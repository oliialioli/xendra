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

/** The map's own greens: a dark, slightly blue foliage with a shade and a light, and warm trunks. */
const COLORS = {
  leaf: 0x4c6a52,
  leafShade: 0x3b5442,
  leafLight: 0x67856a,
  trunk: 0x6b5040,
  shadow: 0x1e2a1a,
  stem: 0x6c8a5a,
  stemLight: 0x87a273,
  cattail: 0x7a5a3e,
};

export function vegetationTextureKey(kind: VegetationKind): string {
  return `vegetation-${kind}`;
}

type Draw = (g: Phaser.GameObjects.Graphics, r: number) => void;

const v = (x: number, y: number, r: number) => new Phaser.Math.Vector2(x * r, y * r);

/** Tall and narrow with a pointed top, like the reference's cypresses; shaded on its right. */
const drawCypress: Draw = (g, r) => {
  g.fillStyle(COLORS.shadow, 0.2);
  g.fillEllipse(24 * r, 124 * r, 22 * r, 6 * r);
  g.fillStyle(COLORS.trunk, 1);
  g.fillRect(15 * r, 110 * r, 2.4 * r, 14 * r);

  const top = 26;
  const bottom = 118;
  const halfWidth = (u: number) => 10 * Math.pow(u, 0.55) * Math.sqrt(Math.max(0, 1 - Math.pow(u, 6)));
  const steps = 32;
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
  // Shade: the right half -- down its right edge, back up the middle.
  g.fillStyle(COLORS.leafShade, 1);
  g.fillPoints([...right, ...right.map((p) => new Phaser.Math.Vector2(16 * r, p.y)).reverse()], true);
  // Light: a thin strip down the left side.
  g.fillStyle(COLORS.leafLight, 0.55);
  g.fillPoints(
    [
      ...left.slice(4, 26),
      ...left
        .slice(4, 26)
        .map((p) => new Phaser.Math.Vector2(16 * r - (16 * r - p.x) * 0.45, p.y))
        .reverse(),
    ],
    true,
  );
};

/** A round crown on a short trunk; darker towards the lower right, a soft highlight top-left. */
const drawTree: Draw = (g, r) => {
  g.fillStyle(COLORS.shadow, 0.2);
  g.fillEllipse(41 * r, 61 * r, 34 * r, 8 * r);
  g.fillStyle(COLORS.trunk, 1);
  g.fillRect(30.6 * r, 34 * r, 3 * r, 27 * r);
  g.fillStyle(COLORS.leafShade, 1);
  g.fillCircle(33.5 * r, 27.5 * r, 19.5 * r);
  g.fillStyle(COLORS.leaf, 1);
  g.fillCircle(31.5 * r, 25.5 * r, 18 * r);
  g.fillStyle(COLORS.leafLight, 0.5);
  g.fillEllipse(25 * r, 17 * r, 14 * r, 9 * r);
};

/** A low clump of two or three rounded shrubs. */
const drawBush: Draw = (g, r) => {
  g.fillStyle(COLORS.shadow, 0.18);
  g.fillEllipse(19 * r, 28 * r, 26 * r, 6 * r);
  const blobs: [number, number, number][] = [
    [11, 22, 7],
    [19, 19, 8],
    [25.5, 23, 5.5],
  ];
  g.fillStyle(COLORS.leafShade, 1);
  blobs.forEach(([x, y, rad]) => g.fillCircle((x + 1) * r, (y + 1.4) * r, rad * r));
  g.fillStyle(COLORS.leaf, 1);
  blobs.forEach(([x, y, rad]) => g.fillCircle(x * r, y * r, (rad - 0.8) * r));
  g.fillStyle(COLORS.leafLight, 0.5);
  g.fillEllipse(16 * r, 15 * r, 6 * r, 3.6 * r);
};

/** Reeds at the water's edge: slender stems and blades, a few topped with cattails. */
const drawReeds: Draw = (g, r) => {
  g.fillStyle(COLORS.shadow, 0.14);
  g.fillEllipse(18 * r, 60 * r, 20 * r, 4 * r);
  const stems: [number, number, number, boolean][] = [
    // base x, top x, top y, has a cattail
    [10, 7, 24, false],
    [13, 12, 14, true],
    [16, 17, 20, true],
    [19, 22, 10, true],
    [22, 26, 26, false],
    [15, 9, 32, false],
  ];
  stems.forEach(([baseX, topX, topY, cattail], i) => {
    g.lineStyle(1.5 * r, i % 2 ? COLORS.stem : COLORS.stemLight, 1);
    const midX = (baseX + topX) / 2 + (topX > baseX ? -1 : 1);
    g.strokePoints([v(baseX, 60, r), v(midX, (60 + topY) / 2, r), v(topX, topY, r)]);
    if (cattail) {
      g.fillStyle(COLORS.cattail, 1);
      g.fillEllipse(topX * r, (topY + 4) * r, 3.4 * r, 8 * r);
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
