import { useEffect, useId, useRef, useState } from 'react';
import { useFocusTrap } from '../../components/useFocusTrap';
import type { Boat } from './boatTypes';
import styles from './BoatMessageCard.module.css';

export type BoatMessageCardProps = {
  boat: Boat;
  /** The boat's own on-screen rect at the moment it was clicked -- used to place the card near it on desktop; ignored on the mobile bottom-sheet layout. */
  anchorRect: DOMRect | null;
  onClose: () => void;
};

const CARD_WIDTH = 280;
const CARD_MARGIN = 12;

function clampDesktopPosition(anchorRect: DOMRect | null): { left: number; top: number } {
  if (!anchorRect || typeof window === 'undefined') return { left: 0, top: 0 };
  const estimatedHeight = 160;
  let left = anchorRect.left + anchorRect.width / 2 - CARD_WIDTH / 2;
  let top = anchorRect.bottom + 10;

  left = Math.min(Math.max(left, CARD_MARGIN), window.innerWidth - CARD_WIDTH - CARD_MARGIN);
  if (top + estimatedHeight > window.innerHeight - CARD_MARGIN) {
    top = anchorRect.top - estimatedHeight - 10;
  }
  top = Math.min(Math.max(top, CARD_MARGIN), window.innerHeight - estimatedHeight - CARD_MARGIN);
  return { left, top };
}

/**
 * A boat's message, shown near the boat on desktop (clamped to stay fully
 * on-screen) and as a bottom sheet on mobile (pure CSS breakpoint, same
 * `(pointer: coarse), (max-width: 720px)` query used across the app).
 * Non-modal in spirit (the map stays visible/interactive around it) but
 * still traps focus + closes on Escape + restores focus, like every other
 * dismissible overlay in the app.
 */
export function BoatMessageCard({ boat, anchorRect, onClose }: BoatMessageCardProps) {
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, true);
  const [position] = useState(() => clampDesktopPosition(anchorRect));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <>
      <div className={styles.scrim} onClick={onClose} />
      <div
        ref={containerRef}
        className={styles.card}
        style={{ '--card-left': `${position.left}px`, '--card-top': `${position.top}px` } as React.CSSProperties}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className={styles.header}>
          <h3 id={titleId} className={styles.name}>
            {boat.displayName ?? 'Anonimoa'}
          </h3>
          <button type="button" className="xnd-btn-icon" onClick={onClose} aria-label="Itxi" title="Itxi">
            ✕
          </button>
        </header>
        <p className={styles.message}>{boat.message}</p>
      </div>
    </>
  );
}
