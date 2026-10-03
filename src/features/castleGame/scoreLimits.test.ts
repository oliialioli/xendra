import { describe, expect, it } from 'vitest';
import { SCORE } from './config';
import { ENEMIES, NOTES } from './level';

/**
 * supabase/migrations/0002_castle_scores.sql refuses scores above what a
 * game can really earn, with these totals written into it. If the level or
 * the points change, this fails until the migration's numbers are updated.
 */
describe('the shared ranking limits', () => {
  it('match what a game can earn', () => {
    const withoutDoor = NOTES.length * SCORE.note + ENEMIES.length * SCORE.enemy + SCORE.boss;
    expect(withoutDoor).toBe(3800);
    expect(withoutDoor + SCORE.door + SCORE.timeBonusMax).toBe(8800);
    expect(SCORE.timeBonusPerSecond).toBe(20);
  });
});
