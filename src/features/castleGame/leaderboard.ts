import { LEADERBOARD } from './config';

export type LeaderboardEntry = {
  alias: string;
  score: number;
  /** When it was saved (ms since epoch): on a tie, the earlier one stays ahead. */
  at: number;
  /** Seconds it took, for a game won at the door (absent for a game over). */
  time?: number;
};

/**
 * Kept in memory too, so the ranking still works for this visit when
 * localStorage is blocked (private mode, storage disabled) -- it just
 * won't survive a reload.
 */
let memoryFallback: LeaderboardEntry[] = [];

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Trims, collapses spaces and drops control characters; null if nothing usable is left or it's too long. */
export function cleanAlias(raw: string): string | null {
  // eslint-disable-next-line no-control-regex
  const alias = raw.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
  const length = Array.from(alias).length;
  if (length === 0 || length > LEADERBOARD.aliasMaxLength) return null;
  return alias;
}

function isEntry(value: unknown): value is LeaderboardEntry {
  if (typeof value !== 'object' || value === null) return false;
  const { alias, score, at, time } = value as Record<string, unknown>;
  return (
    typeof alias === 'string' &&
    cleanAlias(alias) === alias &&
    typeof score === 'number' &&
    Number.isInteger(score) &&
    score >= 0 &&
    typeof at === 'number' &&
    Number.isFinite(at) &&
    (time === undefined || (typeof time === 'number' && Number.isFinite(time) && time >= 0))
  );
}

/** Highest first; on a tie, whoever got there first. */
export function rank(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => b.score - a.score || a.at - b.at).slice(0, LEADERBOARD.size);
}

/** The stored top 3; anything unreadable or malformed is ignored rather than breaking the game. */
export function loadLeaderboard(): LeaderboardEntry[] {
  const store = storage();
  if (!store) return rank(memoryFallback);
  try {
    const raw = store.getItem(LEADERBOARD.storageKey);
    if (!raw) return rank(memoryFallback);
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? rank(parsed.filter(isEntry)) : [];
  } catch {
    return rank(memoryFallback);
  }
}

/** Whether `score` would make the top 3 (always, while there are fewer than 3 entries). A tie with 3rd doesn't. */
export function qualifies(score: number, entries: LeaderboardEntry[]): boolean {
  const ranked = rank(entries);
  return ranked.length < LEADERBOARD.size || score > ranked[ranked.length - 1].score;
}

/** Adds a result and returns the new top 3. Saving can fail silently: the returned ranking is still right for this visit. */
export function saveScore(alias: string, score: number, now: number = Date.now(), time?: number): LeaderboardEntry[] {
  const clean = cleanAlias(alias);
  if (clean === null) return loadLeaderboard();
  const entry: LeaderboardEntry = { alias: clean, score, at: now };
  if (time !== undefined) entry.time = Math.round(time * 10) / 10;
  const next = rank([...loadLeaderboard(), entry]);
  memoryFallback = next;
  try {
    storage()?.setItem(LEADERBOARD.storageKey, JSON.stringify(next));
  } catch {
    // Storage full or blocked: the in-memory copy above still holds it.
  }
  return next;
}

/** Test helper: forget the in-memory copy. */
export function resetMemoryFallback(): void {
  memoryFallback = [];
}
