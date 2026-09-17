import { RIVER_PATH_POLYGON, type OcclusionSegment } from '../../content/boatPathConfig';
import type { Vector2Like } from '../../types/content';

/**
 * Position/tangent math for the closed river loop, computed directly from
 * boatPathConfig's own RIVER_PATH_POLYGON rather than through a real,
 * DOM-mounted SVGPathElement's getTotalLength()/getPointAtLength(). Both
 * approaches are geometrically identical here (the SVG path is itself built
 * from straight `L` segments through these same points, no curves), but
 * walking the polygon directly needs no DOM at all -- it runs the same way
 * in the browser, in a Web Worker, or in a jsdom/vitest test (where real
 * SVGGeometryElement methods aren't implemented), which is what makes
 * samplePathAtProgress directly unit-testable (see boatPath.test.ts).
 */

type Segment = { start: Vector2Like; end: Vector2Like; length: number };

let cachedSegments: Segment[] | null = null;
let cachedTotalLength = 0;

function getSegments(): Segment[] {
  if (cachedSegments) return cachedSegments;
  const points = RIVER_PATH_POLYGON;
  const segments: Segment[] = [];
  let total = 0;
  for (let i = 0; i < points.length; i += 1) {
    const start = points[i];
    const end = points[(i + 1) % points.length];
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    segments.push({ start, end, length });
    total += length;
  }
  cachedSegments = segments;
  cachedTotalLength = total;
  return segments;
}

export function getPathTotalLength(): number {
  getSegments();
  return cachedTotalLength;
}

function pointAtDistance(distance: number): Vector2Like {
  const segments = getSegments();
  const total = cachedTotalLength;
  let remaining = ((distance % total) + total) % total;

  for (const segment of segments) {
    if (remaining <= segment.length) {
      const t = segment.length === 0 ? 0 : remaining / segment.length;
      return {
        x: segment.start.x + (segment.end.x - segment.start.x) * t,
        y: segment.start.y + (segment.end.y - segment.start.y) * t,
      };
    }
    remaining -= segment.length;
  }
  return segments[segments.length - 1].end;
}

/** World-unit lookahead used to derive the tangent -- a fixed distance (not a fixed progress delta) keeps tangent quality consistent across the polygon's uneven segment lengths. */
const TANGENT_LOOKAHEAD_DISTANCE = 6;

export type PathSample = { x: number; y: number; angleRad: number; progress: number };

/** Position + facing angle (radians) at `progress` (0-1, wraps). */
export function samplePathAtProgress(progress: number): PathSample {
  const total = getPathTotalLength();
  const p = ((progress % 1) + 1) % 1;
  const distance = p * total;
  const point = pointAtDistance(distance);
  const ahead = pointAtDistance(distance + TANGENT_LOOKAHEAD_DISTANCE);
  const angleRad = Math.atan2(ahead.y - point.y, ahead.x - point.x);
  return { x: point.x, y: point.y, angleRad, progress: p };
}

/** Offsets a path sample perpendicular to its own tangent by `distance` world units (lane spread). */
export function offsetPerpendicular(sample: PathSample, distance: number): Vector2Like {
  const nx = -Math.sin(sample.angleRad);
  const ny = Math.cos(sample.angleRad);
  return { x: sample.x + nx * distance, y: sample.y + ny * distance };
}

/** True if `progress` (0-1) falls inside `segment` (which may wrap past 1 back to 0). */
export function isWithinSegment(progress: number, segment: OcclusionSegment | null): boolean {
  if (!segment) return false;
  const p = ((progress % 1) + 1) % 1;
  if (segment.start <= segment.end) return p >= segment.start && p <= segment.end;
  return p >= segment.start || p <= segment.end;
}

/**
 * How far `progress` (0-1) has traveled through `segment` -- 0 at its start,
 * 1 at its end -- or null if outside it (same wrap-past-1 handling as
 * isWithinSegment). Lets a caller build a smooth in/out envelope (e.g.
 * `Math.sin(fraction * Math.PI)`, 0 at both edges, peaking mid-segment)
 * instead of a hard on/off step -- see BoatFleet's waterfall crossing.
 */
export function segmentFraction(progress: number, segment: OcclusionSegment | null): number | null {
  if (!segment) return null;
  // progress - floor(progress) wraps into [0, 1) without the extra rounding
  // error a "+1 then %1" chain can introduce right at an exact boundary
  // value (isWithinSegment's own wrap doesn't need this precision, since it
  // only ever compares with <=/>=, not divides by a span near that boundary).
  const p = progress - Math.floor(progress);
  const { start, end } = segment;
  const span = start <= end ? end - start : 1 - start + end;
  if (span <= 0) return null;

  if (start <= end) {
    if (p < start || p > end) return null;
    return (p - start) / span;
  }
  if (p >= start) return (p - start) / span;
  if (p <= end) return (1 - start + p) / span;
  return null;
}
