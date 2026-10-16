import type { LandmarkId } from '../types/content';

/**
 * The site's addresses: the map at the root and one real path per section
 * (the place on the map that opens it), named as the menu names them. Each
 * is published as its own page (see src/seo/siteSeo.ts and vite.config.ts),
 * so it can be linked to and found on its own.
 *
 * Pure data, no components: the content, the router, the audio ducking and
 * the build-time SEO all read the paths from here.
 */
export const MAP_PATH = '/';

export const SECTION_PATHS = {
  school: '/musika',
  stage: '/kontzertuak',
  fountain: '/taldea',
  trainHistory: '/gure-xendra',
  kiosk: '/denda',
  bulletinBoard: '/galeria',
  dockMessages: '/ontziak',
  castle: '/gaztelua',
  postbox: '/kontaktua',
} as const satisfies Record<LandmarkId, string>;

/** What cookies the site uses and the visitor's choice about them (linked from the cookie notice and the menu). */
export const COOKIES_PATH = '/cookieak';

/** Each section's name: in the menu, on its map badge, as its panel's title. */
export const SECTION_TITLES: Record<LandmarkId, string> = {
  school: 'Musika',
  stage: 'Kontzertuak',
  fountain: 'Taldea',
  trainHistory: 'Gure Xendra',
  kiosk: 'Denda',
  bulletinBoard: 'Galeria',
  dockMessages: 'Bidali zure ontzia',
  castle: 'Gaztelu magikoa',
  postbox: 'Kontaktua',
};

/**
 * Where the addresses used before the site had real paths lead now. They
 * lived after a "#" (xendra.eus/#/musica), so links shared back then still
 * arrive at the root page with the old route in the hash.
 */
const LEGACY_PATHS: Record<string, string> = {
  '/mapa': MAP_PATH,
  '/musica': SECTION_PATHS.school,
  '/conciertos': SECTION_PATHS.stage,
  '/grupo': SECTION_PATHS.fountain,
  '/historia': SECTION_PATHS.trainHistory,
  '/merch': SECTION_PATHS.kiosk,
  '/archivo': SECTION_PATHS.bulletinBoard,
  '/mezuak': SECTION_PATHS.dockMessages,
  '/gaztelua': SECTION_PATHS.castle,
  '/contacto': SECTION_PATHS.postbox,
};

/** "/musika/" (how a published page's own address ends) and "/musika" are the same place. */
export function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? MAP_PATH : trimmed;
}

/**
 * The current path an old-style address should become, or null if the
 * address is already a current one. Handles both the old hash form
 * ("/#/musica") and an old route typed as a path ("/musica").
 */
export function legacyRedirect(location: { pathname: string; hash: string }): string | null {
  if (location.hash.startsWith('#/')) {
    const old = normalizePath(location.hash.slice(1));
    return LEGACY_PATHS[old] ?? (Object.values<string>(SECTION_PATHS).includes(old) ? old : MAP_PATH);
  }
  const path = normalizePath(location.pathname);
  // '/gaztelua' kept its name: nothing to redirect.
  return path in LEGACY_PATHS && LEGACY_PATHS[path] !== path ? LEGACY_PATHS[path] : null;
}
