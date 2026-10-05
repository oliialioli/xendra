import { beforeEach, describe, expect, it } from 'vitest';
import { loadPrizeCodes, rememberPrizeCode } from './prize';

describe('remembered prize codes', () => {
  beforeEach(() => window.localStorage.clear());

  it('keeps each code won, once, in order', () => {
    expect(loadPrizeCodes()).toEqual([]);
    rememberPrizeCode('XENDRA3');
    rememberPrizeCode('XENDRA7-K7QM');
    rememberPrizeCode('XENDRA3');
    expect(loadPrizeCodes()).toEqual(['XENDRA3', 'XENDRA7-K7QM']);
  });

  it('ignores anything that is not a prize code', () => {
    window.localStorage.setItem('xendra-castle-prizes-v1', JSON.stringify(['XENDRA2', '<b>x</b>', 5]));
    expect(loadPrizeCodes()).toEqual(['XENDRA2']);
    window.localStorage.setItem('xendra-castle-prizes-v1', '{broken');
    expect(loadPrizeCodes()).toEqual([]);
  });
});
