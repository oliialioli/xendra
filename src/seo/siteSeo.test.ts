import { describe, expect, it } from 'vitest';
import { xendraContent } from '../content/xendraContent';
import { SITE_URL, isoDuration, seoJsonLd, staticSummaryHtml } from './siteSeo';

describe('seoJsonLd', () => {
  const graph = JSON.parse(seoJsonLd(new Date('2026-01-01')))['@graph'];
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
    const future = JSON.parse(seoJsonLd(new Date('2000-01-01')))['@graph'][1].event;
    const none = JSON.parse(seoJsonLd(new Date('2100-01-01')))['@graph'][1].event;
    expect(future.length).toBe(all.filter((concert) => concert.status !== 'cancelled').length);
    expect(none).toEqual([]);
  });

  it('cannot close the <script> tag it is placed in', () => {
    expect(seoJsonLd()).not.toContain('<');
  });
});

describe('staticSummaryHtml', () => {
  const html = staticSummaryHtml(new Date('2026-01-01'));

  it('carries the band, the album tracks and the members as plain HTML', () => {
    expect(html).toContain(`<h1>${xendraContent.band.name}</h1>`);
    xendraContent.album.tracks.forEach((track) => expect(html).toContain(track.title));
    xendraContent.members.forEach((member) => expect(html).toContain(member.name));
  });

  it('leaves out private contact details', () => {
    if (xendraContent.contact.phone) expect(html).not.toContain(xendraContent.contact.phone);
  });
});

describe('isoDuration', () => {
  it('turns m:ss into an ISO 8601 duration', () => {
    expect(isoDuration('3:50')).toBe('PT3M50S');
    expect(isoDuration('5:09')).toBe('PT5M9S');
  });
});
