import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { useSettings } from '../../app/providers/SettingsContext';
import { SnailFigure } from '../../components/SnailFigure';
import { xendraContent } from '../../content/xendraContent';
import shared from './panelShared.module.css';
import styles from './HistoryPanel.module.css';

/** Px from the board's side edges to the path's vertical runs. */
const PATH_INSET = 22;
/** Radius of the path's rounded turns. */
const CORNER = 34;
/** Px from a stop's top to its node (the middle of the year line). */
const NODE_Y = 16;
/** Pause between one stop appearing and the path setting off for the next. */
const STEP_MS = 1100;

type PathGeometry = {
  d: string;
  width: number;
  height: number;
  total: number;
  /** Path length at which each stop's node is reached. */
  nodeAt: number[];
  nodes: { x: number; y: number }[];
};

/**
 * A path that runs down one side, turns across in the gap below a stop and
 * runs down the other side -- like a trail zig-zagging down a hill -- built
 * from the stops' measured positions. Lengths are added up as it's built
 * (straight runs plus quarter-circle turns), so drawing can stop exactly at
 * any stop's node.
 */
function buildPath(width: number, height: number, stops: { top: number; bottom: number }[]): PathGeometry {
  const xAt = (i: number) => (i % 2 === 0 ? PATH_INSET : width - PATH_INSET);
  const quarter = (Math.PI * CORNER) / 2;
  let x = xAt(0);
  let y = 0;
  let total = 0;
  let d = `M${x} ${y}`;
  const nodeAt: number[] = [];
  const nodes: { x: number; y: number }[] = [];

  stops.forEach((stop, i) => {
    const nodeY = stop.top + NODE_Y;
    total += nodeY - y;
    y = nodeY;
    d += ` L${x} ${y}`;
    nodeAt.push(total);
    nodes.push({ x, y });

    const next = stops[i + 1];
    if (!next) {
      const endY = Math.min(height, stop.bottom + 12);
      total += endY - y;
      d += ` L${x} ${endY}`;
      return;
    }
    const nextX = xAt(i + 1);
    const dir = Math.sign(nextX - x);
    const turnY = (stop.bottom + next.top) / 2;
    total += turnY - CORNER - y;
    d += ` L${x} ${turnY - CORNER}`;
    // Down, then round into the crossing (a left turn heading right, a right turn heading left)...
    d += ` A${CORNER} ${CORNER} 0 0 ${dir > 0 ? 0 : 1} ${x + dir * CORNER} ${turnY}`;
    total += quarter;
    d += ` L${nextX - dir * CORNER} ${turnY}`;
    total += Math.abs(nextX - x) - 2 * CORNER;
    // ...then round back down the other side.
    d += ` A${CORNER} ${CORNER} 0 0 ${dir > 0 ? 1 : 0} ${nextX} ${turnY + CORNER}`;
    total += quarter;
    x = nextX;
    y = turnY + CORNER;
  });

  return { d, width, height, total, nodeAt, nodes };
}

/**
 * The band's history as a winding path: it draws itself stop by stop as the
 * panel opens (waiting for each stop to be scrolled into view), each year
 * appearing as the line reaches it, with the player's snail walking at the
 * head of the line. With reduced motion everything is shown at once.
 */
export function HistoryPanel() {
  const { effectiveReducedMotion } = useSettings();
  const stops = xendraContent.history;
  const boardRef = useRef<HTMLDivElement>(null);
  const stopRefs = useRef<(HTMLLIElement | null)[]>([]);
  const visible = useRef(new Set<number>());
  const [geometry, setGeometry] = useState<PathGeometry | null>(null);
  const [revealed, setRevealed] = useState(() => (effectiveReducedMotion ? stops.length : 0));

  // Rebuild the path whenever the board's layout changes (first paint included).
  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return undefined;
    const measure = () => {
      const rects = stopRefs.current.map((el) => ({
        top: el?.offsetTop ?? 0,
        bottom: (el?.offsetTop ?? 0) + (el?.offsetHeight ?? 0),
      }));
      setGeometry(buildPath(board.clientWidth, board.clientHeight, rects));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(board);
    return () => observer.disconnect();
  }, []);

  // Which stops are actually on screen -- the path only advances into view.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number((entry.target as HTMLElement).dataset.index);
          if (entry.isIntersecting) visible.current.add(index);
          else visible.current.delete(index);
        });
      },
      { threshold: 0.35 },
    );
    stopRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // One stop at a time, each once it's in view.
  useEffect(() => {
    if (revealed >= stops.length) return undefined;
    const timer = window.setInterval(
      () => {
        setRevealed((count) => (count < stops.length && visible.current.has(count) ? count + 1 : count));
      },
      revealed === 0 ? 350 : STEP_MS,
    );
    return () => window.clearInterval(timer);
  }, [revealed, stops.length]);

  const drawn = !geometry || revealed === 0
    ? 0
    : revealed >= stops.length
      ? geometry.total
      : geometry.nodeAt[revealed - 1];

  return (
    <div>
      <p className={shared.lead}>{xendraContent.band.originText}</p>

      <div ref={boardRef} className={styles.board}>
        {geometry && (
          <svg
            className={styles.path}
            width={geometry.width}
            height={geometry.height}
            viewBox={`0 0 ${geometry.width} ${geometry.height}`}
            aria-hidden="true"
            focusable="false"
          >
            {/* The whole trail, faint, so you can see where it's heading. */}
            <path d={geometry.d} className={styles.trail} />
            <path
              d={geometry.d}
              className={styles.line}
              style={{ strokeDasharray: geometry.total, strokeDashoffset: geometry.total - drawn }}
            />
            {geometry.nodes.map((node, i) => (
              <circle
                key={stops[i].id}
                cx={node.x}
                cy={node.y}
                r={7}
                className={styles.node}
                data-reached={i < revealed}
              />
            ))}
          </svg>
        )}

        {geometry && (
          <SnailFigure
            className={styles.snail}
            direction="down"
            // offset-path walks it along the very same path; offset-distance follows the line's head.
            style={
              {
                offsetPath: `path("${geometry.d}")`,
                offsetDistance: `${drawn}px`,
                opacity: revealed === 0 ? 0 : 1,
              } as CSSProperties
            }
          />
        )}

        <ol className={styles.stops}>
          {stops.map((stop, i) => (
            <li
              key={stop.id}
              ref={(el) => {
                stopRefs.current[i] = el;
              }}
              data-index={i}
              data-side={i % 2 === 0 ? 'left' : 'right'}
              data-reached={i < revealed}
              className={styles.stop}
            >
              <h3 className={styles.year}>{stop.year}</h3>
              <p className={styles.text}>{stop.description}</p>
            </li>
          ))}
        </ol>
      </div>

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
