/**
 * Clears local guest reading progress items (`lembaran_progress_*`) from localStorage.
 * Unrelated localStorage keys are left untouched.
 * Safe to call in non-browser/SSR environments or when localStorage is inaccessible.
 */
export function clearGuestLocalProgress(storage?: Storage): void {
  const targetStorage =
    storage || (typeof window !== "undefined" ? window.localStorage : undefined);

  if (!targetStorage) {
    return;
  }

  try {
    const keysToRemove: string[] = [];
    const length = targetStorage.length;

    for (let i = 0; i < length; i++) {
      const key = targetStorage.key(i);
      if (key && key.startsWith("lembaran_progress_")) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      targetStorage.removeItem(key);
    });
  } catch (err) {
    console.error("Failed to clear guest local progress from localStorage:", err);
  }
}
