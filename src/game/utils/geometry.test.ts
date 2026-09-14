import { describe, expect, it } from 'vitest';
import { isPointInPolygon, normalizeVector } from './geometry';

describe('normalizeVector', () => {
  it('returns a zero vector for zero input', () => {
    expect(normalizeVector(0, 0)).toEqual({ x: 0, y: 0 });
  });

  it('keeps axis-aligned movement at unit length', () => {
    const result = normalizeVector(1, 0);
    expect(Math.hypot(result.x, result.y)).toBeCloseTo(1);
  });

  it('does not let diagonal movement exceed axis speed', () => {
    const diagonal = normalizeVector(1, 1);
    const axis = normalizeVector(1, 0);
    const diagonalLength = Math.hypot(diagonal.x, diagonal.y);
    const axisLength = Math.hypot(axis.x, axis.y);
    expect(diagonalLength).toBeCloseTo(axisLength, 5);
  });
});

describe('isPointInPolygon', () => {
  const square = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];

  it('detects a point inside the polygon', () => {
    expect(isPointInPolygon({ x: 5, y: 5 }, square)).toBe(true);
  });

  it('detects a point outside the polygon', () => {
    expect(isPointInPolygon({ x: 20, y: 20 }, square)).toBe(false);
  });
});
