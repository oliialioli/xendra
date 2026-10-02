import Phaser from 'phaser';
import type { SnailDirection } from '../utils/placeholderTextures';
import { SNAIL_TEXTURE_RES } from '../utils/snailArt';

export const SNAIL_SPEED = 170;

/** The textures are drawn at SNAIL_TEXTURE_RES px per world unit; this shows them at their world size. */
const BASE_SCALE = 1 / SNAIL_TEXTURE_RES;

/**
 * Placeholder snail entity. Direction textures are looked up by name
 * (`snail-<direction>`) so a future spritesheet swap only changes
 * preload/config, not this class.
 */
export class Snail {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private facing: SnailDirection = 'down';
  private bounceTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, 'snail-down');
    this.sprite.setDepth(y);
    this.sprite.setScale(BASE_SCALE);
    this.sprite.setCollideWorldBounds(true);
    // In texture pixels (the body scales with the sprite): a 28x20-unit footprint under the shell.
    const r = SNAIL_TEXTURE_RES;
    this.sprite.body?.setSize(28 * r, 20 * r).setOffset(18 * r, 30 * r);
  }

  get position(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  /** Moves the snail straight to a world point, standing still and facing the viewer. */
  placeAt(x: number, y: number): void {
    this.sprite.body?.reset(x, y);
    this.sprite.setDepth(y);
    this.bounceTween?.stop();
    this.sprite.setScale(BASE_SCALE, BASE_SCALE);
    this.facing = 'down';
    this.sprite.setTexture('snail-down');
  }

  setVelocity(x: number, y: number): void {
    this.sprite.setVelocity(x, y);
    this.sprite.setDepth(this.sprite.y);

    const moving = x !== 0 || y !== 0;
    if (moving) {
      this.updateFacing(x, y);
      this.playWalkFeedback();
    } else {
      this.bounceTween?.stop();
      this.sprite.setScale(BASE_SCALE, BASE_SCALE);
    }
  }

  private updateFacing(x: number, y: number): void {
    let next: SnailDirection = this.facing;
    if (Math.abs(x) > Math.abs(y)) {
      next = x > 0 ? 'right' : 'left';
    } else if (y !== 0) {
      next = y > 0 ? 'down' : 'up';
    }
    if (next !== this.facing) {
      this.facing = next;
      this.sprite.setTexture(`snail-${next}`);
    }
  }

  private playWalkFeedback(): void {
    if (this.bounceTween?.isPlaying()) return;
    this.bounceTween = this.sprite.scene.tweens.add({
      targets: this.sprite,
      scaleX: { from: BASE_SCALE, to: BASE_SCALE * 1.06 },
      scaleY: { from: BASE_SCALE, to: BASE_SCALE * 0.94 },
      duration: 220,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  playDiscoveryPulse(): void {
    this.sprite.scene.tweens.add({
      targets: this.sprite,
      scale: { from: BASE_SCALE, to: BASE_SCALE * 1.25 },
      duration: 180,
      yoyo: true,
      ease: 'Sine.easeOut',
    });
  }

  destroy(): void {
    this.bounceTween?.stop();
    this.sprite.destroy();
  }
}
