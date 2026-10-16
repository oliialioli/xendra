import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { analyticsConsent, setAnalyticsConsent, subscribeAnalyticsConsent } from '../lib/analytics';
import { useT } from '../i18n/LanguageContext';
import { SnailFigure } from './SnailFigure';
import styles from './AnalyticsConsent.module.css';

/**
 * The question whether the statistics cookies (Google Analytics, see
 * lib/analytics) may be used, put by the snail: a small note in the bottom
 * corner until it's answered, both answers equally easy. The joke asks;
 * "What for?" says what they're for and whose they are, before answering
 * (consent has to be informed). It doesn't block anything behind it, nor take the
 * focus on arrival; only when asked again (from the menu) does the focus come
 * to it.
 */
export function AnalyticsConsent() {
  const t = useT();
  const consent = useSyncExternalStore(subscribeAnalyticsConsent, analyticsConsent, () => null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const [explained, setExplained] = useState(false);
  const detailId = useId();
  const answered = useRef(consent !== null);
  useEffect(() => {
    if (consent !== null) answered.current = true;
    else if (answered.current) firstButtonRef.current?.focus();
  }, [consent]);
  if (consent !== null) return null;

  return (
    <section className={styles.root} aria-label={t('Cookieak')}>
      <SnailFigure direction="right" className={styles.snail} />
      <div className={styles.text}>
        <p>
          {t('Barraskilo honek cookieak jaten ditu. Bat emango diozu?')}{' '}
          <button
            type="button"
            className={styles.why}
            aria-expanded={explained}
            aria-controls={detailId}
            onClick={() => setExplained((value) => !value)}
          >
            {t('Zertarako?')}
          </button>
        </p>
        <p id={detailId} className={styles.detail} hidden={!explained}>
          {t('Webgunearen bisitak zenbatzeko, Google Analytics-ekin.')}
        </p>
      </div>
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
