import { describe, expect, it } from 'vitest';
import { MAP_PATH, SECTION_PATHS, legacyRedirect, normalizePath } from './sectionPaths';

describe('normalizePath', () => {
  it("treats a published page's trailing slash as the same place", () => {
    expect(normalizePath('/musika/')).toBe('/musika');
    expect(normalizePath('/musika')).toBe('/musika');
    expect(normalizePath('/')).toBe(MAP_PATH);
    expect(normalizePath('')).toBe(MAP_PATH);
  });
});

describe('legacyRedirect', () => {
  it('sends the old hash addresses to the current paths', () => {
    expect(legacyRedirect({ pathname: '/', hash: '#/musica' })).toBe(SECTION_PATHS.school);
    expect(legacyRedirect({ pathname: '/', hash: '#/merch' })).toBe(SECTION_PATHS.kiosk);
    expect(legacyRedirect({ pathname: '/', hash: '#/mapa' })).toBe(MAP_PATH);
    expect(legacyRedirect({ pathname: '/', hash: '#/gaztelua' })).toBe(SECTION_PATHS.castle);
  });

  it('sends an unknown old hash address to the map', () => {
    expect(legacyRedirect({ pathname: '/', hash: '#/ez-dago' })).toBe(MAP_PATH);
  });

  it('sends an old route typed as a path to the current one', () => {
    expect(legacyRedirect({ pathname: '/conciertos', hash: '' })).toBe(SECTION_PATHS.stage);
    expect(legacyRedirect({ pathname: '/mapa/', hash: '' })).toBe(MAP_PATH);
  });

  it('leaves current addresses (and ordinary in-page hashes) alone', () => {
    expect(legacyRedirect({ pathname: '/musika/', hash: '' })).toBeNull();
    expect(legacyRedirect({ pathname: '/', hash: '' })).toBeNull();
    expect(legacyRedirect({ pathname: '/gaztelua', hash: '' })).toBeNull();
    expect(legacyRedirect({ pathname: '/', hash: '#atala' })).toBeNull();
  });
});
