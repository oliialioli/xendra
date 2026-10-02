import Phaser from 'phaser';
import type { Vector2Like } from '../../types/content';

/** Snail distance (world units, from the postbox's anchor) that sets off the burst... */
const TRIGGER_RADIUS = 150;
/** ...and the distance it has to walk away to before coming back sets it off again. */
const REARM_RADIUS = 220;
const LETTER_COUNT = 16;
const LETTER_KEYS = ['letter-plain', 'letter-stamped'];

function ensureLetterTextures(scene: Phaser.Scene): void {
  LETTER_KEYS.forEach((key, i) => {
    if (scene.textures.exists(key)) return;
    const g = scene.add.graphics();
    g.fillStyle(0xfbf8f0, 1);
    g.fillRect(0, 0, 18, 12);
    g.lineStyle(1, 0xbdb5a3, 1);
    g.strokeRect(0.5, 0.5, 17, 11);
    // The envelope's flap.
    g.beginPath();
    g.moveTo(0.5, 0.5);
    g.lineTo(9, 7);
    g.lineTo(17.5, 0.5);
    g.strokePath();
    if (i === 1) {
      g.fillStyle(0xd4553f, 1);
      g.fillRect(13, 2, 3, 3);
    }
    g.generateTexture(key, 18, 12);
    g.destroy();
  });
}

export type PostboxLettersOptions = {
  /** The postbox's anchor (bottom-centre of its plinth): the ground the letters land on. */
  anchor: Vector2Like;
  /** World point of the letter slot. */
  slot: Vector2Like;
  depth: number;
  isReducedMotion: () => boolean;
};

/**
 * The postbox's active state: walk up to it and a burst of letters
 * suddenly shoots out of the slot -- one after another in quick succession,
 * tumbling out to the front and side, landing around its foot, lying there
 * a moment and fading. Fires once per visit; walking away re-arms it.
 * Nothing happens with reduced motion.
 */
export class PostboxLetters {
  private readonly scene: Phaser.Scene;
  private readonly options: PostboxLettersOptions;
  private armed = true;
  private letters = new Set<Phaser.GameObjects.Image>();

  constructor(scene: Phaser.Scene, options: PostboxLettersOptions) {
    this.scene = scene;
    this.options = options;
    ensureLetterTextures(scene);
  }

  /** Call once per frame with the snail's position. */
  update(snail: Vector2Like): void {
    const { anchor, isReducedMotion } = this.options;
    const distance = Math.hypot(snail.x - anchor.x, snail.y - anchor.y);
    if (this.armed && distance < TRIGGER_RADIUS) {
      this.armed = false;
      if (!isReducedMotion()) this.burst();
    } else if (!this.armed && distance > REARM_RADIUS) {
      this.armed = true;
    }
  }

  private burst(): void {
    for (let i = 0; i < LETTER_COUNT; i += 1) {
      this.scene.time.delayedCall(i * Phaser.Math.Between(25, 55), () => this.launch());
    }
  }

  private launch(): void {
    const { anchor, slot, depth } = this.options;
    const letter = this.scene.add.image(slot.x, slot.y, Phaser.Utils.Array.GetRandom(LETTER_KEYS));
    letter.setDepth(depth + 1);
    letter.setAngle(Phaser.Math.Between(-30, 30));
    this.letters.add(letter);

    // Out of the slot towards the front and side, a little hop, then down to the ground.
    const landX = slot.x + Phaser.Math.FloatBetween(-25, 75);
    const landY = anchor.y + Phaser.Math.FloatBetween(-6, 22);
    const peakY = slot.y - Phaser.Math.FloatBetween(8, 26);
    const flight = Phaser.Math.Between(650, 950);

    this.scene.tweens.add({ targets: letter, x: landX, duration: flight, ease: 'Quad.easeOut' });
    this.scene.tweens.add({
      targets: letter,
      y: peakY,
      duration: flight * 0.3,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.scene.tweens.add({ targets: letter, y: landY, duration: flight * 0.7, ease: 'Quad.easeIn' });
      },
    });
    this.scene.tweens.add({
      targets: letter,
      // Lands flat-ish, at whatever angle it happened to settle.
      angle: Phaser.Math.Between(-200, 200),
      duration: flight,
      ease: 'Quad.easeOut',
    });
    this.scene.tweens.add({
      targets: letter,
      alpha: 0,
      delay: flight + Phaser.Math.Between(900, 1600),
      duration: 500,
      onComplete: () => {
        this.letters.delete(letter);
        letter.destroy();
      },
    });
  }

  destroy(): void {
    this.letters.forEach((letter) => {
      this.scene.tweens.killTweensOf(letter);
      letter.destroy();
    });
    this.letters.clear();
  }
}
