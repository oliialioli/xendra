import { GESTURE } from './config';
import type { GameInput } from './engine';

const LEFT_KEYS = new Set(['ArrowLeft', 'KeyA']);
const RIGHT_KEYS = new Set(['ArrowRight', 'KeyD']);
const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW']);

/** Keys the game uses, whose browser defaults (scrolling) are blocked while playing. */
export function isGameKey(code: string): boolean {
  return LEFT_KEYS.has(code) || RIGHT_KEYS.has(code) || JUMP_KEYS.has(code);
}

/** A jump from a tap or flick counts as held this long, so it isn't cut short into a hop. */
const TOUCH_JUMP_HOLD_MS = 260;

type Gesture = {
  startX: number;
  startY: number;
  startT: number;
  /** Furthest point reached in the current direction; turning back past it by the hysteresis flips direction. */
  anchorX: number;
  dir: -1 | 0 | 1;
  dragging: boolean;
  jumped: boolean;
};

export type TouchButton = 'left' | 'right' | 'jump';

/**
 * Turns keys, touch gestures and the on-screen buttons into one GameInput.
 *
 * Gestures, per finger: dragging sideways past a threshold moves that way
 * (and holds it while the finger stays down, turning round when it heads
 * back); a quick tap, or a quick flick up, jumps. A drag is never a tap,
 * so lifting the finger after moving never jumps. Several fingers work at
 * once: one can drag while another taps to jump.
 */
export class InputController {
  private keys = new Set<string>();
  private gestures = new Map<number, Gesture>();
  private buttons = new Set<TouchButton>();
  private jumpQueued = false;
  private touchJumpUntil = 0;

  keyDown(code: string): void {
    if (JUMP_KEYS.has(code) && !this.isKeyJumpHeld()) this.jumpQueued = true;
    this.keys.add(code);
  }

  keyUp(code: string): void {
    this.keys.delete(code);
  }

  pointerDown(id: number, x: number, y: number, now: number): void {
    this.gestures.set(id, { startX: x, startY: y, startT: now, anchorX: x, dir: 0, dragging: false, jumped: false });
  }

  pointerMove(id: number, x: number, y: number, now: number): void {
    const g = this.gestures.get(id);
    if (!g) return;
    const dx = x - g.startX;
    const dy = y - g.startY;

    if (!g.dragging && !g.jumped && -dy >= GESTURE.swipeUpDistance && now - g.startT <= GESTURE.swipeUpMaxMs && -dy > Math.abs(dx)) {
      g.jumped = true;
      this.touchJump(now);
    }
    if (!g.dragging && Math.abs(dx) >= GESTURE.dragThreshold && Math.abs(dx) >= Math.abs(dy) * 0.8) {
      g.dragging = true;
      g.dir = dx > 0 ? 1 : -1;
      g.anchorX = x;
    }
    if (g.dragging) {
      if (g.dir > 0) {
        if (x > g.anchorX) g.anchorX = x;
        else if (x < g.anchorX - GESTURE.dragHysteresis) {
          g.dir = -1;
          g.anchorX = x;
        }
      } else if (x < g.anchorX) {
        g.anchorX = x;
      } else if (x > g.anchorX + GESTURE.dragHysteresis) {
        g.dir = 1;
        g.anchorX = x;
      }
    }
  }

  pointerUp(id: number, x: number, y: number, now: number): void {
    const g = this.gestures.get(id);
    this.gestures.delete(id);
    if (!g || g.dragging || g.jumped) return;
    const moved = Math.hypot(x - g.startX, y - g.startY);
    if (moved < GESTURE.dragThreshold && now - g.startT <= GESTURE.tapMaxMs) this.touchJump(now);
  }

  pointerCancel(id: number): void {
    this.gestures.delete(id);
  }

  /** The jump button is held like a key: holding it longer jumps higher. */
  buttonDown(button: TouchButton): void {
    if (button === 'jump' && !this.buttons.has('jump')) this.jumpQueued = true;
    this.buttons.add(button);
  }

  buttonUp(button: TouchButton): void {
    this.buttons.delete(button);
  }

  /** The input for this frame. The jump press stays queued until `consumeJump()` (i.e. until a step has used it). */
  read(now: number): GameInput {
    const touchDir = this.touchDirection();
    return {
      left: this.has(LEFT_KEYS) || this.buttons.has('left') || touchDir < 0,
      right: this.has(RIGHT_KEYS) || this.buttons.has('right') || touchDir > 0,
      jumpHeld: this.isKeyJumpHeld() || this.buttons.has('jump') || now < this.touchJumpUntil,
      jumpPressed: this.jumpQueued,
    };
  }

  consumeJump(): void {
    this.jumpQueued = false;
  }

  /** Lets go of everything (pause, losing focus, leaving the game). */
  reset(): void {
    this.keys.clear();
    this.gestures.clear();
    this.buttons.clear();
    this.jumpQueued = false;
    this.touchJumpUntil = 0;
  }

  private touchJump(now: number): void {
    this.jumpQueued = true;
    this.touchJumpUntil = now + TOUCH_JUMP_HOLD_MS;
  }

  /** The direction of the most recently started drag that's still going. */
  private touchDirection(): -1 | 0 | 1 {
    let dir: -1 | 0 | 1 = 0;
    let latest = -Infinity;
    this.gestures.forEach((g) => {
      if (g.dragging && g.startT >= latest) {
        latest = g.startT;
        dir = g.dir;
      }
    });
    return dir;
  }

  private has(set: Set<string>): boolean {
    for (const key of set) if (this.keys.has(key)) return true;
    return false;
  }

  private isKeyJumpHeld(): boolean {
    return this.has(JUMP_KEYS);
  }
}
