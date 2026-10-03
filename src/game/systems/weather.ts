import Phaser from 'phaser';

/*
 * Weather over the map: occasional rain showers and gusts of wind carrying
 * leaves. Both happen wherever the camera is (they're placed from the
 * camera's view each time, rather than at fixed points on the island), and
 * both are skipped entirely with reduced motion.
 */

const RAIN_TEXTURE = 'weather-rain';
const SPLASH_TEXTURE = 'weather-splash';
const LEAF_TEXTURES = ['weather-leaf-green', 'weather-leaf-olive', 'weather-leaf-ochre'];
const STREAK_TEXTURE = 'weather-streak';

/** Drops slant down-left with the wind: horizontal and vertical speed (world units/s). */
const RAIN_VELOCITY = { x: -140, y: 720 };
/** At full intensity, drops and splashes started per frame per million square world units in view. */
const DROPS_PER_MEGA_UNIT = 9;
const SPLASHES_PER_MEGA_UNIT = 2.2;
/** How dark the sky gets at the peak of a shower. */
/** The rain veil's opacity at a shower's peak (exported so listeners can turn gloom back into intensity). */
export const MAX_GLOOM = 0.16;
/** Draw order: above every landmark and the snail (the in-world maximum is the map height). */
const WEATHER_DEPTH = 5000;

function ensureTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists(RAIN_TEXTURE)) {
    // A streak that's clear at the top and brightest at the bottom, like a falling drop.
    const g = scene.add.graphics();
    for (let i = 0; i < 11; i += 1) {
      g.fillStyle(0xe6eef2, (i + 1) / 13);
      g.fillRect(0, i * 2, 2, 2);
    }
    g.generateTexture(RAIN_TEXTURE, 2, 22);
    g.destroy();
  }
  if (!scene.textures.exists(SPLASH_TEXTURE)) {
    const g = scene.add.graphics();
    g.lineStyle(1.5, 0xf2f6f8, 0.9);
    g.strokeEllipse(8, 4, 14, 6);
    g.generateTexture(SPLASH_TEXTURE, 16, 8);
    g.destroy();
  }
  const leafColors = [
    [0x7c9070, 0x5f7356],
    [0xb7a24c, 0x8e7d35],
    [0xc98a4e, 0x9c6634],
  ];
  LEAF_TEXTURES.forEach((key, i) => {
    if (scene.textures.exists(key)) return;
    const [fill, vein] = leafColors[i];
    const g = scene.add.graphics();
    g.fillStyle(fill, 1);
    g.fillEllipse(9, 5, 16, 8);
    g.fillTriangle(16, 5, 19, 3.5, 19, 6.5); // a little stem
    g.lineStyle(1, vein, 1);
    g.lineBetween(2, 5, 16, 5);
    g.generateTexture(key, 20, 10);
    g.destroy();
  });
  if (!scene.textures.exists(STREAK_TEXTURE)) {
    // A soft, thin breath of wind: fading at both ends.
    const g = scene.add.graphics();
    for (let i = 0; i < 30; i += 1) {
      const t = i / 29;
      g.fillStyle(0xffffff, Math.sin(t * Math.PI) * 0.9);
      g.fillRect(i * 2, 1, 2, 1.5);
    }
    g.generateTexture(STREAK_TEXTURE, 60, 4);
    g.destroy();
  }
}

/**
 * A rain shower every minute or two: it builds up over a few seconds, rains
 * for a while and eases off again. Slanted drops and small splashes fill
 * whatever part of the island is in view, and the scene dims slightly under
 * a translucent grey-blue veil while it lasts.
 */
class RainShowers {
  private readonly scene: Phaser.Scene;
  private readonly onGloom: (amount: number) => void;
  private lastGloom = 0;
  private readonly drops: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly splashes: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly gloom: Phaser.GameObjects.Rectangle;
  private readonly view = new Phaser.Geom.Rectangle();
  private readonly state = { intensity: 0 };
  private timer: Phaser.Time.TimerEvent | null = null;
  private showerTween: Phaser.Tweens.TweenChain | null = null;

