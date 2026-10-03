import { useMemo } from 'react';
import type { BoatDrawing } from './boatTypes';
import { renderDrawingToDataUrl } from './boatBitmap';
import { isDrawingEmpty } from './drawingUtils';
import styles from './BoatPreview.module.css';

/**
 * Live thumbnail of the cropped/centered boat -- recomputed on each committed
 * stroke, not per pointer move. `large` for the message step, where it's the
 * boat that will carry the message.
 */
export function BoatPreview({ drawing, size = 'small' }: { drawing: BoatDrawing; size?: 'small' | 'large' }) {
  const empty = isDrawingEmpty(drawing);
  const dataUrl = useMemo(() => (empty ? null : renderDrawingToDataUrl(drawing)), [drawing, empty]);

  return (
    <div className={styles.root} data-size={size} aria-hidden="true">
      {dataUrl ? <img src={dataUrl} alt="" className={styles.image} /> : <span className={styles.placeholder} />}
    </div>
  );
}
