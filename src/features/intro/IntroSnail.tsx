import { useId, type CSSProperties } from 'react';
import {
  SNAIL_COLORS,
  SNAIL_FRAME_SIZE,
  SNAIL_SPIRAL_ALPHA,
  snailGeometry,
  toCssColor,
} from '../../game/utils/snailArt';
import styles from './IntroSnail.module.css';

/** Side profile reads most clearly as "a snail" at intro size. */
const SNAIL = snailGeometry('right');

/**
 * The egg sits exactly where the snail's shell ends up, slightly larger, so
 * the curled-up shell is literally inside it and is what's left once the
 * egg falls away.
 */
const EGG = { cx: 28.5, cy: 30, rx: 17.5, ry: 18 };

/** Zigzag the egg splits along, left to right. */
const CRACK_POINTS = '10.5,28 15,25 19,29 23,24.5 27,28.5 31,24 35,28.5 39,25 43,28.5 46.5,26';
const CAP_CLIP = `6,-20 52,-20 52,26 ${CRACK_POINTS.split(' ').reverse().join(' ')} 6,28`;
// The cup reaches 1 unit up under the cap so the two halves' antialiased
// edges don't leave a visible seam before the egg actually cracks.
const CUP_CLIP = `6,27 ${CRACK_POINTS.split(' ')
  .map((pair) => {
    const [x, y] = pair.split(',').map(Number);
    return `${x},${y - 1}`;
  })
  .join(' ')} 52,25 52,60 6,60`;

/** Drawn length of the zigzag, for the stroke-dash "crack spreading" animation. */
const CRACK_LENGTH = CRACK_POINTS.split(' ')
  .map((pair) => pair.split(',').map(Number))
  .reduce((total, [x, y], i, points) => {
    if (i === 0) return 0;
    const [px, py] = points[i - 1];
    return total + Math.hypot(x - px, y - py);
  }, 0);

function spiralPath(cx: number, cy: number, r: number): string {
  // 270 degrees clockwise from 3 o'clock to 12 o'clock, like Phaser's arc(0, 1.5 * PI).
  return `M${cx + r} ${cy} A${r} ${r} 0 1 1 ${cx} ${cy - r}`;
}

function SnailBody() {
  const { body, shell, spiral } = SNAIL;
  return (
    <>
      <ellipse cx={body.cx} cy={body.cy} rx={body.width / 2} ry={body.height / 2} fill={toCssColor(SNAIL_COLORS.body)} />
      <circle cx={shell.cx} cy={shell.cy} r={shell.radius} fill={toCssColor(SNAIL_COLORS.shell)} />
      {spiral.radii.map((r) => (
        <path
          key={r}
          d={spiralPath(shell.cx, shell.cy, r)}
          fill="none"
          stroke={toCssColor(SNAIL_COLORS.spiral)}
          strokeOpacity={SNAIL_SPIRAL_ALPHA}
          strokeWidth={spiral.strokeWidth}
        />
      ))}
    </>
  );
}

function SnailFeelers() {
  const { antennae, tentacles } = SNAIL;
  const ink = toCssColor(SNAIL_COLORS.antenna);
  return (
    <>
      {antennae.lines.map((line) => (
        <g key={`a${line.x1}`}>
          <line {...line} stroke={ink} strokeWidth={antennae.strokeWidth} />
          <circle cx={line.x2} cy={line.y2} r={antennae.tipRadius} fill={ink} />
        </g>
      ))}
      {tentacles.lines.map((line) => (
        <line key={`t${line.x1}`} {...line} stroke={ink} strokeWidth={tentacles.strokeWidth} />
      ))}
    </>
  );
}

