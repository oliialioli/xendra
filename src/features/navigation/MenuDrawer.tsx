import { Link } from 'react-router-dom';
import { Panel } from '../../components/Panel';
import { MENU_ENTRIES, panelRouteByPath } from '../../app/routes';
import { useProgress } from '../../app/providers/ProgressContext';
import shared from '../panels/panelShared.module.css';

export function MenuDrawer({ onClose }: { onClose: () => void }) {
  const { visited } = useProgress();

  return (
    <Panel title="Menua" icon="☰" onClose={onClose}>
      <nav aria-label="Xendraren atalak">
        <ul className={shared.list}>
          {MENU_ENTRIES.map((entry) => {
            const landmarkId = panelRouteByPath.get(entry.route)?.landmarkId;
            const isVisited = landmarkId ? visited.has(landmarkId) : false;
            return (
              <li key={entry.route} className={shared.listItem}>
                <Link to={entry.route} onClick={onClose} className={shared.secondaryLink}>
                  {entry.label}
                  {isVisited && <span aria-label="Jadanik bisitatuta"> · ●</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </Panel>
  );
}
