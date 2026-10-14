import { describe, expect, it } from 'vitest';
import { xendraContent } from '../content/xendraContent';
import { MAP_PATH, SECTION_PATHS } from '../content/sectionPaths';
import { LYRICS_PATH, SONGS } from '../content/lyricsPaths';
import { HOME_META, SECTION_META, pageMetaFor } from './pageMeta';
import { SITE_URL, headHtml, isoDuration, notFoundPage, pageUrl, seoJsonLd, seoPageForUrl, seoPages, sitemapXml } from './siteSeo';
import { LANGUAGES } from '../i18n/languages';

const DAY = new Date('2026-01-01');

describe('seoJsonLd', () => {
  const graph = JSON.parse(seoJsonLd(HOME_META, DAY))['@graph'];
  const group = graph.find((node: { '@type': string }) => node['@type'] === 'MusicGroup');

  it('describes the band with the site content', () => {
    expect(group.name).toBe(xendraContent.band.name);
    expect(group.url).toBe(SITE_URL);
    expect(group.member).toHaveLength(xendraContent.members.length);
    expect(group.sameAs).toEqual(expect.arrayContaining(xendraContent.contact.socialLinks.map((link) => link.url)));
  });

  it('lists the album with every track and an ISO duration', () => {
    expect(group.album.name).toBe(xendraContent.album.albumTitle);
    expect(group.album.track.map((track: { name: string }) => track.name)).toEqual(
      xendraContent.album.tracks.map((track) => track.title),
    );
    expect(group.album.track[0].duration).toMatch(/^PT\d+M\d+S$/);
  });

  it('only announces concerts that are still to come', () => {
    const all = xendraContent.concerts.filter((concert) => concert.date !== null);
    const future = JSON.parse(seoJsonLd(HOME_META, new Date('2000-01-01')))['@graph'][1].event;
    const none = JSON.parse(seoJsonLd(HOME_META, new Date('2100-01-01')))['@graph'][1].event;
    expect(future.length).toBe(all.filter((concert) => concert.status !== 'cancelled').length);
    expect(none).toEqual([]);
  });

  it("gives a section its own page node and breadcrumb, pointing at the section's address", () => {
    const meta = SECTION_META.find((entry) => entry.path === SECTION_PATHS.school)!;
    const types = JSON.parse(seoJsonLd(meta, DAY))['@graph'].map((node: { '@type': string }) => node['@type']);
    expect(types).toEqual(['WebSite', 'MusicGroup', 'WebPage', 'BreadcrumbList']);
    expect(seoJsonLd(meta, DAY)).toContain(`${SITE_URL}musika/`);
  });

  it('cannot close the <script> tag it is placed in', () => {
    expect(seoJsonLd()).not.toContain('<');
  });
});

describe('seoPages', () => {
  // The Basque pages: the site as it's written. The other languages have their own tests below.
  const pages = seoPages(DAY).filter((page) => page.lang === 'eu');

  it('has the map and one page per section, each with its own address, title and description', () => {
    expect(pages.map((page) => page.path)).toEqual([
      MAP_PATH,
      ...Object.values(SECTION_PATHS),
      LYRICS_PATH,
      ...SONGS.map((song) => song.path),
    ]);
    expect(new Set(pages.map((page) => page.url)).size).toBe(pages.length);
    expect(new Set(pages.map((page) => page.title)).size).toBe(pages.length);
    expect(new Set(pages.map((page) => page.description)).size).toBe(pages.length);
    pages.forEach((page) => expect(page.url.startsWith(SITE_URL) && page.url.endsWith('/')).toBe(true));
  });

  it('links every page to the map, every section and the list of songs (which leads to each song)', () => {
    const hubs = pages.filter((page) => !SONGS.some((song) => song.path === page.path));
    pages.forEach((page) => {
      hubs
        .filter((other) => other.path !== page.path)
        .forEach((other) => {
          const href = other.path === MAP_PATH ? 'href="/"' : `href="${other.path}/"`;
          expect(page.summaryHtml, `${page.path} -> ${other.path}`).toContain(href);
        });
    });
  });

  it('carries each section its own content as plain HTML', () => {
    const byPath = new Map(pages.map((page) => [page.path, page.summaryHtml]));
    xendraContent.album.tracks.forEach((track) => expect(byPath.get(SECTION_PATHS.school)).toContain(track.title));
    xendraContent.members.forEach((member) => expect(byPath.get(SECTION_PATHS.fountain)).toContain(member.name));
    xendraContent.history.forEach((stop) => expect(byPath.get(SECTION_PATHS.trainHistory)).toContain(stop.year));
    xendraContent.merch.forEach((product) => expect(byPath.get(SECTION_PATHS.kiosk)).toContain(product.name));
    expect(byPath.get(SECTION_PATHS.stage)).toContain('<time datetime=');
    expect(byPath.get(MAP_PATH)).toContain(`<h1>${xendraContent.band.name}</h1>`);
  });

  it('leaves out private contact details', () => {
    const { phone } = xendraContent.contact;
    if (phone) pages.forEach((page) => expect(page.summaryHtml).not.toContain(phone));
  });

  it('finds the page for a request, whatever its trailing slash or query', () => {
    expect(seoPageForUrl('/musika/?x=1', DAY).path).toBe(SECTION_PATHS.school);
    expect(seoPageForUrl('/musika', DAY).path).toBe(SECTION_PATHS.school);
    expect(seoPageForUrl('/', DAY).path).toBe(MAP_PATH);
    expect(seoPageForUrl('/ez-dago', DAY).path).toBe(MAP_PATH);
  });
});

