/**
 * Every tunable number and every word of the castle minigame, in one place.
 * Distances are level units (the level is LEVEL_HEIGHT units tall and the
 * canvas scales it to fit), times are seconds.
 */

/** Points for each reward. Each one can only be earned once per game. */
export const SCORE = {
  note: 100,
  enemy: 200,
  boss: 1000,
  door: 2000,
} as const;

export const LIVES = 3;

export const PHYSICS = {
  /** Fixed simulation step: the game advances in these slices whatever the screen's refresh rate. */
  step: 1 / 120,
  /** Longest real time one frame may simulate (after a stall the game slows down instead of teleporting). */
  maxFrame: 0.1,
  gravity: 2200,
  maxFall: 1000,
  runSpeed: 270,
  groundAccel: 2600,
  airAccel: 1700,
  /** Vertical speed of a jump; with this gravity it rises ~130 units and clears ~180 across. */
  jumpSpeed: 760,
  /** Letting go of jump early cuts the rise to this fraction, for short hops. */
  jumpCut: 0.45,
  /** A jump still works this long after walking off an edge... */
  coyoteTime: 0.1,
  /** ...and a jump pressed this long before landing still happens on landing. */
  jumpBuffer: 0.12,
  /** Bounce after landing on an enemy (more if jump is held). */
  stompBounce: 480,
  stompBounceHeld: 700,
  /** How far below the level's bottom edge counts as having fallen in. */
  fallMargin: 60,
} as const;

export const PLAYER = {
  width: 40,
  height: 30,
  /** After being hurt, the snail blinks and can't be hurt again for this long. */
  invulnerable: 1.6,
  /** Sideways shove when hurt. */
  knockback: 260,
} as const;

export const ENEMY = {
  width: 34,
  height: 24,
  speed: 70,
} as const;

export const BOSS = {
  name: 'Gatz-zaindaria',
  hp: 3,
  width: 112,
  height: 92,
  /** Walking speed at full health; each hit taken adds `speedPerHit`. */
  speed: 80,
  speedPerHit: 35,
  /** Time between throws at full health; each hit taken removes `intervalPerHit` (never below `minInterval`). */
  attackInterval: 2.8,
  intervalPerHit: 0.6,
  minInterval: 1.5,
  /** The visible wind-up before each throw -- always long enough to react to. */
  telegraph: 0.75,
  /** After a hit it flashes and can't be hurt again for this long, so one landing counts once. */
  invulnerable: 1.1,
  /** How long its name card shows before the fight starts. */
  intro: 1.4,
} as const;

export const CRYSTAL = {
  size: 18,
  gravity: 1300,
  /** Launch speed of a thrown salt crystal. */
  speedX: 300,
  speedY: 640,
} as const;

/** Local top-3 storage. Bump the version suffix if the stored shape ever changes. */
export const LEADERBOARD = {
  storageKey: 'xendra-castle-leaderboard-v1',
  size: 3,
  aliasMaxLength: 12,
} as const;

/** Touch gesture thresholds (CSS px / ms). */
export const GESTURE = {
  /** A finger has to move this far sideways before it counts as a drag (and then never as a tap). */
  dragThreshold: 14,
  /** Once dragging, the finger only needs to stay this far from where it turned around to keep a direction. */
  dragHysteresis: 10,
  /** A tap: lifted within this time, having moved less than dragThreshold. */
  tapMaxMs: 260,
  /** A flick up: this far up, within this time, more up than sideways. */
  swipeUpDistance: 36,
  swipeUpMaxMs: 320,
} as const;

/** The game's words, in Euskera like the rest of the site. */
export const COPY = {
  title: 'Xendra: Gaztelu Hondatua',
  start: 'Hasi',
  backToMap: 'Itzuli mapara',
  playAgain: 'Berriro jokatu',
  pause: 'Pausatu',
  resume: 'Jarraitu',
  paused: 'Pausan',
  gameOver: 'Jokoa amaitu da',
  victory: 'Garaipena!',
  victoryText: 'Gatz-zaindaria garaitu eta tronuaren atea zeharkatu duzu.',
  gameOverText: 'Bizitzak agortu zaizkizu.',
  score: 'Puntuak',
  lives: 'Bizitzak',
  finalScore: 'Azken puntuazioa',
  leaderboard: 'Onenak',
  leaderboardEmpty: 'Oraindik ez du inork jokatu. Izan zaitez lehena!',
  leaderboardNote: 'Nabigatzaile honetan gordetako puntuazioak.',
  newRecord: 'Onenen artean zaude! Idatzi zure ezizena:',
  aliasLabel: 'Ezizena',
  aliasHint: `Gehienez ${LEADERBOARD.aliasMaxLength} karaktere.`,
  aliasEmpty: 'Idatzi ezizen bat.',
  save: 'Gorde',
  saved: 'Gordeta!',
  points: 'puntu',
  howToKeys: 'Mugitu geziekin edo A/D teklekin, eta egin salto zuriunearekin edo gora geziarekin. Erori etsaien gainera haiek garaitzeko.',
  howToTouch: 'Arrastatu hatza alboetara mugitzeko, eta ukitu pantaila edo irristatu gora salto egiteko. Erori etsaien gainera haiek garaitzeko.',
  howToGoal: 'Bildu musika-notak, garaitu Gatz-zaindaria buruan salto eginez eta sartu tronuaren atetik.',
  touchLeft: 'Ezkerrera',
  touchRight: 'Eskuinera',
  touchJump: 'Salto',
  bossDefeated: 'Atea zabalik dago!',
  checkpoint: 'Gordeta',
} as const;
