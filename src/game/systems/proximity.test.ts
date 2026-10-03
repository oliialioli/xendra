import { describe, expect, it } from 'vitest';
import { xendraContent } from '../../content/xendraContent';
import { FOOTPRINT_REACH, LANDMARK_FOOTPRINTS, LANDMARK_POSITIONS, OBSTACLE_RECTS } from '../../content/mapGeometry';
import { findNearestLandmark } from './proximity';

const nearest = (x: number, y: number) =>
  findNearestLandmark({ x, y }, xendraContent.landmarks, LANDMARK_FOOTPRINTS, FOOTPRINT_REACH);

const school = OBSTACLE_RECTS.find((r) => r.id === 'school-building')!;

describe('landmark proximity', () => {
  it('opens a big building from beside any of its walls, not only at its door', () => {
    // Standing by the music school's front-left corner: well over 110 from its
    // anchor (the door), but right against the building.
    const corner = { x: school.x - 14, y: school.y + school.height - 10 };
    const anchor = LANDMARK_POSITIONS.school;
    expect(Math.hypot(corner.x - anchor.x, corner.y - anchor.y)).toBeGreaterThan(110);
    expect(nearest(corner.x, corner.y)).toBe('school');
    // And by its far (east) side.
    expect(nearest(school.x + school.width + 14, school.y + school.height / 2)).toBe('school');
  });

  it("doesn't reach far from a building", () => {
    expect(nearest(school.x - 120, school.y + school.height)).not.toBe('school');
  });

  it('still uses the anchor for a landmark without a footprint (the riverside house)', () => {
    const { x, y } = LANDMARK_POSITIONS.dockMessages;
    expect(nearest(x + 60, y + 40)).toBe('dockMessages');
    expect(nearest(x + 200, y + 200)).toBeNull();
  });

  it('picks nothing out in the open', () => {
    expect(nearest(1000, 1300)).toBeNull();
  });
});
