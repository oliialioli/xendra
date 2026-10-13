import { DEFAULT_LANG, type Lang } from './languages';
import { es } from './es';
import { en } from './en';

/**
 * Translations are keyed by the Basque text itself: the site is written in
 * Basque, and `translate('es', 'Itxi')` gives that text in Spanish -- or the
 * Basque, if nobody has translated it yet, so a missing entry never breaks
 * anything. `{name}` in a text is filled from `values`.
 */
const DICTIONARIES: Record<Exclude<Lang, typeof DEFAULT_LANG>, Record<string, string>> = { es, en };

export type TranslateValues = Record<string, string | number>;

export function translate(lang: Lang, text: string, values?: TranslateValues): string {
  const translated = lang === DEFAULT_LANG ? text : (DICTIONARIES[lang][text] ?? text);
  if (!values) return translated;
  return translated.replace(/\{(\w+)\}/g, (match: string, name: string) => (name in values ? String(values[name]) : match));
}

/**
 * Marks a Basque text that's kept in a list or a constant and translated
 * later, where it's shown, with `t()`. Does nothing by itself: it's what
 * lets the tests find the text and check that it has its translations.
 */
export const msg = (text: string): string => text;

/** True if `text` has its own entry in a language's dictionary (Basque needs none). */
export function hasTranslation(lang: Lang, text: string): boolean {
  return lang === DEFAULT_LANG || text in DICTIONARIES[lang];
}

/**
 * A copy of `value` with every string that has a translation replaced by
 * it; everything else (names, addresses, numbers) is left as it is. This is
 * how the site's content (xendraContent) is shown in another language.
 */
export function localizeDeep<T>(lang: Lang, value: T): T {
  if (lang === DEFAULT_LANG) return value;
  if (typeof value === 'string') return translate(lang, value) as T;
  if (Array.isArray(value)) return value.map((item) => localizeDeep(lang, item)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localizeDeep(lang, item)])) as T;
  }
  return value;
}
