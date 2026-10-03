import { useEffect, useRef, useState } from 'react';
import { HandSwipeRight, HandTap, MouseLeftClick, X } from '@phosphor-icons/react';
import styles from './NavigationHint.module.css';

export type NavigationHintProps = {
  open: boolean;
  /** Lifted above the Hud's "Ireki" bar while that's showing (both sit bottom-center). */
  raised?: boolean;
  onDismiss: () => void;
};

/** Keys that count as "the user moved" on desktop: the arrows and WASD -- see handleKeydown below. */
const MOVE_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D']);

/** How long the second step (how to open a place) stays up if nothing else closes it. */
const INTERACT_STEP_MS = 14000;

type Step = 'move' | 'interact';

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
 * A small, non-modal onboarding hint, in two steps: first how to move around
 * the map (arrows or WASD, or a click on the map; a swipe or tap on touch),
 * then -- as soon as the player moves -- how to open a place (walk up to it
 * and press E or Ireki). A floating card anchored to the bottom-center of the
 * viewport, above the map but never blocking it -- no scrim, no focus trap,
 * and (via CSS `visibility`/`pointer-events`) it never intercepts a click,
 * tap or key that isn't its own close button while hidden.
 *
 * Shown once automatically on first visit (see MapLayout, which owns the
 * `open` state and the "has this been seen before" persistence), it closes
 * for good when the player opens a place (MapLayout again), with its close
 * button or Escape, or after a while on its second step. Reachable again at
 * any time via the Hud's `?` button.
 */
export function NavigationHint({ open, raised = false, onDismiss }: NavigationHintProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>('move');

  // Each time it opens (first visit, or the Hud's ? button) it starts from moving.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setStep('move');
  }

  // The second step closes itself after a while.
  useEffect(() => {
    if (!open || step !== 'interact') return undefined;
    const timer = window.setTimeout(onDismiss, INTERACT_STEP_MS);
    return () => window.clearTimeout(timer);
  }, [open, step, onDismiss]);

  useEffect(() => {
    if (!open || step !== 'move') return undefined;
    // Moving is the cue to show the next step.
    const moved = () => setStep('interact');

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
      if (MOVE_KEYS.has(event.key)) moved();
    };

    const handlePointerDown = (event: PointerEvent) => {
      // A press on the hint's own surface (e.g. its close button) is never
      // "a gesture over the map" -- see the module doc comment.
      if (panelRef.current?.contains(event.target as Node)) return;
      if (withinGracePeriod()) return;
      // A click on the map sends the snail there: that's moving.
      if (event.pointerType === 'mouse') {
        moved();
        return;
      }
      dragPointerId = event.pointerId;
      dragStart = { x: event.clientX, y: event.clientY };
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== dragPointerId) return;
      if (withinGracePeriod()) return;
      const distance = Math.hypot(event.clientX - dragStart.x, event.clientY - dragStart.y);
      if (distance > SWIPE_THRESHOLD_PX) {
        dragPointerId = null;
        moved();
      }
    };

    // A tap on the map moves the snail too.
    const handlePointerEnd = (event: PointerEvent) => {
      if (event.type === 'pointerup' && event.pointerId === dragPointerId) moved();
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
  }, [open, step, onDismiss]);

  return (
    <div
      ref={panelRef}
      className={styles.panel}
      data-visible={open}
      data-raised={raised}
      role="region"
      aria-label="Mapa arakatzeko gida"
      aria-hidden={!open}
    >
      {step === 'move' ? (
        <>
          <div className={styles.desktopIcons} aria-hidden="true">
            <div className={styles.keycaps}>
              <span className={`${styles.key} ${styles.keyUp}`}>↑</span>
              <span className={`${styles.key} ${styles.keyLeft}`}>←</span>
              <span className={`${styles.key} ${styles.keyDown}`}>↓</span>
              <span className={`${styles.key} ${styles.keyRight}`}>→</span>
            </div>
            <div className={styles.keycaps}>
              <span className={`${styles.key} ${styles.keyUp}`}>W</span>
              <span className={`${styles.key} ${styles.keyLeft}`}>A</span>
              <span className={`${styles.key} ${styles.keyDown}`}>S</span>
              <span className={`${styles.key} ${styles.keyRight}`}>D</span>
            </div>
            <MouseLeftClick className={styles.mouse} size={30} weight="light" />
          </div>
          <div className={styles.gesture} aria-hidden="true">
            <HandSwipeRight size={28} weight="fill" />
          </div>
          <div className={styles.text}>
            <p className={styles.title}>Arakatu mapa</p>
            <p className={`${styles.subtitle} ${styles.subtitleDesktop}`}>
              Mugitu geziekin edo WASD teklekin, edo egin klik mapan bertara joateko.
            </p>
            <p className={`${styles.subtitle} ${styles.subtitleTouch}`}>Irristatu edo ukitu mapa mugitzeko.</p>
          </div>
        </>
      ) : (
        <>
          <div className={styles.desktopIcons} aria-hidden="true">
            <span className={`${styles.key} ${styles.keyBig}`}>E</span>
          </div>
          <div className={styles.gesture} aria-hidden="true">
            <HandTap size={28} weight="fill" />
          </div>
          <div className={styles.text}>
            <p className={styles.title}>Sartu lekuetan</p>
            <p className={`${styles.subtitle} ${styles.subtitleDesktop}`}>
              Hurbildu leku batera: argitzen denean, sakatu E edo Ireki.
            </p>
            <p className={`${styles.subtitle} ${styles.subtitleTouch}`}>Hurbildu leku batera eta sakatu Ireki.</p>
          </div>
        </>
      )}

      <button
        type="button"
        className={`xnd-btn-icon ${styles.closeButton}`}
        onClick={onDismiss}
        aria-label="Itxi nabigazio-gida"
        title="Itxi"
        tabIndex={open ? 0 : -1}
      >
        <X size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
