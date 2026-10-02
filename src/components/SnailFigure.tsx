import {
  SNAIL_COLORS,
  SNAIL_FRAME_SIZE,
  SNAIL_SPIRAL_ALPHA,
  snailGeometry,
  toCssColor,
  type SnailDirection,
} from '../game/utils/snailArt';
import type { CSSProperties } from 'react';

/**
 * The player's snail as a small static SVG, drawn from the same shapes and
 * palette as the in-game textures (see snailArt.ts) -- for places outside
 * the map that should show "you", like the head of the history path.
 */
export function SnailFigure({
  direction = 'down',
  className,
  style,
}: {
  direction?: SnailDirection;
  className?: string;
  style?: CSSProperties;
}) {
  const { body, shell, spiral, antennae, tentacles } = snailGeometry(direction);
  const ink = toCssColor(SNAIL_COLORS.antenna);
  return (
    <svg
      className={className}
      style={style}
      viewBox={`0 0 ${SNAIL_FRAME_SIZE} ${SNAIL_FRAME_SIZE}`}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx={body.cx} cy={body.cy} rx={body.width / 2} ry={body.height / 2} fill={toCssColor(SNAIL_COLORS.body)} />
      <circle cx={shell.cx} cy={shell.cy} r={shell.radius} fill={toCssColor(SNAIL_COLORS.shell)} />
      {spiral.radii.map((r) => (
        <path
          key={r}
          d={`M${shell.cx + r} ${shell.cy} A${r} ${r} 0 1 1 ${shell.cx} ${shell.cy - r}`}
          fill="none"
          stroke={toCssColor(SNAIL_COLORS.spiral)}
          strokeOpacity={SNAIL_SPIRAL_ALPHA}
          strokeWidth={spiral.strokeWidth}
        />
      ))}
      {antennae.lines.map((line) => (
        <g key={`a${line.x1}`}>
          <line {...line} stroke={ink} strokeWidth={antennae.strokeWidth} />
          <circle cx={line.x2} cy={line.y2} r={antennae.tipRadius} fill={ink} />
        </g>
      ))}
      {tentacles.lines.map((line) => (
        <line key={`t${line.x1}`} {...line} stroke={ink} strokeWidth={tentacles.strokeWidth} />
      ))}
    </svg>
  );
}
