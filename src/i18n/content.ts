import { xendraContent } from '../content/xendraContent';
import type { XendraContent } from '../types/content';
import { DEFAULT_LANG, type Lang } from './languages';
import { localizeDeep } from './translate';

const contentByLang = new Map<Lang, XendraContent>([[DEFAULT_LANG, xendraContent]]);

/**
 * The site's content (xendraContent) in a language: the same object with its
 * Basque texts replaced by their translations. Built once per language, so
 * it's the same object every time it's asked for.
 */
export function contentFor(lang: Lang): XendraContent {
  let content = contentByLang.get(lang);
  if (!content) {
    content = localizeDeep(lang, xendraContent);
    contentByLang.set(lang, content);
  }
  return content;
}
