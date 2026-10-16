import { useEffect, useRef, useSyncExternalStore } from 'react';
import { analyticsConsent, setAnalyticsConsent, subscribeAnalyticsConsent } from '../lib/analytics';
import { useT } from '../i18n/LanguageContext';
import { SnailFigure } from './SnailFigure';
import styles from './AnalyticsConsent.module.css';

/**
 * The question whether Google Analytics may be used (see lib/analytics), put
 * by the snail: a small note in the bottom corner until it's answered, both
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
        {t('Barraskiloak bisitak zenbatu nahi ditu Google Analytics-ekin (cookieak erabiltzen ditu). Utziko diozu?')}
      </p>
      <div className={styles.actions}>
        <button ref={firstButtonRef} type="button" className={styles.answer} onClick={() => setAnalyticsConsent('denied')}>
          {t('Ez, eskerrik asko')}
        </button>
        <button type="button" className={styles.answer} onClick={() => setAnalyticsConsent('granted')}>
          {t('Bai, tira')}
        </button>
      </div>
    </section>
  );
}
