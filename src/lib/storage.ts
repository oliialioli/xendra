/**
 * Versioned, corruption-safe localStorage helpers.
 * All Xendra keys are namespaced `xendra:v1:*` so a future breaking change
 * can bump the version without colliding with old data.
 */

export const STORAGE_PREFIX = 'xendra:v1';

export function storageKey(name: string): string {
  return `${STORAGE_PREFIX}:${name}`;
}

export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
