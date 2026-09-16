/** A single normalized point within a stroke -- see BoatDrawing's own doc comment. */
export type DrawingPoint = { x: number; y: number };

export type DrawingStroke = {
  /** Hex color, e.g. "#232b21". Meaningless (but still present) when tool is "eraser". */
  color: string;
  /** Brush size as a fraction of the drawing canvas's own width (0-1), not raw pixels. */
  size: number;
  /** "eraser" strokes composite as destination-out both live and when re-rendered later -- see boatBitmap.ts. */
  tool: 'pen' | 'eraser';
  points: DrawingPoint[];
};

/**
 * A hand-drawn boat, serialized as normalized vector strokes rather than a
 * raster image -- see drawingUtils.ts for how a live canvas gesture becomes
 * this shape, and boatBitmap.ts for how it's rendered into a small reusable
 * bitmap for the fleet. `version` exists so a future change to this shape
 * (e.g. pressure data) can be introduced without breaking already-stored
 * drawings.
 */
export type BoatDrawing = {
  version: 1;
  strokes: DrawingStroke[];
};

/** A published message-boat, as stored/returned by boatRepository. */
export type Boat = {
  id: string;
  displayName: string | null;
  message: string;
  drawing: BoatDrawing;
  createdAtIso: string;
};

/** Everything needed to publish a new boat, before the repository assigns id/createdAtIso. */
export type NewBoatInput = {
  displayName: string | null;
  message: string;
  drawing: BoatDrawing;
};
