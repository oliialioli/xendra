import { xendraContent } from '../../content/xendraContent';
import shared from './panelShared.module.css';

export function HistoryPanel() {
  return (
    <div>
      <p className={shared.lead}>
        {xendraContent.band.originText} Bide-ideia horrek ematen dio izena Xendrari eta uharte
        honi.
      </p>
      <ol className={shared.list}>
        {xendraContent.history.map((milestone) => (
          <li key={milestone.id} className={shared.listItem}>
            <span className={shared.badge}>{milestone.year}</span>
            <h3 className={shared.cardTitle}>{milestone.title}</h3>
            <p className={shared.lead}>{milestone.description}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
