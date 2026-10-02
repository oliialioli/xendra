import type { ReactElement } from 'react';
import type { Concert } from '../../types/content';
import { xendraContent } from '../../content/xendraContent';
import { EmptyState } from '../../components/EmptyState';
import { SnailFigure } from '../../components/SnailFigure';
import shared from './panelShared.module.css';
import styles from './ConcertsPanel.module.css';

const MONTHS = ['urt', 'ots', 'mar', 'api', 'mai', 'eka', 'uzt', 'abu', 'ira', 'urr', 'aza', 'abe'];

/** Only the statuses worth flagging on a card; upcoming/past show through the road itself. */
const STATUS_LABEL: Partial<Record<Concert['status'], string>> = {
  soldOut: 'Sarrerak agortuta',
  cancelled: 'Bertan behera utzita',
};

/** Today as YYYY-MM-DD in the visitor's own time zone, to compare with concert dates. */
function localIsoDate(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Past once its day is over; a concert with no date yet is still to come. */
function isPast(concert: Concert, today: string): boolean {
  return concert.status === 'past' || (concert.date !== null && concert.date < today);
}

/** Newest first; undated (still to be announced) concerts at the very top. */
function byDateDescending(a: Concert, b: Concert): number {
  return (b.date ?? '9999').localeCompare(a.date ?? '9999');
}

const yearOf = (concert: Concert) => concert.date?.slice(0, 4) ?? null;

function YearMarker({ year, past }: { year: string; past: boolean }) {
  return (
    <li className={`${styles.stop} ${styles.yearStop}`} data-past={past || undefined} aria-hidden="true">
      <span className={styles.milestone}>{year}</span>
    </li>
  );
}

function ConcertStop({ concert, past }: { concert: Concert; past: boolean }) {
  const [, month, day] = concert.date?.split('-') ?? [];
  const status = STATUS_LABEL[concert.status];
  const details = [concert.venue, concert.time].filter(Boolean).join(', ');

  return (
    <li className={styles.stop} data-past={past || undefined}>
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.date}>
        {concert.date ? `${Number(day)} ${MONTHS[Number(month) - 1]}` : 'Laster'}
      </span>
      <span className={styles.info}>
        <span className={styles.city}>{concert.city}</span>
        {details && <span className={styles.details}>{details}</span>}
        {status && <span className={styles.details}>{status}</span>}
        {past && <span className="visually-hidden">(iragana)</span>}
        {!past && concert.ticketsUrl && (
          <a className={shared.secondaryLink} href={concert.ticketsUrl} target="_blank" rel="noreferrer">
            Sarrerak
          </a>
        )}
      </span>
    </li>
  );
}

/**
 * The concerts as a path the snail is walking up: it stands at today, the
 * concerts still ahead of it (above) in colour, the ones it has already
 * passed (below) in greys. Newest at the top, so the panel opens on what's
 * coming next; the year is marked on the path wherever it changes.
 */
export function ConcertsPanel({ now = new Date() }: { now?: Date }) {
  const { concerts } = xendraContent;

  if (concerts.length === 0) {
    return (
      <EmptyState title="Oraindik ez dago kontzerturik baieztatuta">
        Xendra bere agenda prestatzen ari da. Itzuli laster hurrengo datak ikusteko.
      </EmptyState>
    );
  }

  const today = localIsoDate(now);
  const currentYear = today.slice(0, 4);
  const sorted = [...concerts].sort(byDateDescending);
  const upcoming = sorted.filter((c) => !isPast(c, today));
  const past = sorted.filter((c) => isPast(c, today));

  const items: ReactElement[] = [];
  let previousYear: string | null = null;

  if (upcoming.length === 0) {
    items.push(
      <li key="soon" className={`${styles.stop} ${styles.soonStop}`}>
        <span className={styles.soon}>Kontzertu berriak laster!</span>
      </li>,
    );
  }
  upcoming.forEach((concert) => {
    const year = yearOf(concert);
    if (year && year !== currentYear && year !== previousYear) {
      items.push(<YearMarker key={`year-up-${year}`} year={year} past={false} />);
    }
    previousYear = year;
    items.push(<ConcertStop key={concert.id} concert={concert} past={false} />);
  });

  items.push(
    <li key="now" className={`${styles.stop} ${styles.nowStop}`}>
      <SnailFigure direction="up" className={styles.snail} />
      <span className={styles.nowLabel}>Gaur</span>
    </li>,
  );

  previousYear = currentYear;
  past.forEach((concert) => {
    const year = yearOf(concert);
    if (year && year !== previousYear) {
      items.push(<YearMarker key={`year-past-${year}`} year={year} past />);
    }
    previousYear = year;
    items.push(<ConcertStop key={concert.id} concert={concert} past />);
  });

  return (
    <div>
      <ol className={styles.stops} aria-label="Xendraren kontzertuak, berrienetik zaharrenera">
        {items}
      </ol>
    </div>
  );
}
