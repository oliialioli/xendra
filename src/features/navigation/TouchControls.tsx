import { useEffect, useRef, useState } from 'react';
import type { GameEventBus } from '../../game/bridge/gameEvents';
import styles from './TouchControls.module.css';

const MAX_RADIUS = 40;

export type TouchControlsProps = {
  bus: GameEventBus;
  /** Hides and disarms the joystick, e.g. while a panel/menu/intro is open. */
  hidden?: boolean;
};

export function TouchControls({ bus, hidden = false }: TouchControlsProps) {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const activePointerId = useRef<number | null>(null);

  useEffect(() => {
    if (!hidden) return;
    activePointerId.current = null;
    bus.emit('controls:joystick', { x: 0, y: 0 });
  }, [hidden, bus]);

  if (hidden) return null;

  function updateFromPointer(clientX: number, clientY: number) {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const distance = Math.min(Math.hypot(dx, dy), MAX_RADIUS);
    const angle = Math.atan2(dy, dx);
    const offset = { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
    setKnobOffset(offset);
    bus.emit('controls:joystick', { x: offset.x / MAX_RADIUS, y: offset.y / MAX_RADIUS });
  }

  function reset() {
    activePointerId.current = null;
    setKnobOffset({ x: 0, y: 0 });
    bus.emit('controls:joystick', { x: 0, y: 0 });
  }

  return (
    <div
      ref={baseRef}
      className={styles.joystickBase}
      role="presentation"
      aria-hidden="true"
      onPointerDown={(e) => {
        activePointerId.current = e.pointerId;
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
      <div
        className={styles.joystickKnob}
        style={{ transform: `translate(calc(-50% + ${knobOffset.x}px), calc(-50% + ${knobOffset.y}px))` }}
      />
    </div>
  );
}
