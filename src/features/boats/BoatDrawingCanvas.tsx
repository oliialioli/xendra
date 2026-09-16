import { useEffect, useRef, useState } from 'react';
import { Eraser, ArrowCounterClockwise, Trash } from '@phosphor-icons/react';
import type { BoatDrawing, DrawingPoint, DrawingStroke } from './boatTypes';
import { appendPointIfFarEnough, createStroke, isDrawingEmpty } from './drawingUtils';
import styles from './BoatDrawingCanvas.module.css';

export type BoatDrawingCanvasProps = {
  drawing: BoatDrawing;
  onChange: (drawing: BoatDrawing) => void;
};

/**
 * Xendra's own world palette (tokens.css) -- 7 colors plus the dark ink
 * tone, not a generic art-app palette. Kept as literal hex here (rather
 * than reading the CSS custom properties at runtime) since these are the
 * project's stable brand colors; if tokens.css's palette ever changes,
 * update this list to match.
 */
const PALETTE = [
  { name: 'Ikatza', hex: '#3a3530' },
  { name: 'Teila', hex: '#b5654a' },
  { name: 'Granatea', hex: '#6e3f3d' },
  { name: 'Goroldioa', hex: '#7c9070' },
  { name: 'Ibaia', hex: '#6f97a0' },
  { name: 'Mostaza', hex: '#c99a3e' },
  { name: 'Horia', hex: '#e2b53c' },
  { name: 'Koralea', hex: '#c98a6e' },
];

const BRUSH_SIZES = [
  { label: 'Mehea', value: 0.008 },
  { label: 'Ertaina', value: 0.018 },
  { label: 'Lodia', value: 0.034 },
];

const ERASER_SIZE = 0.05;

/**
 * A free-draw canvas, unified across mouse/trackpad/pen/touch via Pointer
 * Events. Strokes are drawn to the visible canvas immediately (imperative
 * canvas calls per pointermove, for smooth feedback) while simultaneously
 * building up the same stroke as normalized points in React state -- the
 * canvas is the live view, `drawing` (owned by the parent, see
 * BoatCreator) is the serializable source of truth once a stroke ends.
 */
export function BoatDrawingCanvas({ drawing, onChange }: BoatDrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activePointerId = useRef<number | null>(null);
  const activeStroke = useRef<DrawingStroke | null>(null);

  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState(PALETTE[0].hex);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1].value);
  // Mirrors activeStroke.current for render purposes -- the ref itself can't
  // be read during render (see handlePointerDown/endStroke, which keep this in sync).
  const [hasActiveStroke, setHasActiveStroke] = useState(false);

  const redraw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const { width, height } = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const strokesToDraw = activeStroke.current ? [...drawing.strokes, activeStroke.current] : drawing.strokes;
    for (const stroke of strokesToDraw) {
      if (stroke.points.length < 2) continue;
      ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = Math.max(1, stroke.size * width);
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x * width, stroke.points[0].y * height);
      for (let i = 1; i < stroke.points.length; i += 1) {
        ctx.lineTo(stroke.points[i].x * width, stroke.points[i].y * height);
      }
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  };

  // Sizes the backing bitmap to the element's real CSS size * devicePixelRatio,
  // so strokes stay crisp on high-DPI screens, and redraws on any resize
  // (orientation change, opening on a different breakpoint).
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return undefined;

    const applySize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      // setTransform (not scale) so repeated resizes replace the DPR scale
      // instead of compounding it.
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      redraw();
    };

    applySize();
    const observer = new ResizeObserver(applySize);
    observer.observe(container);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- redraw reads current refs/props at call time, doesn't need to be a dependency
  }, []);

  useEffect(redraw, [drawing]);

  function pointFromEvent(event: React.PointerEvent<HTMLCanvasElement>): DrawingPoint {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(event.pointerId);
    activePointerId.current = event.pointerId;
    const size = tool === 'eraser' ? ERASER_SIZE : brushSize;
    const stroke = createStroke(color, size, tool);
    appendPointIfFarEnough(stroke, pointFromEvent(event));
    activeStroke.current = stroke;
    setHasActiveStroke(true);
    redraw();
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (activePointerId.current !== event.pointerId || !activeStroke.current) return;
    event.preventDefault();
    const before = activeStroke.current.points.length;
    appendPointIfFarEnough(activeStroke.current, pointFromEvent(event));
    if (activeStroke.current.points.length > before) redraw();
  }

  function endStroke() {
    activePointerId.current = null;
    const stroke = activeStroke.current;
    activeStroke.current = null;
    setHasActiveStroke(false);
    if (stroke && stroke.points.length >= 2) {
      onChange({ version: 1, strokes: [...drawing.strokes, stroke] });
    } else {
      redraw();
    }
  }

  function handleUndo() {
    if (drawing.strokes.length === 0) return;
    onChange({ version: 1, strokes: drawing.strokes.slice(0, -1) });
  }

  function handleClear() {
    if (drawing.strokes.length === 0) return;
    onChange({ version: 1, strokes: [] });
  }

  const empty = isDrawingEmpty(drawing) && !hasActiveStroke;

  return (
    <div className={styles.root}>
      <div ref={containerRef} className={styles.canvasWrap}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          data-tool={tool}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          onPointerLeave={endStroke}
          aria-label="Marrazteko lienzoa"
          role="img"
        />
        {empty && <p className={styles.emptyHint}>Marraztu hemen zure ontzia</p>}
      </div>

      <div className={styles.tools}>
        <div className={styles.swatches} role="radiogroup" aria-label="Kolorea">
          {PALETTE.map((swatch) => (
            <button
              key={swatch.hex}
              type="button"
              role="radio"
              aria-checked={tool === 'pen' && color === swatch.hex}
              aria-label={swatch.name}
              title={swatch.name}
              className={styles.swatch}
              data-selected={tool === 'pen' && color === swatch.hex}
              style={{ background: swatch.hex }}
              onClick={() => {
                setColor(swatch.hex);
                setTool('pen');
              }}
            />
          ))}
        </div>

        <div className={styles.sizes} role="radiogroup" aria-label="Pintzelaren lodiera">
          {BRUSH_SIZES.map((size) => (
            <button
              key={size.label}
              type="button"
              role="radio"
              aria-checked={tool === 'pen' && brushSize === size.value}
              className={styles.sizeButton}
              data-selected={tool === 'pen' && brushSize === size.value}
              onClick={() => {
                setBrushSize(size.value);
                setTool('pen');
              }}
            >
              <span
                className={styles.sizeDot}
                style={{ width: `${6 + size.value * 220}px`, height: `${6 + size.value * 220}px` }}
                aria-hidden="true"
              />
              <span className={styles.sizeLabel}>{size.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className="xnd-btn-icon"
            aria-pressed={tool === 'eraser'}
            aria-label="Borragoma"
            title="Borragoma"
            onClick={() => setTool((t) => (t === 'eraser' ? 'pen' : 'eraser'))}
          >
            <Eraser size={18} weight={tool === 'eraser' ? 'fill' : 'regular'} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="xnd-btn-icon"
            aria-label="Desegin"
            title="Desegin"
            onClick={handleUndo}
            disabled={drawing.strokes.length === 0}
          >
            <ArrowCounterClockwise size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="xnd-btn-icon"
            aria-label="Garbitu dena"
            title="Garbitu dena"
            onClick={handleClear}
            disabled={drawing.strokes.length === 0}
          >
            <Trash size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
