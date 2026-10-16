import { useEffect, useRef, useSyncExternalStore } from 'react';
import { analyticsConsent, setAnalyticsConsent, subscribeAnalyticsConsent } from '../lib/analytics';
import { LocalLink, useT } from '../i18n/LanguageContext';
import { COOKIES_PATH } from '../content/sectionPaths';
import { SnailFigure } from './SnailFigure';
import styles from './AnalyticsConsent.module.css';

/**
 * The question whether the statistics cookies (Google Analytics, see
 * lib/analytics) may be used, put by the snail: a small note in the bottom
 * corner until it's answered, both answers equally easy and plainly named.
 * "More information" opens the cookies page, which says what they're
 * for and whose they are (consent has to be informed) and has the same two
 * answers -- so the note steps aside there. It doesn't block anything behind
 * it, nor take the focus on arrival; only when asked again does the focus
 * come to it.
 */
export function AnalyticsConsent({ hidden = false }: { hidden?: boolean }) {
  const t = useT();
  const consent = useSyncExternalStore(subscribeAnalyticsConsent, analyticsConsent, () => null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const answered = useRef(consent !== null);
  useEffect(() => {
    if (consent !== null) answered.current = true;
    else if (answered.current) firstButtonRef.current?.focus();
  }, [consent]);
  if (consent !== null || hidden) return null;

  return (
    <section className={styles.root} aria-label={t('Cookieak')}>
      <SnailFigure direction="right" className={styles.snail} />
      <div className={styles.text}>
        <p className={styles.joke}>
          {t('🍪 Webgune honek cookieak erabiltzen ditu. Gure barraskiloak nahiago du letxuga.')}{' '}
          <LocalLink to={COOKIES_PATH} className={styles.more}>
            {t('Informazio gehiago')}
          </LocalLink>
        </p>
      </div>
      <div className={styles.actions}>
        <button ref={firstButtonRef} type="button" className={styles.answer} onClick={() => setAnalyticsConsent('denied')}>
          {t('Ukatu')}
        </button>
        <button type="button" className={styles.answer} onClick={() => setAnalyticsConsent('granted')}>
          {t('Onartu')}
        </button>
      </div>
    </section>
  );
}
