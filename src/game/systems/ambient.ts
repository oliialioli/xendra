import Phaser from 'phaser';

type AmbientOptions = {
  reducedMotion: boolean;
  stageLightPositions: { x: number; y: number }[];
  riverSparklePoints: { x: number; y: number }[];
};

/**
 * Small, decoupled ambient effects layer: water sparkle and proximity-
 * triggered stage lights (rain and wind live in systems/weather.ts, the
 * campfire in entities/Campfire.ts).
 * Every effect is cheap (tweens + a handful of sprites, no shaders/blur) and
 * is skipped entirely when `reducedMotion` is true. The scene already pauses
 * the whole game loop when the tab is hidden (Phaser's default `pauseOnBlur`),
 * so no extra visibility handling is needed here.
 */
export class AmbientEffectsSystem {
  private scene: Phaser.Scene;
  private reducedMotion: boolean;
  private stageLights: Phaser.GameObjects.Arc[] = [];
  private activeTweens: Phaser.Tweens.Tween[] = [];

  constructor(scene: Phaser.Scene, options: AmbientOptions) {
    this.scene = scene;
    this.reducedMotion = options.reducedMotion;

    this.ensureTextures();

    if (!this.reducedMotion) {
      this.createRiverSparkles(options.riverSparklePoints);
    }

    this.createStageLights(options.stageLightPositions);
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
    if (reduced) {
      this.activeTweens.forEach((t) => t.stop());
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

  private createStageLights(positions: { x: number; y: number }[]): void {
    this.stageLights = positions.map((pos) => {
      const light = this.scene.add.circle(pos.x, pos.y, 10, 0xc99a3e, 0.15);
      light.setDepth(pos.y);
      return light;
    });
  }

  destroy(): void {
    this.activeTweens.forEach((t) => t.stop());
  }
}
