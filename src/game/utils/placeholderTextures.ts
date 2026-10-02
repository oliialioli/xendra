import Phaser from 'phaser';
import { SNAIL_FRAME_SIZE, SNAIL_TEXTURE_RES, snailParts, type SnailDirection } from './snailArt';

export type { SnailDirection } from './snailArt';

/**
 * Draws the snail for each facing direction from the shared parts in
 * snailArt.ts (also used by the intro's and the history path's SVG snail),
 * at SNAIL_TEXTURE_RES pixels per frame unit -- the Snail entity shows it
 * at 1/SNAIL_TEXTURE_RES scale. Entities only ever use `snail-<direction>`,
 * so swapping this for a real spritesheet later needs no entity changes
 * beyond that scale -- see docs/ASSETS.md.
 */
export function generateSnailTextures(scene: Phaser.Scene): void {
  const directions: SnailDirection[] = ['down', 'up', 'left', 'right'];
  const r = SNAIL_TEXTURE_RES;

  directions.forEach((direction) => {
    const key = `snail-${direction}`;
    if (scene.textures.exists(key)) return;

    const g = scene.add.graphics();
    snailParts(direction).forEach((part) => {
      const alpha = part.alpha ?? 1;
      if (part.kind === 'ellipse') {
        g.fillStyle(part.fill, alpha);
        g.fillEllipse(part.cx * r, part.cy * r, part.rx * 2 * r, part.ry * 2 * r);
        return;
      }
      g.lineStyle(part.width * r, part.stroke, alpha);
      g.strokePoints(part.points.map(([x, y]) => new Phaser.Math.Vector2(x * r, y * r)));
      // Round the ends of solid strokes, like the SVG version's round caps.
      if (alpha === 1) {
        g.fillStyle(part.stroke, 1);
        [part.points[0], part.points[part.points.length - 1]].forEach(([x, y]) => {
          g.fillCircle(x * r, y * r, (part.width * r) / 2);
        });
      }
    });

    g.generateTexture(key, SNAIL_FRAME_SIZE * r, SNAIL_FRAME_SIZE * r);
    g.destroy();
  });
}

/**
 * Tiny dot marking a landmark's exact anchor point, and a "visited" variant.
 * Development/debug aid only -- shown exclusively while debug mode (`D`) is
 * on, never during normal play (see prompt maestro debug-mode requirement).
 */
export function generateLandmarkMarkerTextures(scene: Phaser.Scene): void {
  const draw = (key: string, color: number) => {
    if (scene.textures.exists(key)) return;
    const g = scene.add.graphics();
    g.fillStyle(color, 0.95);
    g.fillCircle(9, 9, 8);
    g.lineStyle(2, 0x3a3530, 0.6);
    g.strokeCircle(9, 9, 8);
    g.generateTexture(key, 18, 18);
    g.destroy();
  };
  draw('landmark-marker', 0xe2b53c);
  draw('landmark-marker-visited', 0x7c9070);
}

/**
 * Soft white radial gradient, fully transparent at its edge. Used as a
 * proximity "glow" overlay (see LandmarkAssetConfig.proximityGlow /
 * MapScene.updateLandmarkGlow) that additively brightens a single-artwork
 * landmark as the snail approaches, without needing a second lit-state PNG.
 */
export function generateGlowTexture(scene: Phaser.Scene, key: string, size = 256): void {
  if (scene.textures.exists(key)) return;
  const canvasTexture = scene.textures.createCanvas(key, size, size);
  if (!canvasTexture) return;
  const ctx = canvasTexture.getContext();
  const cx = size / 2;
  const cy = size / 2;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.55, 'rgba(255,255,255,0.35)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  canvasTexture.refresh();
}
