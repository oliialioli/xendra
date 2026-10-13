import { createContext, useCallback, useContext, useMemo, type ComponentProps, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, type NavigateOptions } from 'react-router-dom';
import type { XendraContent } from '../types/content';
import { contentFor } from './content';
import { DEFAULT_LANG, localizePath, splitLangPath, type Lang } from './languages';
import { translate, type TranslateValues } from './translate';

type LangPath = { lang: Lang; path: string };

// Basque at the map when nothing provides it (a component rendered on its own).
const LanguageContext = createContext<LangPath>({ lang: DEFAULT_LANG, path: '/' });

/** Reads the language from the address (/es/musika) for everything below. Goes inside the router. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const value = useMemo(() => splitLangPath(pathname), [pathname]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** The language of the address being shown, and that address without its language. */
export function useLangPath(): LangPath {
  return useContext(LanguageContext);
}

export function useLang(): Lang {
  return useLangPath().lang;
}

export type Translator = (text: string, values?: TranslateValues) => string;

/** `t('Itxi')`: the Basque text in the current language. */
export function useT(): Translator {
  const lang = useLang();
  return useCallback((text: string, values?: TranslateValues) => translate(lang, text, values), [lang]);
}

/** The site's content in the current language. */
export function useContent(): XendraContent {
  return contentFor(useLang());
}

/** `navigate('/musika')` within the current language. */
export function useLocalNavigate(): (path: string, options?: NavigateOptions) => void {
  const navigate = useNavigate();
  const lang = useLang();
  return useCallback((path: string, options?: NavigateOptions) => navigate(localizePath(lang, path), options), [navigate, lang]);
}

/** A <Link> to a (language-less) path, within the current language. */
export function LocalLink({ to, ...props }: Omit<ComponentProps<typeof Link>, 'to'> & { to: string }) {
  const lang = useLang();
  return <Link to={localizePath(lang, to)} {...props} />;
}
