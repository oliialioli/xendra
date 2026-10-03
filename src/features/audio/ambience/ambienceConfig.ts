/**
 * The world's sound, all in one place. Every sound is synthesised live with
 * the Web Audio API (see AmbienceEngine) -- no audio files -- except the kiosk
 * vendor's voice, a recording played from VENDOR_VOICE_SRC.
 *
 * Gains are linear (0-1) before the master volume; the base bed is meant to
 * sit well in the background.
 */

/** The vendor's "Aupa, egunon!" (1.5s, trimmed and levelled from the band's recording), under /public. If it can't load, he just waves silently. */
export const VENDOR_VOICE_SRC = '/assets/audio/kiosko-aupa-egunon.m4a';

export const MIX = {
  /** The whole world's sound at full volume setting. */
  master: 0.9,
  /** River heard from anywhere on the island... */
  riverBase: 0.035,
  /** ...plus this much more right on the bank. */
  riverNear: 0.2,
  waterfallNear: 0.3,
  /** Rain hiss at a shower's peak; the patter of drops comes on top. */
  rain: 0.12,
  rainDropsPerSecond: 26,
  gust: 0.09,
  /** Birds, distant: each call's peak picks between these. */
  birdMin: 0.018,
  birdMax: 0.04,
  leaves: 0.03,
  /** The campfire's soft roar right beside it; its crackles and snaps come on top. */
  fire: 0.07,
  fireCracklesPerSecond: 11,
  voice: 0.95,
} as const;

/** How far sound reaches, in world units. */
export const REACH = {
  /** From the island's shore: full river sound within `riverFull`, fading out by `riverEdge`. */
  riverFull: 30,
  riverEdge: 420,
  waterfallFull: 60,
  waterfallEdge: 520,
  /** The campfire, once lit (it lights when the snail comes near). */
  fireFull: 50,
  fireEdge: 320,
} as const;

/** Seconds: the time constant every level glides with, so nothing jumps. */
export const GLIDE = {
  proximity: 0.9,
  duck: 0.45,
  toggle: 0.35,
} as const;

/** Ambience level while something else should be heard: */
export const DUCK = {
  /** ...the vendor speaking, */
  voice: 0.3,
  /** ...the band's music (the Musika section, or a preview playing), */
  music: 0.2,
  /** ...a video or other media playing in a section, */
  media: 0.2,
  /** ...or just any other section open (a softer step back). */
  panel: 0.7,
} as const;

/** Seconds between birdsong / rustles (random within the range). */
export const TIMING = {
  birds: [5, 13] as [number, number],
  leaves: [9, 20] as [number, number],
  /** Birds go quieter in the rain: their gaps stretch by up to this factor at its peak. */
  birdsRainFactor: 3,
} as const;
