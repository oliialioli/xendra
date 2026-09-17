import type { Vector2Like } from '../types/content';
import { WORLD_WIDTH, WORLD_HEIGHT, LANDMARK_INTERACTION_RADIUS } from './mapGeometry';

/**
 * Editable placement for the message dock, same percent-of-world pattern as
 * KIOSK_CONFIG/STAGE_CONFIG/SCHOOL_CONFIG/FOUNTAIN_CONFIG in mapGeometry.ts.
 * This reuses the exact spot the old `fronton` landmark stood at (see
 * LandmarkId's `dockMessages` doc comment in types/content.ts for why) --
 * lower-right of the island, just below and right of the music school,
 * inside the path loop, near the lower-right riverbank -- until the real
 * dock/pier artwork exists.
 *
 * `interactionRadius` is this landmark's own value (used by
 * xendraContent.ts instead of the shared LANDMARK_INTERACTION_RADIUS),
 * kept identical to the old default for now -- tune independently once the
 * real dock footprint is known.
 *
 * `launchPoint` is where a newly-sent boat visually appears (the dock spot
 * itself). `riverEntryPoint` is where it merges onto boatPathConfig's route
 * -- computed as the closest point on the island's own coastline
 * (mapGeometry's ISLAND_POLYGON, vertex index 70) pushed outward by
 * boatPathConfig's own RIVER_PATH_MARGIN (see that file), so it lands
 * exactly on the path rather than needing a second hand-tuned margin here.
 * Both points are in world units, independent of viewport/zoom.
 */
export const dockConfig = {
  /** Horizontal position, 0-100, percentage of WORLD_WIDTH. */
  xPercent: 68.48,
  /** Vertical position, 0-100, percentage of WORLD_HEIGHT. */
  yPercent: 64.79,
  interactionRadius: LANDMARK_INTERACTION_RADIUS,
  launchPoint: { x: 1753, y: 933 } as Vector2Like,
  riverEntryPoint: { x: 1811, y: 1263 } as Vector2Like,
};

export const dockPosition: Vector2Like = {
  x: (dockConfig.xPercent / 100) * WORLD_WIDTH,
  y: (dockConfig.yPercent / 100) * WORLD_HEIGHT,
};

/**
 * The waterfall/weir crossing the river just downstream of the dock,
 * rendered by MapScene's setUpWaterfallAsset() the same way a landmark's
 * real artwork is overlaid on the base map (see LANDMARK_ASSET_OVERRIDES in
 * mapGeometry.ts) -- but kept fully separate from that system since this
 * asset isn't a "landmark" (no interaction/proximity) and its anchor is
 * placed by hand (x/y/scale/rotation/anchor), not derived from analyzing
 * the image's own opaque bounds like a building.
 *
 * `x`/`y` reuse dockConfig.riverEntryPoint directly rather than a second
 * hand-picked point: that's already the river-path progress nearest the
 * dock (see boatPathConfig's own `launchProgress`), verified to fall on a
 * clean, bridge-free stretch of xendra-map-base-v7-4k.png's river -- not
 * guessed from the Figma composition reference, which was used only to
 * find *which* stretch of river to target, never for literal coordinates.
 *
 * `segmentStart`/`segmentEnd` are boatPathConfig progress values (0-1)
 * bracketing the same stretch, derived from how far a fixed world-unit
 * distance corresponds to in path progress right here (~7.2 world units of
 * river per 0.001 progress) -- see BoatFleet's tick loop for how a boat's
 * per-frame progress is compared against this range through a smooth 0->1->0
 * envelope (Math.sin), not a hard on/off step, so crossing the falls never
 * visibly pops. `boatPathConfig.occlusionSegments` has a matching (narrower)
 * entry for fading a boat while it's visually behind the rock cluster.
 *
 * If the asset, its scale, or the river art itself ever changes, re-verify
 * `x`/`y`/`scale`/`segmentStart`/`segmentEnd` against the live map (e.g. via
 * MapScene's debug overlay, press `D`) rather than adjusting them from a
 * screenshot alone.
 */
export const waterfallConfig = {
  enabled: true,
  assetSrc: '/assets/landmarks/cascada.png',
  x: dockConfig.riverEntryPoint.x,
  y: dockConfig.riverEntryPoint.y,
  scale: 0.32,
  rotation: 0,
  anchorX: 0.5,
  anchorY: 0.5,
  segmentStart: 0.8354,
  segmentEnd: 0.8654,
  /** Degrees the boat's outer container tilts at the peak of the crossing envelope. */
  tilt: 8,
  speedMultiplier: 1.18,
  /** World units the boat visually drops at the peak of the crossing envelope. */
  dropDistance: 14,
  splashEnabled: true,
};
