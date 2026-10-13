import { xendraContent } from '../content/xendraContent';
import { MAP_PATH, SECTION_PATHS, SECTION_TITLES } from '../content/sectionPaths';
import type { LandmarkId } from '../types/content';
import { LYRICS_PATH, SONGS, songBySlug, lyricsSlugFromPath, type Song } from '../content/lyricsPaths';
import { HOME_META, allPageMeta, homeMeta, type PageMeta } from './pageMeta';
import { contentFor } from '../i18n/content';
import { DEFAULT_LANG, LANGUAGES, LANGUAGE_NAMES, OG_LOCALES, localizePath, splitLangPath, type Lang } from '../i18n/languages';
import { translate, type TranslateValues } from '../i18n/translate';

/**
 * What search engines and link previews read, built from the same content
 * the site shows (xendraContent) so it can't drift from it. The app itself
 * is a map drawn on a canvas with its sections opened on demand, so without
 * this a crawler finds little more than the band's name.
 *
 * Every address (the map and each section, see sectionPaths.ts), in each of
 * the site's languages (i18n/languages.ts: /musika, /es/musika, /en/musika),
 * is published as its own HTML page running the same app. Each page names
 * its versions in the other languages (hreflang), so a search engine shows
 * the one in the searcher's language. For each one this gives:
 *
 *  - `headHtml()`: its title, description, canonical address, link-preview
 *    tags and schema.org structured data, for the <head>;
 *  - `summaryHtml`: that section's content as plain HTML, placed inside
 *    #root under the loading screen -- there for crawlers and assistants
 *    that don't run JavaScript, replaced by the app as it mounts.
 *
 * vite.config.ts writes the pages (and sitemap.xml, 404.html) at build time.
 */
export const SITE_URL = 'https://xendra.eus/';
export const SHARE_IMAGE_URL = `${SITE_URL}og-image.jpg`;
/** Where the band comes from (the island in the site is this town's namesake). */
const HOME_TOWN = 'Uharte, Nafarroa';
// As the band has it on MusicBrainz and Wikidata (the history page starts earlier, in 2020, with four friends rehearsing).
const FOUNDED = '2024';
const ALBUM_RELEASED = '2025-01-09';

export type SeoPage = PageMeta & {
  lang: Lang;
  /** The page's own address: a published page's ends in a slash. */
  url: string;
  summaryHtml: string;
  /** index.html's own two lines of text (before the app has loaded, and without JavaScript) in the page's language. */
  loadingText: string;
  noscriptText: string;
};

/** `t('Hitzak')` in `lang`: the same translations the app uses. */
const translator = (lang: Lang) => (text: string, values?: TranslateValues) => translate(lang, text, values);

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

export function pageUrl(path: string, lang: Lang = DEFAULT_LANG): string {
  const local = localizePath(lang, path);
  return local === '/' ? SITE_URL : `${SITE_URL}${local.replace(/^\//, '')}/`;
}

/** The same address as a link between the published pages ("/es/musika/"). */
function pageHref(path: string, lang: Lang): string {
  return new URL(pageUrl(path, lang)).pathname;
}

type Concert = (typeof xendraContent.concerts)[number];
type DatedConcert = Concert & { date: string };

function datedConcerts(): DatedConcert[] {
  return xendraContent.concerts.filter(
    (concert): concert is DatedConcert => concert.date !== null && concert.status !== 'cancelled',
  );
}

