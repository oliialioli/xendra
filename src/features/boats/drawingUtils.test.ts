import { describe, expect, it } from 'vitest';
import {
  appendPointIfFarEnough,
  computeBoundingBox,
  createEmptyDrawing,
  createStroke,
  estimateDrawingJsonBytes,
  isDrawingEmpty,
  MIN_POINT_DISTANCE,
  normalizeDrawingToBoundingBox,
  validateDrawingSize,
} from './drawingUtils';

describe('isDrawingEmpty', () => {
  it('is true for a drawing with no strokes', () => {
    expect(isDrawingEmpty(createEmptyDrawing())).toBe(true);
  });

  it('is true for a stroke with fewer than 2 points', () => {
    const stroke = createStroke('#000', 0.02, 'pen');
    stroke.points.push({ x: 0.5, y: 0.5 });
    expect(isDrawingEmpty({ version: 1, strokes: [stroke] })).toBe(true);
  });

  it('is false once a pen stroke has 2+ points', () => {
    const stroke = createStroke('#000', 0.02, 'pen');
    stroke.points.push({ x: 0.1, y: 0.1 }, { x: 0.2, y: 0.2 });
    expect(isDrawingEmpty({ version: 1, strokes: [stroke] })).toBe(false);
  });

  it('is true when the only stroke is an eraser stroke', () => {
    const stroke = createStroke('#000', 0.05, 'eraser');
    stroke.points.push({ x: 0.1, y: 0.1 }, { x: 0.2, y: 0.2 });
    expect(isDrawingEmpty({ version: 1, strokes: [stroke] })).toBe(true);
  });
});

describe('appendPointIfFarEnough', () => {
  it('appends the first point unconditionally', () => {
    const stroke = createStroke('#000', 0.02, 'pen');
    appendPointIfFarEnough(stroke, { x: 0.5, y: 0.5 });
    expect(stroke.points).toHaveLength(1);
  });

  it('skips a point closer than MIN_POINT_DISTANCE to the last one', () => {
    const stroke = createStroke('#000', 0.02, 'pen');
    appendPointIfFarEnough(stroke, { x: 0.5, y: 0.5 });
    appendPointIfFarEnough(stroke, { x: 0.5 + MIN_POINT_DISTANCE / 2, y: 0.5 });
    expect(stroke.points).toHaveLength(1);
  });

  it('appends a point at least MIN_POINT_DISTANCE away', () => {
    const stroke = createStroke('#000', 0.02, 'pen');
    appendPointIfFarEnough(stroke, { x: 0.5, y: 0.5 });
    appendPointIfFarEnough(stroke, { x: 0.5 + MIN_POINT_DISTANCE * 2, y: 0.5 });
    expect(stroke.points).toHaveLength(2);
  });
});

describe('computeBoundingBox / normalizeDrawingToBoundingBox', () => {
  it('returns null for an empty drawing', () => {
    expect(computeBoundingBox(createEmptyDrawing())).toBeNull();
  });

  it('centers a small off-center drawing to fill the normalized square', () => {
    const stroke = createStroke('#000', 0.02, 'pen');
    stroke.points.push({ x: 0.6, y: 0.6 }, { x: 0.65, y: 0.65 });
    const drawing = { version: 1 as const, strokes: [stroke] };

    const normalized = normalizeDrawingToBoundingBox(drawing, 0.1);
    const box = computeBoundingBox(normalized)!;
    const centerX = (box.minX + box.maxX) / 2;
    const centerY = (box.minY + box.maxY) / 2;
    expect(centerX).toBeCloseTo(0.5, 5);
    expect(centerY).toBeCloseTo(0.5, 5);
  });
});

describe('validateDrawingSize / estimateDrawingJsonBytes', () => {
  it('accepts a small valid drawing', () => {
    const stroke = createStroke('#000', 0.02, 'pen');
    stroke.points.push({ x: 0.1, y: 0.1 }, { x: 0.2, y: 0.2 });
    expect(validateDrawingSize({ version: 1, strokes: [stroke] })).toBeNull();
  });

  it('flags a drawing with too many strokes', () => {
    const strokes = Array.from({ length: 61 }, () => {
      const s = createStroke('#000', 0.02, 'pen');
      s.points.push({ x: 0, y: 0 }, { x: 0.1, y: 0.1 });
      return s;
    });
    expect(validateDrawingSize({ version: 1, strokes })).toBe('tooManyStrokes');
  });

  it('estimates a positive byte size for a non-empty drawing', () => {
    const stroke = createStroke('#000', 0.02, 'pen');
    stroke.points.push({ x: 0.1, y: 0.1 }, { x: 0.2, y: 0.2 });
    expect(estimateDrawingJsonBytes({ version: 1, strokes: [stroke] })).toBeGreaterThan(0);
  });
});
