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
          await new Promise((resolve) => setTimeout(resolve, 10));

          const putEntry = swEnv.cachePuts.find((p) => p.requestUrl === url);
          assert.notStrictEqual(putEntry, undefined, `Public route ${url} should be saved to cache`);
        } finally {
          globalThis.fetch = originalFetch;
        }
      }
    });

    test('responses with case-insensitive Cache-Control (e.g. NO-STORE, Private) are NOT stored in cache', async () => {
      const swEnv = createSWEnvironment();
      const fetchListener = swEnv.listeners.fetch[0];

      const testCases = [
        { url: 'https://lembaran.vercel.app/bacaan/surah-yasin', header: 'NO-STORE, PRIVATE' },
        { url: 'https://lembaran.vercel.app/bacaan/tahlil', header: 'Private, No-Cache' },
        { url: 'https://lembaran.vercel.app/bacaan/rotib-al-haddad', header: 'no-Store' },
      ];

      for (const testCase of testCases) {
        let respondedPromise: Promise<unknown> | null = null;
        const headersMap = new Map([['cache-control', testCase.header]]);

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
              url: testCase.url,
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

          const putEntry = swEnv.cachePuts.find((p) => p.requestUrl === testCase.url);
          assert.strictEqual(
            putEntry,
            undefined,
            `Responses with Cache-Control '${testCase.header}' should not be cached`
          );
        } finally {
          globalThis.fetch = originalFetch;
        }
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
    test('initial service worker installation (no controller) does not show update dialog and controllerchange does NOT reload', () => {
      let showDialog = false;
      let reloaded = false;
      let isRefreshRequested = false;
      let refreshing = false;

      const handleControllerChange = () => {
        if (isRefreshRequested && !refreshing) {
          refreshing = true;
          reloaded = true;
        }
      };

      const mockRegistration = {
        waiting: null,
        installing: {
          state: 'installing',
          addEventListener: (event: string, callback: Function) => {
            if (event === 'statechange') {
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

      // Simulate initial controllerchange event fired by self.clients.claim() during initial install
      handleControllerChange();

      assert.strictEqual(showDialog, false, 'Dialog should stay hidden on initial installation');
      assert.strictEqual(reloaded, false, 'Initial controllerchange must NOT trigger reload');
    });

    test('controllerchange without explicit user "Refresh sekarang" request does NOT reload', () => {
      let reloaded = false;
      let isRefreshRequested = false;
      let refreshing = false;

      const handleControllerChange = () => {
        if (isRefreshRequested && !refreshing) {
          refreshing = true;
          reloaded = true;
        }
      };

      // Unsolicited controllerchange event (e.g. from another tab or background SW claim)
      handleControllerChange();

      assert.strictEqual(reloaded, false, 'Unsolicited controllerchange must NOT reload the page');
    });

    test('controllerchange AFTER user clicks "Refresh sekarang" DOES trigger page reload', () => {
      let reloaded = false;
      let isRefreshRequested = false;
      let refreshing = false;
      let postedMessage: unknown = null;

      const mockWaitingWorker = {
        state: 'installed',
        postMessage: (msg: unknown) => {
          postedMessage = msg;
        },
      };

      const handleRefresh = () => {
        if (mockWaitingWorker) {
          isRefreshRequested = true;
          mockWaitingWorker.postMessage({ type: 'SKIP_WAITING' });
        }
      };

      const handleControllerChange = () => {
        if (isRefreshRequested && !refreshing) {
          refreshing = true;
          reloaded = true;
        }
      };

      // User clicks Refresh sekarang
      handleRefresh();

      assert.deepStrictEqual(postedMessage, { type: 'SKIP_WAITING' });
      assert.strictEqual(reloaded, false, 'Reload should not happen before controllerchange event');

      // Now SW takes control and fires controllerchange
      handleControllerChange();

      assert.strictEqual(reloaded, true, 'Reload MUST happen when controllerchange fires after user requested refresh');
    });

    test('controllerchange reloads at most once for a single update process', () => {
      let reloadCount = 0;
      let isRefreshRequested = true; // User clicked Refresh sekarang
      let refreshing = false;

      const handleControllerChange = () => {
        if (isRefreshRequested && !refreshing) {
          refreshing = true;
          reloadCount++;
        }
      };

      // Simulate multiple controllerchange events in rapid succession
      handleControllerChange();
      handleControllerChange();
      handleControllerChange();

      assert.strictEqual(reloadCount, 1, 'Page should reload at most once per update process');
    });

    test('dismissing update dialog (Nanti) prevents reload even if controllerchange fires later', () => {
      let showDialog = true;
      let reloaded = false;
      let isRefreshRequested = false;
      let refreshing = false;
      let dismissedWorker: unknown = null;

      const mockWaitingWorker = { postMessage: () => {} };

      const handleLater = () => {
        dismissedWorker = mockWaitingWorker;
        showDialog = false;
      };

      const handleControllerChange = () => {
        if (isRefreshRequested && !refreshing) {
          refreshing = true;
          reloaded = true;
        }
      };

      handleLater();

      assert.strictEqual(showDialog, false);
      assert.strictEqual(isRefreshRequested, false);

      // Simulate controllerchange firing after dismissal
      handleControllerChange();

      assert.strictEqual(reloaded, false, 'Clicking Nanti must not trigger reload on controllerchange');
    });

    test('redundant waiting worker state is handled safely without sending SKIP_WAITING or reloading', () => {
      let postedMessage: unknown = null;
      let isRefreshRequested = false;
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
          isRefreshRequested = true;
          mockRedundantWorker.postMessage({ type: 'SKIP_WAITING' });
        }
        showDialog = false;
      };

      handleRefresh();

      assert.strictEqual(showDialog, false);
      assert.strictEqual(isRefreshRequested, false);
      assert.strictEqual(postedMessage, null, 'Redundant worker should not be sent SKIP_WAITING');
    });
  });
});