/** Concerts from `today` on that already have a date, soonest first. */
function upcomingConcerts(today: Date): DatedConcert[] {
  const from = isoDay(today);
  return datedConcerts()
    .filter((concert) => concert.date >= from)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Concerts already played, latest first. */
function pastConcerts(today: Date): DatedConcert[] {
  const from = isoDay(today);
  return datedConcerts()
    .filter((concert) => concert.date < from)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function listenLinks(): { label: string; url: string }[] {
  return xendraContent.album.externalLinks;
}

/**
 * The band's own pages on the music sites and databases (the album's pages
 * there are the album's `sameAs`). Not Apple Music's artist page: Apple has
 * this band's releases on one page with those of other artists called Xendra.
 */
const ARTIST_PROFILES = [
  'https://xendrataldea.bandcamp.com/',
  'https://www.badok.eus/euskal-musika/xendra',
  'https://musicbrainz.org/artist/6f648d68-98ce-4d0c-9c0d-2533d53d6483',
  'https://www.wikidata.org/wiki/Q141726929',
];

/** Every profile of the band elsewhere: its social accounts and its artist pages. */
function sameAs(): string[] {
  return [...xendraContent.contact.socialLinks.map((link) => link.url), ...ARTIST_PROFILES];
}

// --- structured data -------------------------------------------------------

function groupNode(today: Date, lang: Lang) {
  const { band, album, members } = contentFor(lang);
  return {
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
      url: pageUrl(SECTION_PATHS.school, lang),
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
      name: `${band.name} (${concert.city})`,
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
}

/** A song with its words, as the page about it describes it. */
function songNode(song: Song, lang: Lang) {
  const url = pageUrl(song.path, lang);
  return {
    '@type': 'MusicComposition',
    '@id': `${url}#song`,
    name: song.title,
    url,
    inLanguage: 'eu',
    composer: { '@id': `${SITE_URL}#xendra` },
    lyrics: {
      '@type': 'CreativeWork',
      inLanguage: 'eu',
      text: song.stanzas.map((stanza) => stanza.join('\n')).join('\n\n'),
    },
    recordedAs: {
      '@type': 'MusicRecording',
      name: song.title,
      duration: isoDuration(song.durationLabel),
      byArtist: { '@id': `${SITE_URL}#xendra` },
      inAlbum: { '@type': 'MusicAlbum', name: xendraContent.album.albumTitle },
    },
  };
}

/** The page's schema.org graph: the site, the band, and (for a section) the page itself with its place in the site. */
export function seoJsonLd(page: PageMeta = HOME_META, today: Date = new Date(), lang: Lang = DEFAULT_LANG): string {
  const site = {
    '@type': 'WebSite',
    '@id': `${SITE_URL}#website`,
    url: SITE_URL,
    name: xendraContent.band.name,
    inLanguage: [...LANGUAGES],
    about: { '@id': `${SITE_URL}#xendra` },
  };
  const graph: object[] = [site, groupNode(today, lang)];
  if (page.path !== MAP_PATH) {
    const url = pageUrl(page.path, lang);
    graph.push(
      {
        '@type': 'WebPage',
        '@id': url,
        url,
        name: page.title,
        description: page.description,
        inLanguage: lang,
        isPartOf: { '@id': `${SITE_URL}#website` },
        about: { '@id': `${SITE_URL}#xendra` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: xendraContent.band.name, item: pageUrl(MAP_PATH, lang) },
          { '@type': 'ListItem', position: 2, name: page.title, item: url },
        ],
      },
    );
  }
  const song = songBySlug(lyricsSlugFromPath(page.path) ?? '');
  if (song) graph.push(songNode(song, lang));
  // "<" escaped so nothing in the content can close the <script> it sits in.
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}

// --- plain-HTML summaries ---------------------------------------------------

const link = ({ label, url }: { label: string; url: string }) => `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;
const list = (items: string[], ordered = false) =>
  `<${ordered ? 'ol' : 'ul'}>${items.map((item) => `<li>${item}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`;
const paragraph = (text: string) => `<p>${escapeHtml(text)}</p>`;

function concertLine(concert: DatedConcert): string {
  return `<time datetime="${concert.date}">${concert.date}</time>, ${escapeHtml([concert.city, concert.venue].filter(Boolean).join(' · '))}`;
}

function albumHtml(lang: Lang): string[] {
  const { album } = contentFor(lang);
  const t = translator(lang);
  return [
    paragraph(`${album.summary}. ${album.credits}`),
    list(
      album.tracks.map((track) => `${escapeHtml(track.title)} (${escapeHtml(track.durationLabel)})`),
      true,
    ),
    `<p>${escapeHtml(t('Entzun'))}: ${listenLinks().map(link).join(', ')}.</p>`,
  ];
}

function membersHtml(lang: Lang): string {
  return list(contentFor(lang).members.map((member) => `${escapeHtml(member.name)}: ${escapeHtml(member.instrument)}`));
}

/**
 * Every page links to all the others in its language, so a crawler landing
 * on one finds the rest -- and to itself in the other languages.
 */
function siteNav(current: string, lang: Lang): string {
  const t = translator(lang);
  const entries = [
    { path: MAP_PATH, label: xendraContent.band.name },
    ...(Object.keys(SECTION_PATHS) as LandmarkId[]).map((id) => ({ path: SECTION_PATHS[id], label: t(SECTION_TITLES[id]) })),
    ...(SONGS.length > 0 ? [{ path: LYRICS_PATH, label: t('Hitzak') }] : []),
  ];
  const sections = `<nav aria-label="${escapeHtml(t('Xendraren atalak'))}">${list(
    entries
      .filter((entry) => entry.path !== current)
      .map((entry) => `<a href="${pageHref(entry.path, lang)}">${escapeHtml(entry.label)}</a>`),
  )}</nav>`;
  // An address that isn't a page has no versions of its own: the other languages' home pages, then.
  const here = allPageMeta(lang).some((meta) => meta.path === current) ? current : MAP_PATH;
  const languages = `<nav aria-label="${escapeHtml(t('Hizkuntza'))}">${list(
    LANGUAGES.filter((other) => other !== lang).map(
      (other) => `<a href="${pageHref(here, other)}" hreflang="${other}" lang="${other}">${escapeHtml(LANGUAGE_NAMES[other])}</a>`,
    ),
  )}</nav>`;
  return sections + languages;
}

function sectionBody(path: string, today: Date, lang: Lang): string[] {
  const { band, album, history, press, merch, kiosk, contact } = contentFor(lang);
  const t = translator(lang);
  const heading = (text: string) => `<h2>${escapeHtml(text)}</h2>`;
  switch (path) {
    case SECTION_PATHS.school:
      return [
        `<h2>${escapeHtml(album.albumTitle)}</h2>`,
        ...albumHtml(lang),
        ...(SONGS.length > 0 ? [heading(t('Hitzak')), list(SONGS.map(songLink(lang)), true)] : []),
        ...(album.video
          ? [
              heading(t('Bideoklipa')),
              `<p>${link({ label: album.video.caption, url: `https://www.youtube.com/watch?v=${album.video.youtubeId}` })}</p>`,
            ]
          : []),
      ];
    case SECTION_PATHS.stage: {
      const upcoming = upcomingConcerts(today);
      const past = pastConcerts(today);
      return [
        ...(upcoming.length > 0 ? [heading(t('Hurrengo kontzertuak')), list(upcoming.map(concertLine))] : []),
        ...(past.length > 0 ? [heading(t('Emandako kontzertuak')), list(past.map(concertLine))] : []),
      ];
    }
    case SECTION_PATHS.fountain:
      return [paragraph(band.bio), heading(t('Kideak')), membersHtml(lang)];
    case SECTION_PATHS.trainHistory:
      return [
        paragraph(band.originText),
        ...history.flatMap((stop) => [`<h2>${escapeHtml(stop.year)}</h2>`, paragraph(stop.description)]),
        ...(press.length > 0 ? [heading(t('Prentsan')), list(press.map(link))] : []),
      ];
    case SECTION_PATHS.kiosk:
      return [
        paragraph(kiosk.intro),
        list(merch.map((product) => escapeHtml([product.name, product.priceLabel].filter(Boolean).join(': ')))),
        ...(kiosk.orderUrl ? [`<p>${link({ label: t('Bete eskaera-orria'), url: kiosk.orderUrl })}</p>`] : []),
      ];
    case SECTION_PATHS.postbox:
      return [`<p>${contact.socialLinks.map(link).join(', ')}</p>`];
    default:
      return [];
  }
}

function homeBody(today: Date, lang: Lang): string[] {
  const { band, album, press, contact } = contentFor(lang);
  const t = translator(lang);
  const heading = (text: string) => `<h2>${escapeHtml(text)}</h2>`;
  const concerts = upcomingConcerts(today);
  return [
    paragraph(band.bio),
    paragraph(band.originText),
    `<h2>${escapeHtml(album.albumTitle)}</h2>`,
    ...albumHtml(lang),
    heading(t('Taldea')),
    membersHtml(lang),
    ...(concerts.length > 0 ? [heading(t('Kontzertuak')), list(concerts.map(concertLine))] : []),
    ...(press.length > 0 ? [heading(t('Prentsan')), list(press.map(link))] : []),
    heading(t('Kontaktua')),
    `<p>${contact.socialLinks.map(link).join(', ')}</p>`,
  ];
}

/** Song titles and words are Basque on every page: said so on the pages that aren't. */
const basque = (lang: Lang) => (lang === DEFAULT_LANG ? '' : ' lang="eu"');
const songLink = (lang: Lang) => (song: Song) => `<a href="${pageHref(song.path, lang)}"${basque(lang)}>${escapeHtml(song.title)}</a>`;

/** The list of songs (/hitzak), or one song's words. */
function lyricsSummaryHtml(meta: PageMeta, slug: string, lang: Lang): string {
  const t = translator(lang);
  const song = songBySlug(slug);
  if (!song) {
    return `<main id="static-summary"><h1>${escapeHtml(t('Hitzak'))}</h1>${paragraph(meta.description)}${list(SONGS.map(songLink(lang)), true)}${siteNav(meta.path, lang)}</main>`;
  }
  const position = SONGS.indexOf(song);
  const neighbours = [SONGS[position - 1], SONGS[position + 1]].filter(Boolean).map(songLink(lang));
  const words = song.stanzas.map((stanza) => `<p>${stanza.map(escapeHtml).join('<br>')}</p>`).join('');
  return [
    '<main id="static-summary">',
    `<h1${basque(lang)}>${escapeHtml(song.title)}</h1>`,
    paragraph(`${xendraContent.band.name} · ${xendraContent.album.albumTitle} · ${song.durationLabel}`),
    // The words are the song's own, in Basque, whatever the page's language.
    `<div lang="eu">${words}</div>`,
    `<p><a href="${pageHref(LYRICS_PATH, lang)}">${escapeHtml(t('Abesti guztiak'))}</a>${neighbours.length > 0 ? `: ${neighbours.join(', ')}` : ''}</p>`,
    siteNav(meta.path, lang),
    '</main>',
  ].join('');
}

function summaryHtml(meta: PageMeta, today: Date, lang: Lang): string {
  const lyricsSlug = lyricsSlugFromPath(meta.path);
  if (lyricsSlug !== null) return lyricsSummaryHtml(meta, lyricsSlug, lang);
  const isHome = meta.path === MAP_PATH;
  const sectionId = (Object.keys(SECTION_PATHS) as LandmarkId[]).find((id) => SECTION_PATHS[id] === meta.path);
  const heading = isHome ? xendraContent.band.name : sectionId ? translate(lang, SECTION_TITLES[sectionId]) : meta.title;
  const body = isHome ? homeBody(today, lang) : [paragraph(meta.description), ...sectionBody(meta.path, today, lang)];
  return `<main id="static-summary"><h1>${escapeHtml(heading)}</h1>${body.join('')}${siteNav(meta.path, lang)}</main>`;
}

// --- pages --------------------------------------------------------------------

function shellTexts(lang: Lang): Pick<SeoPage, 'loadingText' | 'noscriptText'> {
  const t = translator(lang);
  return {
    loadingText: escapeHtml(t('Uhartea prestatzen…')),
    noscriptText: escapeHtml(t('Uharte interaktiboak JavaScript behar du; goiko informazioa hala ere irakur dezakezu.')),
  };
}

/** Every published page: in each language, the map, each section, then the songs' words. */
export function seoPages(today: Date = new Date()): SeoPage[] {
  return LANGUAGES.flatMap((lang) =>
    allPageMeta(lang).map((meta) => ({
      ...meta,
      lang,
      url: pageUrl(meta.path, lang),
      summaryHtml: summaryHtml(meta, today, lang),
      ...shellTexts(lang),
    })),
  );
}

/** The page for an address, as the dev server needs it (an unknown one gets the home page's, in its language). */
export function seoPageFor(path: string, today: Date = new Date(), lang: Lang = DEFAULT_LANG): SeoPage {
  const pages = seoPages(today).filter((page) => page.lang === lang);
  return pages.find((page) => page.path === path) ?? pages[0];
}

/** The same, from a request's URL (query and trailing slash ignored; the language is its first part). */
export function seoPageForUrl(url: string, today: Date = new Date()): SeoPage {
  const { lang, path } = splitLangPath(new URL(url, SITE_URL).pathname);
  return seoPageFor(path, today, lang);
}

/**
 * What an address that isn't a page gets: the app (which says so itself, in
 * the address's language), kept out of search results. One file serves them
 * all, so this text is in Basque.
 */
export function notFoundPage(): SeoPage {
  const lang = DEFAULT_LANG;
  const t = translator(lang);
  return {
    path: '/404',
    lang,
    title: `Xendra: ${t('Orri ezezaguna').toLowerCase()}`,
    description: t('Helbide hau ez dagokio Xendraren atal bati ere.'),
    url: SITE_URL,
    summaryHtml: `<main id="static-summary"><h1>${escapeHtml(t('Orri ezezaguna'))}</h1><p>${escapeHtml(t('Helbide hau ez dagokio Xendraren atal bati ere.'))}</p>${siteNav('/404', lang)}</main>`,
    ...shellTexts(lang),
  };
}

/** The page's versions in every language, for search engines to offer each reader theirs (the Basque one when in doubt). */
function alternateLinks(page: SeoPage): string[] {
  return [
    ...LANGUAGES.map((lang) => `<link rel="alternate" hreflang="${lang}" href="${pageUrl(page.path, lang)}" />`),
    `<link rel="alternate" hreflang="x-default" href="${pageUrl(page.path, DEFAULT_LANG)}" />`,
  ];
}

export function headHtml(page: SeoPage, today: Date = new Date(), options: { noindex?: boolean } = {}): string {
  const t = translator(page.lang);
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    ...(options.noindex
      ? ['<meta name="robots" content="noindex" />']
      : [`<link rel="canonical" href="${page.url}" />`, ...alternateLinks(page)]),
    '<meta property="og:type" content="website" />',
    `<meta property="og:site_name" content="${escapeHtml(xendraContent.band.name)}" />`,
    `<meta property="og:locale" content="${OG_LOCALES[page.lang]}" />`,
    ...LANGUAGES.filter((lang) => lang !== page.lang).map(
      (lang) => `<meta property="og:locale:alternate" content="${OG_LOCALES[lang]}" />`,
    ),
    `<meta property="og:url" content="${page.url}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:image" content="${SHARE_IMAGE_URL}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta property="og:image:alt" content="${escapeHtml(t('Xendra: barraskiloa eta taldearen logoa'))}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${SHARE_IMAGE_URL}" />`,
    // An address that isn't a page describes the site, not a page of its own.
    `<script type="application/ld+json">${seoJsonLd(options.noindex ? homeMeta(page.lang) : page, today, page.lang)}</script>`,
  ].join('\n    ');
}

/** Every page in every language, each with its versions in the others. */
export function sitemapXml(today: Date = new Date()): string {
  const urls = seoPages(today)
    .map((page) => {
      const alternates = LANGUAGES.map(
        (lang) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${pageUrl(page.path, lang)}" />`,
      ).join('\n');
      return `  <url>\n    <loc>${page.url}</loc>\n    <lastmod>${isoDay(today)}</lastmod>\n${alternates}\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
}
