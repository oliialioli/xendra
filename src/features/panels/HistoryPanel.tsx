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

      {xendraContent.press.length > 0 && (
        <div className={shared.section}>
          <h3>Prentsan</h3>
          <ul className={shared.list}>
            {xendraContent.press.map((item) => (
              <li key={item.id}>
                <a className={shared.secondaryLink} href={item.url} target="_blank" rel="noreferrer">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
