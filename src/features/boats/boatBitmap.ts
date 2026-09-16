import type { BoatDrawing } from './boatTypes';
import { normalizeDrawingToBoundingBox } from './drawingUtils';

/** Offscreen render resolution (px, square) for a boat's cached bitmap. */
export const BOAT_BITMAP_SIZE = 160;

/**
 * Renders a normalized drawing onto a detached (never-mounted) canvas --
 * transparent background, no white fill -- and returns a PNG data URL.
 * Uses a plain HTMLCanvasElement rather than OffscreenCanvas: the latter
 * only pays off when rendering happens on a worker thread, which nothing
 * here does, and it has no synchronous toDataURL (only an async
 * convertToBlob), which would complicate the cache below for no benefit.
 */
/**
 * Uncached render, exported for BoatPreview's own live thumbnail (recomputed
 * as the person edits, before a boat id exists to cache against). BoatFleet
 * always goes through getBoatBitmapDataUrl below instead.
 */
export function renderDrawingToDataUrl(drawing: BoatDrawing): string {
  const normalized = normalizeDrawingToBoundingBox(drawing);
  const size = BOAT_BITMAP_SIZE;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const stroke of normalized.strokes) {
    if (stroke.points.length < 2) continue;
    ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = Math.max(1, stroke.size * size);
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x * size, stroke.points[0].y * size);
    for (let i = 1; i < stroke.points.length; i += 1) {
      ctx.lineTo(stroke.points[i].x * size, stroke.points[i].y * size);
    }
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';

  return canvas.toDataURL('image/png');
}

/** Boat id -> already-rendered data URL, so the fleet never re-draws a boat's strokes after its first frame. */
const bitmapCache = new Map<string, string>();

export function getBoatBitmapDataUrl(boatId: string, drawing: BoatDrawing): string {
  const cached = bitmapCache.get(boatId);
  if (cached) return cached;
  const url = renderDrawingToDataUrl(drawing);
  bitmapCache.set(boatId, url);
  return url;
}

export function clearBoatBitmapCache(boatId?: string): void {
  if (boatId) bitmapCache.delete(boatId);
  else bitmapCache.clear();
}
