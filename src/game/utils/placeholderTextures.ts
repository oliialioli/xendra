import Phaser from 'phaser';

export type SnailDirection = 'down' | 'up' | 'left' | 'right';

const SNAIL_FRAME_SIZE = 64;

/**
 * Draws a very simple, clearly-placeholder snail silhouette per direction:
 * an oval body, a spiral shell, and exactly two long antennae oriented toward
 * the facing direction. Replace with a real 128x128 spritesheet later --
 * see docs/ASSETS.md. Entities only ever call `snail-<direction>`, so swapping
 * this for `this.load.spritesheet(...)` output requires no entity code changes.
 */
export function generateSnailTextures(scene: Phaser.Scene): void {
  const directions: SnailDirection[] = ['down', 'up', 'left', 'right'];

  directions.forEach((direction) => {
    const key = `snail-${direction}`;
    if (scene.textures.exists(key)) return;

    const g = scene.add.graphics();
    const size = SNAIL_FRAME_SIZE;
    const cx = size / 2;
    const cy = size / 2 + 6;

    // Body
    g.fillStyle(0x7c9070, 1);
    g.fillEllipse(cx, cy, 34, 20);

    // Shell
    g.fillStyle(0xb5654a, 1);
    g.fillCircle(cx - 4, cy - 10, 15);
    g.lineStyle(2, 0x6e3f3d, 0.8);
    g.beginPath();
    g.arc(cx - 4, cy - 10, 10, 0, Math.PI * 1.5);
    g.strokePath();
    g.beginPath();
    g.arc(cx - 4, cy - 10, 5, 0, Math.PI * 1.5);
    g.strokePath();

    // Antennae (exactly two long, two short tentacles), oriented per direction
    g.lineStyle(3, 0x3a3530, 1);
    const antennaOffsets: Record<SnailDirection, { dx: number; dy: number }> = {
      down: { dx: 6, dy: 14 },
      up: { dx: 6, dy: -14 },
      left: { dx: -14, dy: -6 },
      right: { dx: 14, dy: -6 },
    };
    const off = antennaOffsets[direction];
    const headX = cx + (direction === 'left' ? -14 : direction === 'right' ? 14 : 0);
    const headY = cy + (direction === 'up' ? -8 : direction === 'down' ? 8 : 0);

    g.beginPath();
    g.moveTo(headX - 3, headY);
    g.lineTo(headX - 3 + off.dx, headY + off.dy);
    g.strokePath();
    g.fillStyle(0x3a3530, 1);
    g.fillCircle(headX - 3 + off.dx, headY + off.dy, 2.5);

    g.beginPath();
    g.moveTo(headX + 3, headY);
    g.lineTo(headX + 3 + off.dx, headY + off.dy);
    g.strokePath();
    g.fillCircle(headX + 3 + off.dx, headY + off.dy, 2.5);

    // Short tentacles
    g.lineStyle(2, 0x3a3530, 1);
    g.beginPath();
    g.moveTo(headX - 6, headY + 2);
    g.lineTo(headX - 6 + off.dx * 0.35, headY + 2 + off.dy * 0.35);
    g.strokePath();
    g.beginPath();
    g.moveTo(headX + 6, headY + 2);
    g.lineTo(headX + 6 + off.dx * 0.35, headY + 2 + off.dy * 0.35);
    g.strokePath();

    g.generateTexture(key, size, size);
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
