import type { Vector2Like } from '../../types/content';

/** Ray-casting point-in-polygon test. Polygon is an ordered list of vertices. */
export function isPointInPolygon(point: Vector2Like, polygon: Vector2Like[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersects =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

    if (intersects) inside = !inside;
  }
  return inside;
}

/** Normalizes a 2D vector so diagonal movement is not faster than axis movement. */
export function normalizeVector(x: number, y: number): Vector2Like {
  if (x === 0 && y === 0) return { x: 0, y: 0 };
  const length = Math.sqrt(x * x + y * y);
  return { x: x / length, y: y / length };
}

export function distance(a: Vector2Like, b: Vector2Like): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Shortest distance from `point` to the segment `a`-`b`. */
export function distanceToSegment(point: Vector2Like, a: Vector2Like, b: Vector2Like): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) return distance(point, a);

  const t = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq, 0, 1);
  return distance(point, { x: a.x + t * dx, y: a.y + t * dy });
}

/** Shortest distance from `point` to any edge of `polygon` (closed loop). */
export function distanceToPolygonEdges(point: Vector2Like, polygon: Vector2Like[]): number {
  let min = Infinity;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    min = Math.min(min, distanceToSegment(point, polygon[i], polygon[j]));
  }
  return min;
}

/**
 * True when `point` is inside `polygon` *and* at least `margin` units away
 * from every edge -- an eroded/inset version of the polygon test, used to
 * keep a visual buffer between the character and the coastline without
 * needing to compute an actual offset polygon (which is non-trivial for
 * concave shapes).
 */
export function isInsideWithMargin(
  point: Vector2Like,
  polygon: Vector2Like[],
  margin: number,
): boolean {
  if (!isPointInPolygon(point, polygon)) return false;
  if (margin <= 0) return true;
  return distanceToPolygonEdges(point, polygon) >= margin;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Finds the closest point to `target` that is still inside `polygon`, by walking
 * back along the line from `from` to `target` in small steps. This is a deliberately
 * simple stand-in for full pathfinding -- see docs/ASSETS.md "future improvements".
 */
export function clampTargetToWalkable(
  from: Vector2Like,
  target: Vector2Like,
  isWalkable: (point: Vector2Like) => boolean,
  steps = 24,
): Vector2Like {
  if (isWalkable(target)) return target;

  for (let i = 1; i <= steps; i += 1) {
    const t = 1 - i / steps;
    const candidate = {
      x: from.x + (target.x - from.x) * t,
      y: from.y + (target.y - from.y) * t,
    };
    if (isWalkable(candidate)) return candidate;
  }
  return from;
}
