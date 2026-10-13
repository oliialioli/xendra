import { Link } from 'react-router-dom';
import { useLangPath, useT } from '../../i18n/LanguageContext';
import { LANGUAGES, LANGUAGE_NAMES, localizePath } from '../../i18n/languages';
import { rememberLang } from '../../i18n/rememberedLang';
import styles from './LanguageSwitch.module.css';

export type LanguageSwitchProps = {
  /** names: "Euskara", "Castellano", "English"; codes: "EU", "ES", "EN", where there's little room. */
  variant?: 'names' | 'codes';
  /** light: cream ink, for the intro's dark paper. */
  tone?: 'ink' | 'light';
  className?: string;
};

/**
 * The same page in each of the site's languages, as links (each language's
 * pages have their own addresses, see i18n/languages.ts). Choosing one is
 * remembered for the next visit.
 */
export function LanguageSwitch({ variant = 'names', tone = 'ink', className }: LanguageSwitchProps) {
  const { lang, path } = useLangPath();
  const t = useT();

  return (
    <nav className={[styles.root, className].filter(Boolean).join(' ')} data-tone={tone} aria-label={t('Hizkuntza')}>
      <ul className={styles.list}>
        {LANGUAGES.map((option) => (
          <li key={option}>
            <Link
              className={styles.option}
              to={localizePath(option, path)}
              // Each name in its own language, whatever the page's.
              lang={option}
              hrefLang={option}
              aria-current={option === lang ? 'true' : undefined}
              aria-label={variant === 'codes' ? LANGUAGE_NAMES[option] : undefined}
              title={variant === 'codes' ? LANGUAGE_NAMES[option] : undefined}
              onClick={() => rememberLang(option)}
            >
              {variant === 'codes' ? option.toUpperCase() : LANGUAGE_NAMES[option]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
