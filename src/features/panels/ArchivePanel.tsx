import { useMemo, useState, type CSSProperties } from 'react';
import { Play } from '@phosphor-icons/react';
import { xendraContent } from '../../content/xendraContent';
import { EmptyState } from '../../components/EmptyState';
import { assetPath } from '../../lib/assetPath';
import type { MediaItem } from '../../types/content';
import { MediaLightbox } from './MediaLightbox';
import shared from './panelShared.module.css';
import styles from './ArchivePanel.module.css';

type Filter = 'all' | 'photo' | 'video';

type Fastener = 'tape' | 'pin' | 'corners' | 'clip';
type Frame = 'print' | 'polaroid';

/*
 * How each item hangs on the board: tilt, what holds it up and what kind of
 * print it is. Cycled by position with lengths that don't divide each other
 * (nor the usual 7-8 prints per column, or prints side by side would match)
 * -- deterministic, so the board looks the same on every visit.
 */
const TILTS = [-2.4, 1.6, -1, 2.8, -3, 0.6, 2, -1.6, 1.1];
const FASTENERS: Fastener[] = ['tape', 'pin', 'corners', 'tape', 'clip', 'pin'];
const FRAMES: Frame[] = ['print', 'polaroid', 'print', 'print', 'polaroid'];

function hangingFor(index: number) {
  return {
    tilt: TILTS[index % TILTS.length],
    fastener: FASTENERS[index % FASTENERS.length],
    frame: FRAMES[index % FRAMES.length],
  };
}

function Fasteners({ kind }: { kind: Fastener }) {
  switch (kind) {
    case 'pin':
      return <span className={styles.pin} aria-hidden="true" />;
    case 'corners':
      return (
        <>
          <span className={`${styles.tape} ${styles.cornerLeft}`} aria-hidden="true" />
          <span className={`${styles.tape} ${styles.cornerRight}`} aria-hidden="true" />
        </>
      );
    case 'clip':
      return (
        <svg className={styles.clip} viewBox="0 0 20 52" aria-hidden="true" focusable="false">
          <path d="M7 34V9a5 5 0 0 1 10 0v30a8 8 0 0 1-16 0V14" />
        </svg>
      );
    default:
      return <span className={`${styles.tape} ${styles.tapeTop}`} aria-hidden="true" />;
  }
}

function BoardItem({ item, onOpen }: { item: MediaItem; onOpen: () => void }) {
  // Keyed to the item's place in the whole archive, not the filtered list,
  // so each print keeps the same tilt and fastener whichever filter is on.
  const { tilt, fastener, frame } = hangingFor(xendraContent.media.indexOf(item));
  return (
    <li
      className={styles.item}
      data-frame={frame}
      style={{ '--tilt': `${tilt}deg` } as CSSProperties}
    >
      <button type="button" className={styles.photo} onClick={onOpen} aria-label={`Ireki: ${item.altText}`}>
        {item.thumbnailPath ? (
          <img src={assetPath(item.thumbnailPath)} alt="" loading="lazy" className={styles.image} />
        ) : (
          <span className={styles.imagePlaceholder} />
        )}
        {item.kind === 'video' && (
          <span className={styles.play} aria-hidden="true">
            <Play size={18} weight="fill" />
          </span>
        )}
      </button>
      <Fasteners kind={fastener} />
    </li>
  );
}

/**
 * Photos and videos as prints hung on a linen board -- taped, pinned or
 * clipped, each a little askew -- opening large in MediaLightbox on click.
 */
export function ArchivePanel() {
  const [filter, setFilter] = useState<Filter>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const items = useMemo(
    () => xendraContent.media.filter((item) => filter === 'all' || item.kind === filter),
    [filter],
  );

  if (xendraContent.media.length === 0) {
    return (
      <EmptyState title="Artxiboa oraindik hutsik dago">
        Oraindik ez dago erakusteko argazki edo bideo errealik. Itzuli aurrerago.
      </EmptyState>
    );
  }

  return (
    <div>
      <div role="group" aria-label="Iragazi artxiboa" className={`xnd-control-module ${shared.section}`}>
        {(['all', 'photo', 'video'] as Filter[]).map((option) => (
          <button
            key={option}
            type="button"
            className="xnd-btn-icon"
            aria-pressed={filter === option}
            onClick={() => {
              setFilter(option);
              setOpenIndex(null);
            }}
          >
            {option === 'all' ? 'Guztiak' : option === 'photo' ? 'Argazkiak' : 'Bideoak'}
          </button>
        ))}
      </div>

      <div className={styles.board}>
        <ul className={styles.items}>
          {items.map((item, index) => (
            <BoardItem key={item.id} item={item} onOpen={() => setOpenIndex(index)} />
          ))}
        </ul>
      </div>

      {openIndex !== null && (
        <MediaLightbox
          items={items}
          index={openIndex}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </div>
  );
}
