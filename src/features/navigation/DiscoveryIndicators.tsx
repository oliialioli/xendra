import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameEventBus, BridgeEvents } from '../../game/bridge/gameEvents';
import type { Landmark, LandmarkId } from '../../types/content';
import { LANDMARK_INDICATOR_CONFIG } from './landmarkIndicatorConfig';
import { LandmarkIndicator } from './LandmarkIndicator';
import styles from './DiscoveryIndicators.module.css';

export type DiscoveryIndicatorsProps = {
  bus: GameEventBus;
  landmarks: Landmark[];
  /** The single landmark within real interaction range -- same value the Hud's bottom bar already uses. */
  nearestId: LandmarkId | null;
  /** Hidden and disabled while a panel/menu/intro sits over the map. */
  suppressed: boolean;
  reducedMotion: boolean;
  /** Called with the clicked badge's own landmark id -- clicking a badge always opens its panel directly, regardless of the snail's distance. */
  onInteract: (id: LandmarkId) => void;
};

/**
 * Approximate max width an expanded pill can reach (icon + longest label +
 * padding). Used to flip a badge's expansion direction before it would run
 * off the right edge of the viewport -- see the CSS module doc comment for
 * why the icon itself never has to move when this flips.
 */
const FLIP_MARGIN_PX = 220;

/**
 * Renders all 8 landmark discovery badges as absolutely-positioned DOM
 * elements over the Phaser canvas, and keeps them glued to their landmark's
 * world position every frame via the `camera:frame` bridge event.
 *
 * Position is written straight to each badge's `style.transform` through a
 * ref (see `LandmarkIndicator`'s `registerElement`), completely bypassing
 * React state/re-renders for the 60fps part. Only the two things that
 * actually change state -- which badge (if any) is the single nearest one
 * within reveal range, and each badge's expand direction near a screen edge
 * -- go through refs that are compared every frame and only touch the DOM
 * (or call setState) when they actually change.
 */
export function DiscoveryIndicators({
  bus,
  landmarks,
  nearestId,
  suppressed,
  reducedMotion,
  onInteract,
}: DiscoveryIndicatorsProps) {
  const elementRefs = useRef<Partial<Record<LandmarkId, HTMLDivElement>>>({});
  const flipStateRef = useRef<Partial<Record<LandmarkId, boolean>>>({});

  // Built once per `landmarks` identity (stable for the app's lifetime) so
  // each badge gets the same ref-callback instance across re-renders --
  // computed with useMemo rather than lazily read off a ref, since reading a
  // ref's `.current` during render is disallowed.
  const registerCallbacks = useMemo(() => {
    const map: Partial<Record<LandmarkId, (el: HTMLDivElement | null) => void>> = {};
    landmarks.forEach((landmark) => {
      map[landmark.id] = (el: HTMLDivElement | null) => {
        if (el) elementRefs.current[landmark.id] = el;
        else delete elementRefs.current[landmark.id];
      };
    });
    return map;
  }, [landmarks]);

  const autoRevealedRef = useRef<LandmarkId | null>(null);
  const [autoRevealedId, setAutoRevealedId] = useState<LandmarkId | null>(null);

  useEffect(() => {
    if (suppressed) return undefined;

    const handleFrame = ({ scrollX, scrollY, zoom, snailX, snailY }: BridgeEvents['camera:frame']) => {
      const viewportWidth = window.innerWidth;
      let nearestRevealId: LandmarkId | null = null;
      let nearestRevealDist = Infinity;

      landmarks.forEach((landmark) => {
        const config = LANDMARK_INDICATOR_CONFIG[landmark.id];
        // Lift the anchor above the landmark's own ground point by its
        // approximate visual height, so the badge floats above a roofline
        // instead of the bare ground point -- see landmarkIndicatorConfig.ts.
        const worldAnchorY = landmark.position.y - config.visualHeight;
        const screenX = (landmark.position.x - scrollX) * zoom;
        const screenY = (worldAnchorY - scrollY) * zoom;

        const el = elementRefs.current[landmark.id];
        if (el) {
          el.style.transform = `translate3d(${screenX}px, ${screenY}px, 0)`;

          const shouldFlip = screenX > viewportWidth - FLIP_MARGIN_PX;
          if (flipStateRef.current[landmark.id] !== shouldFlip) {
            flipStateRef.current[landmark.id] = shouldFlip;
            el.setAttribute('data-flip', String(shouldFlip));
          }
        }

        const dist = Math.hypot(landmark.position.x - snailX, landmark.position.y - snailY);
        if (dist <= config.revealRadius && dist < nearestRevealDist) {
          nearestRevealDist = dist;
          nearestRevealId = landmark.id;
        }
      });

      if (autoRevealedRef.current !== nearestRevealId) {
        autoRevealedRef.current = nearestRevealId;
        setAutoRevealedId(nearestRevealId);
      }
    };

    return bus.on('camera:frame', handleFrame);
  }, [bus, landmarks, suppressed]);

  return (
    <div className={styles.root}>
      {landmarks.map((landmark, index) => (
        <LandmarkIndicator
          key={landmark.id}
          title={landmark.title}
          config={LANDMARK_INDICATOR_CONFIG[landmark.id]}
          autoRevealed={autoRevealedId === landmark.id}
          interactable={nearestId === landmark.id}
          reducedMotion={reducedMotion}
          suppressed={suppressed}
          index={index}
          onInteract={() => onInteract(landmark.id)}
          registerElement={registerCallbacks[landmark.id]!}
        />
      ))}
    </div>
  );
}
