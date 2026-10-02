import Phaser from 'phaser';

/** The bank plants come in four looks, as in the reference: spear leaves, cattails, curved rushes and broad leaves. */
export type ReedKind = 'reedsSpears' | 'reedsCattails' | 'reedsCurved' | 'reedsBroad';
export type VegetationKind = 'cypress' | 'tree' | 'bush' | ReedKind;

export const REED_KINDS: ReedKind[] = ['reedsSpears', 'reedsCattails', 'reedsCurved', 'reedsBroad'];

/** Textures are drawn at this many pixels per world unit and shown at 1/this scale, so they stay crisp on retina screens. */
export const VEGETATION_TEXTURE_RES = 2;

/**
 * Each kind's frame (world units) and its base -- the point that sits on
 * the ground, used as the sprite's origin, its depth, and the pivot it
 * sways about. Frames are power-of-two once multiplied by
 * VEGETATION_TEXTURE_RES, so the textures get mipmaps and shrink cleanly.
 */
export const VEGETATION_FRAMES: Record<VegetationKind, { width: number; height: number; baseX: number; baseY: number }> = {
  cypress: { width: 32, height: 128, baseX: 16, baseY: 124 },
  tree: { width: 64, height: 64, baseX: 32, baseY: 61 },
  bush: { width: 32, height: 32, baseX: 16, baseY: 28 },
  reedsSpears: { width: 32, height: 64, baseX: 16, baseY: 60 },
  reedsCattails: { width: 32, height: 64, baseX: 16, baseY: 60 },
  reedsCurved: { width: 32, height: 64, baseX: 16, baseY: 60 },
  reedsBroad: { width: 32, height: 64, baseX: 16, baseY: 60 },
};

/** Colours sampled from the approved map reference: one muted green for foliage (with a soft shade), near-black trunks. */
const COLORS = {
  leaf: 0x4b5f4e,
  leafShade: 0x3c4d3f,
  leafSeam: 0x34433a,
  trunk: 0x2f2721,
  shadow: 0x2a3a26,
  reedStem: 0x3f5545,
  reedDark: 0x34463a,
  reedFill: 0x587060,
  cattailGreen: 0x4a5e4f,
  cattailBrown: 0x6e665c,
  cattailTan: 0xc9a77c,
};

export function vegetationTextureKey(kind: VegetationKind): string {
  return `vegetation-${kind}`;
}

type Draw = (g: Phaser.GameObjects.Graphics, r: number) => void;

const v = (x: number, y: number, r: number) => new Phaser.Math.Vector2(x * r, y * r);

/** A long, soft shadow cast to the lower right (the reference's light comes from the upper left). */
function castShadow(g: Phaser.GameObjects.Graphics, r: number, baseX: number, baseY: number, length: number, depth: number): void {
  g.fillStyle(COLORS.shadow, 0.2);
  g.fillEllipse((baseX + length * 0.55) * r, baseY * r, length * 1.3 * r, depth * 2 * r);
}

/**
 * Pointed at the top, fullest about two-thirds of the way down, rounded at
 * the bottom, on a short dark trunk -- the reference's cypress. The right
 * side is only a shade darker, with a faint crease down the middle.
 */
const drawCypress: Draw = (g, r) => {
  castShadow(g, r, 16, 123, 24, 3.4);
  g.fillStyle(COLORS.trunk, 1);
  g.fillRect(14.6 * r, 112 * r, 2.8 * r, 12 * r);

  const top = 22;
  const bottom = 116;
  const widest = 0.68;
  const maxHalf = 12.5;
  const halfWidth = (u: number) =>
    u <= widest
      ? maxHalf * Math.pow(u / widest, 0.85)
      : maxHalf * Math.sqrt(Math.max(0, 1 - Math.pow((u - widest) / (1 - widest), 2)));
  const steps = 40;
  const left: Phaser.Math.Vector2[] = [];
  const right: Phaser.Math.Vector2[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const u = i / steps;
    const y = top + (bottom - top) * u;
    left.push(v(16 - halfWidth(u), y, r));
    right.push(v(16 + halfWidth(u), y, r));
  }
  g.fillStyle(COLORS.leaf, 1);
  g.fillPoints([...left, ...[...right].reverse()], true);
  // The shaded side: from a little right of centre out to the right edge.
  g.fillStyle(COLORS.leafShade, 0.55);
  g.fillPoints(
    [...right, ...right.map((p) => new Phaser.Math.Vector2(16 * r + (p.x - 16 * r) * 0.25, p.y)).reverse()],
    true,
  );
  g.lineStyle(0.8 * r, COLORS.leafSeam, 0.35);
  g.lineBetween(16.6 * r, (top + 14) * r, 16.6 * r, (bottom - 3) * r);
};

