import { ENEMY } from './config';

export type Rect = { x: number; y: number; w: number; h: number };

export const LEVEL_HEIGHT = 540;
export const LEVEL_WIDTH = 3800;
/** Top of the stone floor. */
export const GROUND_Y = 470;

const groundBlock = (x: number, w: number): Rect => ({ x, y: GROUND_Y, w, h: LEVEL_HEIGHT - GROUND_Y });
const ledge = (x: number, y: number, w: number): Rect => ({ x, y, w, h: 26 });
/** A block standing on the floor, `height` tall. */
const pillar = (x: number, w: number, height: number): Rect => ({ x, y: GROUND_Y - height, w, h: height });

/**
 * The level, left to right:
 *   1. 0-760     the courtyard: flat floor and two low blocks to learn moving and jumping
 *   2. 760-2500  the ruins: gaps, floating stones, notes and patrolling salt mites
 *   3. 2500-3480 the arena: a safe respawn point, then the Gatz-zaindaria fight
 *   4. 3480-3800 behind the gate: the throne door
 * Every jump on the way is at most ~130 units across and ~95 up; with the
 * snail's jump (see PHYSICS) clearing ~180 across and ~130 up, they're all
 * comfortable -- level.test.ts checks this.
 */
export const SOLIDS: Rect[] = [
  // 1. Courtyard.
  groundBlock(0, 760),
  pillar(380, 100, 50),
  pillar(570, 90, 95),
  // 2. Ruins: a pit, a long floor, three floating stones over a wide pit...
  groundBlock(880, 420),
  ledge(1360, 410, 120),
  ledge(1540, 345, 120),
  ledge(1720, 410, 120),
  // ...a floor with a raised walkway over it, another pit...
  groundBlock(1900, 480),
  ledge(2040, 375, 200),
  // 3-4. ...and one floor from the respawn point to the end, with a pillar each side of the arena to jump down from.
  groundBlock(2500, LEVEL_WIDTH - 2500),
  pillar(2790, 70, 70),
  pillar(3400, 70, 70),
];

/**
 * The surfaces you have to cross, in order, for level.test.ts to check that
 * every jump between them is reachable. Indexes into SOLIDS.
 */
export const ROUTE = [0, 3, 4, 5, 6, 7, 9];

export type NoteSpawn = { id: string; x: number; y: number };

const notes: [number, number][] = [
  [230, 430], [300, 430], [430, 385], [615, 335],
  [820, 380], [1000, 430], [1180, 430],
  [1420, 365], [1600, 290], [1660, 290], [1780, 365],
  [1960, 430], [2100, 335], [2170, 335], [2300, 430],
  [2440, 380],
  [2825, 360], [3435, 360],
  [3560, 430], [3600, 400],
];
export const NOTES: NoteSpawn[] = notes.map(([x, y], i) => ({ id: `note-${i}`, x, y }));

export type EnemySpawn = { id: string; x: number; y: number; dir: 1 | -1 };

/** Salt mites, standing on the surface whose top is `surfaceY`. */
const mite = (id: string, x: number, surfaceY: number, dir: 1 | -1): EnemySpawn => ({
  id,
  x,
  y: surfaceY - ENEMY.height,
  dir,
});
export const ENEMIES: EnemySpawn[] = [
  mite('mite-1', 980, GROUND_Y, 1),
  mite('mite-2', 1220, GROUND_Y, -1),
  mite('mite-3', 2100, 375, 1),
  mite('mite-4', 2120, GROUND_Y, -1),
];

export type Checkpoint = { x: number; visible: boolean };

/**
 * Where the snail comes back after falling in: the last one it has passed.
 * Only the one before the arena is shown (as a banner); the rest just keep
 * a fall from sending you all the way back.
 */
export const CHECKPOINTS: Checkpoint[] = [
  { x: 60, visible: false },
  { x: 900, visible: false },
  { x: 1920, visible: false },
  { x: 2600, visible: true },
];

export const ARENA = {
  /** Crossing this starts the fight. */
  triggerX: 2880,
  /** The boss walks between these (its left edge). */
  minX: 2870,
  maxX: 3390 - 112,
  /** The closed portcullis between the arena and the throne door. */
  gate: { x: 3480, y: GROUND_Y - 190, w: 28, h: 190 } as Rect,
};

export const DOOR: Rect = { x: 3640, y: GROUND_Y - 130, w: 84, h: 130 };
