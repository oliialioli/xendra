import { describe, expect, it } from 'vitest';
import { computeBoatMotionParams } from './boatHash';

describe('computeBoatMotionParams', () => {
  it('is deterministic for the same id', () => {
    const a = computeBoatMotionParams('boat-123', 3);
    const b = computeBoatMotionParams('boat-123', 3);
    expect(a).toEqual(b);
  });

  it('produces different params for different ids', () => {
    const a = computeBoatMotionParams('boat-abc', 3);
    const b = computeBoatMotionParams('boat-xyz', 3);
    expect(a).not.toEqual(b);
  });

  it('keeps every value within its documented range', () => {
    for (const id of ['a', 'boat-1', 'a-very-long-boat-id-1234567890']) {
      const params = computeBoatMotionParams(id, 3);
      expect(params.initialOffset).toBeGreaterThanOrEqual(0);
      expect(params.initialOffset).toBeLessThan(1);
      expect(params.laneIndex).toBeGreaterThanOrEqual(0);
      expect(params.laneIndex).toBeLessThan(3);
      expect(params.speed).toBeGreaterThan(0);
      expect(params.floatPhase).toBeGreaterThanOrEqual(0);
      expect(params.floatPhase).toBeLessThan(Math.PI * 2);
      expect(params.scaleVariation).toBeGreaterThan(0.8);
      expect(params.scaleVariation).toBeLessThan(1.2);
    }
  });

  it('always picks a lane index within a single-lane fleet', () => {
    const params = computeBoatMotionParams('boat-solo', 1);
    expect(params.laneIndex).toBe(0);
  });
});
