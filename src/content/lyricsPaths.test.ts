import { describe, expect, it } from 'vitest';
import { LYRICS_PATH, lyricsSlugFromPath, songBySlug, songSlug } from './lyricsPaths';

describe('songSlug', () => {
  it("makes an address out of a song's title", () => {
    expect(songSlug('Errauts eskuak')).toBe('errauts-eskuak');
    expect(songSlug('Hor')).toBe('hor');
  });
});

describe('lyricsSlugFromPath', () => {
  it('tells the list, a song and everything else apart', () => {
    expect(lyricsSlugFromPath(LYRICS_PATH)).toBe('');
    expect(lyricsSlugFromPath('/hitzak/errauts-eskuak')).toBe('errauts-eskuak');
    expect(lyricsSlugFromPath('/musika')).toBeNull();
    expect(lyricsSlugFromPath('/hitzakoa')).toBeNull();
  });
});

describe('songBySlug', () => {
  it('finds a song, and nothing for an address that is no song', () => {
    expect(songBySlug('errauts-eskuak')?.title).toBe('Errauts eskuak');
    expect(songBySlug('ez-dago')).toBeNull();
    expect(songBySlug('')).toBeNull();
  });
});
