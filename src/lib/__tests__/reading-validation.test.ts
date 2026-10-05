import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { Reading } from '../../types/reading';
import {
  validateReading,
  validateReadingSection,
  validateReadingsData,
} from '../reading-validation';
import { readingsData } from '../../data/readings';

describe('Reading Validation Suite', () => {
  test('existing readingsData in repository passes all validation rules', () => {
    assert.doesNotThrow(() => {
      validateReadingsData(readingsData);
    });
    assert.strictEqual(readingsData.length > 0, true);
  });

  test('fails if reading id or title is empty', () => {
    const invalidReading: Reading = {
      id: '',
      slug: 'valid-slug',
      title: '',
      description: 'Desc',
      category: 'Cat',
      content: 'Some content',
    };

    const existingSlugs = new Set<string>();
    const errors = validateReading(invalidReading, existingSlugs);

    assert.strictEqual(errors.length >= 2, true);
    assert.strictEqual(errors.some((e) => e.field === 'id'), true);
    assert.strictEqual(errors.some((e) => e.field === 'title'), true);
  });

  test('fails if reading slug is not kebab-case or is duplicate', () => {
    const invalidSlugReading: Reading = {
      id: '10',
      slug: 'Invalid_Slug!',
      title: 'Test',
      description: 'Desc',
      category: 'Cat',
      content: 'Content',
    };

    const existingSlugs = new Set<string>(['valid-slug']);
    const errorsNotKebab = validateReading(invalidSlugReading, existingSlugs);
    assert.strictEqual(
      errorsNotKebab.some((e) => e.message.includes('kebab-case')),
      true
    );

    const duplicateSlugReading: Reading = {
      id: '11',
      slug: 'valid-slug',
      title: 'Test 2',
      description: 'Desc',
      category: 'Cat',
      content: 'Content',
    };

    const errorsDuplicate = validateReading(duplicateSlugReading, existingSlugs);
    assert.strictEqual(
      errorsDuplicate.some((e) => e.message.includes('Duplicate reading slug')),
      true
    );
  });

  test('fails if reading has no content and no sections', () => {
    const emptyReading: Reading = {
      id: '12',
      slug: 'empty-reading',
      title: 'Empty Reading',
      description: 'Desc',
      category: 'Cat',
    };

    const existingSlugs = new Set<string>();
    const errors = validateReading(emptyReading, existingSlugs);
    assert.strictEqual(
      errors.some((e) => e.message.includes('content source')),
      true
    );
  });

  test('fails if section has duplicate ID within same reading', () => {
    const duplicateSectionReading: Reading = {
      id: '13',
      slug: 'dup-sec-reading',
      title: 'Duplicate Section ID Reading',
      description: 'Desc',
      category: 'Cat',
      sections: [
        { id: 'sec-1', arabic: 'Text 1' },
        { id: 'sec-1', arabic: 'Text 2' },
      ],
    };

    const existingSlugs = new Set<string>();
    const errors = validateReading(duplicateSectionReading, existingSlugs);
    assert.strictEqual(
      errors.some((e) => e.message.includes('Duplicate section ID')),
      true
    );
  });

  test('fails if section has no content fields or invalid repeatCount', () => {
    const emptySection = { id: 's1' };
    const errorsEmpty = validateReadingSection(emptySection, 0, 'test-slug');
    assert.strictEqual(
      errorsEmpty.some((e) => e.message.includes('at least one content field')),
      true
    );

    const invalidCountSection = {
      id: 's2',
      instruction: 'Do something',
      repeatCount: -5,
    };
    const errorsCount = validateReadingSection(invalidCountSection, 0, 'test-slug');
    assert.strictEqual(
      errorsCount.some((e) => e.message.includes('repeatCount')),
      true
    );
  });

  test('allows flexible content combinations (e.g., instruction-only, arabic-only, transliteration+translation)', () => {
    const flexReading: Reading = {
      id: '14',
      slug: 'flexible-content',
      title: 'Flexible Content',
      description: 'Desc',
      category: 'Cat',
      sections: [
        { id: 'sec-instruction', instruction: 'Membaca Fatihah 1x' },
        { id: 'sec-arabic', arabic: 'بِسْمِ اللَّهِ' },
        {
          id: 'sec-trans-trans',
          transliteration: 'Bismillah',
          translation: 'Dengan nama Allah',
        },
        {
          id: 'sec-full',
          arabic: 'بِسْمِ اللَّهِ',
          transliteration: 'Bismillah',
          translation: 'Dengan nama Allah',
          instruction: 'Baca dengan khusyuk',
          repeatCount: 3,
        },
      ],
    };

    const existingSlugs = new Set<string>();
    const errors = validateReading(flexReading, existingSlugs);
    assert.strictEqual(errors.length, 0);
  });
});
