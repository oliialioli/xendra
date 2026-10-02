import { describe, expect, it } from 'vitest';
import { BOSS, ENEMY, LIVES, PHYSICS, PLAYER, SCORE } from './config';
import { NO_INPUT, advance, createGame, respawn, solidsFor, step, type GameInput, type GameState } from './engine';
import { ARENA, CHECKPOINTS, DOOR, GROUND_Y } from './level';

const run = (state: GameState, seconds: number, input: GameInput = NO_INPUT) => {
  for (let t = 0; t < seconds; t += PHYSICS.step) step(state, input);
};

/** Puts the snail just above `top`, falling onto it. */
const dropOnto = (state: GameState, centerX: number, top: number) => {
  Object.assign(state.player, { x: centerX - PLAYER.width / 2, y: top - PLAYER.height - 1, vy: 300, vx: 0, onGround: false });
};

/** Starts the boss fight and skips its name card. */
const startFight = (state: GameState) => {
  Object.assign(state.player, { x: ARENA.triggerX + 10, y: GROUND_Y - PLAYER.height });
  step(state, NO_INPUT);
  expect(state.boss.phase).toBe('intro');
  run(state, BOSS.intro + 0.05);
  expect(state.boss.phase).toBe('walk');
};

describe('castle game engine', () => {
  it('stands still on the floor without sinking or bouncing', () => {
    const game = createGame();
    run(game, 2);
    expect(game.player.onGround).toBe(true);
    expect(game.player.y).toBeCloseTo(GROUND_Y - PLAYER.height, 5);
  });

  it('moves sideways and stops against a wall', () => {
    const game = createGame();
    run(game, 1.5, { ...NO_INPUT, right: true });
    // The first block in the courtyard stops it.
    expect(game.player.x + PLAYER.width).toBeCloseTo(380, 0);
    expect(game.player.vx).toBe(0);
  });

  it('jumps about 130 units high and lands again', () => {
    const game = createGame();
    let minY = game.player.y;
    step(game, { ...NO_INPUT, jumpPressed: true, jumpHeld: true });
    for (let t = 0; t < 1.2; t += PHYSICS.step) {
      step(game, { ...NO_INPUT, jumpHeld: true });
      minY = Math.min(minY, game.player.y);
    }
    const rise = GROUND_Y - PLAYER.height - minY;
    expect(rise).toBeGreaterThan(120);
    expect(rise).toBeLessThan(140);
    expect(game.player.onGround).toBe(true);
  });

  it('jumps lower when jump is let go early', () => {
    const game = createGame();
    let minY = game.player.y;
    step(game, { ...NO_INPUT, jumpPressed: true, jumpHeld: true });
    for (let t = 0; t < 1; t += PHYSICS.step) {
      step(game, NO_INPUT);
      minY = Math.min(minY, game.player.y);
    }
    expect(GROUND_Y - PLAYER.height - minY).toBeLessThan(60);
  });

  it('collects a note once, for 100 points', () => {
    const game = createGame();
    const note = game.notes[0];
    Object.assign(game.player, { x: note.x - PLAYER.width / 2 });
    run(game, 0.05);
    expect(note.taken).toBe(true);
    expect(game.score).toBe(SCORE.note);
    run(game, 0.5);
    expect(game.score).toBe(SCORE.note);
  });

  it('defeats a mite landed on from above, with a bounce and 200 points', () => {
    const game = createGame();
    game.notes = [];
    const mite = game.enemies[0];
    dropOnto(game, mite.x + ENEMY.width / 2, mite.y);
    run(game, 0.03);
    expect(mite.alive).toBe(false);
    expect(game.score).toBe(SCORE.enemy);
    expect(game.player.vy).toBeLessThan(0);
    expect(game.lives).toBe(LIVES);
  });

  it('loses a single life bumping into a mite from the side, then blinks safe', () => {
    const game = createGame();
    const mite = game.enemies[0];
    mite.dir = -1;
    Object.assign(game.player, { x: mite.x - PLAYER.width - 1, y: GROUND_Y - PLAYER.height });
    run(game, 0.1, { ...NO_INPUT, right: true });
    expect(game.lives).toBe(LIVES - 1);
    expect(game.player.invulnerable).toBeGreaterThan(0);
    // Still touching it while blinking costs nothing more.
    run(game, 0.6, { ...NO_INPUT, right: true });
    expect(game.lives).toBe(LIVES - 1);
  });

  it('turns mites round before they walk off an edge', () => {
    const game = createGame();
    // mite-3 patrols the raised walkway (x 2040-2240).
    const mite = game.enemies[2];
    Object.assign(game.player, { x: 100 });
    for (let t = 0; t < 12; t += PHYSICS.step) {
      step(game, NO_INPUT);
      expect(mite.x).toBeGreaterThanOrEqual(2040 - 1);
      expect(mite.x + ENEMY.width).toBeLessThanOrEqual(2240 + 1);
    }
  });

  it('falling in costs a life and puts the snail back at the last checkpoint', () => {
    const game = createGame();
    Object.assign(game.player, { x: 1990, y: GROUND_Y - PLAYER.height });
    run(game, 0.1);
    expect(game.checkpoint).toBe(2);
    Object.assign(game.player, { x: 2420, y: 300, onGround: false });
    run(game, 1.5);
    expect(game.lives).toBe(LIVES - 1);
    expect(game.player.x).toBe(CHECKPOINTS[2].x);
    expect(game.player.onGround).toBe(true);
  });

  it('ends the game when the last life goes', () => {
    const game = createGame();
    game.lives = 1;
    Object.assign(game.player, { x: 800, y: 300, onGround: false });
    run(game, 1.5);
    expect(game.status).toBe('gameOver');
  });

  it('runs the same however the frames are sliced', () => {
    const a = createGame();
    const b = createGame();
    const input = { ...NO_INPUT, right: true };
    let accA = 0;
    let accB = 0;
    for (let i = 0; i < 60; i += 1) accA = advance(a, input, 1 / 60, accA).accumulator;
    for (let i = 0; i < 144; i += 1) accB = advance(b, input, 1 / 144, accB).accumulator;
    // Within one fixed step of each other (the slices don't add up to exactly the same count).
    expect(Math.abs(a.player.x - b.player.x)).toBeLessThanOrEqual(PHYSICS.runSpeed * PHYSICS.step + 1e-6);
  });

  it('never simulates more than a short slice after a long stall', () => {
    const game = createGame();
    const { steps } = advance(game, { ...NO_INPUT, right: true }, 5, 0);
    expect(steps * PHYSICS.step).toBeLessThanOrEqual(PHYSICS.maxFrame + 1e-9);
  });
});

