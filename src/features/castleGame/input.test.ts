import { describe, expect, it } from 'vitest';
import { GESTURE } from './config';
import { InputController } from './input';

describe('castle game input', () => {
  it('jumps on a quick tap', () => {
    const input = new InputController();
    input.pointerDown(1, 100, 300, 0);
    input.pointerUp(1, 102, 301, 120);
    expect(input.read(130).jumpPressed).toBe(true);
    expect(input.read(130).jumpHeld).toBe(true); // a full jump, not a hop
  });

  it('moves with a sideways drag, never jumping when the finger lifts', () => {
    const input = new InputController();
    input.pointerDown(1, 100, 300, 0);
    input.pointerMove(1, 100 + GESTURE.dragThreshold + 5, 302, 60);
    expect(input.read(60)).toMatchObject({ right: true, left: false });
    // Holding still keeps going the same way.
    input.pointerMove(1, 100 + GESTURE.dragThreshold + 5, 302, 400);
    expect(input.read(400).right).toBe(true);
    input.pointerUp(1, 100 + GESTURE.dragThreshold + 5, 302, 120);
    expect(input.read(130)).toMatchObject({ right: false, left: false, jumpPressed: false });
  });

  it('turns round when the drag heads back', () => {
    const input = new InputController();
    input.pointerDown(1, 100, 300, 0);
    input.pointerMove(1, 160, 300, 50);
    input.pointerMove(1, 160 - GESTURE.dragHysteresis - 2, 300, 100);
    expect(input.read(100)).toMatchObject({ left: true, right: false });
  });

  it('jumps on a quick flick up', () => {
    const input = new InputController();
    input.pointerDown(1, 100, 300, 0);
    input.pointerMove(1, 104, 300 - GESTURE.swipeUpDistance - 4, 120);
    expect(input.read(120).jumpPressed).toBe(true);
  });

  it('does not jump on a slow press', () => {
    const input = new InputController();
    input.pointerDown(1, 100, 300, 0);
    input.pointerUp(1, 100, 300, GESTURE.tapMaxMs + 200);
    expect(input.read(800).jumpPressed).toBe(false);
  });

  it('lets one finger drag while another taps to jump', () => {
    const input = new InputController();
    input.pointerDown(1, 100, 300, 0);
    input.pointerMove(1, 70, 300, 40);
    input.pointerDown(2, 500, 300, 100);
    input.pointerUp(2, 500, 300, 150);
    expect(input.read(150)).toMatchObject({ left: true, jumpPressed: true });
  });

  it('stops when the touch is cancelled', () => {
    const input = new InputController();
    input.pointerDown(1, 100, 300, 0);
    input.pointerMove(1, 150, 300, 40);
    input.pointerCancel(1);
    expect(input.read(50)).toMatchObject({ left: false, right: false });
  });

  it('holds a direction button while the jump button is pressed', () => {
    const input = new InputController();
    input.buttonDown('right');
    input.buttonDown('jump');
    expect(input.read(0)).toMatchObject({ right: true, jumpHeld: true, jumpPressed: true });
    input.consumeJump();
    input.buttonUp('jump');
    expect(input.read(10)).toMatchObject({ right: true, jumpHeld: false, jumpPressed: false });
  });

  it('keeps a jump press until a game step has used it', () => {
    const input = new InputController();
    input.keyDown('Space');
    expect(input.read(0).jumpPressed).toBe(true);
    expect(input.read(1).jumpPressed).toBe(true);
    input.consumeJump();
    expect(input.read(2).jumpPressed).toBe(false);
    // Holding the key doesn't queue more jumps.
    input.keyDown('Space');
    expect(input.read(3).jumpPressed).toBe(false);
  });
});
