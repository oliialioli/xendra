import type { BoatDrawing, DrawingPoint, DrawingStroke } from './boatTypes';

/** Minimum distance (fraction of canvas width, 0-1) between two consecutive stored points. */
export const MIN_POINT_DISTANCE = 0.004;
export const MAX_STROKES = 60;
export const MAX_POINTS_PER_STROKE = 400;
export const MAX_TOTAL_POINTS = 4000;
/** Serialized JSON byte budget -- comfortably under any reasonable jsonb column/payload limit. */
export const MAX_DRAWING_JSON_BYTES = 60_000;

export function createEmptyDrawing(): BoatDrawing {
  return { version: 1, strokes: [] };
}

export function createStroke(color: string, size: number, tool: DrawingStroke['tool']): DrawingStroke {
  return { color, size, tool, points: [] };
}

/**
 * Appends `point` to `stroke` only if it's at least MIN_POINT_DISTANCE away
 * from the stroke's last point (or the stroke is still empty) -- keeps a
 * slow, careful stroke from ballooning into hundreds of near-duplicate
 * points, without needing any separate simplification pass later. Mutates
 * and returns `stroke` for convenient chaining from a pointermove handler.
 */
export function appendPointIfFarEnough(stroke: DrawingStroke, point: DrawingPoint): DrawingStroke {
  const last = stroke.points[stroke.points.length - 1];
  if (last) {
    const distance = Math.hypot(point.x - last.x, point.y - last.y);
    if (distance < MIN_POINT_DISTANCE) return stroke;
  }
  if (stroke.points.length >= MAX_POINTS_PER_STROKE) return stroke;
  stroke.points.push(point);
  return stroke;
}

/** A drawing counts as empty when no *pen* stroke has real content -- eraser-only strokes never count. */
export function isDrawingEmpty(drawing: BoatDrawing): boolean {
  return !drawing.strokes.some((stroke) => stroke.tool === 'pen' && stroke.points.length >= 2);
}

export function countTotalPoints(drawing: BoatDrawing): number {
  return drawing.strokes.reduce((sum, stroke) => sum + stroke.points.length, 0);
}

export type BoundingBox = { minX: number; minY: number; maxX: number; maxY: number };

export function computeBoundingBox(drawing: BoatDrawing): BoundingBox | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let found = false;

  // Only pen strokes define the visible extent -- an eraser stroke can dip
  // outside the inked area without actually growing what's visible there.
  for (const stroke of drawing.strokes) {
    if (stroke.tool !== 'pen') continue;
    for (const point of stroke.points) {
      found = true;
      if (point.x < minX) minX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.x > maxX) maxX = point.x;
      if (point.y > maxY) maxY = point.y;
    }
  }

  return found ? { minX, minY, maxX, maxY } : null;
}

/**
 * Re-centers and re-scales a drawing so its own content -- not the raw
 * canvas the person happened to draw within -- fills a uniform [0,1]
 * square with `padding` of empty margin on every side, preserving aspect
 * ratio. Called once when a drawing is converted into a boat (see
 * boatBitmap.ts), never while the person is still actively drawing, so the
 * live canvas always reflects exactly what they drew.
 */
export function normalizeDrawingToBoundingBox(drawing: BoatDrawing, padding = 0.08): BoatDrawing {
  const box = computeBoundingBox(drawing);
  if (!box) return drawing;

  const width = box.maxX - box.minX;
  const height = box.maxY - box.minY;
  const size = Math.max(width, height, 1e-6);
  const usable = 1 - padding * 2;
  const scale = usable / size;
  const centerX = (box.minX + box.maxX) / 2;
  const centerY = (box.minY + box.maxY) / 2;

  const strokes: DrawingStroke[] = drawing.strokes.map((stroke) => ({
    color: stroke.color,
    size: stroke.size * scale,
    tool: stroke.tool,
    points: stroke.points.map((p) => ({
      x: (p.x - centerX) * scale + 0.5,
      y: (p.y - centerY) * scale + 0.5,
    })),
  }));

  return { version: 1, strokes };
}

export function estimateDrawingJsonBytes(drawing: BoatDrawing): number {
  return new TextEncoder().encode(JSON.stringify(drawing)).length;
}

export type DrawingSizeError = 'tooManyStrokes' | 'tooManyPoints' | 'tooLarge';

/** Defensive re-check before persisting -- the live canvas already enforces these limits as you draw. */
export function validateDrawingSize(drawing: BoatDrawing): DrawingSizeError | null {
  if (drawing.strokes.length > MAX_STROKES) return 'tooManyStrokes';
  if (countTotalPoints(drawing) > MAX_TOTAL_POINTS) return 'tooManyPoints';
  if (estimateDrawingJsonBytes(drawing) > MAX_DRAWING_JSON_BYTES) return 'tooLarge';
  return null;
}
