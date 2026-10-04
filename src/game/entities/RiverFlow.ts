import Phaser from 'phaser';
import type { Vector2Like } from '../../types/content';
import type { OcclusionSegment } from '../../content/boatPathConfig';
import { RiverLoop } from '../utils/riverLoop';

/** Glints at once, all along the river (most of them where the camera is looking). */
const COUNT = 26;
/** World units per second, downstream. */
const SPEED: [number, number] = [9, 15];
const LIFE_MS: [number, number] = [4200, 7500];
const LENGTH: [number, number] = [16, 30];
const MAX_ALPHA = 0.32;
/** World units. */
const THICKNESS = 1.6;
/** Kept this close to the boats' path either side, so they stay in the water. */
const SPREAD = 26;
/** Progress kept clear around each avoided stretch. */
const AVOID_MARGIN = 0.006;
/** World units either side used to smooth a glint's angle along the bends. */
const ANGLE_WINDOW = 10;
const RES = 3;

type Glint = {
  image: Phaser.GameObjects.Image;
  progress: number;
  offset: number;
  /** Signed progress per ms. */
  speed: number;
  born: number;
  life: number;
};

export type RiverFlowOptions = {
  /** The river's centre loop (the boats' path), in world units. */
  river: Vector2Like[];
  /** +1 if the water runs in the loop's point order, -1 against it (boatPathConfig.direction). */
  direction: 1 | -1;
  /** Stretches (progress 0-1) with no glints: bridges (drawn into the map, so a glint would show on top) and the waterfall. */
  avoid: OcclusionSegment[];
  depth: number;
};

/**
 * The river's current, very subtly: thin pale glints like the strokes
 * painted on the water, each drifting downstream a little way while it
 * fades in and out, so the water reads as moving without anything busy on
 * top. Nothing is shown with reduced motion.
 */
export class RiverFlow {
  private readonly scene: Phaser.Scene;
  private readonly options: RiverFlowOptions;
  private readonly river: RiverLoop;
  private readonly glints: Glint[] = [];
  private enabled = true;

  constructor(scene: Phaser.Scene, options: RiverFlowOptions) {
    this.scene = scene;
    this.options = options;
    this.river = new RiverLoop(options.river);
    if (!scene.textures.exists('river-glint')) {
      const g = scene.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.fillRoundedRect(0, 0, 40 * RES, 2 * RES, RES);
      g.generateTexture('river-glint', 40 * RES, 2 * RES);
      g.destroy();
    }
    for (let i = 0; i < COUNT; i += 1) {
      const image = scene.add.image(0, 0, 'river-glint').setDepth(options.depth).setAlpha(0);
      const glint: Glint = { image, progress: 0, offset: 0, speed: 0, born: 0, life: 1 };
      // Staggered, so they don't all fade in together on the first frame.
      this.respawn(glint, scene.time.now - Math.random() * LIFE_MS[1]);
      this.glints.push(glint);
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.glints.forEach((glint) => glint.image.setVisible(false));
  }

  update(now: number, delta: number): void {
    if (!this.enabled) return;
    this.glints.forEach((glint) => {
      const age = now - glint.born;
      if (age > glint.life) {
        this.respawn(glint, now);
        return;
      }
      glint.progress += glint.speed * delta;
      const at = this.river.sample(glint.progress);
      const before = this.river.sample(glint.progress - ANGLE_WINDOW / this.river.length);
      const after = this.river.sample(glint.progress + ANGLE_WINDOW / this.river.length);
      const angle = Math.atan2(after.y - before.y, after.x - before.x);
      glint.image
        .setVisible(true)
        .setPosition(at.x - Math.sin(angle) * glint.offset, at.y + Math.cos(angle) * glint.offset)
        .setRotation(angle)
        .setAlpha(Math.sin((age / glint.life) * Math.PI) * MAX_ALPHA);
    });
  }

  destroy(): void {
    this.glints.forEach((glint) => glint.image.destroy());
    this.glints.length = 0;
  }

  private respawn(glint: Glint, now: number): void {
    const view = this.scene.cameras.main.worldView;
    const life = Phaser.Math.Between(LIFE_MS[0], LIFE_MS[1]);
    const speed = (Phaser.Math.FloatBetween(SPEED[0], SPEED[1]) / 1000 / this.river.length) * this.options.direction;
    // Prefer somewhere on screen; anywhere clear will do otherwise.
    let progress = Math.random();
    for (let tries = 0; tries < 12; tries += 1) {
      const candidate = Math.random();
      if (!this.isClear(candidate, speed * life)) continue;
      progress = candidate;
      const at = this.river.sample(candidate);
      if (view.width > 0 && Phaser.Geom.Rectangle.Contains(view, at.x, at.y)) break;
    }
    glint.progress = progress;
    glint.offset = Phaser.Math.FloatBetween(-SPREAD, SPREAD);
    glint.speed = speed;
    glint.born = now;
    glint.life = this.isClear(progress, speed * life) ? life : 0;
    glint.image.setScale(Phaser.Math.FloatBetween(LENGTH[0], LENGTH[1]) / (40 * RES), THICKNESS / (2 * RES));
    glint.image.setAlpha(0);
  }

  /** Is the whole drift, from `from` over `span` (signed progress), clear of every avoided stretch? */
  private isClear(from: number, span: number): boolean {
    for (let i = 0; i <= 4; i += 1) {
      const p = Phaser.Math.Wrap(from + (span * i) / 4, 0, 1);
      if (this.options.avoid.some((seg) => p > seg.start - AVOID_MARGIN && p < seg.end + AVOID_MARGIN)) return false;
    }
    return true;
  }
}
