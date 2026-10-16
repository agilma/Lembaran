import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import {
  validateAndNormalizeReadingInput,
  ReadingInputData,
} from '../reading-management-utils';
import { parseRole } from '../auth-utils';
import { Role } from '../../types/user';
import { parseProgressData } from '../reading-progress';
import { ReadingSection } from '../../types/reading';
import { deleteReading, getReadingBySlug } from '../../app/actions/reading-management-actions';

describe('Reading Management & Configurable Counts Suite', () => {
  describe('Input Validation & repeatCount Normalization', () => {
    test('valid input with positive repeatCount normalizes correctly', () => {
      const input: ReadingInputData = {
        title: 'Sholawat Pagi',
        slug: 'sholawat-pagi',
        category: 'Sholawat',
        description: 'Deskripsi tes',
        estimatedTime: '5 Menit',
        sections: [
          {
            id: 'sec-1',
            title: 'Ilaa Hadhroti',
            arabic: 'الى حضرة',
            transliteration: 'Ilaa Hadhroti',
            translation: 'Kepada Junjungan',
            repeatCount: '7',
          },
          {
            id: 'sec-2',
            title: 'Tasbih',
            arabic: 'سُبْحَانَ اللَّهِ',
            repeatCount: 33,
          },
        ],
      };

      const normalized = validateAndNormalizeReadingInput(input);

      assert.strictEqual(normalized.title, 'Sholawat Pagi');
      assert.strictEqual(normalized.slug, 'sholawat-pagi');
      assert.strictEqual(normalized.category, 'Sholawat');
      assert.strictEqual(normalized.sections?.length, 2);
      assert.strictEqual(normalized.sections?.[0].id, 'sec-1');
      assert.strictEqual(normalized.sections?.[0].repeatCount, 7);
      assert.strictEqual(normalized.sections?.[1].repeatCount, 33);
    });

    test('repeatCount = 0, empty string, or null is normalized to undefined (no target)', () => {
      const input: ReadingInputData = {
        title: 'Dzikir Bebas',
        slug: 'dzikir-bebas',
        category: 'Dzikir',
        sections: [
          {
            id: 'sec-a',
            instruction: 'Membaca Fatihah',
            repeatCount: 0,
          },
          {
            id: 'sec-b',
            transliteration: 'Subhanallah',
            repeatCount: '',
          },
          {
            id: 'sec-c',
            arabic: 'الحمد لله',
            repeatCount: null,
          },
        ],
      };

      const normalized = validateAndNormalizeReadingInput(input);

      assert.strictEqual(normalized.sections?.[0].repeatCount, undefined);
      assert.strictEqual(normalized.sections?.[1].repeatCount, undefined);
      assert.strictEqual(normalized.sections?.[2].repeatCount, undefined);
    });

    test('throws Error if repeatCount is negative', () => {
      const input: ReadingInputData = {
        title: 'Uji Negatif',
        slug: 'uji-negatif',
        category: 'Test',
        sections: [
          {
            id: 'sec-1',
            instruction: 'Membaca Fatihah',
            repeatCount: -5,
          },
        ],
      };

      assert.throws(() => {
        validateAndNormalizeReadingInput(input);
      }, (err: Error) => {
        return err.message.includes('tidak boleh bernilai negatif');
      });
    });

    test('throws Error if repeatCount is non-integer or invalid number', () => {
      const input: ReadingInputData = {
        title: 'Uji Non-Integer',
        slug: 'uji-non-integer',
        category: 'Test',
        sections: [
          {
            id: 'sec-1',
            instruction: 'Membaca Fatihah',
            repeatCount: '3.5',
          },
        ],
      };

      assert.throws(() => {
        validateAndNormalizeReadingInput(input);
      }, (err: Error) => {
        return err.message.includes('harus berupa bilangan bulat');
      });
    });

    test('throws Error for invalid slug format or missing title/category', () => {
      assert.throws(() => {
        validateAndNormalizeReadingInput({
          title: '',
          slug: 'valid-slug',
          category: 'Cat',
          content: 'Content',
        });
      }, (err: Error) => err.message.includes('Judul bacaan wajib diisi'));

      assert.throws(() => {
        validateAndNormalizeReadingInput({
          title: 'Judul Valid',
          slug: 'Invalid Slug!',
          category: 'Cat',
          content: 'Content',
        });
      }, (err: Error) => err.message.includes('format kebab-case'));

      assert.throws(() => {
        validateAndNormalizeReadingInput({
          title: 'Judul Valid',
          slug: 'slug-valid',
          category: '',
          content: 'Content',
        });
      }, (err: Error) => err.message.includes('Kategori bacaan wajib diisi'));
    });

    test('generates stable section id if missing in input', () => {
      const input: ReadingInputData = {
        title: 'Sholawat Baru',
        slug: 'sholawat-baru',
        category: 'Sholawat',
        sections: [
          {
            title: 'Bagian Tanpa ID',
            instruction: 'Membaca Sholawat 3x',
            repeatCount: 3,
          },
        ],
      };

      const normalized = validateAndNormalizeReadingInput(input);
      assert.strictEqual(Boolean(normalized.sections?.[0].id), true);
      assert.strictEqual(normalized.sections?.[0].id.startsWith('sec-'), true);
    });
  });

  describe('Role-Based Access Control Verification', () => {
    test('parseRole correctly identifies ADMIN, EDITOR, and VIEWER', () => {
      assert.strictEqual(parseRole('ADMIN'), Role.ADMIN);
      assert.strictEqual(parseRole('admin'), Role.ADMIN);
      assert.strictEqual(parseRole('EDITOR'), Role.EDITOR);
      assert.strictEqual(parseRole('editor'), Role.EDITOR);
      assert.strictEqual(parseRole('VIEWER'), Role.VIEWER);
      assert.strictEqual(parseRole('unknown'), Role.VIEWER);
      assert.strictEqual(parseRole(null), Role.VIEWER);
    });
  });

  describe('Section ID Progress Mapping & activeSectionId Position Preservation', () => {
    test('activeSectionId correctly updates activeIndex when sections are reordered', () => {
      // Original order: [sec-1, sec-2, sec-3], active was sec-2 (index 1)
      const reorderedSections: ReadingSection[] = [
        { id: 'sec-3', instruction: 'Bagian C' },
        { id: 'sec-2', instruction: 'Bagian B' },
        { id: 'sec-1', instruction: 'Bagian A' },
      ];

      const savedData = {
        activeIndex: 1,
        activeSectionId: 'sec-2',
        counts: [0, 5, 0],
        sectionCounts: {
          'sec-1': 0,
          'sec-2': 5,
          'sec-3': 0,
        },
      };

      const parsed = parseProgressData(savedData, reorderedSections);

      assert.notStrictEqual(parsed, null);
      // 'sec-2' is now at index 1 in reordered list
      assert.strictEqual(parsed?.activeIndex, 1);
      assert.strictEqual(parsed?.activeSectionId, 'sec-2');
      assert.strictEqual(parsed?.counts[1], 5);
    });

    test('reloads position correctly when active section moves to different index', () => {
      const reorderedSections: ReadingSection[] = [
        { id: 'sec-2', instruction: 'Bagian B' }, // Moved to index 0
        { id: 'sec-1', instruction: 'Bagian A' }, // Moved to index 1
      ];

      const savedData = {
        activeIndex: 1, // Was at index 1 originally
        activeSectionId: 'sec-2', // Pointed to sec-2
        counts: [10, 25],
        sectionCounts: {
          'sec-1': 10,
          'sec-2': 25,
        },
      };

      const parsed = parseProgressData(savedData, reorderedSections);

      assert.notStrictEqual(parsed, null);
      // 'sec-2' is now index 0!
      assert.strictEqual(parsed?.activeIndex, 0);
      assert.strictEqual(parsed?.counts[0], 25);
      assert.strictEqual(parsed?.counts[1], 10);
    });

    test('falls back safely to valid index if activeSectionId is missing or removed', () => {
      const sections: ReadingSection[] = [
        { id: 'sec-a', instruction: 'Bagian A' },
        { id: 'sec-b', instruction: 'Bagian B' },
      ];

      // Saved activeSectionId 'sec-deleted' was removed
      const dataWithDeletedSection = {
        activeIndex: 1,
        activeSectionId: 'sec-deleted',
        counts: [2, 4],
      };

      const parsed = parseProgressData(dataWithDeletedSection, sections);

      assert.notStrictEqual(parsed, null);
      // Fallback to valid savedIndex 1
      assert.strictEqual(parsed?.activeIndex, 1);
      assert.strictEqual(parsed?.counts[1], 4);
    });

    test('falls back safely to array index counts for legacy progress data', () => {
      const sections: ReadingSection[] = [
        { id: 'sec-1', instruction: 'Bagian 1' },
        { id: 'sec-2', instruction: 'Bagian 2' },
      ];

      const legacyData = {
        activeIndex: 1,
        counts: [5, 12],
      };

      const parsedLegacy = parseProgressData(legacyData, sections);

      assert.notStrictEqual(parsedLegacy, null);
      assert.strictEqual(parsedLegacy?.activeIndex, 1);
      assert.strictEqual(parsedLegacy?.counts[0], 5);
      assert.strictEqual(parsedLegacy?.counts[1], 12);
      assert.strictEqual(parsedLegacy?.sectionCounts?.['sec-1'], 5);
      assert.strictEqual(parsedLegacy?.sectionCounts?.['sec-2'], 12);
    });
  });

  describe('Server Safety & Admin Client Checks', () => {
    test('deleteReading returns explicit error if SUPABASE_SECRET_KEY/Admin Client is not available', async () => {
      const origSecret = process.env.SUPABASE_SECRET_KEY;
      delete process.env.SUPABASE_SECRET_KEY;

      try {
        const result = await deleteReading('test-id');
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.message.includes('Akses ditolak') || result.message.includes('SUPABASE_SECRET_KEY'), true);
      } finally {
        if (origSecret) process.env.SUPABASE_SECRET_KEY = origSecret;
      }
    });

    test('getReadingBySlug returns static reading if Supabase URL is unconfigured', async () => {
      const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      try {
        const reading = await getReadingBySlug('sholawat-wahidiyah');
        assert.notStrictEqual(reading, null);
        assert.strictEqual(reading?.slug, 'sholawat-wahidiyah');
      } finally {
        if (origUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
      }
    });
  });
});
