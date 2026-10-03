import Phaser from 'phaser';
import type { Vector2Like } from '../../types/content';

const PUFF_KEY = 'train-steam-puff';
/** Texture size of one puff (px); drawn at PUFF_START..PUFF_END of that, in world units. */
const PUFF_PX = 64;
const PUFF_START = 0.5;
/** Time between puffs while the train is active (ms, random within). */
const PUFF_EVERY: [number, number] = [320, 460];
/** The first chuffs when it comes alive, closer together. */
const START_BURST = 3;

/** A soft round cloud: warm white, fading out to its edge. */
function ensurePuffTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(PUFF_KEY)) return;
  const canvas = scene.textures.createCanvas(PUFF_KEY, PUFF_PX, PUFF_PX);
  if (!canvas) return;
  const ctx = canvas.getContext();
  const r = PUFF_PX / 2;
  const glow = ctx.createRadialGradient(r, r, 0, r, r, r);
  glow.addColorStop(0, 'rgba(252, 250, 245, 1)');
  glow.addColorStop(0.45, 'rgba(240, 237, 230, 0.9)');
  // A slightly greyer rim, so the cloud reads against the pale grass.
  glow.addColorStop(0.75, 'rgba(206, 204, 198, 0.45)');
  glow.addColorStop(1, 'rgba(206, 204, 198, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, PUFF_PX, PUFF_PX);
  canvas.refresh();
}

export type TrainSteamOptions = {
  /** World point of the chimney's mouth. */
  chimney: Vector2Like;
  /** World units per texture pixel of the train sprite, to size the puffs to its chimney. */
  scale: number;
  depth: number;
  isReducedMotion: () => boolean;
};

/**
 * The train's active state: while it's the landmark that can be opened, its
 * chimney puffs steam -- a quick "chuff-chuff" as it comes alive, then a
 * steady puff every so often. Each cloud swells as it rises and drifts back
 * over the carriages, fading out. Stopping just lets the last clouds finish.
 * Nothing with reduced motion.
 */
export class TrainSteam {
  private readonly scene: Phaser.Scene;
  private readonly options: TrainSteamOptions;
  private active = false;
  private timer: Phaser.Time.TimerEvent | null = null;
  private puffs = new Set<Phaser.GameObjects.Image>();

  constructor(scene: Phaser.Scene, options: TrainSteamOptions) {
    this.scene = scene;
    this.options = options;
    ensurePuffTexture(scene);
  }

  /** Call once per frame with whether the train is active (the map's nearest openable landmark). */
  update(active: boolean): void {
    if (active === this.active) return;
    this.active = active;
    this.timer?.remove();
    this.timer = null;
    if (!active || this.options.isReducedMotion()) return;

    for (let i = 0; i < START_BURST; i += 1) {
      this.scene.time.delayedCall(i * 170, () => this.puff(1.15));
    }
    this.scheduleNext(START_BURST * 170 + 200);
  }

  private scheduleNext(delay: number): void {
    this.timer = this.scene.time.delayedCall(delay, () => {
      if (!this.active) return;
      this.puff(1);
      this.scheduleNext(Phaser.Math.Between(...PUFF_EVERY));
    });
  }

  private puff(strength: number): void {
    const { chimney, scale, depth } = this.options;
    // Sized to the chimney: the texture is PUFF_PX wide, the chimney ~70 px of the train's art.
    const unit = (70 * scale) / PUFF_PX;
    const puff = this.scene.add.image(chimney.x + Phaser.Math.FloatBetween(-2, 2), chimney.y, PUFF_KEY);
    puff.setDepth(depth);
    puff.setScale(unit * PUFF_START * strength);
    puff.setAlpha(1);
    puff.setAngle(Phaser.Math.Between(0, 360));
    this.puffs.add(puff);

    const life = Phaser.Math.Between(1700, 2400);
    this.scene.tweens.add({
      targets: puff,
      // Up, and back over the carriages (the engine faces down-right).
      x: chimney.x - Phaser.Math.FloatBetween(18, 40),
      y: chimney.y - Phaser.Math.FloatBetween(55, 85) * strength,
      scale: unit * Phaser.Math.FloatBetween(3, 4) * strength,
      angle: puff.angle + Phaser.Math.Between(-40, 40),
      duration: life,
      ease: 'Sine.easeOut',
    });
    this.scene.tweens.add({
      targets: puff,
      alpha: 0,
      delay: life * 0.4,
      duration: life * 0.6,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.puffs.delete(puff);
        puff.destroy();
      },
    });
  }

  destroy(): void {
    this.timer?.remove();
    this.puffs.forEach((puff) => {
      this.scene.tweens.killTweensOf(puff);
      puff.destroy();
    });
    this.puffs.clear();
  }
}
