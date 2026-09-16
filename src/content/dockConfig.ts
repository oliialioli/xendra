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
 * Future dock/pier/rocks/weir/waterfall artwork, overlaid the same way
 * LANDMARK_ASSET_OVERRIDES places real landmark art (see MapScene's
 * setUpDockAsset) -- but kept fully separate from that system since this
 * asset's anchor is meant to be placed by hand (x/y/scale/anchor), not
 * derived from analyzing the image's own opaque bounds like a building.
 *
 * While `enabled` is false (the only state right now, since no asset
 * exists yet) MapScene's setUpDockAsset() is a no-op: no broken image, no
 * placeholder, no reserved layout space. The boat launch/river-entry
 * experience never depends on this being enabled.
 *
 * To activate once the real PNG/WebP exists:
 * 1. Drop the file under public/assets/landmarks/ (or public/assets/map/).
 * 2. Set `src` to its /assets/... path.
 * 3. Set `x`/`y` (world units) to where its anchor point should land --
 *    dockPosition above is a reasonable starting point.
 * 4. Set `scale` (1 = the image's natural pixel size in world units).
 * 5. Set `anchorX`/`anchorY` (0-1 fraction of the image itself) to its own
 *    visual ground-contact point.
 * 6. Set `enabled: true`.
 * No other file needs to change.
 */
export const dockAssetConfig = {
  enabled: false,
  src: null as string | null,
  x: 0,
  y: 0,
  scale: 1,
  anchorX: 0.5,
  anchorY: 1,
};

/**
 * The future waterfall/weir crossing the river, downstream of the dock.
 * Stays fully inert while `enabled` is false: boats cross `segmentStart`..
 * `segmentEnd` (boatPathConfig progress values) with completely normal
 * movement, no tilt/speed/drop/splash. See boatPathConfig's
 * `waterfallSegment` for how a boat's per-frame progress is checked against
 * this. Do not set real segment values from a screenshot alone -- confirm
 * against the actual river art once it exists, the same way the dock's own
 * position was confirmed against the live map rather than a reference image.
 */
export const waterfallConfig = {
  enabled: false,
  segmentStart: 0,
  segmentEnd: 0,
  /** Degrees the boat's outer container tilts while inside the segment. */
  tilt: 0,
  speedMultiplier: 1,
  /** World units the boat visually drops while inside the segment. */
  dropDistance: 0,
  splashEnabled: false,
};
