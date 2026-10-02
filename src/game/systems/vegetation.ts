import Phaser from 'phaser';
import { VEGETATION, VEGETATION_KIND_SCALE } from '../../content/vegetationConfig';
import {
  VEGETATION_FRAMES,
  VEGETATION_TEXTURE_RES,
  generateVegetationTextures,
  vegetationTextureKey,
  type VegetationKind,
} from '../utils/vegetationArt';

/** How far (degrees) each kind leans with a gust: reeds bend most, trees least. */
const SWAY_DEGREES: Record<VegetationKind, number> = {
  cypress: 2.5,
  tree: 2,
  bush: 1.5,
  reedsSpears: 6,
  reedsCattails: 7,
  reedsCurved: 8,
  reedsBroad: 4,
};
/** Speed the gust's front crosses the island (world units/s), so plants further downwind lean a little later. */
const GUST_FRONT_SPEED = 900;

/**
 * The map's trees, bushes and reeds (see content/vegetationConfig.ts): each
 * one its own sprite, standing on its base point and depth-sorted by it, so
 * the snail walks behind a tree when it's further up the map and in front
 * of it when it's further down. They lean with the wind's gusts (see
 * systems/weather.ts), the lean sweeping across the island from upwind.
 */
export class VegetationSystem {
  private readonly scene: Phaser.Scene;
  private readonly plants: { sprite: Phaser.GameObjects.Image; kind: VegetationKind }[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    generateVegetationTextures(scene);
    VEGETATION.forEach((item) => {
      const frame = VEGETATION_FRAMES[item.kind];
      const sprite = scene.add.image(item.x, item.y, vegetationTextureKey(item.kind));
      sprite.setOrigin(frame.baseX / frame.width, frame.baseY / frame.height);
      sprite.setScale((item.scale * VEGETATION_KIND_SCALE[item.kind]) / VEGETATION_TEXTURE_RES);
      sprite.setFlipX(Boolean(item.flip));
      sprite.setDepth(item.y);
      this.plants.push({ sprite, kind: item.kind });
    });
  }

  /** A gust: every plant leans downwind and back, starting upwind. */
  sway(fromLeft: boolean): void {
    const direction = fromLeft ? 1 : -1;
    const upwindX = fromLeft ? 0 : this.scene.physics.world.bounds.width;
    this.plants.forEach(({ sprite, kind }) => {
      this.scene.tweens.killTweensOf(sprite);
      this.scene.tweens.add({
        targets: sprite,
        angle: direction * SWAY_DEGREES[kind] * Phaser.Math.FloatBetween(0.7, 1.2),
        delay: (Math.abs(sprite.x - upwindX) / GUST_FRONT_SPEED) * 1000,
        duration: Phaser.Math.Between(650, 900),
        yoyo: true,
        repeat: 1,
        ease: 'Sine.easeInOut',
        onComplete: () => sprite.setAngle(0),
      });
    });
  }

  destroy(): void {
    this.plants.forEach(({ sprite }) => {
      this.scene.tweens.killTweensOf(sprite);
      sprite.destroy();
    });
    this.plants.length = 0;
  }
}
