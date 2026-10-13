import { isLang, type Lang } from './languages';

const KEY = 'xendra:lang';

/** The language last chosen with the switch on this device, if any. */
export function rememberedLang(): Lang | null {
  try {
    const value = window.localStorage.getItem(KEY);
    return value && isLang(value) ? value : null;
  } catch {
    return null;
  }
}

export function rememberLang(lang: Lang): void {
  try {
    window.localStorage.setItem(KEY, lang);
  } catch {
    // Private mode or storage disabled: the address still carries the language.
  }
}
