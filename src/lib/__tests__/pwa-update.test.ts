import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import React from 'react';
import UpdateNotification from '../../components/UpdateNotification';
import {
  PWAUpdateManager,
  ServiceWorkerController,
  ServiceWorkerRegistrationLike,
  ServiceWorkerContainerLike,
} from '../pwa-update';

describe('PWA & Service Worker Implementation & Lifecycle Suite', () => {
  describe('Actual Service Worker Implementation Tests (public/sw.js)', () => {
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
          cachePuts.push({ cacheName: 'lembaran-cache-v2', requestUrl: url, response });
        },
        match: async () => null,
      };

      const mockCaches = {
        keys: async () => ['lembaran-cache-v0', 'lembaran-cache-v1', 'other-app-cache', 'lembaran-cache-v2'],
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

      const swCode = fs.readFileSync(path.join(process.cwd(), 'public/sw.js'), 'utf8');

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
        swCode,
        getSkipWaitingCalled: () => skipWaitingCalled,
        getClientsClaimCalled: () => clientsClaimCalled,
      };
    }

    test('HTML navigation responses (home page / and public routes) are NEVER saved to Cache Storage', async () => {
      const swEnv = createSWEnvironment();
      const fetchListener = swEnv.listeners.fetch[0];

      const htmlUrls = [
        'https://lembaran.vercel.app/',
        'https://lembaran.vercel.app/bacaan/tahlil',
        'https://lembaran.vercel.app/bacaan/sholawat-nariyah',
      ];

      for (const url of htmlUrls) {
        let respondedPromise: Promise<unknown> | null = null;
        const mockNetworkResponse = {
          status: 200,
          headers: new Map([['content-type', 'text/html; charset=utf-8']]),
          clone() { return this; },
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
          assert.notStrictEqual(respondedPromise, null, `Navigation for ${url} should be handled by SW`);

          await respondedPromise;
          await new Promise((resolve) => setImmediate(resolve));

          const putEntry = swEnv.cachePuts.find((p) => p.requestUrl === url);
          assert.strictEqual(
            putEntry,
            undefined,
            `HTML response for ${url} must NEVER be stored in Cache Storage to protect user session state`
          );
        } finally {
          globalThis.fetch = originalFetch;
        }
      }
    });

    test('PRECACHE_ASSETS does not contain HTML page "/"', () => {
      const swCode = fs.readFileSync(path.join(process.cwd(), 'public/sw.js'), 'utf8');
      const precacheMatch = swCode.match(/const PRECACHE_ASSETS = \[([\s\S]*?)\];/);
      assert.ok(precacheMatch, 'PRECACHE_ASSETS array must be defined in public/sw.js');
      const precacheContent = precacheMatch[1];
      assert.strictEqual(
        precacheContent.includes("'/'") || precacheContent.includes('"/"'),
        false,
        "PRECACHE_ASSETS array must not include '/' to avoid caching session-rendered HTML"
      );
    });

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

    test('static assets (_next/static, icons) are saved to cache when allowed', async () => {
      const swEnv = createSWEnvironment();
      const fetchListener = swEnv.listeners.fetch[0];

      const url = 'https://lembaran.vercel.app/_next/static/chunks/main.js';
      let respondedPromise: Promise<unknown> | null = null;
      const headersMap = new Map([['cache-control', 'public, max-age=31536000']]);

      const mockNetworkResponse = {
        status: 200,
        headers: {
          get: (key: string) => headersMap.get(key.toLowerCase()) || null,
        },
        clone() { return this; },
      };

      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async () => mockNetworkResponse) as unknown as typeof fetch;

      try {
        const mockEvent = {
          request: {
            method: 'GET',
            url,
            mode: 'no-cors',
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
        assert.notStrictEqual(respondedPromise, null);

        await respondedPromise;
        await new Promise((resolve) => setImmediate(resolve));

        const putEntry = swEnv.cachePuts.find((p) => p.requestUrl === url);
        assert.notStrictEqual(putEntry, undefined, 'Static asset should be cached');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    test('case-insensitive Cache-Control (e.g. NO-STORE, Private) prevents static asset caching', async () => {
      const swEnv = createSWEnvironment();
      const fetchListener = swEnv.listeners.fetch[0];

      const url = 'https://lembaran.vercel.app/icon-192.png';
      let respondedPromise: Promise<unknown> | null = null;
      const headersMap = new Map([['cache-control', 'NO-STORE, Private']]);

      const mockNetworkResponse = {
        status: 200,
        headers: {
          get: (key: string) => headersMap.get(key.toLowerCase()) || null,
        },
        clone() { return this; },
      };

      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async () => mockNetworkResponse) as unknown as typeof fetch;

      try {
        const mockEvent = {
          request: {
            method: 'GET',
            url,
            mode: 'no-cors',
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
        await new Promise((resolve) => setImmediate(resolve));

        const putEntry = swEnv.cachePuts.find((p) => p.requestUrl === url);
        assert.strictEqual(putEntry, undefined, 'Asset with NO-STORE, Private should not be cached');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    test('activation cleanup deletes old Lembaran caches (lembaran-cache-v0, lembaran-cache-v1) and preserves other app caches', async () => {
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
        ['lembaran-cache-v0', 'lembaran-cache-v1'],
        'Old lembaran-cache-* versions must be deleted while preserving other-app-cache and lembaran-cache-v2'
      );
    });
  });

  describe('PWAUpdateManager Pure Lifecycle Tests', () => {
    function createMockContainer(controller: ServiceWorkerController | null = { postMessage: () => {} }) {
      const listeners: Record<string, EventListenerOrEventListenerObject[]> = {};
      let registrationPromise: Promise<ServiceWorkerRegistrationLike> | null = null;

      const container: ServiceWorkerContainerLike = {
        controller,
        addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
          listeners[type] = listeners[type] || [];
          listeners[type].push(listener);
        },
        removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
          if (listeners[type]) {
            listeners[type] = listeners[type].filter((l) => l !== listener);
          }
        },
        register: (scriptURL: string) => {
          if (registrationPromise) return registrationPromise;
          return Promise.resolve({
            waiting: null,
            addEventListener: () => {},
          });
        },
      };

      const dispatchEvent = (type: string) => {
        if (listeners[type]) {
          listeners[type].forEach((l) => {
            if (typeof l === 'function') {
              l(new Event(type));
            } else if (l && typeof l.handleEvent === 'function') {
              l.handleEvent(new Event(type));
            }
          });
        }
      };

      return {
        container,
        listeners,
        dispatchEvent,
        setRegistrationPromise: (p: Promise<ServiceWorkerRegistrationLike>) => {
          registrationPromise = p;
        },
      };
    }

    function findButtonByText(element: unknown, text: string): React.ReactElement | null {
      if (!element || typeof element !== 'object') return null;
      const el = element as React.ReactElement<{ children?: unknown }>;
      if (el.props) {
        if (typeof el.props.children === 'string' && el.props.children.includes(text)) {
          return el;
        }
        if (Array.isArray(el.props.children)) {
          for (const child of el.props.children) {
            const found = findButtonByText(child, text);
            if (found) return found;
          }
        } else if (el.props.children && typeof el.props.children === 'object') {
          const found = findButtonByText(el.props.children, text);
          if (found) return found;
        }
      }
      return null;
    }

    test('1. controllerchange without refresh request does NOT trigger reload', async () => {
      let reloadedCount = 0;
      const mockEnv = createMockContainer();

      const manager = new PWAUpdateManager({
        navigatorServiceWorker: mockEnv.container,
        reloadPage: () => { reloadedCount++; },
      });

      manager.init();

      assert.ok(mockEnv.listeners['controllerchange']?.length > 0, 'controllerchange listener must be attached during init');

      // Trigger unsolicited controllerchange event
      mockEnv.dispatchEvent('controllerchange');

      assert.strictEqual(reloadedCount, 0, 'Unsolicited controllerchange must NOT trigger reload');
      manager.cleanup();
    });

    test('2. "Refresh sekarang" sends SKIP_WAITING and reloads ONLY after controllerchange', async () => {
      let reloadedCount = 0;
      let postedMessage: unknown = null;
      let updateAvailableCalled = false;

      const mockEnv = createMockContainer();

      const mockWaitingWorker: ServiceWorkerController = {
        state: 'installed',
        postMessage: (msg: unknown) => {
          postedMessage = msg;
        },
      };

      const registrationPromise = Promise.resolve({
        waiting: mockWaitingWorker,
        addEventListener: () => {},
      });

      mockEnv.setRegistrationPromise(registrationPromise);

      const manager = new PWAUpdateManager({
        navigatorServiceWorker: mockEnv.container,
        reloadPage: () => { reloadedCount++; },
        onUpdateAvailable: (worker) => {
          updateAvailableCalled = true;
        },
      });

      manager.init();

      await registrationPromise;
      await new Promise((resolve) => setImmediate(resolve));

      assert.ok(mockEnv.listeners['controllerchange']?.length > 0, 'controllerchange listener must be attached');
      assert.strictEqual(updateAvailableCalled, true, 'onUpdateAvailable should be called for waiting worker');

      manager.refresh();

      assert.deepStrictEqual(postedMessage, { type: 'SKIP_WAITING' }, 'SKIP_WAITING must be sent on refresh');
      assert.strictEqual(reloadedCount, 0, 'Reload must NOT happen before controllerchange');

      mockEnv.dispatchEvent('controllerchange');

      assert.strictEqual(reloadedCount, 1, 'Reload MUST happen on controllerchange after refresh requested');
      manager.cleanup();
    });

    test('3. "Nanti" closes dialog and does NOT trigger reload on controllerchange', async () => {
      let reloadedCount = 0;
      let postedMessage: unknown = null;
      let dismissedCalled = false;

      const mockEnv = createMockContainer();

      const mockWaitingWorker: ServiceWorkerController = {
        state: 'installed',
        postMessage: (msg: unknown) => {
          postedMessage = msg;
        },
      };

      const registrationPromise = Promise.resolve({
        waiting: mockWaitingWorker,
        addEventListener: () => {},
      });

      mockEnv.setRegistrationPromise(registrationPromise);

      const manager = new PWAUpdateManager({
        navigatorServiceWorker: mockEnv.container,
        reloadPage: () => { reloadedCount++; },
        onUpdateDismissed: () => {
          dismissedCalled = true;
        },
      });

      manager.init();

      await registrationPromise;
      await new Promise((resolve) => setImmediate(resolve));

      assert.ok(mockEnv.listeners['controllerchange']?.length > 0, 'controllerchange listener must be attached');

      manager.dismiss();

      assert.strictEqual(dismissedCalled, true);
      assert.strictEqual(postedMessage, null, 'SKIP_WAITING must NOT be sent on dismiss');

      mockEnv.dispatchEvent('controllerchange');

      assert.strictEqual(reloadedCount, 0, 'Dismissing must NOT trigger reload on controllerchange');
      manager.cleanup();
    });

    test('4. Reload occurs at most ONCE during update process', async () => {
      let reloadedCount = 0;
      const mockEnv = createMockContainer();

      const mockWaitingWorker: ServiceWorkerController = {
        state: 'installed',
        postMessage: () => {},
      };

      const registrationPromise = Promise.resolve({
        waiting: mockWaitingWorker,
        addEventListener: () => {},
      });

      mockEnv.setRegistrationPromise(registrationPromise);

      const manager = new PWAUpdateManager({
        navigatorServiceWorker: mockEnv.container,
        reloadPage: () => { reloadedCount++; },
      });

      manager.init();

      await registrationPromise;
      await new Promise((resolve) => setImmediate(resolve));

      assert.ok(mockEnv.listeners['controllerchange']?.length > 0, 'controllerchange listener must be attached');

      manager.refresh();

      mockEnv.dispatchEvent('controllerchange');
      mockEnv.dispatchEvent('controllerchange');
      mockEnv.dispatchEvent('controllerchange');

      assert.strictEqual(reloadedCount, 1, 'Reload must occur at most ONCE');
      manager.cleanup();
    });

    test('5. Initial Service Worker installation (controller === null) does NOT trigger auto-reload or show update prompt', async () => {
      let reloadedCount = 0;
      let updateAvailableCalled = false;

      const mockEnv = createMockContainer(null);

      const registrationPromise = Promise.resolve({
        waiting: { state: 'installed', postMessage: () => {} },
        addEventListener: () => {},
      });

      mockEnv.setRegistrationPromise(registrationPromise);

      const manager = new PWAUpdateManager({
        navigatorServiceWorker: mockEnv.container,
        reloadPage: () => { reloadedCount++; },
        onUpdateAvailable: () => {
          updateAvailableCalled = true;
        },
      });

      manager.init();

      await registrationPromise;
      await new Promise((resolve) => setImmediate(resolve));

      assert.strictEqual(updateAvailableCalled, false, 'Initial install should not trigger update available prompt');

      mockEnv.dispatchEvent('controllerchange');

      assert.strictEqual(reloadedCount, 0, 'Initial install controllerchange must not trigger reload');
      manager.cleanup();
    });

    test('6. UpdateNotification component integration verifies Refresh sekarang and Nanti button elements invoke manager methods', () => {
      let refreshInvoked = false;
      let dismissInvoked = false;

      const mockManager = {
        refresh: () => { refreshInvoked = true; },
        dismiss: () => { dismissInvoked = true; },
      } as unknown as PWAUpdateManager;

      const dispatcher = {
        useState: <T>(init: T) => [typeof init === 'function' ? (init as Function)() : init, () => {}],
        useRef: <T>(init: T) => ({ current: init }),
        useEffect: () => {},
      };

      const reactInternals = (React as unknown as Record<string, unknown>);
      const clientInternals =
        (reactInternals.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE as Record<string, unknown>) ||
        (reactInternals.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED as Record<string, unknown>);

      const prevDispatcher = clientInternals.H;
      clientInternals.H = dispatcher;

      try {
        const tree = UpdateNotification({ manager: mockManager, initialShowDialog: true });
        assert.notStrictEqual(tree, null, 'UpdateNotification must render dialog tree when active');

        const refreshBtn = findButtonByText(tree, 'Refresh sekarang');
        assert.notStrictEqual(refreshBtn, null, 'Refresh sekarang button should exist in JSX tree');

        const laterBtn = findButtonByText(tree, 'Nanti');
        assert.notStrictEqual(laterBtn, null, 'Nanti button should exist in JSX tree');

        (refreshBtn!.props as { onClick: () => void }).onClick();
        assert.strictEqual(refreshInvoked, true, 'Refresh sekarang button onClick must invoke manager.refresh()');

        (laterBtn!.props as { onClick: () => void }).onClick();
        assert.strictEqual(dismissInvoked, true, 'Nanti button onClick must invoke manager.dismiss()');
      } finally {
        clientInternals.H = prevDispatcher;
      }
    });
  });
});
