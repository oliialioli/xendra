import Phaser from 'phaser';
import type { Vector2Like } from '../../types/content';

/** Snail distance (world units, from the kiosk's anchor) at which the vendor pops out... */
const SHOW_RADIUS = 180;
/** ...and the larger distance at which he goes back in. */
const HIDE_RADIUS = 230;
/** How far (texture px) he rises from as he leans out. */
const RISE_PX = 12;

export type KioskVendorOptions = {
  /** The kiosk's anchor, for the distance check. */
  anchor: Vector2Like;
  /** World point of the window textures' top-left corner (they share it). */
  windowTopLeft: Vector2Like;
  /** World point of the waving arm's shoulder pivot. */
  shoulder: Vector2Like;
  /** World units per texture pixel (the kiosk sprite's own scale). */
  scale: number;
  keys: { window: string; body: string; arm: string };
  /** The arm texture's shoulder, as an origin fraction. */
  armOrigin: Vector2Like;
  depth: number;
  isReducedMotion: () => boolean;
  /** Called each time he leans out to greet (once per approach) -- e.g. to play his "Aupa, egunon!". */
  onGreet?: () => void;
};

/**
 * The kiosk's active state: walk up and its side window opens (the glass
 * panes give way to the dark interior), the vendor leans out onto the sill
 * and waves until you walk away again, when he ducks back in. His art is
 * three textures on the kiosk's own pixel grid -- the open window, the
 * vendor, and his waving arm, which swings about the shoulder. With reduced
 * motion he just appears, without waving.
 */
export class KioskVendor {
  private readonly scene: Phaser.Scene;
  private readonly options: KioskVendorOptions;
  private readonly windowImage: Phaser.GameObjects.Image;
  private readonly body: Phaser.GameObjects.Image;
  private readonly arm: Phaser.GameObjects.Image;
  private shown = false;
  private wave: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, options: KioskVendorOptions) {
    this.scene = scene;
    this.options = options;
    const { windowTopLeft, shoulder, scale, keys, armOrigin, depth } = options;

    this.windowImage = scene.add.image(windowTopLeft.x, windowTopLeft.y, keys.window).setOrigin(0, 0);
    this.arm = scene.add.image(shoulder.x, shoulder.y, keys.arm).setOrigin(armOrigin.x, armOrigin.y);
    this.body = scene.add.image(windowTopLeft.x, windowTopLeft.y, keys.body).setOrigin(0, 0);

    [this.windowImage, this.arm, this.body].forEach((image, i) => {
      image.setScale(scale);
      image.setAlpha(0);
      image.setDepth(depth + 0.1 * (i + 1));
    });
  }

  /** Call once per frame with the snail's position. */
  update(snail: Vector2Like): void {
    const { anchor } = this.options;
    const distance = Math.hypot(snail.x - anchor.x, snail.y - anchor.y);
    if (!this.shown && distance < SHOW_RADIUS) this.show();
    else if (this.shown && distance > HIDE_RADIUS) this.hide();
  }

  private get rise(): number {
    return RISE_PX * this.options.scale;
  }

  private show(): void {
    this.shown = true;
    const { windowTopLeft, shoulder, isReducedMotion, onGreet } = this.options;
    onGreet?.();
    this.scene.tweens.killTweensOf([this.windowImage, this.body, this.arm]);

    if (isReducedMotion()) {
      this.windowImage.setAlpha(1);
      this.body.setAlpha(1).setY(windowTopLeft.y);
      this.arm.setAlpha(1).setY(shoulder.y).setAngle(0);
      return;
    }

    this.scene.tweens.add({ targets: this.windowImage, alpha: 1, duration: 220, ease: 'Sine.easeOut' });
    this.body.setY(windowTopLeft.y + this.rise);
    this.arm.setY(shoulder.y + this.rise).setAngle(10);
    this.scene.tweens.add({
      targets: this.body,
      alpha: 1,
      y: windowTopLeft.y,
      delay: 140,
      duration: 460,
      ease: 'Back.easeOut',
    });
    this.scene.tweens.add({
      targets: this.arm,
      alpha: 1,
      y: shoulder.y,
      delay: 140,
      duration: 460,
      ease: 'Back.easeOut',
      onComplete: () => this.startWaving(),
    });
  }

  private startWaving(): void {
    if (!this.shown) return;
    this.arm.setAngle(-16);
    this.wave = this.scene.tweens.add({
      targets: this.arm,
      angle: 14,
      duration: 280,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private hide(): void {
    this.shown = false;
    this.wave?.stop();
    this.wave = null;
    const { windowTopLeft, shoulder, isReducedMotion } = this.options;
    this.scene.tweens.killTweensOf([this.windowImage, this.body, this.arm]);

    if (isReducedMotion()) {
      [this.windowImage, this.body, this.arm].forEach((image) => image.setAlpha(0));
      return;
    }
    this.scene.tweens.add({ targets: this.body, alpha: 0, y: windowTopLeft.y + this.rise, duration: 320, ease: 'Sine.easeIn' });
    this.scene.tweens.add({ targets: this.arm, alpha: 0, y: shoulder.y + this.rise, angle: 0, duration: 320, ease: 'Sine.easeIn' });
    this.scene.tweens.add({ targets: this.windowImage, alpha: 0, delay: 220, duration: 260 });
  }

  destroy(): void {
    this.wave?.stop();
    this.scene.tweens.killTweensOf([this.windowImage, this.body, this.arm]);
    this.windowImage.destroy();
    this.body.destroy();
    this.arm.destroy();
  }
}
