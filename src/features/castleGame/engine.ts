import { BOSS, CRYSTAL, ENEMY, LIVES, PHYSICS, PLAYER, SCORE } from './config';
import {
  ARENA,
  CHECKPOINTS,
  DOOR,
  ENEMIES,
  GROUND_Y,
  LEVEL_HEIGHT,
  LEVEL_WIDTH,
  NOTES,
  SOLIDS,
  type Rect,
} from './level';

/** What the player is asking for this frame. `jumpPressed` is true only on the frame a jump starts. */
export type GameInput = {
  left: boolean;
  right: boolean;
  jumpHeld: boolean;
  jumpPressed: boolean;
};

export const NO_INPUT: GameInput = { left: false, right: false, jumpHeld: false, jumpPressed: false };

/** Things that happened during a step, for the HUD (and anything else) to react to. */
export type GameEvent =
  | { type: 'jump' }
  | { type: 'note'; x: number; y: number }
  | { type: 'stomp'; x: number; y: number }
  | { type: 'hurt' }
  | { type: 'fell' }
  | { type: 'checkpoint'; index: number }
  | { type: 'bossIntro' }
  | { type: 'bossHit'; hp: number }
  | { type: 'bossDefeated' }
  | { type: 'crystalShatter'; x: number; y: number }
  | { type: 'gameOver' }
  | { type: 'victory' };

export type Player = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
  facing: 1 | -1;
  /** Time left in which a jump still counts as from the ground. */
  coyote: number;
  /** Time left on a jump pressed in the air, to fire on landing. */
  jumpBuffer: number;
  /** Whether releasing jump may still shorten the current rise (not after a stomp bounce). */
  canCutJump: boolean;
  invulnerable: number;
};

export type Enemy = { id: string; x: number; y: number; dir: 1 | -1; alive: boolean; squash: number };
export type Note = { id: string; x: number; y: number; taken: boolean };
export type Crystal = { x: number; y: number; vx: number; vy: number; spin: number };

export type BossPhase = 'waiting' | 'intro' | 'walk' | 'windup' | 'defeated';

export type Boss = {
  x: number;
  y: number;
  dir: 1 | -1;
  hp: number;
  phase: BossPhase;
  /** Counts down the current intro/wind-up, and the defeat fade. */
  timer: number;
  /** Counts down to the next wind-up while walking. */
  attackIn: number;
  invulnerable: number;
};

export type GameStatus = 'playing' | 'gameOver' | 'victory';

export type GameState = {
  status: GameStatus;
  time: number;
  score: number;
  lives: number;
  /** Rewards already given this game (`note:<id>`, `enemy:<id>`, `boss`, `door`), so none is given twice. */
  awarded: Set<string>;
  player: Player;
  enemies: Enemy[];
  notes: Note[];
  crystals: Crystal[];
  boss: Boss;
  /** 0 closed, 1 fully raised; it stops blocking the moment the boss is beaten. */
  gateOpen: number;
  checkpoint: number;
  /** The speed bonus earned at the door (0 until then). `time` is the clock: it only runs while playing. */
  timeBonus: number;
  events: GameEvent[];
};

const BOSS_START_X = (ARENA.minX + ARENA.maxX) / 2;

function freshBoss(): Boss {
  return {
    x: BOSS_START_X,
    y: GROUND_Y - BOSS.height,
    dir: -1,
    hp: BOSS.hp,
    phase: 'waiting',
    timer: 0,
    attackIn: BOSS.attackInterval,
    invulnerable: 0,
  };
}

function spawnPoint(index: number): { x: number; y: number } {
  return { x: CHECKPOINTS[index].x, y: GROUND_Y - PLAYER.height };
}

export function createGame(): GameState {
  const start = spawnPoint(0);
  return {
    status: 'playing',
    time: 0,
    score: 0,
    lives: LIVES,
    awarded: new Set(),
    player: {
      x: start.x,
      y: start.y,
      vx: 0,
      vy: 0,
      onGround: true,
      facing: 1,
      coyote: 0,
      jumpBuffer: 0,
      canCutJump: false,
      invulnerable: 0,
    },
    enemies: ENEMIES.map((e) => ({ ...e, alive: true, squash: 0 })),
    notes: NOTES.map((n) => ({ ...n, taken: false })),
    crystals: [],
    boss: freshBoss(),
    gateOpen: 0,
    checkpoint: 0,
    timeBonus: 0,
    events: [],
  };
}

export const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const playerRect = (p: Player): Rect => ({ x: p.x, y: p.y, w: PLAYER.width, h: PLAYER.height });
const bossRect = (b: Boss): Rect => ({ x: b.x, y: b.y, w: BOSS.width, h: BOSS.height });
const enemyRect = (e: Enemy): Rect => ({ x: e.x, y: e.y, w: ENEMY.width, h: ENEMY.height });

