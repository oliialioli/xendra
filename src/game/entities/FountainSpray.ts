import Phaser from 'phaser';
import type { Vector2Like } from '../../types/content';

/** Snail distance (world units, from the fountain's centre) at which the water starts... */
const START_RADIUS = 200;
/** ...and the larger distance at which it stops again, so it doesn't stutter at the edge. */
const STOP_RADIUS = 250;
const DROP_TEXTURE = 'fountain-drop';

export type FountainSprayOptions = {
  /** The fountain's own centre (its sprite anchor), for the distance check. */
  center: Vector2Like;
  /** World point at the top of the column, where the water comes out. */
  spout: Vector2Like;
  /** Depth just above the fountain sprite. */
  depth: number;
  isReducedMotion: () => boolean;
};

function ensureDropTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(DROP_TEXTURE)) return;
  const g = scene.add.graphics();
  g.fillStyle(0xffffff, 1);
  g.fillCircle(3, 3, 3);
  g.generateTexture(DROP_TEXTURE, 6, 6);
  g.destroy();
}

/**
 * The fountain's active state: still water until the snail comes near, then
 * a jet rises from the top of the column and drops arc out and fall back
 * into the basin (gravity-driven particles, timed so they land on the water
 * rather than past the rim). Walking away turns it off. With reduced motion
 * it stays still.
 */
export class FountainSpray {
  private readonly options: FountainSprayOptions;
  private readonly drops: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly jet: Phaser.GameObjects.Particles.ParticleEmitter;
  private running = false;

  constructor(scene: Phaser.Scene, options: FountainSprayOptions) {
    this.options = options;
    const { spout, depth } = options;
    ensureDropTexture(scene);

    // Drops arcing out over the basin: up ~30 units, then ~90 down to the water.
    this.drops = scene.add.particles(spout.x, spout.y, DROP_TEXTURE, {
      x: { min: -5, max: 5 },
      speedY: { min: -150, max: -105 },
      speedX: { min: -42, max: 42 },
      gravityY: 330,
      lifespan: { min: 950, max: 1100 },
      scale: { start: 1.3, end: 0.7 },
      alpha: { start: 1, end: 0.35 },
      tint: [0xffffff, 0xe1f0f7, 0xb5d9ea],
      frequency: 20,
      quantity: 3,
      emitting: false,
    });
    this.drops.setDepth(depth + 0.5);

    // A thin, faster core so it reads as a jet, not just a sprinkle.
    this.jet = scene.add.particles(spout.x, spout.y, DROP_TEXTURE, {
      speedY: { min: -200, max: -175 },
      speedX: { min: -6, max: 6 },
      gravityY: 330,
      lifespan: 560,
      scale: { start: 1.1, end: 0.4 },
      alpha: { start: 0.9, end: 0 },
      tint: 0xffffff,
      frequency: 22,
      emitting: false,
    });
    this.jet.setDepth(depth + 0.6);
  }

  /** Call once per frame with the snail's position. */
  update(snail: Vector2Like): void {
    const { center, isReducedMotion } = this.options;
    const distance = Math.hypot(snail.x - center.x, snail.y - center.y);
    const shouldRun = !isReducedMotion() && (this.running ? distance < STOP_RADIUS : distance < START_RADIUS);
    if (shouldRun === this.running) return;
    this.running = shouldRun;
    if (shouldRun) {
      this.drops.start();
      this.jet.start();
    } else {
      this.drops.stop();
      this.jet.stop();
    }
  }

  destroy(): void {
    this.drops.destroy();
    this.jet.destroy();
  }
}
