import Phaser from 'phaser';
import type { Vector2Like } from '../../types/content';
import type { OcclusionSegment } from '../../content/boatPathConfig';
import { RiverLoop } from '../utils/riverLoop';

/** The beaver textures are drawn at this many px per world unit, then shown at 1/this scale (crisp on retina). */
const RES = 3;
/** Texture frame in world units; the beaver points right (+x), seen from above. */
const FRAME_W = 64;
const FRAME_H = 34;
/** On-screen scale of the textures: back to world units (1 / RES), times how big the beaver is on the map. */
const SIZE = 1.5 / RES;

/** First visit: soon enough that people notice it; then every so often. */
const FIRST_DELAY_MS: [number, number] = [14000, 24000];
const NEXT_DELAY_MS: [number, number] = [45000, 85000];
/** World units per second along the river. */
const SWIM_SPEED = 26;
const SWIM_MS: [number, number] = [8000, 12000];
/** It ducks under early if the snail comes this close. */
const SHY_RADIUS = 120;
const RIPPLE_EVERY_MS = 420;

const C = {
  fur: 0x7a5236,
  furShade: 0x5e3d27,
  furLight: 0x96704d,
  snout: 0x8f6a4a,
  nose: 0x2e2018,
  tail: 0x4a3426,
  tailLine: 0x35251b,
  stick: 0xa5835a,
  stickShade: 0x7d6142,
  leaf: 0x8fa07d,
  wake: 0xf2f6f2,
} as const;

function drawBeaver(g: Phaser.GameObjects.Graphics, withStick: boolean): void {
  g.setScale(RES);
  const cy = FRAME_H / 2;

  // The water parting around its head, trailing back in a V.
  g.lineStyle(1.3, C.wake, 0.55);
  g.beginPath();
  g.moveTo(57, cy - 2);
  g.lineTo(34, cy - 12);
  g.moveTo(57, cy + 2);
  g.lineTo(34, cy + 12);
  g.strokePath();

  // Flat, scaly tail just under the surface, joined to the back.
  g.fillStyle(C.tail, 0.75);
  g.fillRect(12, cy - 2, 8, 4);
  g.fillEllipse(9, cy, 16, 10);
  g.lineStyle(0.7, C.tailLine, 0.6);
  for (let x = 4; x <= 14; x += 3) {
    g.lineBetween(x, cy - 4, x, cy + 4);
  }
  g.lineBetween(2, cy, 16, cy);

  // Back, half sunk: darker where the water covers it.
  g.fillStyle(C.furShade, 0.85);
  g.fillEllipse(28, cy + 0.6, 26, 16);
  g.fillStyle(C.fur, 1);
  g.fillEllipse(29, cy, 22, 13);
  g.fillStyle(C.furLight, 0.6);
  g.fillEllipse(30, cy - 1.6, 13, 4);

  // Head: ears, round face, snout, nose and eyes.
  g.fillStyle(C.furShade, 1);
  g.fillCircle(40.5, cy - 6, 2.3);
  g.fillCircle(40.5, cy + 6, 2.3);
  g.fillStyle(C.fur, 1);
  g.fillEllipse(44, cy, 15, 12.5);
  g.fillStyle(C.snout, 1);
  g.fillEllipse(50.5, cy, 8, 7);
  g.fillStyle(C.nose, 1);
  g.fillEllipse(54, cy, 2.6, 4);
  g.fillCircle(45.2, cy - 3.6, 1.2);
  g.fillCircle(45.2, cy + 3.6, 1.2);
  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(45.6, cy - 3.9, 0.4);
  g.fillCircle(45.6, cy + 3.3, 0.4);

  if (withStick) {
    // A branch held across its mouth, with a couple of leaves.
    g.lineStyle(2.2, C.stickShade, 1);
    g.lineBetween(53.5, cy - 13, 51, cy + 14);
    g.lineStyle(1.4, C.stick, 1);
    g.lineBetween(53.2, cy - 13, 50.7, cy + 14);
    g.lineStyle(1, C.stick, 1);
    g.lineBetween(52.6, cy - 7, 57, cy - 10);
    g.fillStyle(C.leaf, 1);
    g.fillEllipse(58.5, cy - 11, 4, 2.4);
    g.fillEllipse(50, cy + 15.5, 3.6, 2.2);
  }
}

function ensureTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists('beaver')) {
    [false, true].forEach((withStick) => {
      const g = scene.add.graphics();
      drawBeaver(g, withStick);
      g.generateTexture(withStick ? 'beaver-stick' : 'beaver', FRAME_W * RES, FRAME_H * RES);
      g.destroy();
    });
  }
  if (!scene.textures.exists('beaver-ripple')) {
    const g = scene.add.graphics();
    g.lineStyle(2.5, C.wake, 1);
    g.strokeCircle(24, 24, 21);
    g.generateTexture('beaver-ripple', 48, 48);
    g.destroy();
  }
  if (!scene.textures.exists('beaver-drop')) {
    const g = scene.add.graphics();
    g.fillStyle(C.wake, 1);
    g.fillCircle(3, 3, 3);
    g.generateTexture('beaver-drop', 6, 6);
    g.destroy();
  }
}

export type BeaverOptions = {
  /** The river's centre loop (the boats' path), in world units. */
  river: Vector2Like[];
  /** Stretches of the loop (progress 0-1) it must stay clear of: bridges, the waterfall, the dock. */
  avoid: OcclusionSegment[];
  depth: number;
  isReducedMotion: () => boolean;
  /** Told each time it hits the water diving (`startled` when it was clicked), e.g. for the splash's sound. */
  onSplash?: (at: Vector2Like, startled: boolean) => void;
};

/**
 * Every so often a beaver surfaces somewhere on the river -- preferably
 * where the camera is looking -- swims a stretch with a ripple trail
 * (sometimes carrying a branch), then slaps its tail and dives. It's shy:
 * if the snail comes close it ducks under straight away. It never swims
 * near a bridge (the bridges are part of the map image, so it would show
 * on top of them) or the waterfall. Nothing happens with reduced motion.
 */
export class Beaver {
  private readonly scene: Phaser.Scene;
  private readonly options: BeaverOptions;
  private readonly river: RiverLoop;
  private readonly sprite: Phaser.GameObjects.Image;
  private timer: Phaser.Time.TimerEvent | null = null;
  private swim: Phaser.Tweens.Tween | null = null;
  private bob: Phaser.Tweens.Tween | null = null;
  private rippleTimer: Phaser.Time.TimerEvent | null = null;
  private effects = new Set<Phaser.GameObjects.Image>();
  private swimming = false;

