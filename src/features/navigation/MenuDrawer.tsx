import { List } from '@phosphor-icons/react';
import { Panel } from '../../components/Panel';
import { MENU_ENTRIES } from '../../app/routes';
import { LANDMARK_INDICATOR_CONFIG } from './landmarkIndicatorConfig';
import { LanguageSwitch } from './LanguageSwitch';
import { LocalLink, useT } from '../../i18n/LanguageContext';
import styles from './MenuDrawer.module.css';

export function MenuDrawer({ onClose }: { onClose: () => void }) {
  const t = useT();
  return (
    <Panel title={t('Menua')} icon={<List size={20} aria-hidden="true" />} onClose={onClose}>
      <nav aria-label={t('Xendraren atalak')}>
        <ul className={styles.list}>
          {MENU_ENTRIES.map((entry) => {
            // Same line icon as the landmark's badge on the map.
            const Icon = LANDMARK_INDICATOR_CONFIG[entry.landmarkId].icon;
            return (
              <li key={entry.route}>
                <LocalLink to={entry.route} onClick={onClose} className={styles.link}>
                  <span className={styles.icon} aria-hidden="true">
                    <Icon size={20} />
                  </span>
                  {t(entry.label)}
                </LocalLink>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className={styles.languages}>
        <LanguageSwitch />
      </div>
    </Panel>
  );
}
