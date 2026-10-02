import Phaser from 'phaser';

export type VegetationKind = 'cypress' | 'tree' | 'bush' | 'reeds';

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
  reeds: { width: 32, height: 64, baseX: 16, baseY: 60 },
};

/** Colours sampled from the approved map reference: one muted green for foliage (with a soft shade), near-black trunks. */
const COLORS = {
  leaf: 0x4b5f4e,
  leafShade: 0x3c4d3f,
  leafSeam: 0x34433a,
  trunk: 0x2f2721,
  shadow: 0x2a3a26,
  reedStem: 0x3f5545,
  cattail: 0x6b5a48,
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
 * Reeds as in the reference: a few tall, slender dark blades standing
 * apart, each ending in a long pointed leaf, one or two topped with a
 * brown cattail instead.
 */
const drawReeds: Draw = (g, r) => {
  g.fillStyle(COLORS.shadow, 0.14);
  g.fillEllipse(20 * r, 60 * r, 22 * r, 3.4 * r);
  const blades: [number, number, number, 'leaf' | 'cattail'][] = [
    // base x, tip x, tip y, top
    [7, 5, 30, 'leaf'],
    [12, 10.5, 14, 'cattail'],
    [16.5, 17, 22, 'leaf'],
    [21, 22.5, 8, 'leaf'],
    [25.5, 28, 26, 'cattail'],
  ];
  blades.forEach(([baseX, tipX, tipY, top]) => {
    const headY = tipY + 12;
    g.lineStyle(1.7 * r, COLORS.reedStem, 1);
    g.strokePoints([v(baseX, 60, r), v((baseX + tipX) / 2, (60 + headY) / 2, r), v(tipX, headY, r)]);
    if (top === 'leaf') {
      // A long pointed leaf: wide just above the stem, tapering to a tip.
      g.fillStyle(COLORS.reedStem, 1);
      g.fillPoints([v(tipX, tipY, r), v(tipX + 2.2, tipY + 9, r), v(tipX, headY + 2, r), v(tipX - 2.2, tipY + 9, r)], true);
    } else {
      g.fillStyle(COLORS.cattail, 1);
      g.fillEllipse(tipX * r, (tipY + 7) * r, 4.2 * r, 11 * r);
      g.lineStyle(1 * r, COLORS.reedStem, 1);
      g.lineBetween(tipX * r, (tipY + 1.5) * r, tipX * r, (tipY - 3) * r);
    }
  });
};

const DRAWERS: Record<VegetationKind, Draw> = {
  cypress: drawCypress,
  tree: drawTree,
  bush: drawBush,
  reeds: drawReeds,
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