  constructor(scene: Phaser.Scene, onGloom: (amount: number) => void) {
    this.scene = scene;
    this.onGloom = onGloom;
    const angle = Phaser.Math.RadToDeg(Math.atan2(-RAIN_VELOCITY.x, RAIN_VELOCITY.y));

    this.gloom = scene.add.rectangle(0, 0, 10, 10, 0x34434d, 1).setOrigin(0, 0).setAlpha(0);
    this.gloom.setDepth(WEATHER_DEPTH - 1);

    this.drops = scene.add.particles(0, 0, RAIN_TEXTURE, {
      emitZone: { type: 'random', source: this.view, quantity: 1 },
      speedX: { min: RAIN_VELOCITY.x - 20, max: RAIN_VELOCITY.x + 20 },
      speedY: { min: RAIN_VELOCITY.y - 60, max: RAIN_VELOCITY.y + 60 },
      rotate: angle,
      lifespan: { min: 260, max: 520 },
      alpha: { values: [0, 0.75, 0.6, 0] },
      scaleY: { min: 0.8, max: 1.3 },
      frequency: 16,
      quantity: 0,
      emitting: false,
    } as Phaser.Types.GameObjects.Particles.ParticleEmitterConfig);
    this.drops.setDepth(WEATHER_DEPTH);

    this.splashes = scene.add.particles(0, 0, SPLASH_TEXTURE, {
      emitZone: { type: 'random', source: this.view, quantity: 1 },
      lifespan: 320,
      scale: { start: 0.3, end: 1.15 },
      alpha: { start: 0.55, end: 0 },
      frequency: 16,
      quantity: 0,
      emitting: false,
    } as Phaser.Types.GameObjects.Particles.ParticleEmitterConfig);
    this.splashes.setDepth(WEATHER_DEPTH);

    this.schedule(Phaser.Math.Between(20000, 35000));
  }

  private schedule(delay: number): void {
    this.timer = this.scene.time.delayedCall(delay, () => {
      this.startShower();
      this.schedule(Phaser.Math.Between(60000, 110000));
    });
  }

  private startShower(): void {
    const hold = Phaser.Math.Between(8000, 16000);
    this.drops.start();
    this.splashes.start();
    this.showerTween = this.scene.tweens.chain({
      targets: this.state,
      tweens: [
        { intensity: 1, duration: 3200, ease: 'Sine.easeIn' },
        { intensity: 1, duration: hold },
        { intensity: 0, duration: 3600, ease: 'Sine.easeOut' },
      ],
      onComplete: () => {
        this.drops.stop();
        this.splashes.stop();
      },
    });
  }

  /** Follows the camera and scales the amount of rain with the shower's intensity. */
  update(camera: Phaser.Cameras.Scene2D.Camera): void {
    const view = camera.worldView;
    // A margin upwind so slanted drops also enter from the right-hand edge.
    this.view.setTo(view.x - 40, view.y - 40, view.width + 200, view.height + 40);
    this.gloom.setPosition(view.x - 10, view.y - 10).setSize(view.width + 20, view.height + 20);
    const gloom = this.state.intensity * MAX_GLOOM;
    this.gloom.setAlpha(gloom);
    // Tell the DOM layers over the map (boats, badges) too -- in small steps, not every frame.
    if (Math.abs(gloom - this.lastGloom) >= 0.004 || (gloom === 0 && this.lastGloom !== 0)) {
      this.lastGloom = gloom;
      this.onGloom(gloom);
    }

    const megaUnits = (view.width * view.height) / 1_000_000;
    const intensity = this.state.intensity;
    this.drops.setQuantity(Math.round(intensity * DROPS_PER_MEGA_UNIT * megaUnits));
    // Splashes are rarer; carry the fraction over as a probability so light rain still splashes now and then.
    const splashes = intensity * SPLASHES_PER_MEGA_UNIT * megaUnits;
    this.splashes.setQuantity(Math.floor(splashes) + (Math.random() < splashes % 1 ? 1 : 0));
  }

  stop(): void {
    this.timer?.remove();
    this.showerTween?.stop();
    this.state.intensity = 0;
    this.drops.stop();
    this.splashes.stop();
    this.gloom.setAlpha(0);
    if (this.lastGloom !== 0) {
      this.lastGloom = 0;
      this.onGloom(0);
    }
  }

  destroy(): void {
    this.stop();
    this.drops.destroy();
    this.splashes.destroy();
    this.gloom.destroy();
  }
}

/**
 * Every so often a gust of wind sweeps across the view: a handful of leaves
 * blow in from one side, bobbing, spinning and flipping as they go, with a
 * few faint white streaks of wind racing past.
 */
class WindGusts {
  private readonly scene: Phaser.Scene;
  private readonly onGust: (fromLeft: boolean) => void;
  private timer: Phaser.Time.TimerEvent | null = null;
  private readonly flying = new Set<Phaser.GameObjects.Image>();

  constructor(scene: Phaser.Scene, onGust: (fromLeft: boolean) => void) {
    this.scene = scene;
    this.onGust = onGust;
    this.schedule(Phaser.Math.Between(8000, 15000));
  }

  private schedule(delay: number): void {
    this.timer = this.scene.time.delayedCall(delay, () => {
      this.gust();
      this.schedule(Phaser.Math.Between(18000, 35000));
    });
  }

  private gust(): void {
    const view = this.scene.cameras.main.worldView;
    const fromLeft = Math.random() < 0.7;
    this.onGust(fromLeft);
    const leaves = Phaser.Math.Between(6, 11);
    for (let i = 0; i < leaves; i += 1) {
      this.scene.time.delayedCall(Phaser.Math.Between(0, 1400), () => this.blowLeaf(view, fromLeft));
    }
    for (let i = 0; i < 3; i += 1) {
      this.scene.time.delayedCall(Phaser.Math.Between(0, 900), () => this.blowStreak(view, fromLeft));
    }
  }

