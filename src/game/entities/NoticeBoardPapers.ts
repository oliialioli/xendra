import Phaser from 'phaser';
import type { Vector2Like } from '../../types/content';

/** Snail distance (world units, from the board's anchor) at which papers start coming loose... */
const START_RADIUS = 180;
/** ...and stop again, a little further out. */
const STOP_RADIUS = 230;
/** How often a paper comes loose while the snail is near (ms). */
const RELEASE_EVERY_MS = 450;
const MAX_IN_FLIGHT = 7;

/** Paper colours matching the notes pinned on tablon-anuncios.webp: cream, salmon, sage. */
const PAPERS = [
  { key: 'paper-cream', fill: 0xf3eedf, line: 0xb9b2a0 },
  { key: 'paper-salmon', fill: 0xe7b7a2, line: 0xc4846c },
  { key: 'paper-sage', fill: 0xbfc8a6, line: 0x8f9a76 },
];

function ensurePaperTextures(scene: Phaser.Scene): void {
  PAPERS.forEach(({ key, fill, line }) => {
    if (scene.textures.exists(key)) return;
    const g = scene.add.graphics();
    g.fillStyle(fill, 1);
    g.fillRect(0, 0, 18, 23);
    g.fillStyle(line, 1);
    g.fillRect(3, 5, 12, 2);
    g.fillRect(3, 10, 9, 2);
    g.fillRect(3, 15, 11, 2);
    g.generateTexture(key, 18, 23);
    g.destroy();
  });
}

export type NoticeBoardPapersOptions = {
  /** The board's anchor (bottom-centre of its legs), for the distance check. */
  anchor: Vector2Like;
  /** Where papers come loose from, relative to the anchor: the board's cork face. */
  face: { x0: number; x1: number; y0: number; y1: number };
  depth: number;
  isReducedMotion: () => boolean;
};

/**
 * The notice board's active state: while the snail is near, a paper every
 * so often comes loose from the board and flutters off on the breeze --
 * spinning, flipping over (a squashed scaleX) and fading as it drifts away.
 * Nothing flies with reduced motion.
 */
export class NoticeBoardPapers {
  private readonly scene: Phaser.Scene;
  private readonly options: NoticeBoardPapersOptions;
  private active = false;
  private sinceRelease = 0;
  private inFlight = new Set<Phaser.GameObjects.Image>();

  constructor(scene: Phaser.Scene, options: NoticeBoardPapersOptions) {
    this.scene = scene;
    this.options = options;
    ensurePaperTextures(scene);
  }

  /** Call once per frame with the snail's position and the frame's delta (ms). */
  update(snail: Vector2Like, delta: number): void {
    const { anchor, isReducedMotion } = this.options;
    const distance = Math.hypot(snail.x - anchor.x, snail.y - anchor.y);
    this.active = !isReducedMotion() && (this.active ? distance < STOP_RADIUS : distance < START_RADIUS);
    if (!this.active) {
      this.sinceRelease = RELEASE_EVERY_MS * 0.6; // the first one goes soon after arriving
      return;
    }
    this.sinceRelease += delta;
    if (this.sinceRelease >= RELEASE_EVERY_MS && this.inFlight.size < MAX_IN_FLIGHT) {
      this.sinceRelease = 0;
      this.release();
    }
  }

  private release(): void {
    const { anchor, face, depth } = this.options;
    const paper = Phaser.Utils.Array.GetRandom(PAPERS);
    const x = anchor.x + Phaser.Math.FloatBetween(face.x0, face.x1);
    const y = anchor.y + Phaser.Math.FloatBetween(face.y0, face.y1);
    const sprite = this.scene.add.image(x, y, paper.key);
    sprite.setDepth(depth + 1);
    sprite.setAngle(Phaser.Math.Between(-20, 20));
    this.inFlight.add(sprite);

    // Drift: mostly with the breeze to the right, rising a little before settling down.
    const driftX = Phaser.Math.FloatBetween(70, 150) * (Math.random() < 0.8 ? 1 : -1);
    const duration = Phaser.Math.Between(1800, 2600);
    this.scene.tweens.add({
      targets: sprite,
      x: x + driftX,
      duration,
      ease: 'Sine.easeOut',
    });
    this.scene.tweens.add({
      targets: sprite,
      y: { from: y, to: y - Phaser.Math.FloatBetween(14, 30) },
      duration: duration * 0.35,
      ease: 'Sine.easeOut',
      yoyo: false,
      onComplete: () => {
        this.scene.tweens.add({
          targets: sprite,
          y: y + Phaser.Math.FloatBetween(10, 40),
          duration: duration * 0.65,
          ease: 'Sine.easeIn',
        });
      },
    });
    // Tumbling: a slow spin plus a quick flip (scaleX through zero and back).
    this.scene.tweens.add({
      targets: sprite,
      angle: sprite.angle + Phaser.Math.Between(240, 520) * (driftX > 0 ? 1 : -1),
      duration,
      ease: 'Linear',
    });
    this.scene.tweens.add({
      targets: sprite,
      scaleX: { from: 1, to: -1 },
      duration: Phaser.Math.Between(260, 420),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.scene.tweens.add({
      targets: sprite,
      alpha: 0,
      delay: duration * 0.6,
      duration: duration * 0.4,
      onComplete: () => {
        this.scene.tweens.killTweensOf(sprite);
        this.inFlight.delete(sprite);
        sprite.destroy();
      },
    });
  }

  destroy(): void {
    this.inFlight.forEach((sprite) => {
      this.scene.tweens.killTweensOf(sprite);
      sprite.destroy();
    });
    this.inFlight.clear();
  }
}
