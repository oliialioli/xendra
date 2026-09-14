import type { Landmark, LandmarkId, Vector2Like } from '../../types/content';
import { distance } from '../utils/geometry';

/** Finds the nearest landmark whose interaction radius contains `position`, if any. */
export function findNearestLandmark(
  position: Vector2Like,
  landmarks: Landmark[],
): LandmarkId | null {
  let closestId: LandmarkId | null = null;
  let closestDistance = Infinity;

  for (const landmark of landmarks) {
    const d = distance(position, landmark.position);
    if (d <= landmark.interactionRadius && d < closestDistance) {
      closestDistance = d;
      closestId = landmark.id;
    }
  }

  return closestId;
}