/** A crown of overlapping rounded lobes, widest low down, on a thin dark trunk, with a faint V-shaped seam. */
const drawTree: Draw = (g, r) => {
  castShadow(g, r, 32, 60.5, 36, 4.2);
  g.fillStyle(COLORS.trunk, 1);
  g.fillRect(30.8 * r, 44 * r, 2.6 * r, 17 * r);

  const lobes: [number, number, number][] = [
    [32, 19, 14],
    [22.5, 30, 11],
    [41.5, 29, 11],
    [32, 34, 13.5],
  ];
  g.fillStyle(COLORS.leaf, 1);
  lobes.forEach(([x, y, rad]) => g.fillCircle(x * r, y * r, rad * r));
  // Right lobe a shade darker.
  g.fillStyle(COLORS.leafShade, 0.5);
  g.fillCircle(44 * r, 30 * r, 8.5 * r);
  g.lineStyle(0.9 * r, COLORS.leafSeam, 0.4);
  g.strokePoints([v(27.5, 38, r), v(32, 46.5, r), v(37, 39, r)]);
  g.lineBetween(32 * r, 46.5 * r, 32 * r, 37 * r);
};

/** A low cloud of three lobes with a flat base, the right one a shade darker. */
const drawBush: Draw = (g, r) => {
  castShadow(g, r, 16, 27.6, 22, 2.8);
  g.fillStyle(COLORS.leaf, 1);
  g.fillCircle(16 * r, 17.5 * r, 8 * r);
  g.fillCircle(9.5 * r, 21.5 * r, 6 * r);
  g.fillCircle(23 * r, 21.5 * r, 6.4 * r);
  g.fillRect(9.5 * r, 21.5 * r, 13.5 * r, 6 * r);
  g.fillStyle(COLORS.leafShade, 0.5);
  g.fillCircle(24.2 * r, 22.4 * r, 4.6 * r);
  g.lineStyle(0.8 * r, COLORS.leafSeam, 0.35);
  g.strokePoints([v(13.5, 21, r), v(16, 27, r), v(19, 21.5, r)]);
};

/**
 * One leaf or blade along a gently bent centreline: narrow at the base,
 * fullest at `fullAt` (fraction of its length), tapering to a point. `bend`
 * pushes the middle sideways (world units) for curved rushes.
 */
function leaf(
  g: Phaser.GameObjects.Graphics,
  r: number,
  base: [number, number],
  tip: [number, number],
  width: number,
  bend: number,
  fill: number,
  outline?: number,
  fullAt = 0.35,
): void {
  const steps = 16;
  const [bx, by] = base;
  const [tx, ty] = tip;
  const length = Math.hypot(tx - bx, ty - by) || 1;
  // Unit normal to the base->tip line, for the half-width and the bend.
  const nx = -(ty - by) / length;
  const ny = (tx - bx) / length;
  const left: Phaser.Math.Vector2[] = [];
  const right: Phaser.Math.Vector2[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const curve = Math.sin(t * Math.PI) * bend;
    const cx = bx + (tx - bx) * t + nx * curve;
    const cy = by + (ty - by) * t + ny * curve;
    const half = (width / 2) * (t < fullAt ? 0.45 + 0.55 * (t / fullAt) : Math.pow((1 - t) / (1 - fullAt), 0.8));
    left.push(v(cx + nx * half, cy + ny * half, r));
    right.push(v(cx - nx * half, cy - ny * half, r));
  }
  const outlinePoints = [...left, ...right.reverse()];
  g.fillStyle(fill, 1);
  g.fillPoints(outlinePoints, true);
  if (outline !== undefined) {
    g.lineStyle(0.9 * r, outline, 1);
    g.strokePoints(outlinePoints, true);
  }
}

