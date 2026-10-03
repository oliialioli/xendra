import type { Vector2Like } from '../../../types/content';
import { DUCK, REACH } from './ambienceConfig';

/** Distance from `p` to segment ab, and the nearest point on it. */
function toSegment(p: Vector2Like, a: Vector2Like, b: Vector2Like): { d: number; x: number; y: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  const x = a.x + dx * t;
  const y = a.y + dy * t;
  return { d: Math.hypot(p.x - x, p.y - y), x, y };
}

/** The closest point on a closed polygon's edge to `p`, and how far it is. */
export function nearestOnPolygon(p: Vector2Like, polygon: Vector2Like[]): { d: number; x: number; y: number } {
  let best = { d: Infinity, x: p.x, y: p.y };
  for (let i = 0; i < polygon.length; i += 1) {
    const hit = toSegment(p, polygon[i], polygon[(i + 1) % polygon.length]);
    if (hit.d < best.d) best = hit;
  }
  return best;
}

/** 1 within `full`, easing down to 0 at `edge` (smoothstep, so the fade has no corners). */
export function falloff(distance: number, full: number, edge: number): number {
  const t = Math.max(0, Math.min(1, (edge - distance) / (edge - full)));
  return t * t * (3 - 2 * t);
}

/** -1 (left) to 1 (right): where a sound at `x` sits in the view, for stereo panning. */
export function panFor(x: number, viewCenterX: number, viewHalfWidth: number): number {
  return Math.max(-1, Math.min(1, (x - viewCenterX) / Math.max(1, viewHalfWidth)));
}

export type Proximity = { river: number; riverPan: number; waterfall: number; waterfallPan: number };

/**
 * How near the snail is to the water: the river all round the island (its
 * shore is the island's own outline) and the waterfall, each with where it
 * sits left-right in the view.
 */
export function waterProximity(
  snail: Vector2Like,
  shore: Vector2Like[],
  waterfall: Vector2Like | null,
  viewCenterX: number,
  viewHalfWidth: number,
): Proximity {
  const bank = nearestOnPolygon(snail, shore);
  const river = falloff(bank.d, REACH.riverFull, REACH.riverEdge);
  // Panned toward the nearest bank, but never hard to one side: the river is all around.
  const riverPan = panFor(bank.x, viewCenterX, viewHalfWidth) * 0.6;
  if (!waterfall) return { river, riverPan, waterfall: 0, waterfallPan: 0 };
  const toFalls = Math.hypot(snail.x - waterfall.x, snail.y - waterfall.y);
  return {
    river,
    riverPan,
    waterfall: falloff(toFalls, REACH.waterfallFull, REACH.waterfallEdge),
    waterfallPan: panFor(waterfall.x, viewCenterX, viewHalfWidth) * 0.8,
  };
}

/** How loud the campfire is (0 while out) and where it sits in the view. */
export function fireProximity(
  snail: Vector2Like,
  fire: (Vector2Like & { lit: boolean }) | null,
  viewCenterX: number,
  viewHalfWidth: number,
): { level: number; pan: number } {
  if (!fire || !fire.lit) return { level: 0, pan: 0 };
  const d = Math.hypot(snail.x - fire.x, snail.y - fire.y);
  return { level: falloff(d, REACH.fireFull, REACH.fireEdge), pan: panFor(fire.x, viewCenterX, viewHalfWidth) * 0.8 };
}

/** How loud the fountain is (it always runs, quietly) and where it sits in the view. */
export function fountainProximity(
  snail: Vector2Like,
  fountain: Vector2Like,
  viewCenterX: number,
  viewHalfWidth: number,
): { level: number; pan: number } {
  const d = Math.hypot(snail.x - fountain.x, snail.y - fountain.y);
  return { level: falloff(d, REACH.fountainFull, REACH.fountainEdge), pan: panFor(fountain.x, viewCenterX, viewHalfWidth) * 0.8 };
}

/** How loud the rehearsal is from where the snail stands, and where the school sits in the view. */
export function schoolProximity(
  snail: Vector2Like,
  school: Vector2Like,
  viewCenterX: number,
  viewHalfWidth: number,
): { level: number; pan: number } {
  const d = Math.hypot(snail.x - school.x, snail.y - school.y);
  return { level: falloff(d, REACH.schoolFull, REACH.schoolEdge), pan: panFor(school.x, viewCenterX, viewHalfWidth) * 0.7 };
}

export type DuckState = {
  /** The open section's route, or null on the map. */
  panelRoute: string | null;
  /** The band's music (a preview) playing. */
  musicPlaying: boolean;
  /** Some other media (a gallery video) playing. */
  mediaPlaying: boolean;
};

/** How loud the ambience should be (0-1) given what else is going on; the quietest reason wins. */
export function ambienceDuck({ panelRoute, musicPlaying, mediaPlaying }: DuckState): number {
  let level = 1;
  if (panelRoute) level = Math.min(level, DUCK.panel);
  // The band's music lives in Musika (its Bandcamp player can't tell us when it plays, so being there is enough).
  // ...and the castle game has its own music.
  if (panelRoute === '/musica' || panelRoute === '/gaztelua' || musicPlaying) level = Math.min(level, DUCK.music);
  if (mediaPlaying) level = Math.min(level, DUCK.media);
  return level;
}
