import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameEventBus, BridgeEvents } from '../../game/bridge/gameEvents';
import type { Boat } from './boatTypes';
import { boatPathConfig } from '../../content/boatPathConfig';
import { dockConfig, waterfallConfig } from '../../content/dockConfig';
import { computeBoatMotionParams } from './boatHash';
import { samplePathAtProgress, offsetPerpendicular, segmentFraction } from './boatPath';
import { getBoatBitmapDataUrl } from './boatBitmap';
import { BoatMessageCard } from './BoatMessageCard';
import styles from './BoatFleet.module.css';

export type BoatFleetProps = {
  bus: GameEventBus;
  boats: Boat[];
  reducedMotion: boolean;
  /** Hides/disarms selection, e.g. while a panel/menu/intro is open -- mirrors DiscoveryIndicators' own `suppressed`. */
  suppressed: boolean;
  /**
   * Fires whenever a boat's message card opens/closes. The card is
   * non-modal by design (the map stays visible/interactive around it -- see
   * BoatMessageCard's own doc comment), but it can render in the same
   * screen region as a nearby landmark's own "Ireki" proximity prompt (Hud's
   * `proximityBar`), which sits underneath and stays fully clickable since
   * MapLayout has no visibility into this component's local selection state
   * otherwise. MapLayout uses this to hide that prompt while a card is open.
   */
  onBoatCardOpenChange?: (open: boolean) => void;
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

/** Interpolates from angle `a` to `b` (radians) via the shorter of the two arcs around the circle, instead of always sweeping the "positive" way. */
function lerpAngle(a: number, b: number, t: number): number {
  const twoPi = Math.PI * 2;
  let diff = (b - a) % twoPi;
  if (diff < -Math.PI) diff += twoPi;
  if (diff > Math.PI) diff -= twoPi;
  return a + diff * t;
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
export function BoatFleet({ bus, boats, reducedMotion, suppressed, onBoatCardOpenChange }: BoatFleetProps) {
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
    onBoatCardOpenChange?.(selectedBoat !== null);
  }, [selectedBoat, onBoatCardOpenChange]);

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

      // Shared by every currently-launching boat, so computed once per
      // frame rather than per boat -- see the launch branch below for why.
      const launchStartFacing = Math.atan2(
        dockConfig.riverEntryPoint.y - dockConfig.launchPoint.y,
        dockConfig.riverEntryPoint.x - dockConfig.launchPoint.x,
      );
      const launchHandoffSample = samplePathAtProgress(boatPathConfig.launchProgress);
      const launchHandoffFacing = launchHandoffSample.angleRad + (boatPathConfig.direction < 0 ? Math.PI : 0);

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
        let waterfallEnvelope = 0;

        const launchElapsed = state.launchStartedAt === null ? Infinity : now - state.launchStartedAt;

        if (launchElapsed < LAUNCH_DURATION_MS) {
          const t = easeOutCubic(launchElapsed / LAUNCH_DURATION_MS);
          worldX = dockConfig.launchPoint.x + (dockConfig.riverEntryPoint.x - dockConfig.launchPoint.x) * t;
          worldY = dockConfig.launchPoint.y + (dockConfig.riverEntryPoint.y - dockConfig.launchPoint.y) * t;
          // Eases from "facing straight toward the river entry point" (t=0,
          // just leaving the dock) to whatever heading the boat needs the
          // instant it joins the loop (t=1) -- these two angles aren't the
          // same (the loop's own tangent at the entry point rarely matches
          // the dock's straight departure line, more so since
          // boatPathConfig.direction can flip the loop's facing entirely),
          // so holding the departure angle fixed for the whole animation
          // made the boat visibly snap to a new heading the moment it
          // started sailing. Lerping removes that pop.
          angleRad = lerpAngle(launchStartFacing, launchHandoffFacing, t);
          opacity = Math.min(1, launchElapsed / LAUNCH_FADE_MS);
        } else {
          const sailingStart =
            state.launchStartedAt === null ? (fleetStartTimeRef.current ?? now) : state.launchStartedAt + LAUNCH_DURATION_MS;
          const baseOffset = state.launchStartedAt === null ? state.motionParams.initialOffset : boatPathConfig.launchProgress;
          const elapsedSeconds = (now - sailingStart) / 1000;
          const progress = baseOffset + elapsedSeconds * state.motionParams.speed * boatPathConfig.direction;

          // Smooth 0->1->0 envelope across the waterfall's segment (0 at
          // both edges, peaking mid-crossing) instead of a hard on/off step,
          // so entering/leaving the falls never visibly pops -- shared by
          // the speed boost, tilt, drop and splash effects below.
          const waterfallSegment = waterfallConfig.enabled
            ? { start: waterfallConfig.segmentStart, end: waterfallConfig.segmentEnd }
            : null;
          const waterfallFraction = segmentFraction(progress, waterfallSegment);
          waterfallEnvelope = waterfallFraction === null ? 0 : Math.sin(waterfallFraction * Math.PI);

          let sampledProgress = progress;
          if (waterfallEnvelope > 0 && waterfallConfig.speedMultiplier !== 1) {
            // Peak forward nudge sized so the *average* extra distance
            // covered across the whole segment (the sine envelope's mean is
            // 2/pi of its peak) matches segmentSpan * (multiplier - 1) --
            // i.e. "speedMultiplier% faster through this stretch", not an
            // arbitrary constant.
            const segmentSpan = waterfallConfig.segmentEnd - waterfallConfig.segmentStart;
            const peakBoost = (segmentSpan * (waterfallConfig.speedMultiplier - 1)) / (2 / Math.PI);
            sampledProgress = progress + waterfallEnvelope * peakBoost * boatPathConfig.direction;
          }

          const sample = samplePathAtProgress(sampledProgress);
          const lane = boatPathConfig.lanes[state.motionParams.laneIndex] ?? 0;
          const laned = offsetPerpendicular(sample, lane);
          worldX = laned.x;
          worldY = laned.y;
          // samplePathAtProgress's own tangent always faces the polygon's
          // forward point order -- flip it 180 degrees when the fleet is
          // actually traveling that order backwards (boatPathConfig.direction
          // === -1), so the sprite still faces the way it's really moving.
          angleRad = sample.angleRad + (boatPathConfig.direction < 0 ? Math.PI : 0);

          if (waterfallEnvelope > 0) {
            worldY += waterfallConfig.dropDistance * waterfallEnvelope;
            angleRad += ((waterfallConfig.tilt * Math.PI) / 180) * waterfallEnvelope;
          }

          // Smooth fade toward each segment's own center (same envelope
          // shape as the waterfall above) instead of a hard on/off cut, so
          // a boat crossing under a bridge deck reads as passing beneath it
          // rather than blinking out and back. When segments overlap, the
          // deepest fade wins.
          let occlusionEnvelope = 0;
          boatPathConfig.occlusionSegments.forEach((segment) => {
            const fraction = segmentFraction(sample.progress, segment);
            if (fraction === null) return;
            const env = Math.sin(fraction * Math.PI);
            if (env > occlusionEnvelope) occlusionEnvelope = env;
          });
          if (occlusionEnvelope > 0) {
            opacity = 1 - occlusionEnvelope * (1 - OCCLUDED_OPACITY);
          }

          if (!reducedMotion) {
            floatOffset = Math.sin(now / 1000 * FLOAT_SPEED + state.motionParams.floatPhase) * FLOAT_AMPLITUDE_PX;
          }
        }

        const screenX = (worldX - worldViewX) * zoom;
        const screenY = (worldY - worldViewY) * zoom;
        const angleDeg = (angleRad * 180) / Math.PI;
        // Subtle splash bulge at the peak of the waterfall crossing -- same
        // shared envelope as the tilt/drop/speed effects above, no new asset.
        const splashBoost = waterfallConfig.splashEnabled ? 1 + waterfallEnvelope * 0.12 : 1;
        const scale = zoom * state.motionParams.scaleVariation * splashBoost;

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
    <>
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
      </div>

      {/*
       * Rendered as a sibling of .root, not a child -- .root sets its own
       * z-index (4, to sit between the map and the HUD/badges), which
       * creates a stacking context that would otherwise trap this card's
       * own z-index (--z-panel, meant to sit above everything) underneath
       * it, no matter how high --z-panel itself is set. Real pointer clicks
       * on the close button landed on the Phaser canvas instead of the
       * button for exactly this reason -- confirmed via elementFromPoint
       * during manual testing, not just a layout guess.
       */}
      {selectedBoat && !suppressed && (
        <BoatMessageCard boat={selectedBoat} anchorRect={selectedRect} onClose={() => setSelectedBoat(null)} />
      )}
    </>
  );
}
