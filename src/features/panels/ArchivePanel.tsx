import { useMemo, useState, type CSSProperties } from 'react';
import { Play } from '@phosphor-icons/react';
import { xendraContent } from '../../content/xendraContent';
import { EmptyState } from '../../components/EmptyState';
import { assetPath } from '../../lib/assetPath';
import type { MediaItem } from '../../types/content';
import { MediaLightbox } from './MediaLightbox';
import shared from './panelShared.module.css';
import styles from './ArchivePanel.module.css';

type Filter = 'all' | 'photo' | 'video' | 'poster';

const FILTER_LABELS: Record<Filter, string> = {
  all: 'Guztiak',
  photo: 'Argazkiak',
  video: 'Bideoak',
  poster: 'Kartelak',
};

/** poster: the gig poster is the paper itself -- no white border. */
type Frame = 'print' | 'polaroid' | 'poster';
/** new: crisp white; matte: soft off-white; aged: yellowed paper, faded print; deckle: old snapshot with a scalloped edge. */
type Paper = 'new' | 'matte' | 'aged' | 'deckle';
type TapeTone = 'masking' | 'aged' | 'clear' | 'washiStripe' | 'washiDots' | 'washiGrid';
type TapePlacement = 'top' | 'corners' | 'diagonal' | 'cornerRight' | 'side';

/*
 * How each item hangs on the board, as if pinned up by hand over time:
 * tilt, paper, frame, which tape holds it and where, how wide it is within
 * its column, how far it drifts sideways, how far it's stuck over the print
 * above it, and which layer it sits on (so an earlier print sometimes covers
 * a later one). Each list is cycled by position with lengths that don't
 * divide each other, so no two neighbours share the same combination --
 * deterministic, so the board looks the same on every visit. Overlaps stay
 * well short of a print's height so everything is still visible.
 */
const TILTS = [-3.6, 2.4, -1.2, 4.2, -4.6, 0.8, 3.1, -2.2, 1.6, -5.2, 2.9];
const FRAMES: Frame[] = ['print', 'polaroid', 'print', 'print', 'polaroid'];
const PAPERS: Paper[] = ['new', 'aged', 'matte', 'deckle', 'new', 'aged', 'new', 'matte', 'deckle', 'new', 'aged'];
const TAPE_TONES: TapeTone[] = [
  'masking', 'washiStripe', 'aged', 'clear', 'masking', 'washiDots', 'aged', 'masking', 'washiGrid', 'clear', 'aged', 'washiStripe', 'masking',
];
const TAPE_PLACEMENTS: TapePlacement[] = ['top', 'corners', 'diagonal', 'top', 'cornerRight', 'top', 'side'];
/** Width within the column, as a fraction. */
const SIZES = [1, 0.84, 0.95, 0.78, 1, 0.9, 0.82, 0.97];
/** Where a narrower print sits in its column: 0 left, 1 right. */
const ALIGNS = [0.5, 0, 1, 0.3, 0.8];
const DRIFTS_PX = [0, 18, -14, 6, -22, 12, -6, 22, -18, 4];
/** How far each print is pulled up over the one above it (px). */
const OVERLAPS_PX = [0, 28, 12, 40, 0, 36, 20, 44, 8];
const LAYERS = [1, 3, 2, 4, 1, 2, 5, 3];

