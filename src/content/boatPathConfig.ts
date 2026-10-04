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

/**
 * Stretches where pushing the coastline outward doesn't follow the water,
 * redrawn by hand against xendra-map-base-v7-4k.png (world = image px / 1.5).
 * Each replaces the offset polygon's points `from`..`to` (inclusive) with
 * `points`; listed last-first so earlier indexes stay valid.
 */
const RIVER_PATH_FIXES: { from: number; to: number; points: Vector2Like[] }[] = [
  // Under the causeway (bottom): the coast follows the road down off the map,
  // so the offset dived off the bottom edge and came back. The river just
  // runs straight under it.
  {
    from: 57,
    to: 63,
    points: [
      { x: 967, y: 1283 },
      { x: 1080, y: 1303 },
      { x: 1193, y: 1317 },
    ],
  },
  // A tiny zig-zag on the west bend, which crossed the lanes over.
  { from: 48, to: 50, points: [{ x: 438, y: 1038 }] },
  // Top left: the river along the top passes under the curved road and turns
  // down the west channel. The offset climbed onto the land instead and looped
  // over the stone arch bridge.
  {
    from: 27,
    to: 35,
    points: [
      { x: 487, y: 237 },
      { x: 373, y: 300 },
    ],
  },
  // A tiny zig-zag just past the railway viaduct.
  { from: 8, to: 9, points: [{ x: 1981, y: 237 }] },
];

function applyFixes(points: Vector2Like[]): Vector2Like[] {
  const result = [...points];
  RIVER_PATH_FIXES.forEach(({ from, to, points: replacement }) => {
    result.splice(from, to - from + 1, ...replacement);
  });
  return result;
}

/** The river-path polygon in world units -- same order/winding as ISLAND_POLYGON. */
export const RIVER_PATH_POLYGON: Vector2Like[] = applyFixes(offsetPolygonOutward(ISLAND_POLYGON, RIVER_PATH_MARGIN));

function buildClosedSvgPath(points: Vector2Like[]): string {
  const [first, ...rest] = points;
  const segments = rest.map((p) => `L ${p.x.toFixed(2)},${p.y.toFixed(2)}`);
  return `M ${first.x.toFixed(2)},${first.y.toFixed(2)} ${segments.join(' ')} Z`;
}

export type OcclusionSegment = { start: number; end: number };

export type BridgeOverlay = {
  id: string;
  src: string;
  bounds: { x: number; y: number; width: number; height: number };
  segment: OcclusionSegment;
};

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
   * Which way the fleet travels around the loop: `1` follows RIVER_PATH_POLYGON's
   * own point order (the direction every progress value below -- launchProgress,
   * occlusionSegments, waterfallSegment -- was calibrated against); `-1` reverses
   * it. Reversing only changes which way *time* walks through the same
   * progress->position mapping (BoatFleet negates its elapsedSeconds*speed
   * step and flips the displayed facing by 180 degrees), so every calibrated
   * progress value above still lands on the exact same physical point either
   * way -- nothing else needs to change.
   */
  direction: -1 as 1 | -1,
  /**
   * Perpendicular offsets (world units, relative to the path's own tangent
   * normal at each point) for spreading the fleet across parallel lanes
   * instead of a single-file line. Index chosen deterministically per boat
   * -- see boatHash.ts.
   */
  lanes: [-22, 0, 22],
  /**
   * Where a newly-launched boat joins the river: the progress at which
   * waterfallConfig's route (features/boats/waterfallRoute.ts) passes right
   * under the pier's end (dockConfig.launchPoint), so a boat dropped off the
   * pier lands on the water and heads straight for the falls.
   */
  launchProgress: 0.8655,
  /**
   * The four bridges the boats pass under, drawn *over* the boats so a boat
   * really disappears beneath the deck instead of fading on top of it.
   * Boats are DOM elements above the whole map canvas, so the bridges baked
   * into the map image can't cover them; each `src` is that bridge cut out
   * of xendra-map-base-v7-4k.png itself (deck, arches and piers only -- the
   * water and the bridge's shadow on it are left transparent), placed at
   * `bounds` (world units) in BoatFleet's own layer.
   *
   * `segment` is the stretch of path progress where the river actually runs
   * beneath that bridge (sampled from boatPath against the cut-out's own
   * outline), with a little margin either side: inside it a boat is drawn
   * *under* the bridge cut-outs, outside it on top of them -- so a boat
   * sailing in front of a bridge is never clipped by it, and the swap
   * happens where the boat isn't overlapping the bridge, so it never pops.
   */
  bridges: [
    {
      id: 'railway',
      src: '/assets/map/bridge-rail.png',
      bounds: { x: 1894, y: 89, width: 360, height: 327 },
      segment: { start: 0.095, end: 0.1231 },
    },
    {
      // The curved road from the island to the stone bridge, top left.
      id: 'road',
      src: '/assets/map/bridge-road.png',
      bounds: { x: 280, y: 100, width: 300, height: 230 },
      segment: { start: 0.3737, end: 0.3995 },
    },
    {
      id: 'causeway',
      src: '/assets/map/bridge-causeway.png',
      bounds: { x: 1054, y: 1156, width: 150, height: 284 },
      segment: { start: 0.7046, end: 0.7348 },
    },
    {
      // The railway's second crossing, on the east side.
      id: 'rail-south',
      src: '/assets/map/bridge-rail-south.png',
      bounds: { x: 2330, y: 790, width: 230, height: 250 },
      segment: { start: 0.9413, end: 0.9661 },
    },
  ] as BridgeOverlay[],
  /**
   * Progress ranges (0-1) where a boat fades out because it passes visually
   * behind a solid obstruction that isn't a bridge -- just the waterfall's
   * rock cluster. BoatFleet fades smoothly toward the segment's centre via
   * boatPath's segmentFraction. Narrower than dockConfig.waterfallConfig's
   * own segmentStart/segmentEnd (which also drives the tilt/speed/drop
   * effect over a wider approach+exit window), kept here rather than
   * imported from dockConfig.ts to avoid a circular import; update both by
   * hand together if the falls ever move.
   */
  occlusionSegments: [
    // (none: boats go over the waterfall by their own route instead of
    // passing behind its rocks -- see features/boats/waterfallRoute.ts)
  ] as OcclusionSegment[],
  /**
   * Progress range handed to waterfallConfig's tilt/speed/drop/splash
   * effect -- informational only (BoatFleet reads dockConfig.waterfallConfig's
   * own segmentStart/segmentEnd directly), kept here in sync by hand for
   * anyone scanning this file to see the boat-path-side picture in one place.
   */
  waterfallSegment: { start: 0.8244, end: 0.875 } as OcclusionSegment | null,
};
