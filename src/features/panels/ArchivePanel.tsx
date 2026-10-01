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

type Frame = 'print' | 'polaroid';
/** new: crisp white; matte: soft off-white; aged: yellowed paper, faded print; deckle: old snapshot with a scalloped edge. */
type Paper = 'new' | 'matte' | 'aged' | 'deckle';
type TapeTone = 'masking' | 'aged' | 'clear' | 'washiStripe' | 'washiDots' | 'washiGrid';
type TapePlacement = 'top' | 'corners' | 'diagonal' | 'cornerRight' | 'side';

/*
 * How each item hangs on the board: tilt, paper, frame, which tape holds it
 * and where, a small sideways drift and whether it's stuck partly over the
 * print above it. Each list is cycled by position with lengths that don't
 * divide each other (nor the usual 7-8 prints per column, or prints side by
 * side would match) -- deterministic, so the board looks the same on every
 * visit.
 */
const TILTS = [-2.4, 1.6, -1, 2.8, -3, 0.6, 2, -1.6, 1.1];
const FRAMES: Frame[] = ['print', 'polaroid', 'print', 'print', 'polaroid'];
const PAPERS: Paper[] = ['new', 'aged', 'matte', 'deckle', 'new', 'aged', 'new', 'matte', 'deckle', 'new', 'aged'];
const TAPE_TONES: TapeTone[] = [
  'masking', 'washiStripe', 'aged', 'clear', 'masking', 'washiDots', 'aged', 'masking', 'washiGrid', 'clear', 'aged', 'washiStripe', 'masking',
];
const TAPE_PLACEMENTS: TapePlacement[] = ['top', 'corners', 'diagonal', 'top', 'cornerRight', 'top', 'side'];
const DRIFTS_PX = [0, 10, -8, 0, -12, 6, 0, 12, -6];
/** Every few prints overlap the one above them in their column. */
const OVERLAP_EVERY = 3;

function hangingFor(index: number) {
  return {
    tilt: TILTS[index % TILTS.length],
    frame: FRAMES[index % FRAMES.length],
    paper: PAPERS[index % PAPERS.length],
    tapeTone: TAPE_TONES[index % TAPE_TONES.length],
    tapePlacement: TAPE_PLACEMENTS[index % TAPE_PLACEMENTS.length],
    drift: DRIFTS_PX[index % DRIFTS_PX.length],
    overlaps: index % OVERLAP_EVERY === 2,
  };
}

/** Where the strips go for each placement, as CSS-module class names. */
const TAPE_STRIPS: Record<TapePlacement, string[]> = {
  top: ['tapeTop'],
  corners: ['tapeCornerLeft', 'tapeCornerRight'],
  diagonal: ['tapeCornerLeft', 'tapeCornerBottomRight'],
  cornerRight: ['tapeCornerRight'],
  side: ['tapeSide'],
};

function Tape({ tone, placement }: { tone: TapeTone; placement: TapePlacement }) {
  return (
    <>
      {TAPE_STRIPS[placement].map((strip) => (
        <span key={strip} className={`${styles.tape} ${styles[strip]}`} data-tone={tone} aria-hidden="true" />
      ))}
    </>
  );
}

function BoardItem({ item, onOpen }: { item: MediaItem; onOpen: () => void }) {
  // Keyed to the item's place in the whole archive, not the filtered list,
  // so each print keeps the same look whichever filter is on.
  const { tilt, frame, paper, tapeTone, tapePlacement, drift, overlaps } = hangingFor(
    xendraContent.media.indexOf(item),
  );
  return (
    <li
      className={styles.item}
      data-frame={frame}
      data-paper={paper}
      data-overlap={overlaps || undefined}
      style={{ '--tilt': `${tilt}deg`, '--drift': `${drift}px` } as CSSProperties}
    >
      <button type="button" className={styles.photo} onClick={onOpen} aria-label={`Ireki: ${item.altText}`}>
        <span className={styles.paper}>
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
        </span>
      </button>
      <Tape tone={tapeTone} placement={tapePlacement} />
    </li>
  );
}

/**
 * Photos and videos as prints taped to a linen board -- old and new papers,
 * different tapes, each a little askew and some overlapping -- opening
 * large in MediaLightbox on click.
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
