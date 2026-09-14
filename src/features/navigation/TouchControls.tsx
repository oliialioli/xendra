import { useEffect, useRef, useState } from 'react';
import type { GameEventBus } from '../../game/bridge/gameEvents';
import styles from './TouchControls.module.css';

const MAX_RADIUS = 40;
/** Half the visual base's own diameter (108px) -- see TouchControls.module.css. */
const BASE_RADIUS = 54;

export type TouchControlsProps = {
  bus: GameEventBus;
  /** Hides and disarms the joystick, e.g. while a panel/menu/intro is open. */
  hidden?: boolean;
};

/**
 * A "dynamic" (a.k.a. floating) virtual joystick: rather than requiring the
 * thumb to land precisely on a small fixed circle -- the classic mobile
 * touch-handling complaint -- any touch that starts within the larger
 * `.zone` (bottom-left corner) plants the visible base right under the
 * finger, clamped to stay fully on screen. The base only appears while a
 * touch is active.
 */
export function TouchControls({ bus, hidden = false }: TouchControlsProps) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const activePointerId = useRef<number | null>(null);
  const originRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!hidden) return;
    activePointerId.current = null;
    bus.emit('controls:joystick', { x: 0, y: 0 });
  }, [hidden, bus]);

  if (hidden) return null;

  function updateFromPointer(clientX: number, clientY: number) {
    const dx = clientX - originRef.current.x;
    const dy = clientY - originRef.current.y;
    const distance = Math.min(Math.hypot(dx, dy), MAX_RADIUS);
    const angle = Math.atan2(dy, dx);
    const offset = { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
    setKnobOffset(offset);
    bus.emit('controls:joystick', { x: offset.x / MAX_RADIUS, y: offset.y / MAX_RADIUS });
  }

  function reset() {
    activePointerId.current = null;
    setOrigin(null);
    setKnobOffset({ x: 0, y: 0 });
    bus.emit('controls:joystick', { x: 0, y: 0 });
  }

  return (
    <div
      ref={zoneRef}
      className={styles.zone}
      role="presentation"
      aria-hidden="true"
      onPointerDown={(e) => {
        const zone = zoneRef.current;
        if (!zone) return;
        const rect = zone.getBoundingClientRect();
        // Clamp so the base circle always lands fully inside the zone (and
        // therefore fully on screen), even if the touch itself is right at
        // an edge or corner.
        const planted = {
          x: Math.min(Math.max(e.clientX, rect.left + BASE_RADIUS), rect.right - BASE_RADIUS),
          y: Math.min(Math.max(e.clientY, rect.top + BASE_RADIUS), rect.bottom - BASE_RADIUS),
        };
        activePointerId.current = e.pointerId;
        originRef.current = planted;
        setOrigin(planted);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        updateFromPointer(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (activePointerId.current !== e.pointerId) return;
        updateFromPointer(e.clientX, e.clientY);
      }}
      onPointerUp={reset}
      onPointerCancel={reset}
    >
      {origin && (
        <div
          className={styles.joystickBase}
          style={{ left: origin.x, top: origin.y }}
        >
          <div
            className={styles.joystickKnob}
            style={{ transform: `translate(calc(-50% + ${knobOffset.x}px), calc(-50% + ${knobOffset.y}px))` }}
          />
        </div>
      )}
    </div>
  );
}
