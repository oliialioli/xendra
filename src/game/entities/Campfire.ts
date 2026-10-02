import Phaser from 'phaser';
import type { Vector2Like } from '../../types/content';

/** Snail distance (world units) at which the fire lights. */
const IGNITE_RADIUS = 190;
/** ...and the larger distance at which it goes out again, so it doesn't flicker on/off at the edge. */
const DOUSE_RADIUS = 240;
const EMBER_TEXTURE = 'campfire-ember';

export type CampfireOptions = {
  /** World point at the bottom-centre of the flame -- where it grows from. */
  flameBase: Vector2Like;
  /** World units per flame-texture pixel (same scale as the campfire base sprite). */
  flameScale: number;
  /** Flame texture key, and the base point inside it as an origin fraction. */
  flameKey: string;
  flameOrigin: Vector2Like;
  /** Depth just above the campfire base sprite. */
  depth: number;
  isReducedMotion: () => boolean;
};

function ensureEmberTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(EMBER_TEXTURE)) return;
  const g = scene.add.graphics();
  g.fillStyle(0xffffff, 1);
  g.fillCircle(4, 4, 4);
  g.generateTexture(EMBER_TEXTURE, 8, 8);
  g.destroy();
}

/**
 * The campfire by the train: unlit (just stones, ash and logs -- the base
 * sprite MapScene places) until the snail comes close, then the flame grows
 * out of the ash, flickers, glows warm and throws a few sparks; walking
 * away lets it die down again. With reduced motion it simply appears lit,
 * with no flicker or sparks.
 */
export class Campfire {
  private readonly scene: Phaser.Scene;
  private readonly options: CampfireOptions;
  private readonly flame: Phaser.GameObjects.Image;
  private readonly glow: Phaser.GameObjects.Image;
  private readonly embers: Phaser.GameObjects.Particles.ParticleEmitter;
  private lit = false;
  private flickerTween: Phaser.Tweens.Tween | null = null;
  private glowTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, options: CampfireOptions) {
    this.scene = scene;
    this.options = options;
    const { flameBase, flameKey, flameOrigin, depth } = options;

    this.glow = scene.add.image(flameBase.x, flameBase.y - 14, 'landmark-glow');
    this.glow.setBlendMode(Phaser.BlendModes.ADD);
    this.glow.setTint(0xff9a4d);
    this.glow.setDisplaySize(150, 110);
    this.glow.setDepth(depth + 0.2);
    this.glow.setAlpha(0);

    this.flame = scene.add.image(flameBase.x, flameBase.y, flameKey);
    this.flame.setOrigin(flameOrigin.x, flameOrigin.y);
    this.flame.setScale(0);
    this.flame.setDepth(depth + 0.1);

    ensureEmberTexture(scene);
    this.embers = scene.add.particles(flameBase.x, flameBase.y - 26, EMBER_TEXTURE, {
      x: { min: -8, max: 8 },
      speedY: { min: -46, max: -24 },
      speedX: { min: -10, max: 10 },
      lifespan: { min: 700, max: 1200 },
      scale: { start: 0.55, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xffd27a, 0xff9a4d, 0xff7a3d],
      blendMode: Phaser.BlendModes.ADD,
      frequency: 220,
      emitting: false,
    });
    this.embers.setDepth(depth + 0.3);
  }

  /** Call once per frame with the snail's position. */
  update(snail: Vector2Like): void {
    const { flameBase } = this.options;
    const distance = Math.hypot(snail.x - flameBase.x, snail.y - flameBase.y);
    if (!this.lit && distance < IGNITE_RADIUS) this.ignite();
    else if (this.lit && distance > DOUSE_RADIUS) this.douse();
  }

  private get fullScale(): number {
    return this.options.flameScale;
  }

  private ignite(): void {
    this.lit = true;
    this.scene.tweens.killTweensOf([this.flame, this.glow]);

    if (this.options.isReducedMotion()) {
      this.flame.setScale(this.fullScale).setAlpha(1).setAngle(0);
      this.glow.setAlpha(0.5);
      return;
    }

    this.flame.setScale(this.fullScale * 0.12).setAlpha(0.6);
    this.scene.tweens.add({
      targets: this.flame,
      scale: this.fullScale,
      alpha: 1,
      duration: 650,
      ease: 'Back.easeOut',
      onComplete: () => this.startFlicker(),
    });
    this.scene.tweens.add({ targets: this.glow, alpha: 0.5, duration: 700, ease: 'Sine.easeOut' });
    this.embers.start();
  }

  private douse(): void {
    this.lit = false;
    this.stopFlicker();
    this.embers.stop();
    this.scene.tweens.killTweensOf([this.flame, this.glow]);

    if (this.options.isReducedMotion()) {
      this.flame.setScale(0);
      this.glow.setAlpha(0);
      return;
    }
    this.scene.tweens.add({
      targets: this.flame,
      scale: 0,
      angle: 0,
      duration: 500,
      ease: 'Sine.easeIn',
    });
    this.scene.tweens.add({ targets: this.glow, alpha: 0, duration: 600 });
  }

  /** Small random stretches and sways, one after another, so it never loops visibly. */
  private startFlicker(): void {
    if (!this.lit || this.options.isReducedMotion()) return;
    const s = this.fullScale;
    this.flickerTween = this.scene.tweens.add({
      targets: this.flame,
      scaleX: s * Phaser.Math.FloatBetween(0.93, 1.07),
      scaleY: s * Phaser.Math.FloatBetween(0.88, 1.12),
      angle: Phaser.Math.FloatBetween(-4, 4),
      duration: Phaser.Math.Between(110, 220),
      ease: 'Sine.easeInOut',
      onComplete: () => this.startFlicker(),
    });
    if (!this.glowTween?.isPlaying()) {
      this.glowTween = this.scene.tweens.add({
        targets: this.glow,
        alpha: { from: 0.42, to: 0.58 },
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private stopFlicker(): void {
    this.flickerTween?.stop();
    this.flickerTween = null;
    this.glowTween?.stop();
    this.glowTween = null;
  }

  destroy(): void {
    this.stopFlicker();
    this.flame.destroy();
    this.glow.destroy();
    this.embers.destroy();
  }
}