function hangingFor(item: MediaItem, index: number) {
  const paper = PAPERS[index % PAPERS.length];
  const isPoster = item.kind === 'poster';
  return {
    tilt: TILTS[index % TILTS.length],
    frame: isPoster ? 'poster' : FRAMES[index % FRAMES.length],
    // A deckled edge reads as an old photo, not a poster.
    paper: isPoster && paper === 'deckle' ? 'new' : paper,
    tapeTone: TAPE_TONES[index % TAPE_TONES.length],
    tapePlacement: TAPE_PLACEMENTS[index % TAPE_PLACEMENTS.length],
    size: SIZES[index % SIZES.length],
    align: ALIGNS[index % ALIGNS.length],
    drift: DRIFTS_PX[index % DRIFTS_PX.length],
    overlap: OVERLAPS_PX[index % OVERLAPS_PX.length],
    layer: LAYERS[index % LAYERS.length],
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
  const { tilt, frame, paper, tapeTone, tapePlacement, size, align, drift, overlap, layer } = hangingFor(
    item,
    xendraContent.media.indexOf(item),
  );
  return (
    <li
      className={styles.item}
      data-frame={frame}
      data-paper={paper}
      style={
        {
          '--tilt': `${tilt}deg`,
          '--size': size,
          '--align': align,
          '--drift': `${drift}px`,
          '--overlap': `${overlap}px`,
          '--layer': layer,
        } as CSSProperties
      }
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

/*
 * Keepsakes -- the first concert's ticket, a handwritten setlist -- are
 * stuck on top of the board, across the prints, each at its own spot.
 * `top` is a share of the board's height so they stay spread out however
 * tall the board gets; `taped` adds two strips of old tape (the setlist
 * already has its own gaffer tape in the photo).
 */
type KeepsakeSpot = { top: string; left: string; width: string; tilt: number; taped: boolean };

const KEEPSAKE_SPOTS: Record<string, KeepsakeSpot> = {
  'ticket-first-concert': { top: '118px', left: '30%', width: '46%', tilt: -6, taped: true },
  setlist: { top: '17%', left: '49%', width: '27%', tilt: 7, taped: false },
};
const FALLBACK_SPOT: KeepsakeSpot = { top: '40%', left: '10%', width: '34%', tilt: -4, taped: true };

function Keepsake({ item, onOpen }: { item: MediaItem; onOpen: () => void }) {
  const spot = KEEPSAKE_SPOTS[item.id] ?? FALLBACK_SPOT;
  return (
    <div
      className={styles.keepsake}
      data-keepsake={item.id}
      style={
        { '--top': spot.top, '--left': spot.left, '--width': spot.width, '--tilt': `${spot.tilt}deg` } as CSSProperties
      }
    >
      <button type="button" className={styles.keepsakeButton} onClick={onOpen} aria-label={`Ireki: ${item.altText}`}>
        {item.thumbnailPath && <img src={assetPath(item.thumbnailPath)} alt="" className={styles.keepsakeImage} />}
      </button>
      {spot.taped && (
        <>
          <span className={`${styles.tape} ${styles.keepsakeTapeLeft}`} data-tone="aged" aria-hidden="true" />
          <span className={`${styles.tape} ${styles.keepsakeTapeRight}`} data-tone="aged" aria-hidden="true" />
        </>
      )}
    </div>
  );
}

/** Tiny deterministic PRNG (mulberry32), so the "messy" order is the same on every visit. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Shuffles photos, videos and posters together with a fixed seed, so the
 * full board reads as things pinned up by different people at different
 * times rather than a sorted archive -- but the same on every visit.
 */
function shuffleForBoard(items: MediaItem[]): MediaItem[] {
  const random = seededRandom(2025);
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Photos, videos and gig posters taped to a linen board -- old and new
 * papers, different tapes, askew, overlapping, with keepsakes (the first
 * concert's ticket, a setlist) stuck over the top -- opening large in
 * MediaLightbox on click.
 */
export function ArchivePanel() {
  const [filter, setFilter] = useState<Filter>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Everything the lightbox can step through, in board order: keepsakes
  // first (they sit on top of the board), then the hung prints.
  const items = useMemo(() => {
    if (filter !== 'all') return xendraContent.media.filter((item) => item.kind === filter);
    const keepsakes = xendraContent.media.filter((item) => item.kind === 'keepsake');
    return [...keepsakes, ...shuffleForBoard(xendraContent.media.filter((item) => item.kind !== 'keepsake'))];
  }, [filter]);
  const keepsakes = items.filter((item) => item.kind === 'keepsake');
  const prints = items.filter((item) => item.kind !== 'keepsake');

  if (xendraContent.media.length === 0) {
    return (
      <EmptyState title="Artxiboa oraindik hutsik dago">
        Oraindik ez dago erakusteko argazki edo bideo errealik. Itzuli aurrerago.
      </EmptyState>
    );
  }

  return (
    <div>
      <div role="group" aria-label="Iragazi artxiboa" className={`xnd-control-module ${shared.section} ${styles.filters}`}>
        {(Object.keys(FILTER_LABELS) as Filter[]).map((option) => (
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
            {FILTER_LABELS[option]}
          </button>
        ))}
      </div>

      <div className={styles.board}>
        {keepsakes.map((keepsake) => (
          <Keepsake key={keepsake.id} item={keepsake} onOpen={() => setOpenIndex(items.indexOf(keepsake))} />
        ))}
        <ul className={styles.items}>
          {prints.map((item) => (
            <BoardItem key={item.id} item={item} onOpen={() => setOpenIndex(items.indexOf(item))} />
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
