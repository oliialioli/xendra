import { useEffect, useRef, useSyncExternalStore } from 'react';
import { analyticsConsent, setAnalyticsConsent, subscribeAnalyticsConsent } from '../lib/analytics';
import { useT } from '../i18n/LanguageContext';
import { SnailFigure } from './SnailFigure';
import styles from './AnalyticsConsent.module.css';

/**
 * The question whether the statistics cookies (Google Analytics, see
 * lib/analytics) may be used, put by the snail: a small note in the bottom corner until it's answered, both
 * answers equally easy. It doesn't block anything behind it, nor take the
 * focus on arrival; only when asked again (from the menu) does the focus come
 * to it.
 */
export function AnalyticsConsent() {
  const t = useT();
  const consent = useSyncExternalStore(subscribeAnalyticsConsent, analyticsConsent, () => null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const answered = useRef(consent !== null);
  useEffect(() => {
    if (consent !== null) answered.current = true;
    else if (answered.current) firstButtonRef.current?.focus();
  }, [consent]);
  if (consent !== null) return null;

  return (
    <section className={styles.root} aria-label={t('Cookieak')}>
      <SnailFigure direction="right" className={styles.snail} />
      <p className={styles.text}>
        {t('Barraskilo honek cookieak jaten ditu, bisitak zenbatzeko bakarrik. Bat emango diozu?')}
      </p>
      <div className={styles.actions}>
        <button ref={firstButtonRef} type="button" className={styles.answer} onClick={() => setAnalyticsConsent('denied')}>
          {t('Gaur ez')}
        </button>
        <button type="button" className={styles.answer} onClick={() => setAnalyticsConsent('granted')}>
          {t('Bai, tori')}
        </button>
      </div>
    </section>
  );
}
