import { ReadingSection } from "@/types/reading";

export interface ReadingInputData {
  title: string;
  slug: string;
  category: string;
  description?: string;
  estimatedTime?: string;
  content?: string;
  sections?: Array<{
    id?: string;
    title?: string;
    arabic?: string;
    transliteration?: string;
    translation?: string;
    instruction?: string;
    repeatCount?: number | string | null;
  }>;
}

const KEBAB_CASE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Validates and normalizes reading input data.
 * Throws an Error with a user-friendly message if validation fails.
 */
export function validateAndNormalizeReadingInput(input: ReadingInputData): {
  title: string;
  slug: string;
  category: string;
  description: string;
  estimatedTime?: string;
  content?: string;
  sections?: ReadingSection[];
} {
  const title = input.title?.trim();
  if (!title || title.length < 2) {
    throw new Error("Judul bacaan wajib diisi (minimal 2 karakter).");
  }

  const slug = input.slug?.trim().toLowerCase();
  if (!slug || !KEBAB_CASE_REGEX.test(slug)) {
    throw new Error("Slug wajib diisi dan menggunakan format kebab-case (misal: sholawat-pagi).");
  }

  const category = input.category?.trim();
  if (!category) {
    throw new Error("Kategori bacaan wajib diisi.");
  }

  const description = input.description?.trim() || "";
  const estimatedTime = input.estimatedTime?.trim() || undefined;
  const content = input.content?.trim() || undefined;

  let normalizedSections: ReadingSection[] | undefined = undefined;

  if (Array.isArray(input.sections) && input.sections.length > 0) {
    normalizedSections = input.sections.map((sec, idx) => {
      const sectionId =
        sec.id?.trim() || `sec-${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`;

      let normalizedRepeatCount: number | undefined = undefined;
      if (sec.repeatCount !== undefined && sec.repeatCount !== null && sec.repeatCount !== "") {
        const parsed = Number(sec.repeatCount);
        if (isNaN(parsed) || !Number.isInteger(parsed)) {
          throw new Error(
            `Target hitungan pada bagian #${idx + 1} ('${sec.title || "Bagian"}') harus berupa bilangan bulat.`
          );
        }
        if (parsed < 0) {
          throw new Error(
            `Target hitungan pada bagian #${idx + 1} ('${sec.title || "Bagian"}') tidak boleh bernilai negatif.`
          );
        }
        if (parsed > 0) {
          normalizedRepeatCount = parsed;
        }
        // If parsed === 0, normalizedRepeatCount remains undefined (no target)
      }

      const hasContent = Boolean(
        sec.arabic?.trim() ||
          sec.transliteration?.trim() ||
          sec.translation?.trim() ||
          sec.instruction?.trim()
      );

      if (!hasContent) {
        throw new Error(
          `Bagian #${idx + 1} ('${sec.title || "Bagian"}') harus memiliki setidaknya satu konten (Teks Arab, Transliterasi, Terjemahan, atau Instruksi).`
        );
      }

      return {
        id: sectionId,
        title: sec.title?.trim() || undefined,
        arabic: sec.arabic?.trim() || undefined,
        transliteration: sec.transliteration?.trim() || undefined,
        translation: sec.translation?.trim() || undefined,
        instruction: sec.instruction?.trim() || undefined,
        repeatCount: normalizedRepeatCount,
      };
    });
  }

  if (!content && (!normalizedSections || normalizedSections.length === 0)) {
    throw new Error("Bacaan harus memiliki setidaknya satu bagian bacaan atau konten utama.");
  }

  return {
    title,
    slug,
    category,
    description,
    estimatedTime,
    content,
    sections: normalizedSections,
  };
}
