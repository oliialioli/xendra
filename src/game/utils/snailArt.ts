export type SnailDirection = 'down' | 'up' | 'left' | 'right';

/** Square frame every snail pose is drawn in, in "frame units" (the in-game size in world units). */
export const SNAIL_FRAME_SIZE = 64;
/** The in-game textures are rendered at this many pixels per frame unit, then shown at 1/this scale, so they stay crisp on retina screens. */
export const SNAIL_TEXTURE_RES = 2;

/**
 * The snail's palette: the map's own muted, earthy tones -- a sage body and
 * a clay shell, each with a shade and a light for soft, painted-looking
 * volume rather than flat outlines.
 */
export const SNAIL_COLORS = {
  body: 0x8fa07d,
  bodyShade: 0x6f8261,
  bodyLight: 0xb4c09e,
  shell: 0xc06a4b,
  shellShade: 0x9a4f38,
  shellLight: 0xdc9070,
  spiral: 0x6e3f3d,
  ink: 0x3a3530,
  eyeShine: 0xf6f1e4,
  shadow: 0x1e2a1a,
} as const;

/**
 * One shape of the snail drawing. `layer` groups the parts the intro
 * animates separately: 'feelers' are the eye stalks and tentacles, which
 * sway on their own; everything else is 'body'. Parts are listed in paint
 * order (first is furthest back).
 */
export type SnailPart =
  | { kind: 'ellipse'; layer: 'body' | 'feelers'; cx: number; cy: number; rx: number; ry: number; fill: number; alpha?: number }
  | { kind: 'line'; layer: 'body' | 'feelers'; points: [number, number][]; stroke: number; width: number; alpha?: number };

const C = SNAIL_COLORS;

function ellipse(cx: number, cy: number, rx: number, ry: number, fill: number, alpha?: number, layer: 'body' | 'feelers' = 'body'): SnailPart {
  return { kind: 'ellipse', layer, cx, cy, rx, ry, fill, alpha };
}

function line(points: [number, number][], stroke: number, width: number, alpha?: number, layer: 'body' | 'feelers' = 'body'): SnailPart {
  return { kind: 'line', layer, points, stroke, width, alpha };
}

/** An Archimedean spiral from `rOuter` in to `rInner` over `turns`, clockwise on screen. */
function spiral(cx: number, cy: number, rOuter: number, rInner: number, turns: number, startAngle: number): [number, number][] {
  const steps = Math.round(28 * turns);
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const angle = startAngle + t * turns * Math.PI * 2;
    const r = rOuter + (rInner - rOuter) * t;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as [number, number];
  });
}

/** Part of a circle's edge, from `from` to `to` (radians, clockwise on screen). */
function arc(cx: number, cy: number, r: number, from: number, to: number): [number, number][] {
  const steps = 16;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const angle = from + ((to - from) * i) / steps;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as [number, number];
  });
}

/** An eye stalk from `base` to `tip`, with its eye and a speck of light. */
function eyeStalk(base: [number, number], tip: [number, number]): SnailPart[] {
  return [
    line([base, tip], C.bodyShade, 2.4, 1, 'feelers'),
    ellipse(tip[0], tip[1], 2.4, 2.4, C.ink, 1, 'feelers'),
    ellipse(tip[0] - 0.7, tip[1] - 0.8, 0.75, 0.75, C.eyeShine, 1, 'feelers'),
  ];
}

/** A shell seen side-on or from behind: a soft rim shade, the shell, a highlight and the spiral. */
function shellWithSpiral(cx: number, cy: number, r: number, spiralStart: number): SnailPart[] {
  return [
    ellipse(cx + 1.4, cy + 1.6, r, r, C.shellShade),
    ellipse(cx, cy, r - 0.6, r - 0.6, C.shell),
    ellipse(cx - r * 0.38, cy - r * 0.45, r * 0.34, r * 0.22, C.shellLight, 0.75),
    line(spiral(cx + 0.6, cy + 0.6, r * 0.78, 1.2, 1.75, spiralStart), C.spiral, 1.9, 0.85),
  ];
}

