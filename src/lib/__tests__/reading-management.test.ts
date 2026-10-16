import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import {
  validateAndNormalizeReadingInput,
  ReadingInputData,
} from '../reading-management-utils';
import { parseRole } from '../auth-utils';
import { Role } from '../../types/user';

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
});