  private blowLeaf(view: Phaser.Geom.Rectangle, fromLeft: boolean): void {
    const startX = fromLeft ? view.x - 30 : view.right + 30;
    const endX = fromLeft ? view.right + 60 : view.x - 60;
    const baseY = view.y + view.height * Phaser.Math.FloatBetween(0.15, 0.8);
    const drift = Phaser.Math.FloatBetween(20, 90); // settles a little lower by the end
    const bob = Phaser.Math.FloatBetween(18, 40);
    const bobs = Phaser.Math.FloatBetween(1.5, 3);
    const duration = Phaser.Math.Between(3800, 5600);

    const leaf = this.scene.add.image(startX, baseY, Phaser.Utils.Array.GetRandom(LEAF_TEXTURES));
    leaf.setDepth(WEATHER_DEPTH - 2).setAlpha(0).setScale(Phaser.Math.FloatBetween(1, 1.5));
    this.flying.add(leaf);
    const baseScale = leaf.scaleX;
    const spin = Phaser.Math.Between(360, 900) * (fromLeft ? 1 : -1);
    const progress = { t: 0 };

    this.scene.tweens.add({
      targets: progress,
      t: 1,
      duration,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        const t = progress.t;
        leaf.x = startX + (endX - startX) * t;
        leaf.y = baseY + Math.sin(t * Math.PI * 2 * bobs) * bob + drift * t;
        leaf.angle = spin * t;
        // Flipping over in the air: scaleY swings through zero and back.
        leaf.scaleY = baseScale * Math.cos(t * Math.PI * 2 * bobs * 1.6);
        leaf.alpha = Math.min(1, t * 8, (1 - t) * 8);
      },
      onComplete: () => {
        this.flying.delete(leaf);
        leaf.destroy();
      },
    });
  }

  private blowStreak(view: Phaser.Geom.Rectangle, fromLeft: boolean): void {
    const y = view.y + view.height * Phaser.Math.FloatBetween(0.2, 0.75);
    const startX = fromLeft ? view.x - 80 : view.right + 80;
    const travel = view.width * Phaser.Math.FloatBetween(0.45, 0.7) * (fromLeft ? 1 : -1);
    const streak = this.scene.add.image(startX, y, STREAK_TEXTURE);
    streak.setDepth(WEATHER_DEPTH - 2).setAlpha(0).setScale(Phaser.Math.FloatBetween(1.4, 2.2), 1);
    this.flying.add(streak);
    this.scene.tweens.add({
      targets: streak,
      x: startX + travel * 1.6,
      duration: 1500,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.flying.delete(streak);
        streak.destroy();
      },
    });
    this.scene.tweens.add({ targets: streak, alpha: 0.4, duration: 500, yoyo: true, hold: 400, ease: 'Sine.easeInOut' });
  }

  stop(): void {
    this.timer?.remove();
  }

  destroy(): void {
    this.stop();
    this.flying.forEach((item) => {
      this.scene.tweens.killTweensOf(item);
      item.destroy();
    });
    this.flying.clear();
  }
}

/** Rain showers and wind gusts together, switched off entirely with reduced motion. */
export class WeatherSystem {
  private readonly scene: Phaser.Scene;
  private readonly onGust: (fromLeft: boolean) => void;
  private readonly onGloom: (amount: number) => void;
  private rain: RainShowers | null = null;
  private wind: WindGusts | null = null;

  /**
   * `onGust` is told each time a gust starts and which way it blows (e.g. so
   * the vegetation can lean with it); `onGloom` how dark the rain has made
   * the scene (0 to the veil's full opacity), as it changes.
   */
  constructor(
    scene: Phaser.Scene,
    reducedMotion: boolean,
    onGust: (fromLeft: boolean) => void = () => {},
    onGloom: (amount: number) => void = () => {},
  ) {
    this.scene = scene;
    this.onGust = onGust;
    this.onGloom = onGloom;
    ensureTextures(scene);
    if (!reducedMotion) this.start();
  }

  private start(): void {
    this.rain = new RainShowers(this.scene, this.onGloom);
    this.wind = new WindGusts(this.scene, this.onGust);
  }

  setReducedMotion(reduced: boolean): void {
    if (reduced) {
      this.rain?.destroy();
      this.wind?.destroy();
      this.rain = null;
      this.wind = null;
    } else if (!this.rain) {
      this.start();
    }
  }

  /** Call once per frame. */
  update(): void {
    this.rain?.update(this.scene.cameras.main);
  }

  destroy(): void {
    this.rain?.destroy();
    this.wind?.destroy();
  }
}
