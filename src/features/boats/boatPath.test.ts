import { describe, expect, it } from 'vitest';
import { getPathTotalLength, isWithinSegment, offsetPerpendicular, samplePathAtProgress } from './boatPath';
import { RIVER_PATH_POLYGON } from '../../content/boatPathConfig';

describe('getPathTotalLength', () => {
  it('is a large positive number (a real loop around the island)', () => {
    expect(getPathTotalLength()).toBeGreaterThan(1000);
  });
});

describe('samplePathAtProgress', () => {
  it('returns the same sample for equivalent progress values (wraps at 1)', () => {
    const a = samplePathAtProgress(0.25);
    const b = samplePathAtProgress(1.25);
    expect(a.x).toBeCloseTo(b.x, 5);
    expect(a.y).toBeCloseTo(b.y, 5);
  });

  it('is deterministic for the same progress', () => {
    const a = samplePathAtProgress(0.5);
    const b = samplePathAtProgress(0.5);
    expect(a).toEqual(b);
  });

  it('progress 0 lands on (or extremely near) the polygon\'s first vertex', () => {
    const sample = samplePathAtProgress(0);
    expect(sample.x).toBeCloseTo(RIVER_PATH_POLYGON[0].x, 3);
    expect(sample.y).toBeCloseTo(RIVER_PATH_POLYGON[0].y, 3);
  });

  it('moves to a different point as progress advances', () => {
    const a = samplePathAtProgress(0.1);
    const b = samplePathAtProgress(0.2);
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(1);
  });
});

describe('offsetPerpendicular', () => {
  it('returns the same point for a zero offset', () => {
    const sample = samplePathAtProgress(0.3);
    const offset = offsetPerpendicular(sample, 0);
    expect(offset.x).toBeCloseTo(sample.x, 5);
    expect(offset.y).toBeCloseTo(sample.y, 5);
  });

  it('moves the point away from the path for a non-zero offset', () => {
    const sample = samplePathAtProgress(0.3);
    const offset = offsetPerpendicular(sample, 20);
    const distance = Math.hypot(offset.x - sample.x, offset.y - sample.y);
    expect(distance).toBeCloseTo(20, 3);
  });
});

describe('isWithinSegment', () => {
  it('is false for a null segment', () => {
    expect(isWithinSegment(0.5, null)).toBe(false);
  });

  it('detects a normal (non-wrapping) range', () => {
    expect(isWithinSegment(0.5, { start: 0.4, end: 0.6 })).toBe(true);
    expect(isWithinSegment(0.7, { start: 0.4, end: 0.6 })).toBe(false);
  });

  it('detects a wrapping range (end < start)', () => {
    expect(isWithinSegment(0.95, { start: 0.9, end: 0.1 })).toBe(true);
    expect(isWithinSegment(0.05, { start: 0.9, end: 0.1 })).toBe(true);
    expect(isWithinSegment(0.5, { start: 0.9, end: 0.1 })).toBe(false);
  });
});
