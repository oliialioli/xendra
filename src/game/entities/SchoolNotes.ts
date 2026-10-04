import Phaser from 'phaser';
import type { Vector2Like } from '../../types/content';

const NOTE_KEYS = ['school-note-eighth', 'school-note-beamed'] as const;
/** Texture px per world unit (crisp on retina). */
const RES = 4;
/** Texture frame, world units. */
const FRAME = 14;
/** On-screen height of a note, world units, as it leaves the window... */
const START_SIZE = 11;
/** ...and as it fades out up above. */
const END_SIZE = 19;
/** Time between notes while the school is active (ms, random within). */
const NOTE_EVERY: [number, number] = [380, 680];
/** The school's blue (the music panel on its façade). */
const INK = 0x3f63a8;
const OUTLINE = 0xf6f1e4;

const v = (x: number, y: number) => new Phaser.Math.Vector2(x, y);

/** A quaver and a pair of beamed quavers, drawn in the school's blue with a pale rim so they read over roof and grass. */
function ensureNoteTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists(NOTE_KEYS[0])) return;
  const draw = (g: Phaser.GameObjects.Graphics, color: number, grow: number, beamed: boolean) => {
    g.fillStyle(color, 1);
    const head = (x: number, y: number) => {
      g.fillEllipse(x, y, 4.6 + grow * 2, 3.4 + grow * 2);
    };
    const stem = (x: number, top: number, bottom: number) => g.fillRect(x - 0.55 - grow, top - grow, 1.1 + grow * 2, bottom - top + grow * 2);
    if (beamed) {
      head(3.4, 11.2);
      head(10.2, 10);
      stem(5.3, 2.6, 11);
      stem(12.1, 1.4, 9.8);
      // The beam joining the two stems.
      g.fillPoints(
        [
          v(4.8 - grow, 2.4 - grow),
          v(12.6 + grow, 1.2 - grow),
          v(12.6 + grow, 3.6 + grow),
          v(4.8 - grow, 4.8 + grow),
        ],
        true,
      );
    } else {
      head(5, 11);
      stem(7, 1.6, 10.8);
      // The flag, curling down off the top of the stem.
      g.fillPoints(
        [
          v(6.5 - grow, 1.4 - grow),
          v(8 + grow, 1.4 - grow),
          v(11.6 + grow, 5),
          v(10.6 + grow, 8.2 + grow),
          v(9.6, 8.4),
          v(10, 5.8),
          v(7.4, 4.4 + grow),
        ],
        true,
      );
    }
  };
  NOTE_KEYS.forEach((key, i) => {
    const g = scene.add.graphics();
    g.setScale(RES);
    draw(g, OUTLINE, 0.7, i === 1);
    draw(g, INK, 0, i === 1);
    g.generateTexture(key, FRAME * RES, FRAME * RES);
    g.destroy();
  });
}

export type SchoolNotesOptions = {
  /** World points of the windows the notes come out of. */
  windows: Vector2Like[];
  depth: number;
  isReducedMotion: () => boolean;
};

/**
 * The music school's active state: while it's the landmark that can be
 * opened (when the rehearsal is heard), music notes float out of its
 * windows, swaying as they rise and fading away. Stopping lets the last
 * ones finish. Nothing with reduced motion.
 */
export class SchoolNotes {
  private readonly scene: Phaser.Scene;
  private readonly options: SchoolNotesOptions;
  private active = false;
  private timer: Phaser.Time.TimerEvent | null = null;
  private notes = new Set<Phaser.GameObjects.Image>();

  constructor(scene: Phaser.Scene, options: SchoolNotesOptions) {
    this.scene = scene;
    this.options = options;
    ensureNoteTextures(scene);
  }

  /** Call once per frame with whether the school is active (the map's nearest openable landmark). */
  update(active: boolean): void {
    if (active === this.active) return;
    this.active = active;
    this.timer?.remove();
    this.timer = null;
    if (!active || this.options.isReducedMotion()) return;
    this.note();
    this.scheduleNext(220);
  }

  private scheduleNext(delay: number): void {
    this.timer = this.scene.time.delayedCall(delay, () => {
      if (!this.active) return;
      this.note();
      this.scheduleNext(Phaser.Math.Between(...NOTE_EVERY));
    });
  }

  private note(): void {
    const { windows, depth } = this.options;
    const from = Phaser.Utils.Array.GetRandom(windows);
    const note = this.scene.add.image(from.x + Phaser.Math.FloatBetween(-4, 4), from.y, Phaser.Utils.Array.GetRandom([...NOTE_KEYS]));
    const start = START_SIZE / FRAME / RES;
    const end = (END_SIZE / FRAME / RES) * Phaser.Math.FloatBetween(0.85, 1.1);
    note.setDepth(depth).setScale(start).setAlpha(0).setAngle(Phaser.Math.Between(-12, 12));
    this.notes.add(note);

    const life = Phaser.Math.Between(1900, 2600);
    const rise = Phaser.Math.FloatBetween(60, 90);
    const drift = Phaser.Math.FloatBetween(-18, 18);
    const sway = Phaser.Math.FloatBetween(4, 7) * (Math.random() < 0.5 ? -1 : 1);
    const startX = note.x;
    const startY = note.y;
    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: life,
      onUpdate: (tween) => {
        const t = tween.getValue() ?? 0;
        const eased = 1 - (1 - t) ** 2;
        note.setPosition(startX + drift * t + Math.sin(t * Math.PI * 2.2) * sway, startY - rise * eased);
        note.setScale(start + (end - start) * eased);
        note.setAngle(Math.sin(t * Math.PI * 2.2) * 14);
        note.setAlpha(Math.min(1, t / 0.12) * Math.min(1, (1 - t) / 0.4));
      },
      onComplete: () => {
        this.notes.delete(note);
        note.destroy();
      },
    });
  }

  destroy(): void {
    this.timer?.remove();
    this.notes.forEach((note) => note.destroy());
    this.notes.clear();
  }
}
