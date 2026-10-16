import { useSyncExternalStore } from 'react';
import { analyticsConsent, setAnalyticsConsent, subscribeAnalyticsConsent } from '../../lib/analytics';
import { useContent, useT } from '../../i18n/LanguageContext';
import shared from './panelShared.module.css';
import styles from './CookiesPanel.module.css';

/**
 * What the site keeps in the visitor's browser and why, and their answer
 * about the statistics cookies, which they can change here (the same two
 * answers as the cookie notice). Written to be read: what, who, how long,
 * and how to say no.
 */
export function CookiesPanel() {
  const t = useT();
  const { contact } = useContent();
  const consent = useSyncExternalStore(subscribeAnalyticsConsent, analyticsConsent, () => null);

  return (
    <div className={styles.page}>
      <section className={shared.section}>
        <h3>{t('Zer dira?')}</h3>
        <p>{t('Cookieak webgune batek zure nabigatzailean gordetzen dituen fitxategi txikiak dira.')}</p>
      </section>

      <section className={shared.section}>
        <h3>{t('Zein erabiltzen ditugu?')}</h3>
        <p>
          {t(
            'Zuk onartzen baduzu bakarrik, Google Analytics-en cookieak (_ga eta _ga_…), webgunea zenbat bisitatzen den eta zein orri ikusten diren jakiteko. Datuak bateratuta ikusten ditugu (adibidez, «gaur 40 bisita»): ez dakigu nor zaren, eta ez ditugu iragarkietarako erabiltzen.',
          )}
        </p>
        <p>
          {t(
            'Google Ireland Limited-ek kudeatzen ditu, 2 urte arte irauten dute, eta Google-k Europar Batasunetik kanpo ere trata ditzake datuak.',
          )}
        </p>
        <p>
          {t(
            'Musika atalean Bandcamp-en erreproduzitzailea eta YouTubeko bideo bat daude: erabiltzen badituzu, beren cookieak jar ditzakete, Bandcamp-en eta YouTuberen arauen arabera.',
          )}
        </p>
      </section>

      <section className={shared.section}>
        <h3>{t('Zure nabigatzailean gordetzen dena')}</h3>
        <p>
          {t(
            'Webguneak zure aukera batzuk ere gogoratzen ditu (hizkuntza, soinua, mapan aurkitutako lekuak eta cookieei buruzko erantzuna). Ez dira cookieak eta ez dira inora bidaltzen: webguneak funtziona dezan dira.',
          )}
        </p>
      </section>

      <section className={shared.section}>
        <h3>{t('Zure erabakia aldatzeko')}</h3>
        <p>{t('Nahi duzunean alda dezakezu zure erantzuna; ezezkoa ematen baduzu, Google Analytics-en cookieak ezabatu egiten dira.')}</p>
        <p className={styles.state} role="status">
          {consent === 'granted' ? t('Orain: onartuta.') : consent === 'denied' ? t('Orain: ukatuta.') : t('Oraindik ez duzu erantzun.')}
        </p>
        <div className={styles.answers}>
          <button
            type="button"
            className={styles.answer}
            aria-pressed={consent === 'denied'}
            onClick={() => setAnalyticsConsent('denied')}
          >
            {t('Ukatu')}
          </button>
          <button
            type="button"
            className={styles.answer}
            aria-pressed={consent === 'granted'}
            onClick={() => setAnalyticsConsent('granted')}
          >
            {t('Onartu')}
          </button>
        </div>
      </section>

      <section className={shared.section}>
        <h3>{t('Nor gara')}</h3>
        <p>
          {t('Webgune hau Xendra musika taldearena da. Zalantzarik baduzu, idatziguzu:')}{' '}
          {contact.email && (
            <a className={shared.secondaryLink} href={`mailto:${contact.email}`}>
              {contact.email}
            </a>
          )}
        </p>
      </section>
    </div>
  );
}
