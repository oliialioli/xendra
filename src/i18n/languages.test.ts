import { describe, expect, it } from 'vitest';
import { localizePath, splitLangPath } from './languages';
import { hasTranslation, localizeDeep, translate } from './translate';
import { contentFor } from './content';
import { xendraContent } from '../content/xendraContent';

describe('splitLangPath', () => {
  it('reads Basque from a plain address', () => {
    expect(splitLangPath('/')).toEqual({ lang: 'eu', path: '/' });
    expect(splitLangPath('/musika')).toEqual({ lang: 'eu', path: '/musika' });
    expect(splitLangPath('/hitzak/amilena/')).toEqual({ lang: 'eu', path: '/hitzak/amilena' });
  });

  it("reads another language from the address's first part", () => {
    expect(splitLangPath('/es')).toEqual({ lang: 'es', path: '/' });
    expect(splitLangPath('/es/')).toEqual({ lang: 'es', path: '/' });
    expect(splitLangPath('/en/musika/')).toEqual({ lang: 'en', path: '/musika' });
    expect(splitLangPath('/es/hitzak/amilena')).toEqual({ lang: 'es', path: '/hitzak/amilena' });
  });

  it('does not take a section for a language', () => {
    // "/eskola" starts with "es" but isn't /es/...
    expect(splitLangPath('/eskola')).toEqual({ lang: 'eu', path: '/eskola' });
    expect(splitLangPath('/fr/musika')).toEqual({ lang: 'eu', path: '/fr/musika' });
  });

  it('is undone by localizePath', () => {
    (['eu', 'es', 'en'] as const).forEach((lang) => {
      ['/', '/musika', '/hitzak/amilena'].forEach((path) => {
        expect(splitLangPath(localizePath(lang, path))).toEqual({ lang, path });
      });
    });
    expect(localizePath('eu', '/musika')).toBe('/musika');
    expect(localizePath('es', '/')).toBe('/es');
    expect(localizePath('en', '/musika')).toBe('/en/musika');
  });
});

describe('translate', () => {
  it('gives the Basque text back in Basque, and its translation elsewhere', () => {
    expect(translate('eu', 'Itxi')).toBe('Itxi');
    expect(translate('es', 'Itxi')).toBe('Cerrar');
    expect(translate('en', 'Itxi')).toBe('Close');
  });

  it('falls back to the Basque when there is no translation', () => {
    expect(translate('es', 'Ez dago itzulita')).toBe('Ez dago itzulita');
    expect(hasTranslation('es', 'Ez dago itzulita')).toBe(false);
  });

  it('fills in {values}, in whatever order the language puts them', () => {
    expect(translate('eu', '{title}. Sakatu irekitzeko.', { title: 'Musika' })).toBe('Musika. Sakatu irekitzeko.');
    expect(translate('en', 'Xendraren «{song}» abestiaren hitzak, «{album}» diskokoa.', { song: 'Hor', album: 'Bihia' })).toBe(
      "The lyrics of Xendra's song “Hor”, from the album “Bihia”.",
    );
    expect(translate('es', '{n}. abestia', { n: 3 })).toBe('Canción 3');
  });
});

describe('the content in another language', () => {
  it('is the very same object in Basque', () => {
    expect(contentFor('eu')).toBe(xendraContent);
    expect(contentFor('es')).toBe(contentFor('es'));
  });

  it("translates the band's texts and leaves names, addresses and numbers alone", () => {
    const content = contentFor('en');
    expect(content.band.bio).not.toBe(xendraContent.band.bio);
    expect(content.band.name).toBe('Xendra');
    expect(content.members.map((member) => member.name)).toEqual(xendraContent.members.map((member) => member.name));
    expect(content.members[0].instrument).toBe('Drums and backing vocals');
    expect(content.album.tracks).toEqual(xendraContent.album.tracks);
    expect(content.concerts).toEqual(xendraContent.concerts);
    expect(content.landmarks.map((landmark) => [landmark.id, landmark.route, landmark.position])).toEqual(
      xendraContent.landmarks.map((landmark) => [landmark.id, landmark.route, landmark.position]),
    );
    expect(content.contact).toEqual(xendraContent.contact);
  });

  it('does not touch the original', () => {
    const before = JSON.stringify(xendraContent);
    localizeDeep('es', xendraContent);
    expect(JSON.stringify(xendraContent)).toBe(before);
  });
});
