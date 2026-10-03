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

/**
 * The band rehearsing in the music school: the chorus of "Errauts eskuak"
 * (77.0-100.5 s of the album track, faded in and out), heard from outside --
 * muffled through the walls and echoing in the room (see AmbienceEngine).
 */
export const SCHOOL_REHEARSAL_SRC = '/assets/audio/eskola-errauts-eskuak-leloa.m4a';

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
  /** The fountain beside it: a soft splash, with droplets plinking into the basin on top. */
  fountain: 0.06,
  fountainDropsPerSecond: 9,
  /** How much livelier it gets while its spray is going. */
  fountainSpray: 1.6,
  /** The rehearsal, right outside the school (it's muffled too, so it never gets loud). */
  school: 0.5,
  /** The beaver's plop as it dives (startled: bigger). */
  splash: 0.09,
  /** The vendor's greeting -- kept gentle: he pops out as you pass, and shouldn't make anyone jump. */
  voice: 0.4,
} as const;

/**
 * How far sound reaches, in world units. The landmarks' own sounds (fountain,
 * campfire, school) start about where the landmark itself lights up -- its
 * badge, glow and Ireki -- and are full right beside it; the river is the
 * island's bed and reaches further.
 */
export const REACH = {
  /** From the island's shore: full river sound within `riverFull`, fading out by `riverEdge`. */
  riverFull: 30,
  riverEdge: 420,
  waterfallFull: 60,
  waterfallEdge: 380,
  /** The campfire, once lit (it lights when the snail comes near). */
  fireFull: 50,
  fireEdge: 200,
  /** From the fountain's centre (its basin is ~85 across). */
  fountainFull: 100,
  fountainEdge: 220,
  /**
   * From the middle of the music school (it's ~290 wide, so its walls are
   * ~145 out): heard only once you're near it, full right beside it.
   */
  schoolFull: 130,
  schoolEdge: 260,
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
  /** The band's short break between run-throughs of the chorus. */
  rehearsalGap: [1.5, 3] as [number, number],
} as const;
