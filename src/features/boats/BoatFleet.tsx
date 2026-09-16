import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameEventBus, BridgeEvents } from '../../game/bridge/gameEvents';
import type { Boat } from './boatTypes';
import { boatPathConfig } from '../../content/boatPathConfig';
import { dockConfig, waterfallConfig } from '../../content/dockConfig';
import { computeBoatMotionParams } from './boatHash';
import { samplePathAtProgress, offsetPerpendicular, isWithinSegment } from './boatPath';
import { getBoatBitmapDataUrl } from './boatBitmap';
import { BoatMessageCard } from './BoatMessageCard';
import styles from './BoatFleet.module.css';

export type BoatFleetProps = {
  bus: GameEventBus;
  boats: Boat[];
  reducedMotion: boolean;
  /** Hides/disarms selection, e.g. while a panel/menu/intro is open -- mirrors DiscoveryIndicators' own `suppressed`. */
  suppressed: boolean;
};

/** World-unit footprint a boat's bitmap renders at, before the map's own zoom -- see docs/BOATS.md for how to retune. */
const BOAT_WORLD_SIZE = 72;
const LAUNCH_DURATION_MS = 1400;
const LAUNCH_FADE_MS = 300;
const FLOAT_AMPLITUDE_PX = 3;
const FLOAT_SPEED = 1.6;
const OCCLUDED_OPACITY = 0.08;

type RuntimeState = {
  motionParams: ReturnType<typeof computeBoatMotionParams>;
  /** performance.now() this boat started its dock->river launch animation, or null if it was already sailing when the fleet loaded (no launch flourish). */
  launchStartedAt: number | null;
};

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/**
 * Renders every boat as a DOM overlay above the Phaser canvas -- the same
 * pattern DiscoveryIndicators uses for landmark badges (imperative
 * style.transform writes via refs, no React re-render per frame) -- but
 * driven by its own single requestAnimationFrame loop rather than only the
 * camera:frame bridge event, since boats keep moving via elapsed time even
 * while the camera itself is stationary. camera:frame is still consulted
 * (via a ref, updated as it arrives) for the current world->screen
 * projection.
 */
