import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CaretLeft, CaretRight, X } from '@phosphor-icons/react';
import { useFocusTrap } from '../../components/useFocusTrap';
import { assetPath } from '../../lib/assetPath';
import type { MediaItem } from '../../types/content';
import styles from './MediaLightbox.module.css';

export type MediaLightboxProps = {
  items: MediaItem[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

/** Horizontal finger travel (CSS px) that counts as a swipe to the next/previous item. */
const SWIPE_THRESHOLD_PX = 50;

/**
 * One board item shown large, as a print on a dark backdrop, with
 * previous/next. Portaled to <body> so it covers the whole screen rather
 * than just the panel it was opened from. Escape and the arrow keys are
 * caught in the capture phase and stopped there, so Escape closes only this
 * view and not the panel underneath (whose own Escape handler listens on
 * document).
 */
export function MediaLightbox({ items, index, onIndexChange, onClose }: MediaLightboxProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const swipeStartX = useRef<number | null>(null);
  useFocusTrap(rootRef, true);

  const item = items[index];
  const hasPrevious = index > 0;
  const hasNext = index < items.length - 1;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        event.preventDefault();
        onClose();
      } else if (event.key === 'ArrowLeft' && hasPrevious) {
        event.stopPropagation();
        onIndexChange(index - 1);
      } else if (event.key === 'ArrowRight' && hasNext) {
        event.stopPropagation();
        onIndexChange(index + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [index, hasPrevious, hasNext, onIndexChange, onClose]);

  if (!item) return null;

  return createPortal(
    <div
      ref={rootRef}
      className={styles.root}
      role="dialog"
      aria-modal="true"
      aria-label={item.altText}
    >
      <div className={styles.scrim} onClick={onClose} />

      <button type="button" className={`xnd-btn-icon ${styles.close}`} onClick={onClose} aria-label="Itxi" title="Itxi">
        <X size={20} aria-hidden="true" />
      </button>

      <figure
        className={styles.print}
        key={item.id}
        onPointerDown={(event) => {
          if (event.pointerType === 'touch') swipeStartX.current = event.clientX;
        }}
        onPointerUp={(event) => {
          if (swipeStartX.current === null) return;
          const dx = event.clientX - swipeStartX.current;
          swipeStartX.current = null;
          if (dx <= -SWIPE_THRESHOLD_PX && hasNext) onIndexChange(index + 1);
          if (dx >= SWIPE_THRESHOLD_PX && hasPrevious) onIndexChange(index - 1);
        }}
      >
        {item.kind === 'video' && item.fullPath ? (
          <video
            className={styles.media}
            src={assetPath(item.fullPath)}
            poster={item.thumbnailPath ? assetPath(item.thumbnailPath) : undefined}
            controls
            autoPlay
            playsInline
          />
        ) : (
          <img
            className={styles.media}
            src={assetPath(item.fullPath ?? item.thumbnailPath ?? '')}
            alt={item.altText}
          />
        )}
        <figcaption className={styles.caption}>{item.altText}</figcaption>
      </figure>

      <div className={styles.nav}>
        <button
          type="button"
          className="xnd-btn-icon"
          onClick={() => onIndexChange(index - 1)}
          disabled={!hasPrevious}
          aria-label="Aurrekoa"
          title="Aurrekoa"
        >
          <CaretLeft size={20} aria-hidden="true" />
        </button>
        <span className={styles.counter} aria-live="polite">
          {index + 1} / {items.length}
        </span>
        <button
          type="button"
          className="xnd-btn-icon"
          onClick={() => onIndexChange(index + 1)}
          disabled={!hasNext}
          aria-label="Hurrengoa"
          title="Hurrengoa"
        >
          <CaretRight size={20} aria-hidden="true" />
        </button>
      </div>
    </div>,
    document.body,
  );
}
