import { xendraContent } from '../content/xendraContent';

/**
 * What search engines and link previews read, built from the same content
 * the site shows (xendraContent) so it can't drift from it. The app itself
 * is a map drawn on a canvas with its sections opened on demand, so without
 * this a crawler finds little more than the band's name:
 *
 *  - `seoJsonLd()`: schema.org structured data (the band, its album and
 *    tracks, its members, upcoming concerts), for the <head>;
 *  - `staticSummaryHtml()`: the same information as plain HTML, placed
 *    inside #root under the loading screen -- there for crawlers and
 *    assistants that don't run JavaScript, replaced by the app as it mounts.
 *
 * vite.config.ts injects both into index.html at build time.
 */
export const SITE_URL = 'https://xendra.eus/';
export const SHARE_IMAGE_URL = `${SITE_URL}og-image.jpg`;
/** Where the band comes from (the island in the site is this town's namesake). */
const HOME_TOWN = 'Uharte, Nafarroa';
const FOUNDED = '2020';
const ALBUM_RELEASED = '2025-01-09';

const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** "3:50" -> "PT3M50S" */
export function isoDuration(label: string): string {
  const [minutes, seconds] = label.split(':').map(Number);
  return `PT${minutes}M${seconds}S`;
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

type Concert = (typeof xendraContent.concerts)[number];
type DatedConcert = Concert & { date: string };

/** Concerts from `today` on that already have a date, soonest first. */
function upcomingConcerts(today: Date): DatedConcert[] {
  const from = isoDay(today);
  return xendraContent.concerts
    .filter((concert): concert is DatedConcert => concert.date !== null && concert.date >= from && concert.status !== 'cancelled')
    .sort((a, b) => a.date.localeCompare(b.date));
}

function listenLinks(): { label: string; url: string }[] {
  return xendraContent.album.externalLinks;
}

/** The band's own pages on the music sites (the album's pages there are the album's `sameAs`). */
const ARTIST_PROFILES = ['https://xendrataldea.bandcamp.com/', 'https://www.badok.eus/euskal-musika/xendra'];

/** Every profile of the band elsewhere: its social accounts and its artist pages. */
function sameAs(): string[] {
  return [...xendraContent.contact.socialLinks.map((link) => link.url), ...ARTIST_PROFILES];
}

export function seoJsonLd(today: Date = new Date()): string {
  const { band, album, members } = xendraContent;
  const group = {
    '@type': 'MusicGroup',
    '@id': `${SITE_URL}#xendra`,
    name: band.name,
    alternateName: 'Xendra taldea',
    url: SITE_URL,
    description: band.bio,
    genre: ['Folk', 'Pop', 'Rock'],
    inLanguage: 'eu',
    foundingDate: FOUNDED,
    foundingLocation: { '@type': 'Place', name: HOME_TOWN },
    image: SHARE_IMAGE_URL,
    sameAs: sameAs(),
    member: members.map((member) => ({
      '@type': 'OrganizationRole',
      roleName: member.instrument,
      member: { '@type': 'Person', name: member.name },
    })),
    album: {
      '@type': 'MusicAlbum',
      name: album.albumTitle,
      datePublished: ALBUM_RELEASED,
      numTracks: album.tracks.length,
      byArtist: { '@id': `${SITE_URL}#xendra` },
      url: listenLinks()[0]?.url ?? SITE_URL,
      sameAs: listenLinks().map((link) => link.url),
      ...(album.coverPath ? { image: new URL(album.coverPath, SITE_URL).href } : {}),
      track: album.tracks.map((track) => ({
        '@type': 'MusicRecording',
        position: track.index,
        name: track.title,
        duration: isoDuration(track.durationLabel),
      })),
    },
    event: upcomingConcerts(today).map((concert) => ({
      '@type': 'MusicEvent',
      name: `${band.name} — ${concert.city}`,
      startDate: concert.time ? `${concert.date}T${concert.time}` : concert.date,
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: concert.venue || concert.city,
        address: { '@type': 'PostalAddress', addressLocality: concert.city },
      },
      performer: { '@id': `${SITE_URL}#xendra` },
      ...(concert.ticketsUrl ? { offers: { '@type': 'Offer', url: concert.ticketsUrl } } : {}),
    })),
  };
  const site = {
    '@type': 'WebSite',
    '@id': `${SITE_URL}#website`,
    url: SITE_URL,
    name: band.name,
    inLanguage: 'eu',
    about: { '@id': `${SITE_URL}#xendra` },
  };
  // "<" escaped so nothing in the content can close the <script> it sits in.
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [site, group] }).replace(/</g, '\\u003c');
}

export function staticSummaryHtml(today: Date = new Date()): string {
  const { band, album, members, press, contact } = xendraContent;
  const concerts = upcomingConcerts(today);
  const link = ({ label, url }: { label: string; url: string }) => `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;
  const list = (items: string[]) => `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;

  const parts = [
    `<h1>${escapeHtml(band.name)}</h1>`,
    `<p>${escapeHtml(band.bio)}</p>`,
    `<p>${escapeHtml(band.originText)}</p>`,
    `<h2>${escapeHtml(album.albumTitle)}</h2>`,
    `<p>${escapeHtml(album.summary)}. ${escapeHtml(album.credits)}</p>`,
    `<ol>${album.tracks.map((track) => `<li>${escapeHtml(track.title)} (${escapeHtml(track.durationLabel)})</li>`).join('')}</ol>`,
    `<p>Entzun: ${listenLinks().map(link).join(', ')}.</p>`,
    '<h2>Taldea</h2>',
    list(members.map((member) => `${escapeHtml(member.name)}: ${escapeHtml(member.instrument)}`)),
  ];
  if (concerts.length > 0) {
    parts.push(
      '<h2>Kontzertuak</h2>',
      list(
        concerts.map(
          (concert) =>
            `<time datetime="${concert.date}">${concert.date}</time>, ${escapeHtml([concert.city, concert.venue].filter(Boolean).join(' · '))}`,
        ),
      ),
    );
  }
  if (press.length > 0) parts.push('<h2>Prentsan</h2>', list(press.map(link)));
  parts.push('<h2>Kontaktua</h2>', `<p>${contact.socialLinks.map(link).join(', ')}</p>`);
  return `<main id="static-summary">${parts.join('')}</main>`;
}
