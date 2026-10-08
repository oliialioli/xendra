import { Link } from 'react-router-dom';
import { List } from '@phosphor-icons/react';
import { Panel } from '../../components/Panel';
import { MENU_ENTRIES } from '../../app/routes';
import { LANDMARK_INDICATOR_CONFIG } from './landmarkIndicatorConfig';
import styles from './MenuDrawer.module.css';

export function MenuDrawer({ onClose }: { onClose: () => void }) {
  return (
    <Panel title="Menua" icon={<List size={20} aria-hidden="true" />} onClose={onClose}>
      <nav aria-label="Xendraren atalak">
        <ul className={styles.list}>
          {MENU_ENTRIES.map((entry) => {
            // Same line icon as the landmark's badge on the map.
            const Icon = LANDMARK_INDICATOR_CONFIG[entry.landmarkId].icon;
            return (
              <li key={entry.route}>
                <Link to={entry.route} onClick={onClose} className={styles.link}>
                  <span className={styles.icon} aria-hidden="true">
                    <Icon size={20} />
                  </span>
                  {entry.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </Panel>
  );
}
