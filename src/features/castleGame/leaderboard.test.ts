import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LEADERBOARD } from './config';
import { cleanAlias, loadLeaderboard, qualifies, resetMemoryFallback, saveScore } from './leaderboard';

describe('castle leaderboard', () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetMemoryFallback();
  });
  afterEach(() => vi.restoreAllMocks());

  it('starts empty, without made-up scores', () => {
    expect(loadLeaderboard()).toEqual([]);
  });

  it('keeps the best three, highest first, and survives a reload', () => {
    saveScore('Ane', 1200, 1);
    saveScore('Jon', 3400, 2);
    saveScore('Miren', 800, 3);
    saveScore('Unai', 2000, 4);
    expect(loadLeaderboard().map((e) => e.alias)).toEqual(['Jon', 'Unai', 'Ane']);
    expect(JSON.parse(window.localStorage.getItem(LEADERBOARD.storageKey)!)).toHaveLength(3);
  });

  it('keeps the earlier score first on a tie', () => {
    saveScore('Lehena', 1000, 10);
    saveScore('Bigarrena', 1000, 20);
    expect(loadLeaderboard().map((e) => e.alias)).toEqual(['Lehena', 'Bigarrena']);
  });

  it('lets any result in while there are fewer than three, then only a better one', () => {
    expect(qualifies(0, [])).toBe(true);
    saveScore('A', 500, 1);
    saveScore('B', 400, 2);
    saveScore('C', 300, 3);
    const board = loadLeaderboard();
    expect(qualifies(300, board)).toBe(false);
    expect(qualifies(301, board)).toBe(true);
  });

  it('cleans aliases and rejects empty or too long ones', () => {
    expect(cleanAlias('  Ane   Mari ')).toBe('Ane Mari');
    expect(cleanAlias('   ')).toBeNull();
    expect(cleanAlias('a'.repeat(LEADERBOARD.aliasMaxLength + 1))).toBeNull();
    expect(cleanAlias('<b>kaixo</b>')).toBe('<b>kaixo</b>'); // kept as plain text; React renders it as text
  });

  it('ignores broken or tampered storage', () => {
    window.localStorage.setItem(LEADERBOARD.storageKey, '{not json');
    expect(loadLeaderboard()).toEqual([]);
    window.localStorage.setItem(
      LEADERBOARD.storageKey,
      JSON.stringify([{ alias: 'Ona', score: 900, at: 1 }, { alias: '', score: 5, at: 2 }, { alias: 'X', score: -1, at: 3 }, 'zaborra']),
    );
    expect(loadLeaderboard()).toEqual([{ alias: 'Ona', score: 900, at: 1 }]);
  });

  it('still works for this visit when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const board = saveScore('Ane', 700, 1);
    expect(board.map((e) => e.alias)).toEqual(['Ane']);
    expect(loadLeaderboard().map((e) => e.alias)).toEqual(['Ane']);
  });
});
