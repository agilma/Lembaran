export interface ReadingSection {
  id: string;
  title?: string;
  arabic?: string;
  transliteration?: string;
  translation?: string;
  instruction?: string;
  repeatCount?: number;
}

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