describe('lyrics pages', () => {
  const pages = seoPages(DAY).filter((page) => page.lang === 'eu');

  it('has the words of every song on the album', () => {
    expect(SONGS.map((song) => song.title)).toEqual(xendraContent.album.tracks.map((track) => track.title));
    SONGS.forEach((song) => expect(song.stanzas.flat().length).toBeGreaterThan(0));
  });

  it("puts each song's words, line by line, on its own page", () => {
    SONGS.forEach((song) => {
      const page = pages.find((entry) => entry.path === song.path)!;
      expect(page.url).toBe(`${SITE_URL}hitzak/${song.slug}/`);
      expect(page.summaryHtml).toContain(`<h1>${song.title}</h1>`);
      song.stanzas.flat().forEach((line) => expect(page.summaryHtml).toContain(line));
    });
  });

  it('describes the song, with its words, in the structured data', () => {
    const song = SONGS[0];
    const graph = JSON.parse(seoJsonLd(pages.find((entry) => entry.path === song.path)!, DAY))['@graph'];
    const node = graph.find((entry: { '@type': string }) => entry['@type'] === 'MusicComposition');
    expect(node.name).toBe(song.title);
    expect(node.lyrics.text).toBe(song.stanzas.map((stanza) => stanza.join('\n')).join('\n\n'));
  });

  it('lists every song from /hitzak and from Musika', () => {
    const index = pages.find((entry) => entry.path === LYRICS_PATH)!.summaryHtml;
    const musika = pages.find((entry) => entry.path === SECTION_PATHS.school)!.summaryHtml;
    SONGS.forEach((song) => {
      expect(index).toContain(`href="${song.path}/"`);
      expect(musika).toContain(`href="${song.path}/"`);
    });
  });
});

