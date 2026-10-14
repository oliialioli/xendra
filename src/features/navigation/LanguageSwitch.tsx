import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CaretDown, Globe } from '@phosphor-icons/react';
import { useLangPath, useT } from '../../i18n/LanguageContext';
import { LANGUAGES, LANGUAGE_NAMES, localizePath } from '../../i18n/languages';
import { rememberLang } from '../../i18n/rememberedLang';
import styles from './LanguageSwitch.module.css';

export type LanguageSwitchProps = {
  /** What the button shows of the current language: its code ("EU"), where there's little room, or its name ("Euskara"). */
  label?: 'code' | 'name';
  /** light: cream ink, for the intro's dark paper. */
  tone?: 'ink' | 'light';
  /** Which way the list opens: down from the top of a screen, up from the bottom of a panel. */
  placement?: 'down' | 'up';
  className?: string;
};

/**
 * A button with the current language that opens the list of the site's
 * languages: links to this same page in each one (each language's pages have
 * their own addresses, see i18n/languages.ts). Choosing one is remembered for
 * the next visit. Escape, a click outside or a choice closes the list.
 */
export function LanguageSwitch({ label = 'name', tone = 'ink', placement = 'down', className }: LanguageSwitchProps) {
  const { lang, path } = useLangPath();
  const t = useT();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    // Caught first and stopped, so Escape closes only the list, not the panel it's in.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-tone={tone}
      data-placement={placement}
    >
      <button
        ref={buttonRef}
        type="button"
        className={styles.button}
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${t('Hizkuntza')}: ${LANGUAGE_NAMES[lang]}`}
        onClick={() => setOpen((value) => !value)}
      >
        <Globe size={16} aria-hidden="true" />
        <span>{label === 'code' ? lang.toUpperCase() : LANGUAGE_NAMES[lang]}</span>
        <CaretDown size={12} weight="bold" className={styles.caret} aria-hidden="true" />
      </button>

      {/* Always in the page (only hidden), so the other languages' links are there for anything reading it. */}
      <nav aria-label={t('Hizkuntza')} hidden={!open}>
        <ul id={listId} className={styles.list}>
          {LANGUAGES.map((option) => (
            <li key={option}>
              <Link
                className={styles.option}
                to={localizePath(option, path)}
                // Each name in its own language, whatever the page's.
                lang={option}
                hrefLang={option}
                aria-current={option === lang ? 'true' : undefined}
                onClick={() => {
                  rememberLang(option);
                  setOpen(false);
                }}
              >
                {LANGUAGE_NAMES[option]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
