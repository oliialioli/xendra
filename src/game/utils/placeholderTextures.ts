import Phaser from 'phaser';
import {
  SNAIL_COLORS,
  SNAIL_FRAME_SIZE,
  SNAIL_SPIRAL_ALPHA,
  snailGeometry,
  type SnailDirection,
} from './snailArt';

export type { SnailDirection } from './snailArt';

/**
 * Draws a very simple, clearly-placeholder snail silhouette per direction
 * from the shared shapes in snailArt.ts (also used by the intro screen's
 * SVG snail). Replace with a real 128x128 spritesheet later -- see
 * docs/ASSETS.md. Entities only ever call `snail-<direction>`, so swapping
 * this for `this.load.spritesheet(...)` output requires no entity code changes.
 */
export function generateSnailTextures(scene: Phaser.Scene): void {
  const directions: SnailDirection[] = ['down', 'up', 'left', 'right'];

  directions.forEach((direction) => {
    const key = `snail-${direction}`;
    if (scene.textures.exists(key)) return;

    const g = scene.add.graphics();
    const { body, shell, spiral, antennae, tentacles } = snailGeometry(direction);

    g.fillStyle(SNAIL_COLORS.body, 1);
    g.fillEllipse(body.cx, body.cy, body.width, body.height);

    g.fillStyle(SNAIL_COLORS.shell, 1);
    g.fillCircle(shell.cx, shell.cy, shell.radius);
    g.lineStyle(spiral.strokeWidth, SNAIL_COLORS.spiral, SNAIL_SPIRAL_ALPHA);
    spiral.radii.forEach((radius) => {
      g.beginPath();
      g.arc(shell.cx, shell.cy, radius, 0, Math.PI * 1.5);
      g.strokePath();
    });

    g.lineStyle(antennae.strokeWidth, SNAIL_COLORS.antenna, 1);
    g.fillStyle(SNAIL_COLORS.antenna, 1);
    antennae.lines.forEach((line) => {
      g.beginPath();
      g.moveTo(line.x1, line.y1);
      g.lineTo(line.x2, line.y2);
      g.strokePath();
      g.fillCircle(line.x2, line.y2, antennae.tipRadius);
    });

    g.lineStyle(tentacles.strokeWidth, SNAIL_COLORS.antenna, 1);
    tentacles.lines.forEach((line) => {
      g.beginPath();
      g.moveTo(line.x1, line.y1);
      g.lineTo(line.x2, line.y2);
      g.strokePath();
    });

    g.generateTexture(key, SNAIL_FRAME_SIZE, SNAIL_FRAME_SIZE);
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
