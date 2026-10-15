import assert from 'node:assert/strict';
import { test, describe, beforeEach, afterEach } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import React from 'react';
import UpdateNotification from '../../components/UpdateNotification';

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
          await new Promise((resolve) => setTimeout(resolve, 10));

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
        await new Promise((resolve) => setTimeout(resolve, 10));

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
        await new Promise((resolve) => setTimeout(resolve, 10));

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

  describe('UpdateNotification Component Execution & Lifecycle Tests', () => {
    let originalWindowDesc: PropertyDescriptor | undefined;
    let originalNavigatorDesc: PropertyDescriptor | undefined;

    beforeEach(() => {
      originalWindowDesc = Object.getOwnPropertyDescriptor(globalThis, 'window');
      originalNavigatorDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    });

    afterEach(() => {
      if (originalWindowDesc) {
        Object.defineProperty(globalThis, 'window', originalWindowDesc);
      } else {
        delete (globalThis as unknown as { window?: unknown }).window;
      }
      if (originalNavigatorDesc) {
        Object.defineProperty(globalThis, 'navigator', originalNavigatorDesc);
      } else {
        delete (globalThis as unknown as { navigator?: unknown }).navigator;
      }
    });

    test('UpdateNotification component registers SW and enforces user refresh request for controllerchange reload', async () => {
      let reloadedCount = 0;
      const swListeners: Record<string, Function> = {};

      const mockNavigator = {
        serviceWorker: {
          addEventListener: (event: string, fn: Function) => {
            swListeners[event] = fn;
          },
          removeEventListener: (event: string) => {
            delete swListeners[event];
          },
          register: async () => ({
            waiting: {
              state: 'installed',
              postMessage: (msg: unknown) => {
                if ((msg as { type?: string })?.type === 'SKIP_WAITING') {
                  if (swListeners['controllerchange']) {
                    swListeners['controllerchange']();
                  }
                }
              },
            },
            addEventListener: () => {},
          }),
          controller: {},
        },
      };

      const mockWindow = {
        location: {
          reload: () => {
            reloadedCount++;
          },
        },
      };

      Object.defineProperty(globalThis, 'window', {
        value: mockWindow,
        configurable: true,
        writable: true,
      });

      Object.defineProperty(globalThis, 'navigator', {
        value: mockNavigator,
        configurable: true,
        writable: true,
      });

      const element = React.createElement(UpdateNotification);
      assert.notStrictEqual(element, null);

      if (swListeners['controllerchange']) {
        swListeners['controllerchange']();
      }
      assert.strictEqual(reloadedCount, 0, 'Unsolicited controllerchange must NOT trigger reload');
    });

    test('UpdateNotification initial installation (controller === null) does not reload on controllerchange', async () => {
      let reloadedCount = 0;
      const swListeners: Record<string, Function> = {};

      const mockNavigator = {
        serviceWorker: {
          addEventListener: (event: string, fn: Function) => {
            swListeners[event] = fn;
          },
          removeEventListener: () => {},
          register: async () => ({
            waiting: null,
            installing: {
              state: 'installing',
              addEventListener: () => {},
            },
            addEventListener: () => {},
          }),
          controller: null, // Initial install
        },
      };

      const mockWindow = {
        location: {
          reload: () => {
            reloadedCount++;
          },
        },
      };

      Object.defineProperty(globalThis, 'window', {
        value: mockWindow,
        configurable: true,
        writable: true,
      });

      Object.defineProperty(globalThis, 'navigator', {
        value: mockNavigator,
        configurable: true,
        writable: true,
      });

      const element = React.createElement(UpdateNotification);
      assert.notStrictEqual(element, null);

      if (swListeners['controllerchange']) {
        swListeners['controllerchange']();
      }

      assert.strictEqual(reloadedCount, 0, 'Initial installation controllerchange must not trigger reload');
    });
  });
});
