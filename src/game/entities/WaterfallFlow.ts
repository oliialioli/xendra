import Phaser from 'phaser';
import type { Vector2Like } from '../../types/content';

/** A fall's face in cascada.png's own pixels: its lip and its foot, each a line from left to right. */
export type FallFace = { top: [Vector2Like, Vector2Like]; bottom: [Vector2Like, Vector2Like] };

/**
 * The two falls in cascada.png and the foam at their feet, measured on the
 * image itself (the face's light-blue run in each pixel column).
 */
export const FALL_FACES: FallFace[] = [
  { top: [{ x: 498, y: 340 }, { x: 655, y: 362 }], bottom: [{ x: 490, y: 474 }, { x: 648, y: 505 }] },
  { top: [{ x: 908, y: 473 }, { x: 1075, y: 490 }], bottom: [{ x: 898, y: 626 }, { x: 1062, y: 642 }] },
];
export const FOAM_PUFFS_PX: Vector2Like[] = [
  { x: 445, y: 466 }, { x: 505, y: 500 }, { x: 565, y: 522 }, { x: 628, y: 514 },
  { x: 852, y: 602 }, { x: 905, y: 632 }, { x: 962, y: 664 }, { x: 1012, y: 668 },
];

const STREAKS_PER_FALL = 8;
/** World units per second. */
const FALL_SPEED: [number, number] = [48, 66];
/** World units. */
const STREAK_LENGTH: [number, number] = [7, 13];
const STREAK_WIDTH = 1.5;
const STREAK_ALPHA = 0.55;
const RES = 3;

type Streak = { image: Phaser.GameObjects.Image; face: FallFace; along: number; travelled: number; speed: number; length: number };

export type WaterfallFlowOptions = {
  /** Maps a cascada.png pixel to world units (through the sprite's own placement and scale). */
  toWorld: (px: Vector2Like) => Vector2Like;
  /** World units per cascada.png pixel. */
  scale: number;
  depth: number;
};

const lerp = (a: Vector2Like, b: Vector2Like, t: number): Vector2Like => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/**
 * Keeps the waterfall running: pale streaks sliding down both falls, over
 * and over, and the foam at their feet gently churning. With reduced motion
 * the painted falls are left still.
 */
export class WaterfallFlow {
  private readonly options: WaterfallFlowOptions;
  private readonly streaks: Streak[] = [];
  private readonly puffs: Phaser.GameObjects.Image[] = [];
  private readonly tweens: Phaser.Tweens.Tween[] = [];
  private enabled = true;

  constructor(scene: Phaser.Scene, options: WaterfallFlowOptions) {
    this.options = options;
    if (!scene.textures.exists('falls-streak')) {
      const g = scene.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.fillRoundedRect(0, 0, 2 * RES, 16 * RES, RES);
      g.generateTexture('falls-streak', 2 * RES, 16 * RES);
      g.clear();
      g.fillStyle(0xf4f1e6, 1);
      g.fillCircle(12 * RES, 12 * RES, 12 * RES);
      g.generateTexture('falls-puff', 24 * RES, 24 * RES);
      g.destroy();
    }

    FALL_FACES.forEach((face) => {
      for (let i = 0; i < STREAKS_PER_FALL; i += 1) {
        const image = scene.add.image(0, 0, 'falls-streak').setDepth(options.depth).setAlpha(0).setOrigin(0.5, 0);
        const streak: Streak = { image, face, along: 0, travelled: 0, speed: 0, length: 0 };
        this.reset(streak);
        // Spread out down the face from the start.
        streak.travelled = Math.random() * this.faceHeight(streak);
        this.streaks.push(streak);
      }
    });

    FOAM_PUFFS_PX.forEach((px, i) => {
      const at = options.toWorld(px);
      const size = (Phaser.Math.FloatBetween(16, 24) * options.scale * 3) / (24 * RES);
      const puff = scene.add.image(at.x, at.y, 'falls-puff').setDepth(options.depth).setScale(size).setAlpha(0);
      this.puffs.push(puff);
      this.tweens.push(
        scene.tweens.add({
          targets: puff,
          alpha: { from: 0, to: 0.5 },
          scale: { from: size * 0.75, to: size * 1.1 },
          duration: Phaser.Math.Between(900, 1400),
          delay: i * 170,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
        }),
      );
    });
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.streaks.forEach((streak) => streak.image.setVisible(enabled));
    this.puffs.forEach((puff) => puff.setVisible(enabled));
    this.tweens.forEach((tween) => (enabled ? tween.resume() : tween.pause()));
  }

  update(delta: number): void {
    if (!this.enabled) return;
    this.streaks.forEach((streak) => {
      streak.travelled += (streak.speed * delta) / 1000;
      const height = this.faceHeight(streak);
      if (streak.travelled > height) {
        this.reset(streak);
        return;
      }
      const top = this.options.toWorld(lerp(streak.face.top[0], streak.face.top[1], streak.along));
      const t = streak.travelled / height;
      // In at the lip, out into the foam.
      const alpha = Math.min(1, t / 0.15) * Math.min(1, (1 - t) / 0.3) * STREAK_ALPHA;
      streak.image.setPosition(top.x, top.y + streak.travelled).setAlpha(Math.max(0, alpha));
    });
  }

  destroy(): void {
    this.tweens.forEach((tween) => tween.remove());
    this.streaks.forEach((streak) => streak.image.destroy());
    this.puffs.forEach((puff) => puff.destroy());
  }

  /** World units from the lip to the foot, where this streak runs down (minus its own length, so it never spills past). */
  private faceHeight(streak: Streak): number {
    const top = this.options.toWorld(lerp(streak.face.top[0], streak.face.top[1], streak.along));
    const bottom = this.options.toWorld(lerp(streak.face.bottom[0], streak.face.bottom[1], streak.along));
    return Math.max(1, bottom.y - top.y - streak.length);
  }

  private reset(streak: Streak): void {
    streak.along = Phaser.Math.FloatBetween(0.06, 0.94);
    streak.travelled = 0;
    streak.speed = Phaser.Math.FloatBetween(FALL_SPEED[0], FALL_SPEED[1]);
    streak.length = Phaser.Math.FloatBetween(STREAK_LENGTH[0], STREAK_LENGTH[1]);
    streak.image.setScale(STREAK_WIDTH / (2 * RES), streak.length / (16 * RES)).setAlpha(0);
  }
}
