/**
 * Represents an individual section or step within a reading flow.
 *
 * A section must contain at least one meaningful content field:
 * `arabic`, `transliteration`, `translation`, or `instruction`.
 *
 * Fields like `arabic` and `repeatCount` are strictly optional.
 * `repeatCount` acts as a counting helper for the user and is never a validation gate.
 */
export interface ReadingSection {
  id: string;
  title?: string;
  arabic?: string;
  transliteration?: string;
  translation?: string;
  instruction?: string;
  /**
   * Optional target count helper. Must be an integer > 0 if provided.
   */
  repeatCount?: number;
}

/**
 * Represents a reading item (e.g., Sholawat, Al-Fatihah, Dzikir, Doa, etc.).
 *
 * A reading must have at least one content source: `sections` or `content`.
 */
export interface Reading {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  content?: string;
  sections?: ReadingSection[];
  estimatedTime?: string;
}
