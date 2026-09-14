import { useEffect, useRef, useState } from 'react';
import type { LandmarkIndicatorConfig } from './landmarkIndicatorConfig';
import styles from './LandmarkIndicator.module.css';

export type LandmarkIndicatorProps = {
  title: string;
  config: LandmarkIndicatorConfig;
  /** True when this is the single nearest badge within its own revealRadius -- see DiscoveryIndicators. */
  autoRevealed: boolean;
  /** True when the snail is within the landmark's real `interactionRadius` -- same signal the Hud's bottom bar already uses. */
  interactable: boolean;
  reducedMotion: boolean;
  /** Hidden and non-interactive while a panel/menu/intro is open. */
  suppressed: boolean;
  /** Animation stagger, so badges don't float in lockstep. */
  index: number;
  onInteract: () => void;
  /** Registers/unregisters this badge's positioned wrapper so the parent can write its transform every frame without a re-render. */
  registerElement: (el: HTMLDivElement | null) => void;
};

/**
 * A single discovery badge: a closed icon circle that expands into a
 * icon+label pill as the snail approaches, and switches to the Xendra
 * terracotta accent once close enough to interact. Position is written
 * imperatively by the parent (see `registerElement`) onto the wrapper's
 * `style.transform` every frame -- this component only owns its own
 * discrete visual state (revealed/interactable/hover/focus), which changes
 * far less often and is fine as normal React state.
 */
export function LandmarkIndicator({
  title,
  config,
  autoRevealed,
  interactable,
  reducedMotion,
  suppressed,
  index,
  onInteract,
  registerElement,
}: LandmarkIndicatorProps) {
  const [hoverOrFocus, setHoverOrFocus] = useState(false);
  const [justBecameInteractable, setJustBecameInteractable] = useState(false);
  const wasInteractable = useRef(false);

  const revealed = autoRevealed || hoverOrFocus;
  const Icon = config.icon;

  useEffect(() => {
    if (interactable && !wasInteractable.current) {
      setJustBecameInteractable(true);
    }
    wasInteractable.current = interactable;
  }, [interactable]);

  return (
    <div
      className={styles.wrapper}
      ref={registerElement}
      data-flip="false"
      aria-hidden={suppressed}
      style={suppressed ? { visibility: 'hidden', pointerEvents: 'none' } : undefined}
    >
      <div className={styles.anchor}>
        <button
          type="button"
          className={[
            styles.badge,
            revealed ? styles.revealed : '',
            interactable ? styles.interactable : '',
            !reducedMotion ? styles.floating : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={
            !reducedMotion
              ? { animationDuration: `${3.2 + (index % 3) * 0.15}s`, animationDelay: `${-(index * 0.4)}s` }
              : undefined
          }
          onMouseEnter={() => setHoverOrFocus(true)}
          onMouseLeave={() => setHoverOrFocus(false)}
          onFocus={() => setHoverOrFocus(true)}
          onBlur={() => setHoverOrFocus(false)}
          onClick={onInteract}
          aria-expanded={revealed}
          aria-label={`${title}. Sakatu irekitzeko.`}
          tabIndex={suppressed ? -1 : 0}
        >
          <span
            className={[styles.iconCircle, justBecameInteractable ? styles.pulse : ''].filter(Boolean).join(' ')}
            onAnimationEnd={() => setJustBecameInteractable(false)}
          >
            <Icon size={19} weight="fill" aria-hidden="true" />
          </span>
          <span className={styles.label}>{config.label}</span>
        </button>
      </div>
    </div>
  );
}
