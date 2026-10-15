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

    // Helper harness to execute UpdateNotification component function & hooks in Node.js
    function mountUpdateNotificationComponent(Component: (props: Record<string, unknown>) => React.ReactElement | null) {
      const stateMap = new Map<number, unknown>();
      const effectCleanups: Function[] = [];

      let hookIndex = 0;

      const mockUseState = <T>(initial: T | (() => T)): [T, (val: T | ((prev: T) => T)) => void] => {
        const id = hookIndex++;
        if (!stateMap.has(id)) {
          stateMap.set(id, typeof initial === 'function' ? (initial as Function)() : initial);
        }
        const val = stateMap.get(id) as T;
        const setState = (nextVal: T | ((prev: T) => T)) => {
          const updated = typeof nextVal === 'function' ? (nextVal as Function)(val) : nextVal;
          stateMap.set(id, updated);
        };
        return [val, setState];
      };

      const mockUseRef = <T>(initial: T): React.MutableRefObject<T> => {
        const id = hookIndex++;
        if (!stateMap.has(id)) {
          stateMap.set(id, { current: initial });
        }
        return stateMap.get(id) as React.MutableRefObject<T>;
      };

      const mockUseEffect = (effect: React.EffectCallback) => {
        const id = hookIndex++;
        if (!stateMap.has(id)) {
          stateMap.set(id, true);
          const cleanup = effect();
          if (typeof cleanup === 'function') {
            effectCleanups.push(cleanup);
          }
        }
      };

      const dispatcher = {
        useState: mockUseState,
        useRef: mockUseRef,
        useEffect: mockUseEffect,
      };

      const reactInternals = (React as unknown as Record<string, unknown>);
      const clientInternals =
        (reactInternals.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE as Record<string, unknown>) ||
        (reactInternals.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED as Record<string, unknown>);

      let prevDispatcher: unknown;

      if (clientInternals) {
        if ('H' in clientInternals) {
          prevDispatcher = clientInternals.H;
          clientInternals.H = dispatcher;
        } else if ('ReactCurrentDispatcher' in clientInternals) {
          const currentDisp = clientInternals.ReactCurrentDispatcher as { current: unknown };
          prevDispatcher = currentDisp.current;
          currentDisp.current = dispatcher;
        }
      }

      try {
        hookIndex = 0;
        const tree = Component({});

        const renderTree = () => {
          if (clientInternals) {
            if ('H' in clientInternals) {
              clientInternals.H = dispatcher;
            } else if ('ReactCurrentDispatcher' in clientInternals) {
              (clientInternals.ReactCurrentDispatcher as { current: unknown }).current = dispatcher;
            }
          }
          hookIndex = 0;
          return Component({});
        };

        return {
          tree,
          renderTree,
          cleanup: () => {
            effectCleanups.forEach((cleanup) => cleanup());
            if (clientInternals) {
              if ('H' in clientInternals) {
                clientInternals.H = prevDispatcher;
              } else if ('ReactCurrentDispatcher' in clientInternals) {
                (clientInternals.ReactCurrentDispatcher as { current: unknown }).current = prevDispatcher;
              }
            }
          },
        };
      } catch (err) {
        if (clientInternals) {
          if ('H' in clientInternals) {
            clientInternals.H = prevDispatcher;
          } else if ('ReactCurrentDispatcher' in clientInternals) {
            (clientInternals.ReactCurrentDispatcher as { current: unknown }).current = prevDispatcher;
          }
        }
        throw err;
      }
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
            waiting: null,
            addEventListener: () => {},
          }),
          controller: {},
        },
      };

      const mockWindow = {
        location: { reload: () => { reloadedCount++; } },
      };

      Object.defineProperty(globalThis, 'window', { value: mockWindow, configurable: true, writable: true });
      Object.defineProperty(globalThis, 'navigator', { value: mockNavigator, configurable: true, writable: true });

      const harness = mountUpdateNotificationComponent(UpdateNotification);

      if (swListeners['controllerchange']) {
        swListeners['controllerchange']();
      }

      assert.strictEqual(reloadedCount, 0, 'Unsolicited controllerchange must NOT reload');
      harness.cleanup();
    });

    test('2. "Refresh sekarang" sends SKIP_WAITING and reloads ONLY after controllerchange', async () => {
      let reloadedCount = 0;
      let postedMessage: unknown = null;
      const swListeners: Record<string, Function> = {};
      let registrationResolve: Function;

      const mockRegistrationPromise = new Promise((resolve) => {
        registrationResolve = resolve;
      });

      const mockWaitingWorker = {
        state: 'installed',
        postMessage: (msg: unknown) => {
          postedMessage = msg;
        },
      };

      const mockNavigator = {
        serviceWorker: {
          addEventListener: (event: string, fn: Function) => {
            swListeners[event] = fn;
          },
          removeEventListener: () => {},
          register: () => mockRegistrationPromise,
          controller: {},
        },
      };

      const mockWindow = {
        location: { reload: () => { reloadedCount++; } },
      };

      Object.defineProperty(globalThis, 'window', { value: mockWindow, configurable: true, writable: true });
      Object.defineProperty(globalThis, 'navigator', { value: mockNavigator, configurable: true, writable: true });

      const harness = mountUpdateNotificationComponent(UpdateNotification);

      assert.strictEqual(harness.renderTree(), null);

      registrationResolve!({
        waiting: mockWaitingWorker,
        addEventListener: () => {},
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const dialogTree = harness.renderTree();
      assert.notStrictEqual(dialogTree, null);

      const refreshBtn = findButtonByText(dialogTree, 'Refresh sekarang');
      assert.notStrictEqual(refreshBtn, null, 'Refresh sekarang button should be present in rendered dialog');

      (refreshBtn!.props as { onClick: () => void }).onClick();

      assert.deepStrictEqual(postedMessage, { type: 'SKIP_WAITING' });
      assert.strictEqual(reloadedCount, 0, 'Page reload must NOT happen before controllerchange fires');

      if (swListeners['controllerchange']) {
        swListeners['controllerchange']();
      }

      assert.strictEqual(reloadedCount, 1, 'Page reload MUST trigger when controllerchange fires after clicking Refresh');
      harness.cleanup();
    });

    test('3. "Nanti" closes dialog and does NOT trigger reload on controllerchange', async () => {
      let reloadedCount = 0;
      let postedMessage: unknown = null;
      const swListeners: Record<string, Function> = {};
      let registrationResolve: Function;

      const mockRegistrationPromise = new Promise((resolve) => {
        registrationResolve = resolve;
      });

      const mockWaitingWorker = {
        state: 'installed',
        postMessage: (msg: unknown) => {
          postedMessage = msg;
        },
      };

      const mockNavigator = {
        serviceWorker: {
          addEventListener: (event: string, fn: Function) => {
            swListeners[event] = fn;
          },
          removeEventListener: () => {},
          register: () => mockRegistrationPromise,
          controller: {},
        },
      };

      const mockWindow = {
        location: { reload: () => { reloadedCount++; } },
      };

      Object.defineProperty(globalThis, 'window', { value: mockWindow, configurable: true, writable: true });
      Object.defineProperty(globalThis, 'navigator', { value: mockNavigator, configurable: true, writable: true });

      const harness = mountUpdateNotificationComponent(UpdateNotification);

      registrationResolve!({
        waiting: mockWaitingWorker,
        addEventListener: () => {},
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const dialogTree = harness.renderTree();
      assert.notStrictEqual(dialogTree, null);

      const laterBtn = findButtonByText(dialogTree, 'Nanti');
      assert.notStrictEqual(laterBtn, null, 'Nanti button should be present in rendered dialog');

      (laterBtn!.props as { onClick: () => void }).onClick();

      assert.strictEqual(postedMessage, null, 'SKIP_WAITING must NOT be posted on Nanti');
      assert.strictEqual(harness.renderTree(), null, 'Dialog should close on Nanti');

      if (swListeners['controllerchange']) {
        swListeners['controllerchange']();
      }

      assert.strictEqual(reloadedCount, 0, 'Clicking Nanti must NOT reload page on controllerchange');
      harness.cleanup();
    });

    test('4. Reload occurs at most ONCE during update process', async () => {
      let reloadedCount = 0;
      const swListeners: Record<string, Function> = {};
      let registrationResolve: Function;

      const mockRegistrationPromise = new Promise((resolve) => {
        registrationResolve = resolve;
      });

      const mockWaitingWorker = {
        state: 'installed',
        postMessage: () => {},
      };

      const mockNavigator = {
        serviceWorker: {
          addEventListener: (event: string, fn: Function) => {
            swListeners[event] = fn;
          },
          removeEventListener: () => {},
          register: () => mockRegistrationPromise,
          controller: {},
        },
      };

      const mockWindow = {
        location: { reload: () => { reloadedCount++; } },
      };

      Object.defineProperty(globalThis, 'window', { value: mockWindow, configurable: true, writable: true });
      Object.defineProperty(globalThis, 'navigator', { value: mockNavigator, configurable: true, writable: true });

      const harness = mountUpdateNotificationComponent(UpdateNotification);

      registrationResolve!({
        waiting: mockWaitingWorker,
        addEventListener: () => {},
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const dialogTree = harness.renderTree();
      const refreshBtn = findButtonByText(dialogTree, 'Refresh sekarang');
      (refreshBtn!.props as { onClick: () => void }).onClick();

      if (swListeners['controllerchange']) {
        swListeners['controllerchange']();
        swListeners['controllerchange']();
        swListeners['controllerchange']();
      }

      assert.strictEqual(reloadedCount, 1, 'Page reload must occur at most ONCE');
      harness.cleanup();
    });

    test('5. Initial Service Worker installation (controller === null) does NOT trigger auto-reload', async () => {
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
          controller: null, // First install: no active controller
        },
      };

      const mockWindow = {
        location: { reload: () => { reloadedCount++; } },
      };

      Object.defineProperty(globalThis, 'window', { value: mockWindow, configurable: true, writable: true });
      Object.defineProperty(globalThis, 'navigator', { value: mockNavigator, configurable: true, writable: true });

      const harness = mountUpdateNotificationComponent(UpdateNotification);

      if (swListeners['controllerchange']) {
        swListeners['controllerchange']();
      }

      assert.strictEqual(reloadedCount, 0, 'Initial installation controllerchange must not trigger reload');
      assert.strictEqual(harness.renderTree(), null, 'Initial installation must not show update dialog');
      harness.cleanup();
    });
  });
});
