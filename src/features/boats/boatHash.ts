/**
 * Deterministic per-boat motion parameters, derived from the boat's own id
 * so every browser tab renders the exact same fleet layout without storing
 * or syncing any position/velocity/lane data -- see BoatFleet.tsx.
 */

/** FNV-1a, a small well-known non-cryptographic string hash -- good enough spread for seeding motion, not used for anything security-sensitive. */
function hashStringToUint32(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32 -- a tiny deterministic PRNG seeded from the hash above. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type BoatMotionParams = {
  /** Starting progress (0-1) around the loop. */
  initialOffset: number;
  /** Loop-fractions per second. */
  speed: number;
  /** Index into boatPathConfig.lanes. */
  laneIndex: number;
  /** Radian phase offset for the floating sine wave, so boats don't bob in lockstep. */
  floatPhase: number;
  /** Small multiplier around 1 for a subtle per-boat size variation. */
  scaleVariation: number;
};

const BASE_SPEED = 0.012;
const SPEED_VARIATION = 0.18;
const SCALE_VARIATION_RANGE = 0.08;

export function computeBoatMotionParams(boatId: string, laneCount: number): BoatMotionParams {
  const random = mulberry32(hashStringToUint32(boatId));
  const initialOffset = random();
  const speed = BASE_SPEED * (1 - SPEED_VARIATION + random() * SPEED_VARIATION * 2);
  const laneIndex = Math.floor(random() * laneCount);
  const floatPhase = random() * Math.PI * 2;
  const scaleVariation = 1 - SCALE_VARIATION_RANGE + random() * SCALE_VARIATION_RANGE * 2;
  return { initialOffset, speed, laneIndex, floatPhase, scaleVariation };
}
