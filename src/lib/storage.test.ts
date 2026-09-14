import { beforeEach, describe, expect, it } from 'vitest';
import { readJSON, writeJSON } from './storage';

describe('storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns the fallback when the key is missing', () => {
    expect(readJSON('missing-key', 'fallback')).toBe('fallback');
  });

  it('round-trips values written with writeJSON', () => {
    writeJSON('some-key', { a: 1 });
    expect(readJSON('some-key', null)).toEqual({ a: 1 });
  });

  it('returns the fallback instead of throwing when JSON is corrupted', () => {
    window.localStorage.setItem('corrupt-key', '{not valid json');
    expect(readJSON('corrupt-key', 'safe-default')).toBe('safe-default');
  });
});
