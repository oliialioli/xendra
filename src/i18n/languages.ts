/**
 * The site's languages. Basque is the default and lives at the plain
 * addresses (/musika); the others live under their code (/es/musika,
 * /en/musika). The language is always read from the address, so a link
 * carries it and each language's pages can be found on their own.
 */
export const LANGUAGES = ['eu', 'es', 'en'] as const;
export type Lang = (typeof LANGUAGES)[number];
export const DEFAULT_LANG = 'eu' satisfies Lang;

/** Each language's own name, as the switch shows it. */
export const LANGUAGE_NAMES: Record<Lang, string> = { eu: 'Euskara', es: 'Castellano', en: 'English' };

/** For og:locale. */
export const OG_LOCALES: Record<Lang, string> = { eu: 'eu_ES', es: 'es_ES', en: 'en_GB' };

export function isLang(value: string): value is Lang {
  return (LANGUAGES as readonly string[]).includes(value);
}

/**
 * Splits an address into its language and the language-less path the rest
 * of the app works with: "/es/musika/" -> { lang: 'es', path: '/musika' },
 * "/musika" -> { lang: 'eu', path: '/musika' }, "/en" -> { lang: 'en', path: '/' }.
 */
export function splitLangPath(pathname: string): { lang: Lang; path: string } {
  const trimmed = pathname.replace(/\/+$/, '');
  const [, first, ...rest] = trimmed.split('/');
  // "/eu/musika" is understood too, though Basque's own addresses have no prefix.
  if (first && isLang(first)) {
    return { lang: first, path: rest.length > 0 ? `/${rest.join('/')}` : '/' };
  }
  return { lang: DEFAULT_LANG, path: trimmed === '' ? '/' : trimmed };
}

/** The address of a (language-less) path in a language: ('es', '/musika') -> "/es/musika", ('es', '/') -> "/es". */
export function localizePath(lang: Lang, path: string): string {
  if (lang === DEFAULT_LANG) return path;
  return path === '/' ? `/${lang}` : `/${lang}${path}`;
}