export const NOTE_SIZE = 26;
const noteRect = (n: Note): Rect => ({ x: n.x - NOTE_SIZE / 2, y: n.y - NOTE_SIZE / 2, w: NOTE_SIZE, h: NOTE_SIZE });

/** The level's solid blocks, plus the gate while the boss still stands. */
export function solidsFor(state: GameState): Rect[] {
  return state.boss.phase === 'defeated' ? SOLIDS : [...SOLIDS, ARENA.gate];
}

const isSolidAt = (solids: Rect[], x: number, y: number) =>
  solids.some((s) => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h);

function award(state: GameState, key: string, points: number): void {
  if (state.awarded.has(key)) return;
  state.awarded.add(key);
  state.score += points;
}

/** The speed bonus for reaching the door after `seconds` of play: the faster, the more (rounded to tens). */
export function timeBonus(seconds: number): number {
  const points = SCORE.timeBonusMax - SCORE.timeBonusPerSecond * seconds;
  return Math.max(0, Math.round(points / 10) * 10);
}

export function bossInterval(hp: number): number {
  const hits = BOSS.hp - hp;
  return Math.max(BOSS.minInterval, BOSS.attackInterval - BOSS.intervalPerHit * hits);
}

export function bossSpeed(hp: number): number {
  return BOSS.speed + BOSS.speedPerHit * (BOSS.hp - hp);
}

/** Hurt by a mite, the boss or a crystal: one life, a shove away, and a moment of blinking safety. */
function hurt(state: GameState, awayFrom: number): void {
  const p = state.player;
  if (p.invulnerable > 0 || state.status !== 'playing') return;
  state.lives -= 1;
  state.events.push({ type: 'hurt' });
  if (state.lives <= 0) {
    state.status = 'gameOver';
    state.events.push({ type: 'gameOver' });
    return;
  }
  p.invulnerable = PLAYER.invulnerable;
  const dir = p.x + PLAYER.width / 2 < awayFrom ? -1 : 1;
  p.vx = dir * PLAYER.knockback;
  p.vy = -320;
  p.onGround = false;
  p.canCutJump = false;
}

/** Back to the last checkpoint. Mid-fight, the boss starts over too (but its points were never given, so none repeat). */
export function respawn(state: GameState): void {
  const p = state.player;
  const at = spawnPoint(state.checkpoint);
  Object.assign(p, { x: at.x, y: at.y, vx: 0, vy: 0, onGround: true, coyote: 0, jumpBuffer: 0, canCutJump: false });
  p.facing = 1;
  p.invulnerable = 1;
  if (state.boss.phase !== 'defeated') {
    state.boss = freshBoss();
    state.crystals = [];
  }
}

function fell(state: GameState): void {
  state.lives -= 1;
  state.events.push({ type: 'fell' });
  if (state.lives <= 0) {
    state.status = 'gameOver';
    state.events.push({ type: 'gameOver' });
    return;
  }
  respawn(state);
}

function stepPlayer(state: GameState, input: GameInput, dt: number, solids: Rect[]): void {
  const p = state.player;
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (dir !== 0) p.facing = dir as 1 | -1;

  const target = dir * PHYSICS.runSpeed;
  const accel = p.onGround ? PHYSICS.groundAccel : PHYSICS.airAccel;
  const change = accel * dt;
  p.vx = Math.abs(target - p.vx) <= change ? target : p.vx + Math.sign(target - p.vx) * change;

  p.coyote = p.onGround ? PHYSICS.coyoteTime : Math.max(0, p.coyote - dt);
  p.jumpBuffer = input.jumpPressed ? PHYSICS.jumpBuffer : Math.max(0, p.jumpBuffer - dt);
  if (p.jumpBuffer > 0 && p.coyote > 0) {
    p.vy = -PHYSICS.jumpSpeed;
    p.onGround = false;
    p.coyote = 0;
    p.jumpBuffer = 0;
    p.canCutJump = true;
    state.events.push({ type: 'jump' });
  }
  if (p.canCutJump && !input.jumpHeld && p.vy < -PHYSICS.jumpSpeed * PHYSICS.jumpCut) {
    p.vy = -PHYSICS.jumpSpeed * PHYSICS.jumpCut;
    p.canCutJump = false;
  }

  p.vy = Math.min(PHYSICS.maxFall, p.vy + PHYSICS.gravity * dt);

  // Move one axis at a time, pushing back out of whatever was entered.
  p.x += p.vx * dt;
  for (const s of solids) {
    const r = playerRect(p);
    if (!overlaps(r, s)) continue;
    p.x = p.vx > 0 ? s.x - PLAYER.width : p.vx < 0 ? s.x + s.w : p.x;
    p.vx = 0;
  }
  p.x = Math.min(Math.max(p.x, 0), LEVEL_WIDTH - PLAYER.width);

  p.y += p.vy * dt;
  p.onGround = false;
  for (const s of solids) {
    if (!overlaps(playerRect(p), s)) continue;
    if (p.vy > 0) {
      p.y = s.y - PLAYER.height;
      p.onGround = true;
      p.canCutJump = false;
    } else if (p.vy < 0) {
      p.y = s.y + s.h;
    }
    p.vy = 0;
  }

  p.invulnerable = Math.max(0, p.invulnerable - dt);

  if (p.y > LEVEL_HEIGHT + PHYSICS.fallMargin) fell(state);
}

