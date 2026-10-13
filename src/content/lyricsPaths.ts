import { xendraContent } from './xendraContent';
import { LYRICS } from './lyrics';

/**
 * The songs' words each have their own address under /hitzak
 * (/hitzak/errauts-eskuak...), with /hitzak itself listing them. They open
 * inside the Musika section's panel and, like every address, are published
 * as their own pages (src/seo/siteSeo.ts).
 */
export const LYRICS_PATH = '/hitzak';

export type Song = {
  slug: string;
  path: string;
  index: number;
  title: string;
  durationLabel: string;
  stanzas: string[][];
};

/** "Errauts eskuak" -> "errauts-eskuak" */
export function songSlug(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, '-');
}

/** The album's songs that have their words written down, in album order. */
export const SONGS: Song[] = xendraContent.album.tracks.flatMap((track) => {
  const slug = songSlug(track.title);
  const stanzas = LYRICS[slug];
  if (!stanzas) return [];
  return [{ slug, path: `${LYRICS_PATH}/${slug}`, index: track.index, title: track.title, durationLabel: track.durationLabel, stanzas }];
});

/**
 * What a (normalized) path asks of the lyrics: null if it isn't one of
 * theirs, '' for the list at /hitzak, otherwise the song's slug -- which
 * may be of no song at all (an address that leads nowhere).
 */
export function lyricsSlugFromPath(path: string): string | null {
  if (path === LYRICS_PATH) return '';
  return path.startsWith(`${LYRICS_PATH}/`) ? path.slice(LYRICS_PATH.length + 1) : null;
}

export function songBySlug(slug: string): Song | null {
  return SONGS.find((song) => song.slug === slug) ?? null;
}
