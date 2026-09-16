import { useMemo } from 'react';
import type { BoatDrawing } from './boatTypes';
import { renderDrawingToDataUrl } from './boatBitmap';
import { isDrawingEmpty } from './drawingUtils';
import styles from './BoatPreview.module.css';

/** Small live thumbnail of the cropped/centered boat -- recomputed on each committed stroke, not per pointer move. */
export function BoatPreview({ drawing }: { drawing: BoatDrawing }) {
  const empty = isDrawingEmpty(drawing);
  const dataUrl = useMemo(() => (empty ? null : renderDrawingToDataUrl(drawing)), [drawing, empty]);

  return (
    <div className={styles.root} aria-hidden="true">
      {dataUrl ? <img src={dataUrl} alt="" className={styles.image} /> : <span className={styles.placeholder} />}
    </div>
  );
}
