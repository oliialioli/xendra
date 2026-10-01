export type SnailDirection = 'down' | 'up' | 'left' | 'right';

/** Square texture frame every snail pose is drawn into, in pixels. */
export const SNAIL_FRAME_SIZE = 64;

/** Palette shared by the in-game textures and the intro's SVG snail. */
export const SNAIL_COLORS = {
  body: 0x7c9070,
  shell: 0xb5654a,
  spiral: 0x6e3f3d,
  antenna: 0x3a3530,
} as const;

export const SNAIL_SPIRAL_ALPHA = 0.8;

export type SnailLine = { x1: number; y1: number; x2: number; y2: number };

export type SnailGeometry = {
  body: { cx: number; cy: number; width: number; height: number };
  shell: { cx: number; cy: number; radius: number };
  /** Concentric 270-degree arcs drawn clockwise from 3 o'clock to 12 o'clock. */
  spiral: { radii: readonly number[]; strokeWidth: number };
  antennae: { lines: SnailLine[]; strokeWidth: number; tipRadius: number };
  tentacles: { lines: SnailLine[]; strokeWidth: number };
};

const ANTENNA_OFFSETS: Record<SnailDirection, { dx: number; dy: number }> = {
  down: { dx: 6, dy: 14 },
  up: { dx: 6, dy: -14 },
  left: { dx: -14, dy: -6 },
  right: { dx: 14, dy: -6 },
};

/**
 * The placeholder snail's shapes for one facing direction, in frame pixels:
 * an oval body, a spiral shell, two long antennae and two short tentacles
 * oriented toward the facing direction. Single source of truth for both the
 * Phaser textures (placeholderTextures.ts) and the intro's SVG snail
 * (features/intro/IntroSnail.tsx), so the character born on the intro
 * screen is exactly the one the player then steers around the island.
 */
export function snailGeometry(direction: SnailDirection): SnailGeometry {
  const size = SNAIL_FRAME_SIZE;
  const cx = size / 2;
  const cy = size / 2 + 6;
  const off = ANTENNA_OFFSETS[direction];
  const headX = cx + (direction === 'left' ? -14 : direction === 'right' ? 14 : 0);
  const headY = cy + (direction === 'up' ? -8 : direction === 'down' ? 8 : 0);

  return {
    body: { cx, cy, width: 34, height: 20 },
    shell: { cx: cx - 4, cy: cy - 10, radius: 15 },
    spiral: { radii: [10, 5], strokeWidth: 2 },
    antennae: {
      lines: [-3, 3].map((dx) => ({
        x1: headX + dx,
        y1: headY,
        x2: headX + dx + off.dx,
        y2: headY + off.dy,
      })),
      strokeWidth: 3,
      tipRadius: 2.5,
    },
    tentacles: {
      lines: [-6, 6].map((dx) => ({
        x1: headX + dx,
        y1: headY + 2,
        x2: headX + dx + off.dx * 0.35,
        y2: headY + 2 + off.dy * 0.35,
      })),
      strokeWidth: 2,
    },
  };
}

/** `0x7c9070` -> `#7c9070`, for drawing the same palette in SVG/CSS. */
export function toCssColor(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}