/** True when a descending player came from above `top` -- a stomp rather than a bump. */
const isStomp = (p: Player, prevBottom: number, top: number, tolerance: number) =>
  p.vy > 0 && prevBottom <= top + tolerance;

function bounce(p: Player, input: GameInput, top: number): void {
  p.y = top - PLAYER.height;
  p.vy = -(input.jumpHeld ? PHYSICS.stompBounceHeld : PHYSICS.stompBounce);
  p.onGround = false;
  p.canCutJump = false;
}

function stepEnemies(state: GameState, input: GameInput, dt: number, solids: Rect[], prevBottom: number): void {
  const p = state.player;
  for (const e of state.enemies) {
    if (!e.alive) {
      e.squash = Math.max(0, e.squash - dt);
      continue;
    }
    // Walk, and turn round at a wall or before stepping off an edge.
    const nextX = e.x + e.dir * ENEMY.speed * dt;
    const front = e.dir > 0 ? nextX + ENEMY.width : nextX;
    const blocked = solids.some((s) => overlaps({ x: nextX, y: e.y, w: ENEMY.width, h: ENEMY.height }, s));
    const supported = isSolidAt(solids, front, e.y + ENEMY.height + 2);
    if (blocked || !supported || nextX < 0 || nextX + ENEMY.width > LEVEL_WIDTH) e.dir = (e.dir * -1) as 1 | -1;
    else e.x = nextX;

    if (state.status !== 'playing' || !overlaps(playerRect(p), enemyRect(e))) continue;
    if (isStomp(p, prevBottom, e.y, 8)) {
      e.alive = false;
      e.squash = 0.45;
      award(state, `enemy:${e.id}`, SCORE.enemy);
      bounce(p, input, e.y);
      state.events.push({ type: 'stomp', x: e.x + ENEMY.width / 2, y: e.y });
    } else {
      hurt(state, e.x + ENEMY.width / 2);
    }
  }
}

function throwCrystals(state: GameState): void {
  const b = state.boss;
  const p = state.player;
  const fromX = b.x + BOSS.width / 2;
  const fromY = b.y + 10;
  const toward = p.x + PLAYER.width / 2 < fromX ? -1 : 1;
  // One crystal at full health; once hurt it throws a second, shorter one too.
  const throws = b.hp === BOSS.hp ? [1] : [1, 0.6];
  for (const reach of throws) {
    state.crystals.push({
      x: fromX - CRYSTAL.size / 2,
      y: fromY,
      vx: toward * CRYSTAL.speedX * reach,
      vy: -CRYSTAL.speedY * (0.75 + 0.25 * reach),
      spin: 0,
    });
  }
}

function defeatBoss(state: GameState): void {
  const b = state.boss;
  b.phase = 'defeated';
  b.timer = 1.2;
  state.crystals = [];
  award(state, 'boss', SCORE.boss);
  state.events.push({ type: 'bossDefeated' });
}

