/**
 * Clears all guest local progress keys from storage matching the prefix `lembaran_progress_`.
 * Preserves all other local storage keys (e.g. `theme`, settings, etc.).
 *
 * @param storage Storage implementation to use (defaults to window.localStorage in browser)
 */
export function clearGuestLocalProgress(storage?: Storage): void {
  const targetStorage =
    storage || (typeof window !== "undefined" ? window.localStorage : undefined);

  if (!targetStorage) {
    return;
  }

  const prefix = "lembaran_progress_";
  const keysToRemove: string[] = [];

  for (let i = 0; i < targetStorage.length; i++) {
    const key = targetStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    targetStorage.removeItem(key);
  }
}
