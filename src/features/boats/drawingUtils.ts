import type { BoatDrawing, DrawingPoint, DrawingStroke } from './boatTypes';

/** Minimum distance (fraction of canvas width, 0-1) between two consecutive stored points. */
export const MIN_POINT_DISTANCE = 0.004;
export const MAX_STROKES = 150;
export const MAX_POINTS_PER_STROKE = 400;
export const MAX_TOTAL_POINTS = 6000;
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

/** Coordinates (0-1 of the canvas) are kept to this many decimals once compacted -- a thousandth of the canvas is finer than any drawn line. */
const COORDINATE_DECIMALS = 3;
/** Increasingly strong simplification tolerances (fraction of the canvas) tried by compactDrawingToFit, gentlest first. */
const SIMPLIFY_TOLERANCES = [0.0012, 0.0025, 0.004, 0.0065, 0.01];

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function distanceToSegment(p: DrawingPoint, a: DrawingPoint, b: DrawingPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** Ramer-Douglas-Peucker: drops points that sit within `tolerance` of the line through their neighbours. */
export function simplifyPoints(points: DrawingPoint[], tolerance: number): DrawingPoint[] {
  if (points.length <= 2) return points.slice();
  const keep = new Array<boolean>(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;
  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length > 0) {
    const [start, end] = stack.pop()!;
    let farthest = -1;
    let farthestDistance = tolerance;
    for (let i = start + 1; i < end; i += 1) {
      const distance = distanceToSegment(points[i], points[start], points[end]);
      if (distance > farthestDistance) {
        farthest = i;
        farthestDistance = distance;
      }
    }
    if (farthest !== -1) {
      keep[farthest] = true;
      stack.push([start, farthest], [farthest, end]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/**
 * The drawing as it's stored: every stroke simplified to `tolerance` and
 * every coordinate rounded to COORDINATE_DECIMALS. Visually the same at any
 * size a boat is ever shown, but a fraction of the bytes -- raw pointer
 * coordinates carry ~16 decimals each.
 */
export function compactDrawing(drawing: BoatDrawing, tolerance: number): BoatDrawing {
  return {
    version: drawing.version,
    strokes: drawing.strokes.map((stroke) => ({
      color: stroke.color,
      size: round(stroke.size, 4),
      tool: stroke.tool,
      points: simplifyPoints(stroke.points, tolerance).map((p) => ({
        x: round(p.x, COORDINATE_DECIMALS),
        y: round(p.y, COORDINATE_DECIMALS),
      })),
    })),
  };
}

/**
 * Compacts a drawing just enough to fit MAX_TOTAL_POINTS and
 * MAX_DRAWING_JSON_BYTES: tries the gentlest simplification first and only
 * goes stronger if it still doesn't fit, so a detailed drawing is kept as
 * detailed as the limits allow instead of being rejected. Returns the most
 * compact attempt if even that doesn't fit (validateDrawingSize then
 * reports why).
 */
export function compactDrawingToFit(drawing: BoatDrawing): BoatDrawing {
  let compacted = drawing;
  for (const tolerance of SIMPLIFY_TOLERANCES) {
    compacted = compactDrawing(drawing, tolerance);
    const error = validateDrawingSize(compacted);
    if (error === null || error === 'tooManyStrokes') return compacted;
  }
  return compacted;
}
