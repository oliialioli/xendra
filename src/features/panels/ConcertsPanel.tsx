import { xendraContent } from '../../content/xendraContent';
import { EmptyState } from '../../components/EmptyState';
import shared from './panelShared.module.css';

const STATUS_LABEL: Record<string, string> = {
  upcoming: 'Hurrengoa',
  soldOut: 'Sarrerak agortuta',
  cancelled: 'Bertan behera utzita',
  past: 'Iragana',
};

export function ConcertsPanel() {
  const { concerts } = xendraContent;

  if (concerts.length === 0) {
    return (
      <EmptyState title="Oraindik ez dago kontzerturik baieztatuta">
        Xendra bere agenda prestatzen ari da. Itzuli laster hurrengo datak ikusteko.
      </EmptyState>
    );
  }

  return (
    <ul className={shared.list}>
      {concerts.map((concert) => (
        <li key={concert.id} className={shared.listItem}>
          <span className={shared.badge}>{STATUS_LABEL[concert.status] ?? concert.status}</span>
          <h3>{concert.city}</h3>
          <p className={shared.lead}>{concert.venue}</p>
          <p>
            {concert.date ?? 'Data zehazteke'}
            {concert.time ? ` · ${concert.time}` : ''}
          </p>
          {concert.ticketsUrl && (
            <a className={shared.secondaryLink} href={concert.ticketsUrl}>
              Sarrerak
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
