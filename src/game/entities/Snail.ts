import Phaser from 'phaser';
import type { SnailDirection } from '../utils/placeholderTextures';

export const SNAIL_SPEED = 170;

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
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body?.setSize(28, 20).setOffset(18, 30);
  }

  get position(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
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
      this.sprite.setScale(1, 1);
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
      scaleX: { from: 1, to: 1.06 },
      scaleY: { from: 1, to: 0.94 },
      duration: 220,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  playDiscoveryPulse(): void {
    this.sprite.scene.tweens.add({
      targets: this.sprite,
      scale: { from: 1, to: 1.25 },
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
