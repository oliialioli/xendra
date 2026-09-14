import type { Concert } from '../../types/content';
import { xendraContent } from '../../content/xendraContent';
import { EmptyState } from '../../components/EmptyState';
import shared from './panelShared.module.css';
import styles from './ConcertsPanel.module.css';

const STATUS_LABEL: Record<string, string> = {
  upcoming: 'Hurrengoa',
  soldOut: 'Sarrerak agortuta',
  cancelled: 'Bertan behera utzita',
  past: 'Iragana',
};

function ConcertNode({ concert, past }: { concert: Concert; past: boolean }) {
  return (
    <li className={`${styles.node} ${past ? styles.past : styles.upcoming}`}>
      <span className={styles.dot} aria-hidden="true" />
      <span className={shared.badge}>{STATUS_LABEL[concert.status] ?? concert.status}</span>
      <h3 className={styles.title}>{concert.city}</h3>
      {concert.venue && <p className={shared.lead}>{concert.venue}</p>}
      <p className={shared.statusText}>
        {concert.date ?? 'Data zehazteke'}
        {concert.time ? ` · ${concert.time}` : ''}
      </p>
      {concert.ticketsUrl && (
        <a className={shared.secondaryLink} href={concert.ticketsUrl} target="_blank" rel="noreferrer">
          Sarrerak
        </a>
      )}
    </li>
  );
}

export function ConcertsPanel() {
  const { concerts } = xendraContent;

  if (concerts.length === 0) {
    return (
      <EmptyState title="Oraindik ez dago kontzerturik baieztatuta">
        Xendra bere agenda prestatzen ari da. Itzuli laster hurrengo datak ikusteko.
      </EmptyState>
    );
  }

  const upcoming = concerts.filter((c) => c.status !== 'past');
  const past = concerts.filter((c) => c.status === 'past');

  return (
    <div>
      {upcoming.length > 0 && (
        <ol className={styles.timeline}>
          {upcoming.map((concert) => (
            <ConcertNode key={concert.id} concert={concert} past={false} />
          ))}
        </ol>
      )}

      {upcoming.length === 0 && (
        <p className={shared.statusText}>Oraindik ez dago hurrengo kontzerturik iragarrita.</p>
      )}

      {past.length > 0 && (
        <>
          <p className={styles.sectionLabel}>Iraganeko kontzertuak</p>
          <ol className={styles.timeline}>
            {past.map((concert) => (
              <ConcertNode key={concert.id} concert={concert} past />
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