export function BoatFleet({ bus, boats, reducedMotion, suppressed }: BoatFleetProps) {
  const elementRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const innerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const runtimeRef = useRef<Map<string, RuntimeState>>(new Map());
  const hasLoadedInitialRef = useRef(false);
  // Set once, inside the tick-loop effect below (not here -- reading
  // performance.now() during render itself is impure/disallowed).
  const fleetStartTimeRef = useRef<number | null>(null);
  const cameraRef = useRef<{ worldViewX: number; worldViewY: number; zoom: number }>({
    worldViewX: 0,
    worldViewY: 0,
    zoom: 1,
  });
  const rafRef = useRef<number | null>(null);
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);
  const [selectedRect, setSelectedRect] = useState<DOMRect | null>(null);
  const selectedBoatIdRef = useRef<string | null>(null);

  // When suppressed turns on (a panel/menu/intro opens over the map), the
  // message card below unmounts on its own (its render guard is `!suppressed`)
  // without ever calling its own onClose -- so this is the only place that
  // clears `selectedBoat` for that path. Without it, a boat clicked open and
  // then covered by e.g. opening a different landmark's panel would stay
  // "selected" (and therefore frozen -- see the tick loop below) forever.
  // Adjusts state directly during render (comparing against the previous
  // `suppressed` value kept in state, React's own documented pattern for
  // this) rather than in an effect, to avoid an extra render round-trip.
  const [wasSuppressed, setWasSuppressed] = useState(suppressed);
  if (suppressed !== wasSuppressed) {
    setWasSuppressed(suppressed);
    if (suppressed) {
      setSelectedBoat(null);
      setSelectedRect(null);
    }
  }

  useEffect(() => {
    const previousId = selectedBoatIdRef.current;
    const nextId = selectedBoat?.id ?? null;
    if (previousId && previousId !== nextId) elementRefs.current.get(previousId)?.removeAttribute('data-selected');
    if (nextId) elementRefs.current.get(nextId)?.setAttribute('data-selected', 'true');
    selectedBoatIdRef.current = nextId;
  }, [selectedBoat]);

  const laneCount = boatPathConfig.lanes.length || 1;

  // Registers/refreshes runtime motion state for any boat not seen before --
  // boats already present the first time this runs (the initial historical
  // list) sail in "cold" (no launch flourish); anything added afterwards
  // (this tab's own submission, or another visitor's, arriving live) gets
  // the dock->river launch animation.
  useEffect(() => {
    const runtime = runtimeRef.current;
    const isFirstPopulation = !hasLoadedInitialRef.current;
    boats.forEach((boat) => {
      if (runtime.has(boat.id)) return;
      runtime.set(boat.id, {
        motionParams: computeBoatMotionParams(boat.id, laneCount),
        launchStartedAt: isFirstPopulation ? null : performance.now(),
      });
    });
    // Prune boats that were removed.
    const currentIds = new Set(boats.map((b) => b.id));
    Array.from(runtime.keys()).forEach((id) => {
      if (!currentIds.has(id)) runtime.delete(id);
    });
    hasLoadedInitialRef.current = true;
  }, [boats, laneCount]);

  useEffect(() => {
    return bus.on('camera:frame', (frame: BridgeEvents['camera:frame']) => {
      cameraRef.current = { worldViewX: frame.worldViewX, worldViewY: frame.worldViewY, zoom: frame.zoom };
    });
  }, [bus]);

  useEffect(() => {
    if (fleetStartTimeRef.current === null) fleetStartTimeRef.current = performance.now();

    function tick() {
      rafRef.current = requestAnimationFrame(tick);
      if (document.hidden) return;

      const now = performance.now();
      const { worldViewX, worldViewY, zoom } = cameraRef.current;

      runtimeRef.current.forEach((state, boatId) => {
        const el = elementRefs.current.get(boatId);
        const inner = innerRefs.current.get(boatId);
        if (!el || !inner) return;
        // Selected boat: resáltalo ligeramente + pausa su movimiento -- skip
        // this frame's position/float update entirely, leaving it at
        // whatever transform it already has.
        if (boatId === selectedBoatIdRef.current) return;

        let worldX: number;
        let worldY: number;
        let angleRad: number;
        let opacity = 1;
        let floatOffset = 0;

        const launchElapsed = state.launchStartedAt === null ? Infinity : now - state.launchStartedAt;

        if (launchElapsed < LAUNCH_DURATION_MS) {
          const t = easeOutCubic(launchElapsed / LAUNCH_DURATION_MS);
          worldX = dockConfig.launchPoint.x + (dockConfig.riverEntryPoint.x - dockConfig.launchPoint.x) * t;
          worldY = dockConfig.launchPoint.y + (dockConfig.riverEntryPoint.y - dockConfig.launchPoint.y) * t;
          angleRad = Math.atan2(
            dockConfig.riverEntryPoint.y - dockConfig.launchPoint.y,
            dockConfig.riverEntryPoint.x - dockConfig.launchPoint.x,
          );
          opacity = Math.min(1, launchElapsed / LAUNCH_FADE_MS);
        } else {
          const sailingStart =
            state.launchStartedAt === null ? (fleetStartTimeRef.current ?? now) : state.launchStartedAt + LAUNCH_DURATION_MS;
          const baseOffset = state.launchStartedAt === null ? state.motionParams.initialOffset : boatPathConfig.launchProgress;
          const elapsedSeconds = (now - sailingStart) / 1000;
          const progress = baseOffset + elapsedSeconds * state.motionParams.speed;

          const sample = samplePathAtProgress(progress);
          const lane = boatPathConfig.lanes[state.motionParams.laneIndex] ?? 0;
          const laned = offsetPerpendicular(sample, lane);
          worldX = laned.x;
          worldY = laned.y;
          angleRad = sample.angleRad;

          if (boatPathConfig.occlusionSegments.some((segment) => isWithinSegment(sample.progress, segment))) {
            opacity = OCCLUDED_OPACITY;
          }
          if (waterfallConfig.enabled && isWithinSegment(sample.progress, { start: waterfallConfig.segmentStart, end: waterfallConfig.segmentEnd })) {
            worldY += waterfallConfig.dropDistance;
            angleRad += (waterfallConfig.tilt * Math.PI) / 180;
          }

          if (!reducedMotion) {
            floatOffset = Math.sin(now / 1000 * FLOAT_SPEED + state.motionParams.floatPhase) * FLOAT_AMPLITUDE_PX;
          }
        }

        const screenX = (worldX - worldViewX) * zoom;
        const screenY = (worldY - worldViewY) * zoom;
        const angleDeg = (angleRad * 180) / Math.PI;
        const scale = zoom * state.motionParams.scaleVariation;

        // translate(-50%,-50%) centers the box on the screen point (its own
        // top-left otherwise would); rotate/scale then pivot correctly
        // around that same centered point -- see BoatFleet.module.css.
        el.style.transform = `translate3d(${screenX}px, ${screenY}px, 0) translate(-50%, -50%) rotate(${angleDeg}deg) scale(${scale})`;
        el.style.opacity = String(opacity);
        inner.style.transform = `translateY(${floatOffset}px)`;
      });
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [reducedMotion]);

  const bitmapUrls = useMemo(() => {
    const map = new Map<string, string>();
    boats.forEach((boat) => map.set(boat.id, getBoatBitmapDataUrl(boat.id, boat.drawing)));
    return map;
  }, [boats]);

  return (
    <div className={styles.root}>
      {boats.map((boat) => (
        <div
          key={boat.id}
          ref={(el) => {
            if (el) elementRefs.current.set(boat.id, el);
            else elementRefs.current.delete(boat.id);
          }}
          className={styles.outer}
          style={{ width: BOAT_WORLD_SIZE, height: BOAT_WORLD_SIZE }}
        >
          <div
            ref={(el) => {
              if (el) innerRefs.current.set(boat.id, el);
              else innerRefs.current.delete(boat.id);
            }}
            className={styles.inner}
          >
            <button
              type="button"
              className={styles.hitArea}
              onClick={(event) => {
                event.stopPropagation();
                if (suppressed) return;
                setSelectedRect(event.currentTarget.getBoundingClientRect());
                setSelectedBoat(boat);
              }}
              aria-label={`${boat.displayName ?? 'Anonimoa'}-ren mezua irakurri`}
              tabIndex={suppressed ? -1 : 0}
            >
              <img src={bitmapUrls.get(boat.id)} alt="" className={styles.image} draggable={false} />
            </button>
          </div>
        </div>
      ))}

      {selectedBoat && !suppressed && (
        <BoatMessageCard boat={selectedBoat} anchorRect={selectedRect} onClose={() => setSelectedBoat(null)} />
      )}
    </div>
  );
}
