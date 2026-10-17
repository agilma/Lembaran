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
import {
  deleteReadingInternal,
  getReadingBySlugInternal,
  getReadingsListInternal,
} from '../reading-management-service';

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
      assert.strictEqual(parsed?.activeIndex, 1);
      assert.strictEqual(parsed?.activeSectionId, 'sec-2');
      assert.strictEqual(parsed?.counts[1], 5);
    });

    test('reloads position correctly when active section moves to different index', () => {
      const reorderedSections: ReadingSection[] = [
        { id: 'sec-2', instruction: 'Bagian B' },
        { id: 'sec-1', instruction: 'Bagian A' },
      ];

      const savedData = {
        activeIndex: 1,
        activeSectionId: 'sec-2',
        counts: [10, 25],
        sectionCounts: {
          'sec-1': 10,
          'sec-2': 25,
        },
      };

      const parsed = parseProgressData(savedData, reorderedSections);

      assert.notStrictEqual(parsed, null);
      assert.strictEqual(parsed?.activeIndex, 0);
      assert.strictEqual(parsed?.counts[0], 25);
      assert.strictEqual(parsed?.counts[1], 10);
    });

    test('falls back safely to valid index if activeSectionId is missing or removed', () => {
      const sections: ReadingSection[] = [
        { id: 'sec-a', instruction: 'Bagian A' },
        { id: 'sec-b', instruction: 'Bagian B' },
      ];

      const dataWithDeletedSection = {
        activeIndex: 1,
        activeSectionId: 'sec-deleted',
        counts: [2, 4],
      };

      const parsed = parseProgressData(dataWithDeletedSection, sections);

      assert.notStrictEqual(parsed, null);
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

  describe('Server Safety & Database Fallback Isolation', () => {
    test('getReadingsListInternal(true) throws or returns unauthorized for unauthenticated/VIEWER users', async () => {
      const result = await getReadingsListInternal(true);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.message.includes('UNAUTHORIZED') || result.message.includes('Akses ditolak'), true);
      assert.deepStrictEqual(result.data, []);
    });

    test('getReadingBySlugInternal filters out archived reading for public requests', async () => {
      const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const origKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fake-test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'fake-anon-key';

      try {
        const mockArchivedRow = {
          id: 'test-archived-id',
          slug: 'archived-reading',
          title: 'Bacaan Arsip',
          is_archived: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const mockSessionClient = {
          from: (_table: string) => ({
            select: (_cols?: string) => ({
              eq: (_col: string, val: any) => ({
                eq: (_col2: string, _val2: any) => ({
                  maybeSingle: () => Promise.resolve({ data: null, error: null }),
                }),
                maybeSingle: () => Promise.resolve({ data: mockArchivedRow, error: null }),
              }),
            }),
          }),
        };

        const publicResult = await getReadingBySlugInternal('archived-reading', false, {
          supabase: mockSessionClient,
          adminClient: null,
        });

        assert.strictEqual(publicResult, null);
      } finally {
        if (origUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
        else delete process.env.NEXT_PUBLIC_SUPABASE_URL;

        if (origKey) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = origKey;
        else delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      }
    });

    test('deleteReadingInternal returns explicit error if SUPABASE_SECRET_KEY/Admin Client is not available', async () => {
      const origSecret = process.env.SUPABASE_SECRET_KEY;
      delete process.env.SUPABASE_SECRET_KEY;

      try {
        const result = await deleteReadingInternal('test-id');
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.message.includes('Akses ditolak') || result.message.includes('SUPABASE_SECRET_KEY'), true);
      } finally {
        if (origSecret) process.env.SUPABASE_SECRET_KEY = origSecret;
      }
    });

    test('getReadingBySlugInternal returns static reading if Supabase URL is unconfigured', async () => {
      const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      try {
        const reading = await getReadingBySlugInternal('sholawat-wahidiyah');
        assert.notStrictEqual(reading, null);
        assert.strictEqual(reading?.slug, 'sholawat-wahidiyah');
      } finally {
        if (origUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
      }
    });

    test('public reading retrieval uses getSupabasePublicClient and does not fallback to adminClient when public client is unavailable', async () => {
      const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const origKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      try {
        let adminClientQueriedForPublicData = false;
        const mockAdminClient = {
          from: () => {
            adminClientQueriedForPublicData = true;
            return {
              select: () => ({
                eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
              }),
            };
          },
        };

        // Call public reading fetch without overrides.supabase or public client config
        const reading = await getReadingBySlugInternal('sholawat-wahidiyah', false, {
          adminClient: mockAdminClient,
        });

        // Should return static fallback because env is unconfigured, without querying admin client for public data
        assert.notStrictEqual(reading, null);
        assert.strictEqual(reading?.slug, 'sholawat-wahidiyah');
        assert.strictEqual(adminClientQueriedForPublicData, false);
      } finally {
        if (origUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
        if (origKey) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = origKey;
      }
    });

    test('getReadingsListInternal returns fallback only when Supabase is completely unconfigured', async () => {
      const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      try {
        const res = await getReadingsListInternal(false);
        assert.strictEqual(res.success, true);
        assert.strictEqual(res.isStaticFallback, true);
        assert.strictEqual((res.data?.length ?? 0) > 0, true);
      } finally {
        if (origUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
      }
    });
  });

  describe('Mocked Database State & Fallback Prevention Tests', () => {
    test('getReadingsListInternal(false) returns empty active list without static fallback when DB has items but all are archived', async () => {
      const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const origKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fake-test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'fake-anon-key';

      try {
        const mockAdminClient = {
          from: (_table: string) => ({
            select: (_cols?: string, opts?: { count?: string; head?: boolean }) => {
              if (opts?.count === 'exact' && opts?.head === true) {
                return Promise.resolve({ count: 4, error: null });
              }
              return Promise.resolve({ data: [], error: null });
            },
          }),
        };

        const mockSessionClient = {
          from: (_table: string) => ({
            select: (_cols?: string) => ({
              order: (_col?: string) => ({
                eq: (_c?: string, _v?: boolean) => Promise.resolve({ data: [], error: null }),
              }),
            }),
          }),
        };

        const res = await getReadingsListInternal(false, {
          supabase: mockSessionClient,
          adminClient: mockAdminClient,
        });

        assert.strictEqual(res.success, true);
        assert.deepStrictEqual(res.data, []);
        assert.notStrictEqual(res.isStaticFallback, true);
      } finally {
        if (origUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
        else delete process.env.NEXT_PUBLIC_SUPABASE_URL;

        if (origKey) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = origKey;
        else delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      }
    });

    test('getReadingBySlugInternal returns null when reading is not found in session client and admin client is null', async () => {
      const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const origKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fake-test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'fake-anon-key';

      try {
        const mockSessionClient = {
          from: (_table: string) => ({
            select: (_cols?: string) => ({
              eq: (_c?: string, _slugVal?: string) => ({
                maybeSingle: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
          }),
        };

        const reading = await getReadingBySlugInternal('sholawat-wahidiyah', false, {
          supabase: mockSessionClient,
          adminClient: null,
        });

        assert.strictEqual(reading, null);
      } finally {
        if (origUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
        else delete process.env.NEXT_PUBLIC_SUPABASE_URL;

        if (origKey) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = origKey;
        else delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      }
    });

    test('getReadingsListInternal returns error and no static fallback when admin count check query fails', async () => {
      const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const origKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fake-test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'fake-anon-key';

      try {
        const mockAdminClient = {
          from: (_table: string) => ({
            select: (_cols?: string, _opts?: { count?: string; head?: boolean }) => {
              return Promise.resolve({ count: null, error: { message: 'Database connection timeout' } });
            },
          }),
        };

        const res = await getReadingsListInternal(false, {
          adminClient: mockAdminClient,
        });

        assert.strictEqual(res.success, false);
        assert.strictEqual(res.message.includes('Database connection timeout'), true);
        assert.deepStrictEqual(res.data, []);
        assert.notStrictEqual(res.isStaticFallback, true);
      } finally {
        if (origUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
        else delete process.env.NEXT_PUBLIC_SUPABASE_URL;

        if (origKey) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = origKey;
        else delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      }
    });
  });
});
