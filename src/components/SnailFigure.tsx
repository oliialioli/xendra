import type { CSSProperties } from 'react';
import {
  SNAIL_FRAME_SIZE,
  snailParts,
  toCssColor,
  type SnailDirection,
  type SnailPart,
} from '../game/utils/snailArt';

/** Renders snail parts (see snailArt.ts) as SVG shapes, in frame units. */
export function SnailShapes({ parts }: { parts: SnailPart[] }) {
  return (
    <>
      {parts.map((part, i) =>
        part.kind === 'ellipse' ? (
          <ellipse
            key={i}
            cx={part.cx}
            cy={part.cy}
            rx={part.rx}
            ry={part.ry}
            fill={toCssColor(part.fill)}
            opacity={part.alpha}
          />
        ) : (
          <polyline
            key={i}
            points={part.points.map(([x, y]) => `${x},${y}`).join(' ')}
            fill="none"
            stroke={toCssColor(part.stroke)}
            strokeWidth={part.width}
            strokeOpacity={part.alpha}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ),
      )}
    </>
  );
}

/**
 * The player's snail as a small static SVG, drawn from the same parts as
 * the in-game textures (see snailArt.ts) -- for places outside the map that
 * should show "you", like the head of the history path.
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
  return (
    <svg
      className={className}
      style={style}
      viewBox={`0 0 ${SNAIL_FRAME_SIZE} ${SNAIL_FRAME_SIZE}`}
      aria-hidden="true"
      focusable="false"
    >
      <SnailShapes parts={snailParts(direction)} />
    </svg>
  );
}