/** A thin stem with an oval head on top -- a cattail. */
function cattail(g: Phaser.GameObjects.Graphics, r: number, baseX: number, tip: [number, number], bend: number, head: number): void {
  const [tx, ty] = tip;
  const midX = (baseX + tx) / 2 + bend;
  g.lineStyle(1.3 * r, COLORS.reedStem, 1);
  g.strokePoints([v(baseX, 60, r), v(midX, (60 + ty) / 2, r), v(tx, ty + 6, r)]);
  g.fillStyle(head, 1);
  g.fillEllipse(tx * r, (ty + 3) * r, 4.4 * r, 9.5 * r);
  g.lineStyle(0.9 * r, COLORS.reedStem, 1);
  g.lineBetween(tx * r, (ty - 1) * r, tx * r, (ty - 4.5) * r);
}

function reedShadow(g: Phaser.GameObjects.Graphics, r: number): void {
  g.fillStyle(COLORS.shadow, 0.13);
  g.fillEllipse(19 * r, 60 * r, 24 * r, 3.2 * r);
}

/** A row of narrow, upright spear leaves of different heights, two-tone like the reference's. */
const drawReedsSpears: Draw = (g, r) => {
  reedShadow(g, r);
  const leaves: [number, number][] = [
    [5, 34],
    [10, 22],
    [15.5, 14],
    [21, 26],
    [26.5, 18],
  ];
  leaves.forEach(([x, top]) => leaf(g, r, [x, 60], [x + 0.6, top], 3.8, 0, COLORS.reedFill, COLORS.reedDark, 0.6));
};

/** Cattails on thin stems, some leaning -- heads dark green, grey-brown or pale tan -- among a couple of leaves. */
const drawReedsCattails: Draw = (g, r) => {
  reedShadow(g, r);
  leaf(g, r, [9, 60], [7.5, 32], 3.4, -1, COLORS.reedStem);
  leaf(g, r, [22, 60], [24, 36], 3.2, 1, COLORS.reedStem);
  cattail(g, r, 12, [10, 10], -1.5, COLORS.cattailBrown);
  cattail(g, r, 16, [17.5, 18], 1, COLORS.cattailGreen);
  cattail(g, r, 20, [25, 8], 2.5, COLORS.cattailTan);
  cattail(g, r, 26, [29, 24], 1.5, COLORS.cattailTan);
};

/** Rushes bent this way and that, with a pair opening in a V. */
const drawReedsCurved: Draw = (g, r) => {
  reedShadow(g, r);
  leaf(g, r, [7, 60], [3, 26], 3, -4, COLORS.reedStem);
  leaf(g, r, [11, 60], [15, 16], 3.2, 5, COLORS.reedStem);
  leaf(g, r, [17, 60], [11, 24], 3, -5, COLORS.reedStem);
  // The V pair.
  leaf(g, r, [22, 60], [18.5, 30], 3, -1.5, COLORS.reedStem);
  leaf(g, r, [22.5, 60], [29, 28], 3, 2, COLORS.reedStem);
};

/** Two or three broad, solid, dark leaves -- like a young iris. */
const drawReedsBroad: Draw = (g, r) => {
  reedShadow(g, r);
  leaf(g, r, [9, 60], [9.5, 24], 6.4, 0, COLORS.reedDark);
  leaf(g, r, [17, 60], [17.5, 16], 7, 0.5, COLORS.reedStem);
  leaf(g, r, [24.5, 60], [25, 34], 5.6, 0, COLORS.reedDark);
};

const DRAWERS: Record<VegetationKind, Draw> = {
  cypress: drawCypress,
  tree: drawTree,
  bush: drawBush,
  reedsSpears: drawReedsSpears,
  reedsCattails: drawReedsCattails,
  reedsCurved: drawReedsCurved,
  reedsBroad: drawReedsBroad,
};

/** Draws every vegetation kind's texture once. */
export function generateVegetationTextures(scene: Phaser.Scene): void {
  const r = VEGETATION_TEXTURE_RES;
  (Object.keys(DRAWERS) as VegetationKind[]).forEach((kind) => {
    const key = vegetationTextureKey(kind);
    if (scene.textures.exists(key)) return;
    const g = scene.add.graphics();
    DRAWERS[kind](g, r);
    const frame = VEGETATION_FRAMES[kind];
    g.generateTexture(key, frame.width * r, frame.height * r);
    g.destroy();
  });
}