function EggShell({ gradientId }: { gradientId: string }) {
  const { shell } = SNAIL;
  return (
    <>
      <ellipse cx={EGG.cx} cy={EGG.cy} rx={EGG.rx} ry={EGG.ry} fill={`url(#${gradientId})`} />
      {/* Snail eggs are translucent: the curled shell shows through faintly. */}
      <g opacity={0.16}>
        <circle cx={shell.cx} cy={shell.cy} r={shell.radius - 1} fill={toCssColor(SNAIL_COLORS.shell)} />
      </g>
      <ellipse cx={EGG.cx - 6} cy={EGG.cy - 9} rx={5} ry={3.4} fill="#fffaf0" opacity={0.55} transform={`rotate(-28 ${EGG.cx - 6} ${EGG.cy - 9})`} />
    </>
  );
}

/**
 * The intro's hatching scene, drawn in the in-game texture's own 64x64 frame
 * units (see snailArt.ts) so the snail that hatches is pixel-for-pixel the
 * one the player steers: same shapes, palette and even the same clipping
 * at the frame edge. All motion lives in IntroSnail.module.css and is
 * sequenced by the custom properties IntroScreen.module.css sets on its
 * root; with animations off, every element rests at its final state (egg
 * gone, snail standing).
 *
 * Two copies of the snail take part: a "peek" copy, masked so only what's
 * outside the egg shows, slides its head and antennae out through the
 * crack; the real snail then takes over in the same pose the instant the
 * egg breaks, so the swap is invisible.
 */
export function IntroSnail() {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const frameClipId = `${id}-frame`;
  const capClipId = `${id}-cap`;
  const cupClipId = `${id}-cup`;
  const peekMaskId = `${id}-peek`;
  const eggGradientId = `${id}-egg`;

  return (
    <svg className={styles.scene} viewBox="-12 -10 88 68" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={frameClipId}>
          <rect x={0} y={0} width={SNAIL_FRAME_SIZE} height={SNAIL_FRAME_SIZE} />
        </clipPath>
        <clipPath id={capClipId}>
          <polygon points={CAP_CLIP} />
        </clipPath>
        <clipPath id={cupClipId}>
          <polygon points={CUP_CLIP} />
        </clipPath>
        <mask id={peekMaskId} maskUnits="userSpaceOnUse" x={-20} y={-20} width={110} height={100}>
          <rect x={30} y={-20} width={60} height={100} fill="#fff" />
          <ellipse cx={EGG.cx} cy={EGG.cy} rx={EGG.rx} ry={EGG.ry} fill="#000" />
        </mask>
        <radialGradient id={eggGradientId} cx="36%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#fbf5e9" />
          <stop offset="55%" stopColor="#eadfc9" />
          <stop offset="100%" stopColor="#c9b89a" />
        </radialGradient>
      </defs>

      <ellipse className={styles.groundShadow} cx={31} cy={48.5} rx={19} ry={2.6} fill="#1a130c" />

      <g className={styles.final} clipPath={`url(#${frameClipId})`}>
        <g className={styles.settle}>
          <g className={styles.breathe}>
            <SnailBody />
            <g className={styles.feelers}>
              <SnailFeelers />
            </g>
          </g>
        </g>
      </g>

      <g className={styles.eggPop}>
        <g className={styles.wobble}>
          <g className={styles.cup}>
            <g clipPath={`url(#${cupClipId})`}>
              <EggShell gradientId={eggGradientId} />
            </g>
          </g>
          <g className={styles.cap}>
            <g clipPath={`url(#${capClipId})`}>
              <EggShell gradientId={eggGradientId} />
            </g>
            <polyline
              className={styles.crack}
              points={CRACK_POINTS}
              style={{ '--crack-length': CRACK_LENGTH } as CSSProperties}
              fill="none"
              stroke="#8a7658"
              strokeWidth={1.1}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </g>
        </g>
      </g>

      <g className={styles.peek} mask={`url(#${peekMaskId})`} clipPath={`url(#${frameClipId})`}>
        <g className={styles.peekSlide}>
          <SnailBody />
          <g className={styles.peekFeelers}>
            <SnailFeelers />
          </g>
        </g>
      </g>
    </svg>
  );
}
