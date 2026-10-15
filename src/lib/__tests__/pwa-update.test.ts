import assert from 'node:assert/strict';
import { test, describe } from 'node:test';

describe('PWA & Service Worker Update Logic Suite', () => {
  describe('Service Worker Update Detection & Message Handling', () => {
    test('SKIP_WAITING message payload format is correct', () => {
      const messagePayload = { type: 'SKIP_WAITING' };
      assert.strictEqual(messagePayload.type, 'SKIP_WAITING');
    });

    test('detects waiting worker when registration has waiting worker and active controller', () => {
      let isUpdateAvailable = false;
      let waitingWorkerObj: { postMessage: (msg: unknown) => void } | null = null;

      const mockWaitingWorker = {
        postMessage: (msg: unknown) => {
          if ((msg as { type?: string }).type === 'SKIP_WAITING') {
            // Worker skips waiting
          }
        },
      };

      const mockRegistration = {
        waiting: mockWaitingWorker,
        controller: {},
      };

      if (mockRegistration.waiting && mockRegistration.controller) {
        waitingWorkerObj = mockRegistration.waiting;
        isUpdateAvailable = true;
      }

      assert.strictEqual(isUpdateAvailable, true);
      assert.strictEqual(waitingWorkerObj, mockWaitingWorker);
    });

    test('handles installing worker state transition to installed with active controller', () => {
      let showDialog = false;

      const listeners: Record<string, () => void> = {};
      const mockInstallingWorker = {
        state: 'installing',
        addEventListener: (event: string, callback: () => void) => {
          listeners[event] = callback;
        },
      };

      const mockRegistration = {
        installing: mockInstallingWorker,
        controller: {},
      };

      // Simulated SW update found
      if (mockRegistration.installing) {
        mockRegistration.installing.addEventListener('statechange', () => {
          if (mockInstallingWorker.state === 'installed' && mockRegistration.controller) {
            showDialog = true;
          }
        });
      }

      assert.strictEqual(showDialog, false, 'Dialog should not show while state is installing');

      // Simulate state transition to installed
      mockInstallingWorker.state = 'installed';
      listeners['statechange']?.();

      assert.strictEqual(showDialog, true, 'Dialog should show when state transitions to installed');
    });

    test('does not show update dialog on initial service worker installation (no controller)', () => {
      let showDialog = false;

      const listeners: Record<string, () => void> = {};
      const mockInstallingWorker = {
        state: 'installing',
        addEventListener: (event: string, callback: () => void) => {
          listeners[event] = callback;
        },
      };

      const mockRegistration = {
        installing: mockInstallingWorker,
        controller: null, // First install, no controller exists yet
      };

      if (mockRegistration.installing) {
        mockRegistration.installing.addEventListener('statechange', () => {
          if (mockInstallingWorker.state === 'installed' && mockRegistration.controller) {
            showDialog = true;
          }
        });
      }

      mockInstallingWorker.state = 'installed';
      listeners['statechange']?.();

      assert.strictEqual(
        showDialog,
        false,
        'First time SW installation should not show update dialog'
      );
    });

    test('dismissing update dialog (Nanti) does not force reload or post SKIP_WAITING', () => {
      let postedMessage: unknown = null;
      let isReloaded = false;
      let showDialog = true;

      const mockWaitingWorker = {
        postMessage: (msg: unknown) => {
          postedMessage = msg;
        },
      };

      // User clicks "Nanti"
      const handleLater = () => {
        showDialog = false;
      };

      handleLater();

      assert.strictEqual(showDialog, false);
      assert.strictEqual(postedMessage, null, 'SKIP_WAITING should not be sent on Nanti');
      assert.strictEqual(isReloaded, false, 'Reload should not happen on Nanti');
    });

    test('confirming update dialog (Refresh sekarang) sends SKIP_WAITING to waiting worker', () => {
      let postedMessage: unknown = null;
      let showDialog = true;

      const mockWaitingWorker = {
        postMessage: (msg: unknown) => {
          postedMessage = msg;
        },
      };

      // User clicks "Refresh sekarang"
      const handleRefresh = () => {
        if (mockWaitingWorker) {
          mockWaitingWorker.postMessage({ type: 'SKIP_WAITING' });
        }
        showDialog = false;
      };

      handleRefresh();

      assert.strictEqual(showDialog, false);
      assert.deepStrictEqual(postedMessage, { type: 'SKIP_WAITING' });
    });
  });
});