describe('the other languages', () => {
  const all = seoPages(DAY);
  const basque = all.filter((page) => page.lang === 'eu');

  it('publishes every page in every language, under the language (Basque at the plain addresses)', () => {
    expect(all).toHaveLength(basque.length * LANGUAGES.length);
    expect(new Set(all.map((page) => page.url)).size).toBe(all.length);
    basque.forEach((page) => {
      const rest = page.path === MAP_PATH ? '' : `${page.path.slice(1)}/`;
      expect(all.find((other) => other.lang === 'es' && other.path === page.path)!.url).toBe(`${SITE_URL}es/${rest}`);
      expect(all.find((other) => other.lang === 'en' && other.path === page.path)!.url).toBe(`${SITE_URL}en/${rest}`);
    });
  });

  it('gives each language its own titles, descriptions and section texts', () => {
    (['es', 'ca', 'gl', 'en'] as const).forEach((lang) => {
      const translated = all.filter((page) => page.lang === lang);
      translated.forEach((page) => {
        const original = basque.find((other) => other.path === page.path)!;
        expect(page.title, page.url).not.toBe(original.title);
        expect(page.description, page.url).not.toBe(original.description);
        expect(page.title).toBe(pageMetaFor(page.path, lang).title);
      });
      const group = translated.find((page) => page.path === SECTION_PATHS.fountain)!.summaryHtml;
      expect(group).not.toContain(xendraContent.band.bio);
      // People's names are the same in every language.
      xendraContent.members.forEach((member) => expect(group).toContain(member.name));
    });
  });

  it('keeps the songs in Basque, and says so', () => {
    const song = SONGS[0];
    const page = all.find((entry) => entry.lang === 'es' && entry.path === song.path)!;
    expect(page.summaryHtml).toContain(`<h1 lang="eu">${song.title}</h1>`);
    expect(page.summaryHtml).toContain('<div lang="eu">');
    song.stanzas.flat().forEach((line) => expect(page.summaryHtml).toContain(line));
  });

  it("links a page to the others in its own language and to itself in the other languages", () => {
    const page = all.find((entry) => entry.lang === 'es' && entry.path === SECTION_PATHS.school)!;
    expect(page.summaryHtml).toContain('href="/es/kontzertuak/"');
    expect(page.summaryHtml).toContain('href="/es/"');
    expect(page.summaryHtml).not.toContain('href="/kontzertuak/"');
    expect(page.summaryHtml).toContain('<a href="/musika/" hreflang="eu" lang="eu">Euskara</a>');
    expect(page.summaryHtml).toContain('<a href="/en/musika/" hreflang="en" lang="en">English</a>');
  });

  it('names every language version of a page in its head, Basque being the default', () => {
    all
      .filter((page) => page.path === SECTION_PATHS.stage)
      .forEach((page) => {
        const head = headHtml(page, DAY);
        expect(head).toContain(`<link rel="canonical" href="${page.url}" />`);
        LANGUAGES.forEach((lang) =>
          expect(head).toContain(`<link rel="alternate" hreflang="${lang}" href="${pageUrl(page.path, lang)}" />`),
        );
        expect(head).toContain(`<link rel="alternate" hreflang="x-default" href="${SITE_URL}kontzertuak/" />`);
      });
    expect(headHtml(all.find((page) => page.lang === 'en')!, DAY)).toContain('<meta property="og:locale" content="en_GB" />');
  });

  it('finds the page for a request in its language', () => {
    expect(seoPageForUrl('/es/musika/', DAY)).toMatchObject({ lang: 'es', path: SECTION_PATHS.school });
    expect(seoPageForUrl('/en', DAY)).toMatchObject({ lang: 'en', path: MAP_PATH });
    expect(seoPageForUrl('/en/ez-dago', DAY)).toMatchObject({ lang: 'en', path: MAP_PATH });
    expect(seoPageForUrl('/musika', DAY).lang).toBe('eu');
  });

  it('describes the page in its language in the structured data', () => {
    const page = all.find((entry) => entry.lang === 'en' && entry.path === SECTION_PATHS.school)!;
    const graph = JSON.parse(seoJsonLd(page, DAY, 'en'))['@graph'];
    const webPage = graph.find((node: { '@type': string }) => node['@type'] === 'WebPage');
    expect(webPage).toMatchObject({ url: `${SITE_URL}en/musika/`, inLanguage: 'en', name: page.title });
    const group = graph.find((node: { '@type': string }) => node['@type'] === 'MusicGroup');
    expect(group.description).not.toBe(xendraContent.band.bio);
    // The band's own address is the same whatever the page's language.
    expect(group.url).toBe(SITE_URL);
  });
});

describe('headHtml', () => {
  it('writes the title, description and canonical address of the page', () => {
    const page = seoPages(DAY).find((entry) => entry.path === SECTION_PATHS.stage)!;
    const head = headHtml(page, DAY);
    expect(head).toContain(`<title>${page.title}</title>`);
    expect(head).toContain(`<link rel="canonical" href="${SITE_URL}kontzertuak/" />`);
    expect(head).toContain('application/ld+json');
  });

  it('keeps the unknown-address page out of search results', () => {
    const head = headHtml(notFoundPage(), DAY, { noindex: true });
    expect(head).toContain('noindex');
    expect(head).not.toContain('rel="canonical"');
  });
});

describe('sitemapXml', () => {
  it('lists every page of every language once, each with its other versions', () => {
    const xml = sitemapXml(DAY);
    seoPages(DAY).forEach((page) => expect(xml).toContain(`<loc>${page.url}</loc>`));
    expect(xml.match(/<url>/g)).toHaveLength(seoPages(DAY).length);
    expect(xml.match(/<xhtml:link /g)).toHaveLength(seoPages(DAY).length * LANGUAGES.length);
  });
});

describe('isoDuration', () => {
  it('turns m:ss into an ISO 8601 duration', () => {
    expect(isoDuration('3:50')).toBe('PT3M50S');
    expect(isoDuration('5:09')).toBe('PT5M9S');
  });
});
