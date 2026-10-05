import { Reading, ReadingSection } from '@/types/reading';

export interface ValidationError {
  readingSlug?: string;
  sectionId?: string;
  field?: string;
  message: string;
}

const KEBAB_CASE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Validates a single ReadingSection.
 */
export function validateReadingSection(
  section: ReadingSection,
  index: number,
  readingSlug: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check section id
  if (!section.id || typeof section.id !== 'string' || section.id.trim() === '') {
    errors.push({
      readingSlug,
      field: `sections[${index}].id`,
      message: `Section at index ${index} in reading "${readingSlug}" must have a non-empty string "id".`,
    });
  }

  // Check repeatCount if present
  if (section.repeatCount !== undefined) {
    if (
      typeof section.repeatCount !== 'number' ||
      !Number.isInteger(section.repeatCount) ||
      section.repeatCount <= 0
    ) {
      errors.push({
        readingSlug,
        sectionId: section.id,
        field: `sections[${index}].repeatCount`,
        message: `Section "${section.id}" in reading "${readingSlug}" has invalid repeatCount: ${section.repeatCount}. Must be an integer > 0.`,
      });
    }
  }

  // Check at least one content field is present and non-empty
  const hasArabic = typeof section.arabic === 'string' && section.arabic.trim() !== '';
  const hasTransliteration =
    typeof section.transliteration === 'string' && section.transliteration.trim() !== '';
  const hasTranslation =
    typeof section.translation === 'string' && section.translation.trim() !== '';
  const hasInstruction =
    typeof section.instruction === 'string' && section.instruction.trim() !== '';

  if (!hasArabic && !hasTransliteration && !hasTranslation && !hasInstruction) {
    errors.push({
      readingSlug,
      sectionId: section.id,
      field: `sections[${index}]`,
      message: `Section "${section.id}" in reading "${readingSlug}" must have at least one content field ("arabic", "transliteration", "translation", or "instruction").`,
    });
  }

  return errors;
}

/**
 * Validates a single Reading item.
 */
export function validateReading(
  reading: Reading,
  existingSlugs: Set<string>
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check id
  if (!reading.id || typeof reading.id !== 'string' || reading.id.trim() === '') {
    errors.push({
      field: 'id',
      message: `Reading with title "${reading.title || 'Unknown'}" must have a non-empty string "id".`,
    });
  }

  // Check title
  if (!reading.title || typeof reading.title !== 'string' || reading.title.trim() === '') {
    errors.push({
      readingSlug: reading.slug,
      field: 'title',
      message: `Reading with id "${reading.id}" must have a non-empty string "title".`,
    });
  }

  // Check slug
  if (!reading.slug || typeof reading.slug !== 'string' || reading.slug.trim() === '') {
    errors.push({
      field: 'slug',
      message: `Reading with id "${reading.id}" must have a non-empty string "slug".`,
    });
  } else {
    if (!KEBAB_CASE_REGEX.test(reading.slug)) {
      errors.push({
        readingSlug: reading.slug,
        field: 'slug',
        message: `Reading slug "${reading.slug}" must be URL-safe (kebab-case, lowercase letters, numbers, and hyphens).`,
      });
    }

    if (existingSlugs.has(reading.slug)) {
      errors.push({
        readingSlug: reading.slug,
        field: 'slug',
        message: `Duplicate reading slug found: "${reading.slug}". Slugs must be globally unique.`,
      });
    } else {
      existingSlugs.add(reading.slug);
    }
  }

  // Check content source: must have sections (non-empty) or content (non-empty string)
  const hasSections = Array.isArray(reading.sections) && reading.sections.length > 0;
  const hasContent = typeof reading.content === 'string' && reading.content.trim() !== '';

  if (!hasSections && !hasContent) {
    errors.push({
      readingSlug: reading.slug,
      field: 'content/sections',
      message: `Reading "${reading.slug}" must have at least one content source: non-empty "sections" or non-empty "content".`,
    });
  }

  // Validate individual sections and check unique section IDs within this reading
  if (Array.isArray(reading.sections)) {
    const sectionIds = new Set<string>();

    reading.sections.forEach((section, idx) => {
      if (section.id) {
        if (sectionIds.has(section.id)) {
          errors.push({
            readingSlug: reading.slug,
            sectionId: section.id,
            field: `sections[${idx}].id`,
            message: `Duplicate section ID "${section.id}" in reading "${reading.slug}". Section IDs must be unique within a reading.`,
          });
        } else {
          sectionIds.add(section.id);
        }
      }

      const sectionErrors = validateReadingSection(section, idx, reading.slug);
      errors.push(...sectionErrors);
    });
  }

  return errors;
}

/**
 * Validates an array of Reading objects.
 * Throws a detailed Error if any validation error is found.
 */
export function validateReadingsData(readings: Reading[]): Reading[] {
  const allErrors: ValidationError[] = [];
  const existingSlugs = new Set<string>();

  if (!Array.isArray(readings) || readings.length === 0) {
    throw new Error('[Reading Data Validation Failed] Readings data must be a non-empty array.');
  }

  readings.forEach((reading) => {
    const readingErrors = validateReading(reading, existingSlugs);
    allErrors.push(...readingErrors);
  });

  if (allErrors.length > 0) {
    const formattedMessages = allErrors
      .map((err) => `  - [${err.readingSlug || 'Global'}] ${err.field ? `(${err.field}) ` : ''}${err.message}`)
      .join('\n');
    throw new Error(
      `[Reading Data Validation Failed] Found ${allErrors.length} validation error(s):\n${formattedMessages}`
    );
  }

  return readings;
}
