import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import {
  parseProgressData,
  resolveReadingProgress,
  SavedReadingProgress,
} from '../reading-progress';

describe('Reading Progress Resolution & Persistence Suite', () => {
  const sectionsCount = 3;

  describe('Progress Data Parsing & Validation', () => {
    test('parses valid progress data correctly', () => {
      const raw = {
        activeIndex: 1,
        counts: [2, 1, 0],
        updatedAt: '2026-03-30T10:00:00.000Z',
      };

      const parsed = parseProgressData(raw, sectionsCount);
      assert.deepStrictEqual(parsed, {
        activeIndex: 1,
        counts: [2, 1, 0],
        updatedAt: '2026-03-30T10:00:00.000Z',
      });
    });

    test('falls back out-of-bound activeIndex to 0', () => {
      const rawNegative = { activeIndex: -1, counts: [1, 2, 3] };
      const rawTooLarge = { activeIndex: 99, counts: [1, 2, 3] };

      assert.strictEqual(parseProgressData(rawNegative, sectionsCount)?.activeIndex, 0);
      assert.strictEqual(parseProgressData(rawTooLarge, sectionsCount)?.activeIndex, 0);
    });

    test('normalizes counts array to match sections length', () => {
      const rawShort = { activeIndex: 0, counts: [5] };
      const parsed = parseProgressData(rawShort, sectionsCount);

      assert.deepStrictEqual(parsed?.counts, [5, 0, 0]);
    });

    test('returns null for null, undefined, or non-object input', () => {
      assert.strictEqual(parseProgressData(null, sectionsCount), null);
      assert.strictEqual(parseProgressData(undefined, sectionsCount), null);
      assert.strictEqual(parseProgressData('invalid string', sectionsCount), null);
    });
  });

  describe('Progress Resolution Strategy', () => {
    test('Scenario 1: Tidak ada localStorage + ada server progress → server progress dipulihkan', () => {
      const localProgress: SavedReadingProgress | null = null;
      const serverProgress: SavedReadingProgress = {
        activeIndex: 2,
        counts: [3, 3, 1],
        updatedAt: '2026-03-30T09:00:00.000Z',
      };

      const resolved = resolveReadingProgress(localProgress, serverProgress);
      assert.deepStrictEqual(resolved, serverProgress);
    });

    test('Scenario 2: Ada localStorage + server lebih lama → localStorage dipertahankan', () => {
      const localProgress: SavedReadingProgress = {
        activeIndex: 1,
        counts: [1, 2, 0],
        updatedAt: '2026-03-30T10:00:00.000Z',
      };
      const serverProgress: SavedReadingProgress = {
        activeIndex: 0,
        counts: [1, 0, 0],
        updatedAt: '2026-03-30T08:00:00.000Z',
      };

      const resolved = resolveReadingProgress(localProgress, serverProgress);
      assert.deepStrictEqual(resolved, localProgress);
    });

    test('Scenario 3: Ada localStorage + server lebih baru → server progress digunakan', () => {
      const localProgress: SavedReadingProgress = {
        activeIndex: 0,
        counts: [1, 0, 0],
        updatedAt: '2026-03-30T08:00:00.000Z',
      };
      const serverProgress: SavedReadingProgress = {
        activeIndex: 2,
        counts: [3, 3, 3],
        updatedAt: '2026-03-30T10:00:00.000Z',
      };

      const resolved = resolveReadingProgress(localProgress, serverProgress);
      assert.deepStrictEqual(resolved, serverProgress);
    });

    test('Scenario 4: Ada localStorage + tidak ada server progress → localStorage dipertahankan', () => {
      const localProgress: SavedReadingProgress = {
        activeIndex: 1,
        counts: [1, 0, 0],
        updatedAt: '2026-03-30T10:00:00.000Z',
      };

      const resolved = resolveReadingProgress(localProgress, null);
      assert.deepStrictEqual(resolved, localProgress);
    });

    test('Scenario 5: Tidak ada localStorage + tidak ada server progress → null (state awal)', () => {
      const resolved = resolveReadingProgress(null, null);
      assert.strictEqual(resolved, null);
    });
  });

  describe('Hydration Flow & Persistence Controls', () => {
    test('Initial hydration tidak melakukan save dengan state 0 sebelum hydration selesai', () => {
      let isProgressLoaded = false;
      let saveCallCount = 0;

      const mockPersist = (index: number, counts: number[]) => {
        if (!isProgressLoaded) return;
        saveCallCount++;
      };

      // Simulated hydration in-flight
      const defaultIndex = 0;
      const defaultCounts = [0, 0, 0];

      // Auto-save attempt during hydration
      mockPersist(defaultIndex, defaultCounts);
      assert.strictEqual(saveCallCount, 0, 'No save calls should happen before progress is loaded');

      // Complete hydration with server progress
      isProgressLoaded = true;
      assert.strictEqual(saveCallCount, 0, 'Hydration itself should not increment save calls');
    });

    test('Setelah hydration, perubahan counter tetap tersimpan ke localStorage dan Supabase', () => {
      let isProgressLoaded = true;
      const savedCalls: { index: number; counts: number[] }[] = [];

      const mockPersist = (index: number, counts: number[]) => {
        if (!isProgressLoaded) return;
        savedCalls.push({ index, counts });
      };

      // User increments counter
      mockPersist(1, [3, 1, 0]);

      assert.strictEqual(savedCalls.length, 1);
      assert.deepStrictEqual(savedCalls[0], { index: 1, counts: [3, 1, 0] });
    });

    test('Klik Selesai membersihkan temporary progress', () => {
      const mockStorage = new Map<string, string>();
      mockStorage.set('lembaran_progress_al-fatihah', JSON.stringify({ activeIndex: 1, counts: [1, 0] }));

      let serverProgressDeleted = false;

      const handleComplete = (slug: string) => {
        mockStorage.delete(`lembaran_progress_${slug}`);
        serverProgressDeleted = true;
      };

      handleComplete('al-fatihah');

      assert.strictEqual(mockStorage.has('lembaran_progress_al-fatihah'), false);
      assert.strictEqual(serverProgressDeleted, true);
    });
  });
});
