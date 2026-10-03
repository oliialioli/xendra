import type { Landmark, LandmarkId, Vector2Like } from '../../types/content';
import type { ObstacleCircle, ObstacleRect } from '../../content/mapGeometry';
import { distance } from '../utils/geometry';

export type Footprint = (ObstacleRect | ObstacleCircle)[];

/** How far `position` is from one footprint shape's edge (0 inside it). */
function distanceToShape(position: Vector2Like, shape: ObstacleRect | ObstacleCircle): number {
  if ('radius' in shape) return Math.max(0, distance(position, shape) - shape.radius);
  const dx = Math.max(shape.x - position.x, 0, position.x - (shape.x + shape.width));
  const dy = Math.max(shape.y - position.y, 0, position.y - (shape.y + shape.height));
  return Math.hypot(dx, dy);
}

/**
 * How near `position` is to a landmark, for opening it: the closer of its
 * anchor point and its footprint's edge (plus `reach`) -- so a big building
 * can be opened from any side, not only right at its door.
 */
export function landmarkDistance(position: Vector2Like, landmark: Landmark, footprint: Footprint = [], reach = 0): number {
  const toAnchor = distance(position, landmark.position);
  if (footprint.length === 0) return toAnchor;
  const toEdge = Math.min(...footprint.map((shape) => distanceToShape(position, shape)));
  return Math.min(toAnchor, toEdge + reach);
}

/**
 * The landmark that can be opened from `position`: the nearest one within its
 * interaction radius, if any. Everything that makes a landmark look active
 * (its glow, lights and expanded badge) follows this same answer, so a
 * building never lights up without being openable.
 */
export function findNearestLandmark(
  position: Vector2Like,
  landmarks: Landmark[],
  footprints: Partial<Record<LandmarkId, Footprint>> = {},
  reach = 0,
): LandmarkId | null {
  let closestId: LandmarkId | null = null;
  let closestDistance = Infinity;

  for (const landmark of landmarks) {
    const d = landmarkDistance(position, landmark, footprints[landmark.id], reach);
    if (d <= landmark.interactionRadius && d < closestDistance) {
      closestDistance = d;
      closestId = landmark.id;
    }
  }

  return closestId;
}