function rightPose(): SnailPart[] {
  return [
    ellipse(33, 49.5, 21, 3.4, C.shadow, 0.2),
    // Foot: a long soft body, tapering into a tail behind the shell, darker
    // underneath, rising into the neck and head at the front.
    ellipse(13.5, 46.8, 9, 3.2, C.body),
    ellipse(31, 45, 21, 5.6, C.body),
    ellipse(29, 47.6, 20, 2.6, C.bodyShade),
    ellipse(46.5, 40.5, 6.4, 8, C.body),
    ellipse(50.5, 34.5, 6.4, 6.2, C.body),
    ellipse(48.8, 32.6, 2.6, 2, C.bodyLight, 0.7),
    ...shellWithSpiral(29, 29, 15, Math.PI * 0.25),
    // Feelers: two long eye stalks and two short tentacles at the front.
    ...eyeStalk([49.5, 30], [54, 18.5]),
    ...eyeStalk([53, 30.5], [59.5, 21]),
    line([[55, 37], [59.5, 37.8]], C.bodyShade, 1.7, 1, 'feelers'),
    line([[54.2, 39], [58, 41]], C.bodyShade, 1.7, 1, 'feelers'),
  ];
}

function leftPose(): SnailPart[] {
  return rightPose().map((part) =>
    part.kind === 'ellipse'
      ? { ...part, cx: SNAIL_FRAME_SIZE - part.cx }
      : { ...part, points: part.points.map(([x, y]) => [SNAIL_FRAME_SIZE - x, y] as [number, number]) },
  );
}

function downPose(): SnailPart[] {
  return [
    ellipse(32, 50, 15, 3.8, C.shadow, 0.2),
    ellipse(32, 46, 12, 6, C.body),
    ellipse(32, 48.6, 10, 3, C.bodyShade),
    // Shell from the front: its coil is seen side-on, as one curve down its side.
    ellipse(32.6, 28.6, 14, 14, C.shellShade),
    ellipse(32, 27.6, 13.4, 13.4, C.shell),
    ellipse(26.6, 21.4, 4.6, 3, C.shellLight, 0.75),
    line(arc(30, 27.6, 9.5, -Math.PI * 0.42, Math.PI * 0.32), C.spiral, 1.8, 0.7),
    // Head in front of the shell's foot.
    ellipse(32, 41.5, 6.6, 6, C.body),
    ellipse(30.2, 39.6, 2.4, 1.8, C.bodyLight, 0.7),
    ...eyeStalk([29.6, 37.5], [26.4, 27]),
    ...eyeStalk([34.4, 37.5], [37.6, 27]),
    line([[29.4, 44.5], [27.2, 47.4]], C.bodyShade, 1.6, 1, 'feelers'),
    line([[34.6, 44.5], [36.8, 47.4]], C.bodyShade, 1.6, 1, 'feelers'),
  ];
}

function upPose(): SnailPart[] {
  return [
    ellipse(32, 50, 15, 3.8, C.shadow, 0.2),
    ellipse(32, 45.5, 11, 6, C.body),
    ellipse(32, 48.2, 9, 2.8, C.bodyShade),
    // Eye stalks poke out above the shell, which hides where they start.
    ...eyeStalk([29.4, 22], [26.6, 11]),
    ...eyeStalk([34.6, 22], [37.4, 11]),
    ...shellWithSpiral(32, 31.5, 14, Math.PI * 1.1),
  ];
}

const POSES: Record<SnailDirection, () => SnailPart[]> = {
  right: rightPose,
  left: leftPose,
  down: downPose,
  up: upPose,
};

/**
 * The snail drawing for one facing direction, in frame units. Single source
 * of truth for the Phaser textures (placeholderTextures.ts), the intro's
 * hatching snail (features/intro/IntroSnail.tsx) and the small snail on the
 * history path (components/SnailFigure.tsx), so it's the same character
 * everywhere.
 */
export function snailParts(direction: SnailDirection): SnailPart[] {
  return POSES[direction]();
}

/** `0x7c9070` -> `#7c9070`, for drawing the same palette in SVG/CSS. */
export function toCssColor(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}
