import Phaser from 'phaser';

type AmbientOptions = {
  reducedMotion: boolean;
  campfirePosition: { x: number; y: number };
  stageLightPositions: { x: number; y: number }[];
  riverSparklePoints: { x: number; y: number }[];
  windLeafSpawnPoints: { x: number; y: number }[];
};

/**
 * Small, decoupled ambient effects layer: water sparkle, wind-blown leaves,
 * campfire flicker, proximity-triggered stage lights, and occasional rain.
 * Every effect is cheap (tweens + a handful of sprites, no shaders/blur) and
 * is skipped entirely when `reducedMotion` is true. The scene already pauses
 * the whole game loop when the tab is hidden (Phaser's default `pauseOnBlur`),
 * so no extra visibility handling is needed here.
 */
export class AmbientEffectsSystem {
  private scene: Phaser.Scene;
  private reducedMotion: boolean;
  private stageLights: Phaser.GameObjects.Arc[] = [];
  private rainEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private rainTimer: Phaser.Time.TimerEvent | null = null;
  private activeTweens: Phaser.Tweens.Tween[] = [];

  constructor(scene: Phaser.Scene, options: AmbientOptions) {
    this.scene = scene;
    this.reducedMotion = options.reducedMotion;

    this.ensureTextures();

    if (!this.reducedMotion) {
      this.createRiverSparkles(options.riverSparklePoints);
      this.createLeaves(options.windLeafSpawnPoints);
      this.createCampfire(options.campfirePosition);
      this.scheduleOccasionalRain();
    }

    this.createStageLights(options.stageLightPositions);
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
    if (reduced) {
      this.activeTweens.forEach((t) => t.stop());
      this.rainTimer?.remove();
      this.rainEmitter?.stop();
    }
  }

  setStageActive(active: boolean): void {
    this.stageLights.forEach((light) => {
      this.scene.tweens.add({
        targets: light,
        alpha: active ? 0.85 : 0.15,
        duration: this.reducedMotion ? 1 : 500,
      });
    });
  }

  private ensureTextures(): void {
    if (!this.scene.textures.exists('ambient-leaf')) {
      const g = this.scene.add.graphics();
      g.fillStyle(0x7c9070, 0.9);
      g.fillEllipse(4, 4, 8, 4);
      g.generateTexture('ambient-leaf', 8, 8);
      g.destroy();
    }
    if (!this.scene.textures.exists('ambient-rain')) {
      const g = this.scene.add.graphics();
      g.fillStyle(0x6f97a0, 0.6);
      g.fillRect(0, 0, 2, 12);
      g.generateTexture('ambient-rain', 2, 12);
      g.destroy();
    }
    if (!this.scene.textures.exists('ambient-spark')) {
      const g = this.scene.add.graphics();
      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(3, 3, 3);
      g.generateTexture('ambient-spark', 6, 6);
      g.destroy();
    }
  }

  private createRiverSparkles(points: { x: number; y: number }[]): void {
    points.forEach((point, index) => {
      const sparkle = this.scene.add.image(point.x, point.y, 'ambient-spark');
      sparkle.setAlpha(0.25);
      sparkle.setDepth(1);
      const tween = this.scene.tweens.add({
        targets: sparkle,
        alpha: { from: 0.15, to: 0.55 },
        duration: 1800 + index * 130,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.activeTweens.push(tween);
    });
  }

  private createLeaves(spawnPoints: { x: number; y: number }[]): void {
    spawnPoints.forEach((point, index) => {
      const emitter = this.scene.add.particles(point.x, point.y, 'ambient-leaf', {
        speed: { min: 20, max: 40 },
        angle: { min: 160, max: 200 },
        lifespan: 6000,
        alpha: { start: 0.7, end: 0 },
        scale: { start: 1, end: 0.6 },
        frequency: 2600 + index * 400,
        rotate: { min: 0, max: 360 },
        quantity: 1,
      });
      emitter.setDepth(2);
    });
  }

  private createCampfire(position: { x: number; y: number }): void {
    const flame = this.scene.add.ellipse(position.x, position.y - 6, 14, 22, 0xc99a3e, 0.9);
    flame.setDepth(position.y);
    const flicker = this.scene.tweens.add({
      targets: flame,
      scaleY: { from: 0.8, to: 1.15 },
      alpha: { from: 0.75, to: 1 },
      duration: 260,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.activeTweens.push(flicker);

    const smoke = this.scene.add.particles(position.x, position.y - 20, 'ambient-spark', {
      speed: { min: 6, max: 14 },
      angle: { min: 260, max: 280 },
      lifespan: 2200,
      alpha: { start: 0.25, end: 0 },
      scale: { start: 0.6, end: 1.4 },
      tint: 0x9a9284,
      frequency: 500,
    });
    smoke.setDepth(position.y + 1);
  }

  private createStageLights(positions: { x: number; y: number }[]): void {
    this.stageLights = positions.map((pos) => {
      const light = this.scene.add.circle(pos.x, pos.y, 10, 0xc99a3e, 0.15);
      light.setDepth(pos.y);
      return light;
    });
  }

  private scheduleOccasionalRain(): void {
    const scheduleNext = () => {
      const delay = Phaser.Math.Between(45000, 90000);
      this.rainTimer = this.scene.time.delayedCall(delay, () => {
        this.playRainBurst();
        scheduleNext();
      });
    };
    scheduleNext();
  }

  private playRainBurst(): void {
    if (this.reducedMotion) return;
    const cam = this.scene.cameras.main;
    this.rainEmitter = this.scene.add.particles(0, 0, 'ambient-rain', {
      x: { min: cam.worldView.x, max: cam.worldView.right },
      y: cam.worldView.y - 20,
      lifespan: 900,
      speedY: { min: 400, max: 500 },
      speedX: { min: -20, max: -10 },
      quantity: 3,
      frequency: 20,
      alpha: { start: 0.5, end: 0.1 },
    });
    this.rainEmitter.setDepth(5000);
    this.scene.time.delayedCall(5000, () => {
      this.rainEmitter?.stop();
      this.scene.time.delayedCall(1000, () => this.rainEmitter?.destroy());
    });
  }

  destroy(): void {
    this.activeTweens.forEach((t) => t.stop());
    this.rainTimer?.remove();
    this.rainEmitter?.destroy();
  }
}
