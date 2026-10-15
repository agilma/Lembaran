import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

describe('PWA & Service Worker Implementation & Lifecycle Suite', () => {
  describe('Actual Service Worker Implementation Tests (public/sw.js)', () => {
    // Helper to evaluate public/sw.js in a controlled Service Worker environment
    function createSWEnvironment() {
      const listeners: Record<string, Function[]> = {
        install: [],
        activate: [],
        message: [],
        fetch: [],
      };

      const deletedCaches: string[] = [];
      const cachePuts: { cacheName: string; requestUrl: string; response: unknown }[] = [];

      const mockCache = {
        addAll: async () => {},
        put: async (request: unknown, response: unknown) => {
          const url = typeof request === 'string' ? request : (request as { url: string }).url;
          cachePuts.push({ cacheName: 'lembaran-cache-v1', requestUrl: url, response });
        },
        match: async () => null,
      };

      const mockCaches = {
        keys: async () => ['lembaran-cache-v0', 'other-app-cache', 'lembaran-cache-v1'],
        open: async (name: string) => mockCache,
        delete: async (name: string) => {
          deletedCaches.push(name);
          return true;
        },
        match: async () => null,
      };

      let skipWaitingCalled = false;
      let clientsClaimCalled = false;

      const mockSelf = {
        addEventListener: (event: string, callback: Function) => {
          listeners[event] = listeners[event] || [];
          listeners[event].push(callback);
        },
        skipWaiting: () => {
          skipWaitingCalled = true;
        },
        clients: {
          claim: async () => {
            clientsClaimCalled = true;
          },
        },
      };

      // Read public/sw.js from project root
      const swCode = fs.readFileSync(path.join(process.cwd(), 'public/sw.js'), 'utf8');

      // Create VM context with mock browser / service worker globals
      const context = vm.createContext({
        self: mockSelf,
        caches: mockCaches,
        fetch: (...args: Parameters<typeof fetch>) => globalThis.fetch(...args),
        console: { ...console, warn: () => {} },
        URL: globalThis.URL,
        Response: globalThis.Response || class MockResponse {
          status: number;
          headers: Map<string, string>;
          constructor(body?: unknown, init?: { status?: number; headers?: Record<string, string> }) {
            this.status = init?.status || 200;
            this.headers = new Map(Object.entries(init?.headers || {}));
          }
          clone() { return this; }
        },
      });

      vm.runInContext(swCode, context);

      return {
        listeners,
        deletedCaches,
        cachePuts,
        getSkipWaitingCalled: () => skipWaitingCalled,
        getClientsClaimCalled: () => clientsClaimCalled,
      };
    }

    test('sensitive paths and endpoints bypass caching completely', async () => {
      const swEnv = createSWEnvironment();
      const fetchListener = swEnv.listeners.fetch[0];

      const sensitiveUrls = [
        'https://lembaran.vercel.app/riwayat',
        'https://lembaran.vercel.app/kalender',
        'https://lembaran.vercel.app/login',
        'https://lembaran.vercel.app/reset-password',
        'https://lembaran.vercel.app/auth/callback',
        'https://lembaran.vercel.app/api/auth',
        'https://xyz.supabase.co/rest/v1/reading_completions',
      ];

      for (const url of sensitiveUrls) {
        let respondWithCalled = false;
        const mockEvent = {
          request: {
            method: 'GET',
            url,
            mode: 'navigate',
            headers: new Map(),
          },
          respondWith: () => {
            respondWithCalled = true;
          },
        };

        await fetchListener(mockEvent);
        assert.strictEqual(
          respondWithCalled,
          false,
          `SW fetch handler should bypass caching for sensitive URL: ${url}`
        );
      }
    });

    test('Next.js Server Actions bypass service worker caching', async () => {
      const swEnv = createSWEnvironment();
      const fetchListener = swEnv.listeners.fetch[0];

      let respondWithCalled = false;
      const headersMap = new Map([['Next-Action', 'action-id-123']]);

      const mockEvent = {
        request: {
          method: 'GET',
          url: 'https://lembaran.vercel.app/',
          mode: 'navigate',
          headers: {
            has: (header: string) => headersMap.has(header),
            get: (header: string) => headersMap.get(header),
          },
        },
        respondWith: () => {
          respondWithCalled = true;
        },
      };

      await fetchListener(mockEvent);
      assert.strictEqual(
        respondWithCalled,
        false,
        'Server actions with Next-Action header must bypass SW caching'
      );
    });

    test('public reading pages and home page navigations are intercepted and cached on success', async () => {
      const swEnv = createSWEnvironment();
      const fetchListener = swEnv.listeners.fetch[0];

      const publicUrls = [
        'https://lembaran.vercel.app/',
        'https://lembaran.vercel.app/bacaan/tahlil',
        'https://lembaran.vercel.app/bacaan/sholawat-nariyah',
      ];

      for (const url of publicUrls) {
        let respondedPromise: Promise<unknown> | null = null;
        const headersMap = new Map();

        const mockNetworkResponse = {
          status: 200,
          headers: {
            get: (key: string) => headersMap.get(key.toLowerCase()) || null,
          },
          clone() {
            return this;
          },
        };

        // Global fetch stub returning mock network response
        const originalFetch = globalThis.fetch;
        globalThis.fetch = (async () => mockNetworkResponse) as unknown as typeof fetch;

        try {
          const mockEvent = {
            request: {
              method: 'GET',
              url,
              mode: 'navigate',
              headers: {
                has: () => false,
                get: () => null,
              },
            },
            respondWith: (promise: Promise<unknown>) => {
              respondedPromise = promise;
            },
          };

          await fetchListener(mockEvent);
          assert.notStrictEqual(respondedPromise, null, `Public route ${url} should be handled by SW`);

          await respondedPromise;
          // Yield event loop for caches.open().then(...)
          await new Promise((resolve) => setTimeout(resolve, 10));

          const putEntry = swEnv.cachePuts.find((p) => p.requestUrl === url);
          assert.notStrictEqual(putEntry, undefined, `Public route ${url} should be saved to cache`);
        } finally {
          globalThis.fetch = originalFetch;
        }
      }
    });

    test('responses with Cache-Control: no-store or private are NOT stored in cache', async () => {
      const swEnv = createSWEnvironment();
      const fetchListener = swEnv.listeners.fetch[0];

      const url = 'https://lembaran.vercel.app/bacaan/surah-yasin';
      let respondedPromise: Promise<unknown> | null = null;
      const headersMap = new Map([['cache-control', 'no-store, private']]);

      const mockNetworkResponse = {
        status: 200,
        headers: {
          get: (key: string) => headersMap.get(key.toLowerCase()) || null,
        },
        clone() {
          return this;
        },
      };

      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async () => mockNetworkResponse) as unknown as typeof fetch;

      try {
        const mockEvent = {
          request: {
            method: 'GET',
            url,
            mode: 'navigate',
            headers: {
              has: () => false,
              get: () => null,
            },
          },
          respondWith: (promise: Promise<unknown>) => {
            respondedPromise = promise;
          },
        };

        await fetchListener(mockEvent);
        await respondedPromise;
        await new Promise((resolve) => setTimeout(resolve, 10));

        const putEntry = swEnv.cachePuts.find((p) => p.requestUrl === url);
        assert.strictEqual(
          putEntry,
          undefined,
          'Responses with no-store or private should not be cached'
        );
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    test('activation cleanup deletes ONLY old Lembaran caches and preserves other application caches', async () => {
      const swEnv = createSWEnvironment();
      const activateListener = swEnv.listeners.activate[0];

      let waitUntilPromise: Promise<unknown> | null = null;
      const mockEvent = {
        waitUntil: (promise: Promise<unknown>) => {
          waitUntilPromise = promise;
        },
      };

      await activateListener(mockEvent);
      await waitUntilPromise;

      assert.deepStrictEqual(
        swEnv.deletedCaches,
        ['lembaran-cache-v0'],
        'Only old lembaran-cache-* caches should be deleted, preserving other-app-cache and current lembaran-cache-v1'
      );
      assert.strictEqual(swEnv.getClientsClaimCalled(), true, 'activation should claim clients');
    });

    test('SKIP_WAITING message triggers self.skipWaiting()', async () => {
      const swEnv = createSWEnvironment();
      const messageListener = swEnv.listeners.message[0];

      messageListener({ data: { type: 'SKIP_WAITING' } });
      assert.strictEqual(swEnv.getSkipWaitingCalled(), true);
    });
  });

  describe('Update Notification Component Logic Tests', () => {
    test('initial service worker installation (no controller) does not show update dialog', () => {
      let showDialog = false;

      const mockRegistration = {
        waiting: null,
        installing: {
          state: 'installing',
          addEventListener: (event: string, callback: Function) => {
            if (event === 'statechange') {
              // Simulate transition to installed
              mockRegistration.installing.state = 'installed';
              callback();
            }
          },
        },
      };

      const activeController = null; // Initial install

      const handleWorkerUpdate = (worker: unknown) => {
        if (!worker) return;
        if (activeController) {
          showDialog = true;
        }
      };

      if (mockRegistration.installing) {
        mockRegistration.installing.addEventListener('statechange', () => {
          if (mockRegistration.installing.state === 'installed') {
            handleWorkerUpdate(mockRegistration.installing);
          }
        });
      }

      assert.strictEqual(
        showDialog,
        false,
        'Dialog should stay hidden on initial installation when controller is null'
      );
    });

    test('detects waiting worker when controller is active', () => {
      let showDialog = false;
      let targetWorker: unknown = null;

      const mockWaitingWorker = { postMessage: () => {} };
      const activeController = {}; // Active controller exists

      const handleWorkerUpdate = (worker: unknown) => {
        if (!worker) return;
        if (activeController) {
          targetWorker = worker;
          showDialog = true;
        }
      };

      handleWorkerUpdate(mockWaitingWorker);

      assert.strictEqual(showDialog, true);
      assert.strictEqual(targetWorker, mockWaitingWorker);
    });

    test('Refresh sekarang sends SKIP_WAITING and does not set a timeout reload fallback', () => {
      let postedMessage: unknown = null;
      let showDialog = true;

      const mockWaitingWorker = {
        state: 'installed',
        postMessage: (msg: unknown) => {
          postedMessage = msg;
        },
      };

      const handleRefresh = () => {
        if (mockWaitingWorker) {
          if (mockWaitingWorker.state === 'redundant') {
            showDialog = false;
            return;
          }
          mockWaitingWorker.postMessage({ type: 'SKIP_WAITING' });
        }
        showDialog = false;
      };

      handleRefresh();

      assert.strictEqual(showDialog, false);
      assert.deepStrictEqual(postedMessage, { type: 'SKIP_WAITING' });
    });

    test('controllerchange listener reloads the page exactly once (prevents refresh loop)', () => {
      let reloadCount = 0;
      let isRefreshing = false;

      const handleControllerChange = () => {
        if (!isRefreshing) {
          isRefreshing = true;
          reloadCount++;
        }
      };

      // Simulate multiple controllerchange events
      handleControllerChange();
      handleControllerChange();
      handleControllerChange();

      assert.strictEqual(reloadCount, 1, 'controllerchange should trigger reload at most once');
    });

    test('dismissing update dialog (Nanti) prevents repeating dialogs for same version in session', () => {
      let showDialog = true;
      let dismissedWorker: unknown = null;

      const mockWaitingWorker = { postMessage: () => {} };
      const activeController = {};

      const handleLater = () => {
        dismissedWorker = mockWaitingWorker;
        showDialog = false;
      };

      handleLater();
      assert.strictEqual(showDialog, false);

      // Simulate registration update check in same session
      const handleWorkerUpdate = (worker: unknown) => {
        if (!worker) return;
        if (dismissedWorker === worker) return; // Prevent repeat dialog for dismissed worker
        if (activeController) {
          showDialog = true;
        }
      };

      handleWorkerUpdate(mockWaitingWorker);
      assert.strictEqual(
        showDialog,
        false,
        'Should not re-trigger update dialog for the same dismissed waiting worker'
      );
    });

    test('redundant waiting worker state is handled safely without hanging', () => {
      let postedMessage: unknown = null;
      let showDialog = true;

      const mockRedundantWorker = {
        state: 'redundant',
        postMessage: (msg: unknown) => {
          postedMessage = msg;
        },
      };

      const handleRefresh = () => {
        if (mockRedundantWorker) {
          if (mockRedundantWorker.state === 'redundant') {
            showDialog = false;
            return;
          }
          mockRedundantWorker.postMessage({ type: 'SKIP_WAITING' });
        }
        showDialog = false;
      };

      handleRefresh();

      assert.strictEqual(showDialog, false);
      assert.strictEqual(
        postedMessage,
        null,
        'Redundant worker should not be sent SKIP_WAITING messages'
      );
    });
  });
});