  constructor(scene: Phaser.Scene, options: BeaverOptions) {
    this.scene = scene;
    this.options = options;
    this.river = new RiverLoop(options.river);
    ensureTextures(scene);
    this.sprite = scene.add.image(0, 0, 'beaver').setScale(SIZE).setAlpha(0).setVisible(false);
    this.sprite.setDepth(options.depth);
    // Clicking it startles it: it darts off and dives. A generous round hit
    // area (in texture pixels) around its head and back, so it's easy to catch.
    this.sprite.setInteractive({
      hitArea: new Phaser.Geom.Circle((FRAME_W * RES) / 2 + 6 * RES, (FRAME_H * RES) / 2, 24 * RES),
      hitAreaCallback: Phaser.Geom.Circle.Contains,
      useHandCursor: true,
    });
    this.sprite.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        if (!this.swimming) return;
        // It's the beaver being clicked, not the map: don't send the snail walking there.
        event.stopPropagation();
        this.dive(true);
      },
    );
    this.schedule(FIRST_DELAY_MS);
  }

  /** Call once per frame with the snail's position. */
  update(snail: Vector2Like): void {
    if (!this.swimming) return;
    if (Math.hypot(snail.x - this.sprite.x, snail.y - this.sprite.y) < SHY_RADIUS) this.dive();
  }

  private schedule([min, max]: [number, number]): void {
    this.timer = this.scene.time.delayedCall(Phaser.Math.Between(min, max), () => this.surface());
  }

  /** Is the whole swim, from `from` over `span` (signed progress), clear of every avoided stretch? */
  private isClear(from: number, span: number): boolean {
    const margin = 0.012;
    for (let s = 0; s <= 1; s += 0.05) {
      const p = Phaser.Math.Wrap(from + span * s, 0, 1);
      if (this.options.avoid.some((seg) => p > seg.start - margin && p < seg.end + margin)) return false;
    }
    return true;
  }

  /** A starting point and direction for this swim: in view if possible, anywhere clear otherwise. */
  private pickRoute(span: number): { from: number; dir: 1 | -1 } | null {
    const view = this.scene.cameras.main.worldView;
    const inner = new Phaser.Geom.Rectangle(view.x + 60, view.y + 60, view.width - 120, view.height - 120);
    const inView: { from: number; dir: 1 | -1 }[] = [];
    const anywhere: { from: number; dir: 1 | -1 }[] = [];
    for (let from = 0; from < 1; from += 0.005) {
      ([1, -1] as const).forEach((dir) => {
        if (!this.isClear(from, span * dir)) return;
        const start = this.river.sample(from);
        const mid = this.river.sample(from + (span * dir) / 2);
        const route = { from, dir };
        anywhere.push(route);
        if (inner.contains(start.x, start.y) && inner.contains(mid.x, mid.y)) inView.push(route);
      });
    }
    const pool = inView.length > 0 ? inView : anywhere;
    return pool.length > 0 ? Phaser.Utils.Array.GetRandom(pool) : null;
  }

  private surface(): void {
    this.timer = null;
    if (this.options.isReducedMotion()) {
      this.schedule(NEXT_DELAY_MS);
      return;
    }
    const duration = Phaser.Math.Between(...SWIM_MS);
    const span = (SWIM_SPEED * duration) / 1000 / this.river.length;
    const route = this.pickRoute(span);
    if (!route) {
      this.schedule(NEXT_DELAY_MS);
      return;
    }

    const { from, dir } = route;
    const place = (progress: number) => {
      const at = this.river.sample(progress);
      this.sprite.setPosition(at.x, at.y);
      // The loop's segment angle points along increasing progress; turn round when swimming the other way.
      this.sprite.setRotation(at.angle + (dir === -1 ? Math.PI : 0));
    };

    this.sprite.setTexture(Math.random() < 0.4 ? 'beaver-stick' : 'beaver');
    place(from);
    this.sprite.setVisible(true).setAlpha(0).setScale(0.6 * SIZE);
    this.swimming = true;
    this.ripple(this.sprite.x, this.sprite.y, 1.4);

    this.scene.tweens.add({ targets: this.sprite, alpha: 1, scale: SIZE, duration: 600, ease: 'Sine.easeOut' });
    const state = { t: 0 };
    this.swim = this.scene.tweens.add({
      targets: state,
      t: 1,
      duration,
      ease: 'Linear',
      onUpdate: () => place(from + span * dir * state.t),
      onComplete: () => this.dive(),
    });
    // A gentle paddling roll from side to side.
    this.bob = this.scene.tweens.add({
      targets: this.sprite,
      scaleY: { from: 0.94 * SIZE, to: 1.04 * SIZE },
      delay: 600,
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.rippleTimer = this.scene.time.addEvent({
      delay: RIPPLE_EVERY_MS,
      loop: true,
      callback: () => {
        // Behind it, where the tail stirs the water.
        const back = this.sprite.rotation + Math.PI;
        this.ripple(this.sprite.x + Math.cos(back) * 21, this.sprite.y + Math.sin(back) * 21, 0.7);
      },
    });
  }

  /** Tail slap, a splash and it's gone -- then wait for next time. */
  /**
   * Tail slap, a splash and it's gone -- then wait for next time. Startled
   * (clicked), it first darts ahead and goes under faster, with a bigger splash.
   */
  private dive(startled = false): void {
    if (!this.swimming) return;
    this.swimming = false;
    this.swim?.stop();
    this.bob?.stop();
    this.rippleTimer?.remove();
    this.swim = this.bob = this.rippleTimer = null;

    const ahead = this.sprite.rotation;
    const dart = startled ? 34 : 0;
    const x = this.sprite.x + Math.cos(ahead) * dart;
    const y = this.sprite.y + Math.sin(ahead) * dart;
    const goUnder = startled ? 260 : 420;
    if (startled) {
      this.scene.tweens.add({ targets: this.sprite, x, y, duration: 200, ease: 'Quad.easeOut' });
    }
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scaleX: 0.5 * SIZE,
      scaleY: 0.85 * SIZE,
      delay: startled ? 140 : 0,
      duration: goUnder,
      ease: 'Quad.easeIn',
      onComplete: () => this.sprite.setVisible(false),
    });
    const back = ahead + Math.PI;
    const tailX = x + Math.cos(back) * 30;
    const tailY = y + Math.sin(back) * 30;
    this.scene.time.delayedCall(startled ? 220 : 260, () => {
      this.ripple(tailX, tailY, startled ? 2.2 : 1.6);
      this.scene.time.delayedCall(220, () => this.ripple(tailX, tailY, startled ? 1.6 : 1.1));
      this.splash(tailX, tailY);
      if (startled) this.splash(tailX + 6, tailY - 4);
      this.options.onSplash?.({ x: tailX, y: tailY }, startled);
    });
    this.schedule(NEXT_DELAY_MS);
  }

  private ripple(x: number, y: number, size: number): void {
    const ring = this.scene.add.image(x, y, 'beaver-ripple').setDepth(this.options.depth - 0.1);
    ring.setScale(0.15 * size, 0.1 * size).setAlpha(0.6);
    this.effects.add(ring);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 0.9 * size,
      scaleY: 0.6 * size,
      alpha: 0,
      duration: 1400,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.effects.delete(ring);
        ring.destroy();
      },
    });
  }

  private splash(x: number, y: number): void {
    for (let i = 0; i < 9; i += 1) {
      const drop = this.scene.add.image(x, y, 'beaver-drop').setDepth(this.options.depth + 0.1);
      drop.setScale(Phaser.Math.FloatBetween(0.5, 1)).setAlpha(0.9);
      this.effects.add(drop);
      const angle = Phaser.Math.FloatBetween(-Math.PI, 0);
      const reach = Phaser.Math.FloatBetween(10, 26);
      const flight = Phaser.Math.Between(380, 560);
      this.scene.tweens.add({ targets: drop, x: x + Math.cos(angle) * reach, duration: flight, ease: 'Quad.easeOut' });
      this.scene.tweens.add({
        targets: drop,
        y: y + Math.sin(angle) * reach,
        duration: flight * 0.45,
        ease: 'Sine.easeOut',
        yoyo: true,
      });
      this.scene.tweens.add({
        targets: drop,
        alpha: 0,
        delay: flight * 0.5,
        duration: flight * 0.5,
        onComplete: () => {
          this.effects.delete(drop);
          drop.destroy();
        },
      });
    }
  }

  destroy(): void {
    this.timer?.remove();
    this.rippleTimer?.remove();
    this.swim?.stop();
    this.bob?.stop();
    this.scene.tweens.killTweensOf(this.sprite);
    this.effects.forEach((effect) => {
      this.scene.tweens.killTweensOf(effect);
      effect.destroy();
    });
    this.effects.clear();
    this.sprite.destroy();
  }
}
