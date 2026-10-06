import type { Vector2Like } from '../types/content';
import { WORLD_WIDTH, WORLD_HEIGHT, LANDMARK_INTERACTION_RADIUS } from './mapGeometry';

/**
 * Editable placement for the message dock (the paper-boat workshop), same
 * percent-of-world pattern as KIOSK_CONFIG/STAGE_CONFIG/SCHOOL_CONFIG in
 * mapGeometry.ts: the workshop stands on the plaza baked into
 * xendra-map-base-v7-4k.png (where the old `fronton` landmark was -- see
 * LandmarkId's `dockMessages` doc comment), a path leads down to the pier
 * (pierConfig) and boats are launched off its end (`launchPoint`), joining
 * the river at boatPathConfig.launchProgress. World units throughout.
 */
export const dockConfig = {
  /**
   * Horizontal position, 0-100, percentage of WORLD_WIDTH: the bottom-centre
   * of caseta-ontziak.png's silhouette (its bench and tufts included), placed
   * so the shed itself stands in the middle of the plaza.
   */
  xPercent: 69.61,
  /** Vertical position, 0-100, percentage of WORLD_HEIGHT -- see xPercent. */
  yPercent: 70.49,
  interactionRadius: LANDMARK_INTERACTION_RADIUS,
  /** The far end of the pier (pierConfig below): boats are set on the water there. */
  launchPoint: { x: 2036, y: 1150 } as Vector2Like,
};

/**
 * The sandy path from the front of the workshop's plaza down to the
 * riverbank and the little wooden pier the boats are launched from -- one ground-level image
 * (ontzi-kaia.png) laid over the base map like the bridges, under every
 * y-sorted sprite so the snail walks on it. `x`/`y` is its top-left corner
 * and `width`/`height` its size, all in world units (the image covers
 * xendra-map-base-v7-4k.png's pixels 2610-3150 x 1510-1800 at 2x).
 */
/**
 * The workshop's plaza, fitted around the house: the base map's plaza was
 * much bigger than the house, so this image paints grass back over it and
 * draws a smaller plaza (on the map's isometric axes) with the left-hand
 * path continued into it. Same placement convention as pierConfig, drawn
 * just under it; covers xendra-map-base-v7-4k.png's pixels 2330-3050 x
 * 1270-1650 at 2x.
 */
export const plazaConfig = {
  src: '/assets/map/ontzi-plaza.png',
  x: 2330 / 1.5,
  y: 1270 / 1.5,
  width: 720 / 1.5,
  height: 380 / 1.5,
};

export const pierConfig = {
  src: '/assets/map/ontzi-kaia.png',
  x: 2610 / 1.5,
  y: 1510 / 1.5,
  width: 540 / 1.5,
  height: 290 / 1.5,
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
 * `segmentStart`/`segmentEnd` are boatPathConfig progress values (0-1)
 * bracketing the stretch where a boat leaves the river path and takes
 * `route` instead: round the big rock, into the pool above the right-hand
 * fall, over its lip, down into the foam and back out to the path (see
 * features/boats/waterfallRoute.ts). Route points are world units, checked
 * against a composite of xendra-map-base-v7-4k.png with cascada.png at this
 * exact x/y/scale -- re-check them if either moves. A boat's position is its
 * centre, so points sit a little above the water line its hull rests on.
 */
export const waterfallConfig = {
  enabled: true,
  assetSrc: '/assets/landmarks/cascada.png',
  // Placed so the rocks span the river: the left one on the north bank,
  // the right ones touching the south bank (segment values follow it,
  // ~7.2 world units per 0.001 progress).
  x: 1888,
  y: 1211,
  scale: 0.32,
  rotation: 0,
  anchorX: 0.5,
  anchorY: 0.5,
  segmentStart: 0.8244,
  segmentEnd: 0.875,
  /**
   * In travel order, between the path at segmentEnd and at segmentStart
   * (both added from the path itself). `pace` is how fast the leg leading
   * *to* that point goes (1 = river speed); `fall` marks the drop.
   */
  route: [
    { x: 2027, y: 1195, pace: 1 },
    { x: 1965, y: 1201, pace: 0.85 },
    // The lip: it slows a touch before tipping over...
    { x: 1921, y: 1205, pace: 0.6 },
    // ...and drops.
    { x: 1909, y: 1265, pace: 3.4, fall: true },
    { x: 1865, y: 1288, pace: 1.2 },
  ] as WaterfallRoutePoint[],
  /** World units after landing over which the boat bobs and its splash bulges. */
  splashDistance: 34,
};

export type WaterfallRoutePoint = Vector2Like & { pace: number; fall?: boolean };
