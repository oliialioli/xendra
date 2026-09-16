import { ISLAND_POLYGON } from './mapGeometry';
import type { Vector2Like } from '../types/content';

/**
 * World-unit distance the river-path polygon is pushed outward from
 * ISLAND_POLYGON's own coastline -- i.e. how far out into the river band the
 * boats travel. ISLAND_POLYGON has no matching "river centerline" data of
 * its own (only the coastline itself is traced), so this derives one
 * programmatically rather than inventing a second hand-traced point list:
 * every coastline vertex is pushed along its own outward normal by this
 * amount. Visually verified against the live map at the default value;
 * retune this single number (not the generator below) if a stretch of the
 * loop ever reads as too close to shore or too far into open water.
 */
const RIVER_PATH_MARGIN = 75;

/** Pushes a closed polygon outward by `margin` along each vertex's averaged edge normal. */
function offsetPolygonOutward(polygon: Vector2Like[], margin: number): Vector2Like[] {
  const n = polygon.length;
  let centroidX = 0;
  let centroidY = 0;
  polygon.forEach((p) => {
    centroidX += p.x;
    centroidY += p.y;
  });
  centroidX /= n;
  centroidY /= n;

  const edgeNormal = (a: Vector2Like, b: Vector2Like): Vector2Like => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: dy / len, y: -dx / len };
  };

  return polygon.map((p, i) => {
    const prev = polygon[(i - 1 + n) % n];
    const next = polygon[(i + 1) % n];
    const n1 = edgeNormal(prev, p);
    const n2 = edgeNormal(p, next);
    let nx = n1.x + n2.x;
    let ny = n1.y + n2.y;
    const len = Math.hypot(nx, ny) || 1;
    nx /= len;
    ny /= len;

    // The averaged normal can point either away from or toward the
    // island's centroid depending on local polygon concavity; always push
    // in whichever direction actually increases distance from the
    // centroid, so every vertex moves outward into the river.
    const testDist = Math.hypot(p.x + nx * margin - centroidX, p.y + ny * margin - centroidY);
    const origDist = Math.hypot(p.x - centroidX, p.y - centroidY);
    const sign = testDist > origDist ? 1 : -1;
    return { x: p.x + nx * margin * sign, y: p.y + ny * margin * sign };
  });
}

/** The river-path polygon in world units -- same order/winding as ISLAND_POLYGON. */
export const RIVER_PATH_POLYGON: Vector2Like[] = offsetPolygonOutward(ISLAND_POLYGON, RIVER_PATH_MARGIN);

function buildClosedSvgPath(points: Vector2Like[]): string {
  const [first, ...rest] = points;
  const segments = rest.map((p) => `L ${p.x.toFixed(2)},${p.y.toFixed(2)}`);
  return `M ${first.x.toFixed(2)},${first.y.toFixed(2)} ${segments.join(' ')} Z`;
}

export type OcclusionSegment = { start: number; end: number };

/**
 * Centralized configuration for the closed river loop every boat travels.
 * Nothing outside this file needs to change to retune the route -- see each
 * field's own comment for what it drives and where its current value came
 * from.
 */
export const boatPathConfig = {
  /**
   * SVG path `d` string, world units, closed loop around the island --
   * built once above from ISLAND_POLYGON + RIVER_PATH_MARGIN. Consumed via
   * an in-memory (never mounted) SVGPathElement's own getTotalLength()/
   * getPointAtLength() -- see boatPath.ts -- so this never needs to be
   * hand-written or kept in sync with any rendered SVG.
   */
  path: buildClosedSvgPath(RIVER_PATH_POLYGON),
  /**
   * Perpendicular offsets (world units, relative to the path's own tangent
   * normal at each point) for spreading the fleet across parallel lanes
   * instead of a single-file line. Index chosen deterministically per boat
   * -- see boatHash.ts.
   */
  lanes: [-22, 0, 22],
  /**
   * Progress (0-1 along the path) nearest dockConfig.riverEntryPoint -- a
   * newly-launched boat's animation ends here before joining the loop.
   * Computed the same way (nearest-vertex-index / vertex-count along the
   * polyline) as riverEntryPoint's own coordinates in dockConfig.ts, so the
   * two stay geometrically consistent with each other.
   */
  launchProgress: 0.8504,
  /**
   * Progress ranges (0-1) where a boat should hide/fade because the route
   * passes under a bridge deck at that point on the real map. Empty for now
   * -- deliberately not guessed from a screenshot; add {start, end} entries
   * here once each bridge crossing's actual progress range is located
   * (e.g. via MapScene's debug overlay, extended to draw this path -- see
   * dockConfig's own debug notes) against the live map.
   */
  occlusionSegments: [] as OcclusionSegment[],
  /**
   * Progress range handed to waterfallConfig once a real waterfall exists.
   * `null` today; MapScene/BoatFleet only ever consult waterfallConfig's
   * own `enabled` flag, so this stays informational until that's turned on.
   */
  waterfallSegment: null as OcclusionSegment | null,
};