function stepBoss(state: GameState, input: GameInput, dt: number, solids: Rect[], prevBottom: number): void {
  const b = state.boss;
  const p = state.player;

  if (b.phase === 'defeated') {
    b.timer = Math.max(0, b.timer - dt);
    state.gateOpen = Math.min(1, state.gateOpen + dt / 1.2);
    return;
  }
  if (b.phase === 'waiting') {
    if (p.x > ARENA.triggerX) {
      b.phase = 'intro';
      b.timer = BOSS.intro;
      state.events.push({ type: 'bossIntro' });
    }
    return;
  }

  b.invulnerable = Math.max(0, b.invulnerable - dt);
  if (b.phase === 'intro') {
    b.timer -= dt;
    if (b.timer <= 0) {
      b.phase = 'walk';
      b.attackIn = bossInterval(b.hp);
    }
  } else if (b.phase === 'walk') {
    b.x += b.dir * bossSpeed(b.hp) * dt;
    if (b.x <= ARENA.minX) {
      b.x = ARENA.minX;
      b.dir = 1;
    } else if (b.x >= ARENA.maxX) {
      b.x = ARENA.maxX;
      b.dir = -1;
    }
    b.attackIn -= dt;
    if (b.attackIn <= 0) {
      b.phase = 'windup';
      b.timer = BOSS.telegraph;
      b.dir = p.x + PLAYER.width / 2 < b.x + BOSS.width / 2 ? -1 : 1;
    }
  } else if (b.phase === 'windup') {
    b.timer -= dt;
    if (b.timer <= 0) {
      throwCrystals(state);
      b.phase = 'walk';
      b.attackIn = bossInterval(b.hp);
    }
  }

  // The player against the boss: from above it's a hit, from the side it hurts.
  if (state.status === 'playing' && overlaps(playerRect(p), bossRect(b))) {
    if (isStomp(p, prevBottom, b.y, 16)) {
      bounce(p, input, b.y);
      if (b.invulnerable <= 0 && b.phase !== 'intro') {
        b.hp -= 1;
        b.invulnerable = BOSS.invulnerable;
        state.events.push({ type: 'bossHit', hp: b.hp });
        if (b.hp <= 0) defeatBoss(state);
      }
    } else {
      hurt(state, b.x + BOSS.width / 2);
    }
  }

  // Salt crystals fly in an arc and shatter on whatever they hit.
  state.crystals = state.crystals.filter((c) => {
    c.vy += CRYSTAL.gravity * dt;
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    c.spin += dt * 8 * Math.sign(c.vx || 1);
    const r = { x: c.x, y: c.y, w: CRYSTAL.size, h: CRYSTAL.size };
    if (state.status === 'playing' && overlaps(r, playerRect(p))) {
      hurt(state, c.x + CRYSTAL.size / 2);
      state.events.push({ type: 'crystalShatter', x: c.x, y: c.y });
      return false;
    }
    if (solids.some((s) => overlaps(r, s)) || c.y > LEVEL_HEIGHT) {
      state.events.push({ type: 'crystalShatter', x: c.x + CRYSTAL.size / 2, y: Math.min(c.y, GROUND_Y) });
      return false;
    }
    return true;
  });
}

function stepPickups(state: GameState): void {
  const r = playerRect(state.player);
  for (const n of state.notes) {
    if (n.taken || !overlaps(r, noteRect(n))) continue;
    n.taken = true;
    award(state, `note:${n.id}`, SCORE.note);
    state.events.push({ type: 'note', x: n.x, y: n.y });
  }

  for (let i = state.checkpoint + 1; i < CHECKPOINTS.length; i += 1) {
    if (state.player.x >= CHECKPOINTS[i].x && state.player.onGround) {
      state.checkpoint = i;
      state.events.push({ type: 'checkpoint', index: i });
    }
  }

  if (state.boss.phase === 'defeated' && overlaps(r, DOOR)) {
    award(state, 'door', SCORE.door);
    if (!state.awarded.has('time')) {
      state.timeBonus = timeBonus(state.time);
      award(state, 'time', state.timeBonus);
    }
    state.status = 'victory';
    state.events.push({ type: 'victory' });
  }
}

/** Advances the game by one fixed step. Does nothing once the game is over. */
export function step(state: GameState, input: GameInput, dt: number = PHYSICS.step): void {
  if (state.status !== 'playing') return;
  state.time += dt;
  const solids = solidsFor(state);
  const prevBottom = state.player.y + PLAYER.height;
  stepPlayer(state, input, dt, solids);
  if (state.status !== 'playing') return;
  stepEnemies(state, input, dt, solids, prevBottom);
  if (state.status !== 'playing') return;
  stepBoss(state, input, dt, solidsFor(state), prevBottom);
  if (state.status !== 'playing') return;
  stepPickups(state);
}

/**
 * Runs as many fixed steps as `elapsed` real seconds hold, carrying the
 * remainder over in `accumulator` -- so the game runs the same at 30, 60 or
 * 144 fps. A jump press is only applied on the first step; `steps` says
 * how many ran, so a press made between steps can be kept for the next frame.
 */
export function advance(
  state: GameState,
  input: GameInput,
  elapsed: number,
  accumulator: number,
): { accumulator: number; steps: number } {
  let acc = accumulator + Math.min(Math.max(elapsed, 0), PHYSICS.maxFrame);
  let steps = 0;
  while (acc >= PHYSICS.step) {
    step(state, steps === 0 ? input : { ...input, jumpPressed: false }, PHYSICS.step);
    steps += 1;
    acc -= PHYSICS.step;
  }
  return { accumulator: acc, steps };
}