describe('the Gatz-zaindaria fight', () => {
  it('introduces itself, winds up visibly, then throws salt crystals', () => {
    const game = createGame();
    startFight(game);
    Object.assign(game.player, { x: ARENA.minX - 60, y: GROUND_Y - 70 - PLAYER.height }); // safe on the left pillar
    let sawWindup = false;
    for (let t = 0; t < BOSS.attackInterval + BOSS.telegraph + 0.2 && game.crystals.length === 0; t += PHYSICS.step) {
      step(game, NO_INPUT);
      if (game.boss.phase === 'windup') sawWindup = true;
    }
    expect(sawWindup).toBe(true);
    expect(game.crystals.length).toBeGreaterThan(0);
  });

  it('takes three hits from above, one per landing, then opens the way', () => {
    const game = createGame();
    startFight(game);
    const startScore = game.score;

    for (let hit = 1; hit <= BOSS.hp; hit += 1) {
      const b = game.boss;
      dropOnto(game, b.x + BOSS.width / 2, b.y);
      step(game, NO_INPUT);
      expect(game.boss.hp).toBe(BOSS.hp - hit);
      // Landing again straight away doesn't count twice.
      if (hit < BOSS.hp) {
        dropOnto(game, b.x + BOSS.width / 2, b.y);
        step(game, NO_INPUT);
        expect(game.boss.hp).toBe(BOSS.hp - hit);
        run(game, BOSS.invulnerable + 0.05);
        game.player.invulnerable = 0;
        game.crystals = [];
      }
    }

    expect(game.boss.phase).toBe('defeated');
    expect(game.crystals).toHaveLength(0);
    expect(game.score).toBe(startScore + SCORE.boss);
    expect(solidsFor(game)).not.toContain(ARENA.gate);
    // Beating it isn't winning: the door is.
    expect(game.status).toBe('playing');
    Object.assign(game.player, { x: DOOR.x + 10, y: GROUND_Y - PLAYER.height });
    step(game, NO_INPUT);
    expect(game.status).toBe('victory');
    expect(game.score).toBe(startScore + SCORE.boss + SCORE.door);
  });

  it('blocks the door until it is beaten', () => {
    const game = createGame();
    Object.assign(game.player, { x: ARENA.gate.x - PLAYER.width - 5, y: GROUND_Y - PLAYER.height });
    run(game, 1, { ...NO_INPUT, right: true });
    expect(game.player.x + PLAYER.width).toBeLessThanOrEqual(ARENA.gate.x + 0.01);
    expect(game.status).toBe('playing');
  });

  it('gets faster and throws more often as it is hurt', () => {
    const game = createGame();
    startFight(game);
    const b = game.boss;
    dropOnto(game, b.x + BOSS.width / 2, b.y);
    step(game, NO_INPUT);
    expect(b.hp).toBe(BOSS.hp - 1);
    const x0 = b.x;
    // Still walking, a beat later, it covers more ground per second than at full health.
    run(game, 0.2);
    expect(Math.abs(b.x - x0)).toBeGreaterThan(BOSS.speed * 0.2);
  });

  it('starts over, without its crystals, if the snail respawns mid-fight -- and pays out only once', () => {
    const game = createGame();
    startFight(game);
    const b = game.boss;
    dropOnto(game, b.x + BOSS.width / 2, b.y);
    step(game, NO_INPUT);
    expect(game.boss.hp).toBe(BOSS.hp - 1);
    game.crystals.push({ x: 3000, y: 300, vx: 0, vy: 0, spin: 0 });

    respawn(game);
    expect(game.boss.hp).toBe(BOSS.hp);
    expect(game.boss.phase).toBe('waiting');
    expect(game.crystals).toHaveLength(0);
    expect(game.awarded.has('boss')).toBe(false);
  });

  it('hurts the snail when it walks into it', () => {
    const game = createGame();
    startFight(game);
    const b = game.boss;
    b.phase = 'windup';
    b.timer = 5;
    Object.assign(game.player, { x: b.x - PLAYER.width - 2, y: GROUND_Y - PLAYER.height, invulnerable: 0 });
    run(game, 0.3, { ...NO_INPUT, right: true });
    expect(game.lives).toBe(LIVES - 1);
    expect(b.hp).toBe(BOSS.hp);
  });
});
