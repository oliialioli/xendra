/**
 * The discount codes this browser has won (see remoteLeaderboard's
 * prizeCode), kept so the player can find theirs again in the game's menu.
 * Like the local ranking, a blocked or broken localStorage just means it
 * isn't remembered -- never an error.
 */
const KEY = 'xendra-castle-prizes-v1';

export function loadPrizeCodes(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((c): c is string => typeof c === 'string' && /^XENDRA\d+$/.test(c)) : [];
  } catch {
    return [];
  }
}

export function rememberPrizeCode(code: string): string[] {
  const codes = loadPrizeCodes();
  const next = codes.includes(code) ? codes : [...codes, code];
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Not remembered; it's still on screen.
  }
  return next;
}
