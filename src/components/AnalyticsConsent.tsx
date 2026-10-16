import { useEffect, useRef, useSyncExternalStore } from 'react';
import { analyticsConsent, setAnalyticsConsent, subscribeAnalyticsConsent } from '../lib/analytics';
import { useT } from '../i18n/LanguageContext';
import styles from './AnalyticsConsent.module.css';

/**
 * The notice asking whether Google Analytics may be used (see lib/analytics):
 * at the bottom of the screen until the visitor answers, both answers equally
 * easy. It doesn't block anything behind it, nor take the focus on arrival;
 * only when asked again (from the menu) does the focus come to it.
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
      <p className={styles.text}>
        {t('Google Analytics erabili nahi genuke webgunea nola erabiltzen den jakiteko (zein orri ikusten diren, zenbat bisita dauden). Cookieak gordetzen ditu zure nabigatzailean. Onartzen duzu?')}
      </p>
      <div className={styles.actions}>
        <button ref={firstButtonRef} type="button" className="xnd-btn-secondary" onClick={() => setAnalyticsConsent('denied')}>
          {t('Ez, eskerrik asko')}
        </button>
        <button type="button" className="xnd-btn-secondary" onClick={() => setAnalyticsConsent('granted')}>
          {t('Onartu')}
        </button>
      </div>
    </section>
  );
}
