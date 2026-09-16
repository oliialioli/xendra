import { useEffect, useRef } from 'react';
import { HandSwipeRight } from '@phosphor-icons/react';
import styles from './NavigationHint.module.css';

export type NavigationHintProps = {
  open: boolean;
  onDismiss: () => void;
};

/** Arrow keys that count as "the user moved" on desktop -- see handleKeydown below. */
const MOVE_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

/**
 * How long after opening to ignore dismiss-triggering input. Without this, an
 * arrow key already being auto-repeated (held down) or a touch drag already
 * in flight at the moment this reopens via the Hud's `?` button would close
 * it again on the very next event -- see the module doc comment below.
 */
const REOPEN_GRACE_MS = 250;

/** World-unit-free, plain screen-pixel drag distance that counts as "a clear swipe", not a tap. */
const SWIPE_THRESHOLD_PX = 24;

/**
 * A small, non-modal onboarding hint explaining how to move around the map:
 * a floating pill anchored to the bottom-center of the viewport, above the
 * map but never blocking it -- no scrim, no focus trap, and (via CSS
 * `visibility`/`pointer-events`) it never intercepts a click, tap or key
 * that isn't its own close button while hidden.
 *
 * Shown once automatically on first visit (see MapLayout, which owns the
 * `open` state and the "has this been seen before" persistence), and
 * dismissed either by its own close button, or implicitly the moment the
 * player actually starts moving -- an arrow key on desktop, a real drag
 * gesture on touch -- so it never lingers over gameplay once it's done its
 * job. Reachable again at any time via the Hud's `?` button.
 */
export function NavigationHint({ open, onDismiss }: NavigationHintProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;

    const openedAt = Date.now();
    const withinGracePeriod = () => Date.now() - openedAt < REOPEN_GRACE_MS;

    let dragPointerId: number | null = null;
    let dragStart = { x: 0, y: 0 };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss();
        return;
      }
      if (withinGracePeriod()) return;
      if (MOVE_KEYS.has(event.key)) onDismiss();
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return;
      // A touch that starts on the hint's own surface (e.g. tapping close)
      // is never "a gesture over the map" -- see the module doc comment.
      if (panelRef.current?.contains(event.target as Node)) return;
      dragPointerId = event.pointerId;
      dragStart = { x: event.clientX, y: event.clientY };
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== dragPointerId) return;
      if (withinGracePeriod()) return;
      const distance = Math.hypot(event.clientX - dragStart.x, event.clientY - dragStart.y);
      if (distance > SWIPE_THRESHOLD_PX) {
        dragPointerId = null;
        onDismiss();
      }
    };

    const handlePointerEnd = () => {
      dragPointerId = null;
    };

    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerEnd);
    window.addEventListener('pointercancel', handlePointerEnd);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerEnd);
      window.removeEventListener('pointercancel', handlePointerEnd);
    };
  }, [open, onDismiss]);

  return (
    <div
      ref={panelRef}
      className={styles.panel}
      data-visible={open}
      role="region"
      aria-label="Mapa arakatzeko gida"
      aria-hidden={!open}
    >
      <div className={styles.keycaps} aria-hidden="true">
        <span className={`${styles.key} ${styles.keyUp}`}>↑</span>
        <span className={`${styles.key} ${styles.keyLeft}`}>←</span>
        <span className={`${styles.key} ${styles.keyDown}`}>↓</span>
        <span className={`${styles.key} ${styles.keyRight}`}>→</span>
      </div>

      <div className={styles.gesture} aria-hidden="true">
        <HandSwipeRight size={28} weight="fill" />
      </div>

      <div className={styles.text}>
        <p className={styles.title}>Arakatu mapa</p>
        <p className={`${styles.subtitle} ${styles.subtitleDesktop}`}>Erabili geziak mugitzeko</p>
        <p className={`${styles.subtitle} ${styles.subtitleTouch}`}>
          Irristatu mugitzeko · Estutu zooma egiteko
        </p>
      </div>

      <button
        type="button"
        className={`xnd-btn-icon ${styles.closeButton}`}
        onClick={onDismiss}
        aria-label="Itxi nabigazio-gida"
        title="Itxi"
        tabIndex={open ? 0 : -1}
      >
        ×
      </button>
    </div>
  );
}
