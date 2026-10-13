import { describe, expect, it } from 'vitest';
import { xendraContent } from '../content/xendraContent';
import { MAP_PATH, SECTION_PATHS } from '../content/sectionPaths';
import { LYRICS_PATH, SONGS } from '../content/lyricsPaths';
import { HOME_META, SECTION_META } from './pageMeta';
import { SITE_URL, headHtml, isoDuration, notFoundPage, seoJsonLd, seoPageForUrl, seoPages, sitemapXml } from './siteSeo';

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
  const pages = seoPages(DAY);

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
  const pages = seoPages(DAY);

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
  it('lists every page once', () => {
    const xml = sitemapXml(DAY);
    seoPages(DAY).forEach((page) => expect(xml).toContain(`<loc>${page.url}</loc>`));
    expect(xml.match(/<url>/g)).toHaveLength(seoPages(DAY).length);
  });
});

describe('isoDuration', () => {
  it('turns m:ss into an ISO 8601 duration', () => {
    expect(isoDuration('3:50')).toBe('PT3M50S');
    expect(isoDuration('5:09')).toBe('PT5M9S');
  });
});
