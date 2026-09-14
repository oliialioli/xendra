/**
 * Geometry for the Xendra island world. Kept separate from illustrative art so the
 * approved map image (or any future replacement/layered art) can change without
 * touching collisions, and collisions can be refined without touching art.
 *
 * All coordinates are in "world units" inside a stable virtual world of
 * WORLD_WIDTH x WORLD_HEIGHT, independent of the pixel size of the source image.
 * See docs/ASSETS.md for how this maps onto xendra-map-base.png.
 */
import type { LandmarkId, Vector2Like } from '../types/content';

export const WORLD_WIDTH = 2560;
export const WORLD_HEIGHT = 1440;

/**
 * Coastline of the island, stored as fractions of the world size (0..1) so it
 * stays correct if WORLD_WIDTH/WORLD_HEIGHT ever change.
 *
 * This was generated (not hand-traced) directly from
 * public/assets/map/xendra-map-base.png: the source PNG was segmented into
 * water/land by color, a morphological opening snapped the two bridge
 * causeways off from the distant mainland patches (leaving each bridge as a
 * short walkable stub attached to the island, rather than a corridor all the
 * way across the river), the whole silhouette was then dilated (its two
 * painted bridge decks are narrower than the coastline's own margin + snail
 * radius, which would otherwise leave no comfortable walking lane down the
 * middle -- a uniform dilation avoids the seams a bridges-only dilation left
 * at the neck where each causeway joins the island), and the result was
 * traced and simplified to 81 points. If the map art changes, regenerate
 * this the same way rather than hand-editing a few points -- see docs/ASSETS.md.
 */
export const ISLAND_POLYGON_NORMALIZED: Vector2Like[] = [
  { x: 0.9844, y: 0.4676 },
  { x: 0.9785, y: 0.4346 },
  { x: 0.9677, y: 0.4017 },
  { x: 0.9199, y: 0.322 },
  { x: 0.9007, y: 0.2954 },
  { x: 0.8696, y: 0.2678 },
  { x: 0.8086, y: 0.2327 },
  { x: 0.7727, y: 0.2189 },
  { x: 0.7584, y: 0.2083 },
  { x: 0.75, y: 0.1955 },
  { x: 0.7452, y: 0.1732 },
  { x: 0.738, y: 0.1605 },
  { x: 0.7327, y: 0.1382 },
  { x: 0.7189, y: 0.1148 },
  { x: 0.6866, y: 0.085 },
  { x: 0.6603, y: 0.0468 },
  { x: 0.6453, y: 0.0372 },
  { x: 0.6286, y: 0.034 },
  { x: 0.5921, y: 0.0425 },
  { x: 0.5209, y: 0.0446 },
  { x: 0.494, y: 0.0531 },
  { x: 0.4456, y: 0.0755 },
  { x: 0.3882, y: 0.0871 },
  { x: 0.3343, y: 0.1169 },
  { x: 0.3056, y: 0.1211 },
  { x: 0.2847, y: 0.1286 },
  { x: 0.2219, y: 0.1775 },
  { x: 0.1818, y: 0.1063 },
  { x: 0.1687, y: 0.0999 },
  { x: 0.1579, y: 0.1041 },
  { x: 0.1483, y: 0.119 },
  { x: 0.1447, y: 0.1339 },
  { x: 0.1447, y: 0.1509 },
  { x: 0.1483, y: 0.1658 },
  { x: 0.1693, y: 0.2083 },
  { x: 0.1352, y: 0.2402 },
  { x: 0.1106, y: 0.2827 },
  { x: 0.073, y: 0.3666 },
  { x: 0.0425, y: 0.4113 },
  { x: 0.0227, y: 0.4825 },
  { x: 0.0179, y: 0.5112 },
  { x: 0.0179, y: 0.5409 },
  { x: 0.0227, y: 0.5611 },
  { x: 0.0335, y: 0.5802 },
  { x: 0.0508, y: 0.5994 },
  { x: 0.07, y: 0.6111 },
  { x: 0.0993, y: 0.6206 },
  { x: 0.1417, y: 0.6557 },
  { x: 0.1788, y: 0.6716 },
  { x: 0.1896, y: 0.6801 },
  { x: 0.1944, y: 0.6886 },
  { x: 0.2022, y: 0.7194 },
  { x: 0.2153, y: 0.7439 },
  { x: 0.2446, y: 0.7779 },
  { x: 0.2745, y: 0.8055 },
  { x: 0.3032, y: 0.8193 },
  { x: 0.3481, y: 0.8204 },
  { x: 0.3852, y: 0.8491 },
  { x: 0.4055, y: 0.8587 },
  { x: 0.4187, y: 0.9989 },
  { x: 0.4803, y: 0.9989 },
  { x: 0.4803, y: 0.9883 },
  { x: 0.4623, y: 0.865 },
  { x: 0.4886, y: 0.8661 },
  { x: 0.5138, y: 0.8735 },
  { x: 0.5365, y: 0.8757 },
  { x: 0.5819, y: 0.864 },
  { x: 0.6184, y: 0.8672 },
  { x: 0.6501, y: 0.864 },
  { x: 0.6705, y: 0.8533 },
  { x: 0.6992, y: 0.8268 },
  { x: 0.753, y: 0.8183 },
  { x: 0.811, y: 0.7875 },
  { x: 0.8487, y: 0.7524 },
  { x: 0.89, y: 0.7226 },
  { x: 0.9282, y: 0.6546 },
  { x: 0.9354, y: 0.6312 },
  { x: 0.942, y: 0.5951 },
  { x: 0.9605, y: 0.5717 },
  { x: 0.9731, y: 0.5484 },
  { x: 0.9833, y: 0.5005 },
];

/** Island coastline in world units, derived from the normalized polygon above. */
export const ISLAND_POLYGON: Vector2Like[] = ISLAND_POLYGON_NORMALIZED.map((p) => ({
  x: p.x * WORLD_WIDTH,
  y: p.y * WORLD_HEIGHT,
}));

/**
 * Interior safety margin (world units) kept between the snail and the actual
 * coastline, so the sprite never looks like it's touching the water. This is
 * on top of the snail's own collision radius (see SNAIL_COLLISION_RADIUS in
 * MapScene.ts), which keeps its whole body clear of the line, not just its center.
 */
export const ISLAND_EDGE_MARGIN = 26;

export type ObstacleRect = { id: string; x: number; y: number; width: number; height: number };
export type ObstacleCircle = { id: string; x: number; y: number; radius: number };

/**
 * Buildings and large props the snail cannot walk through. Rectangles are
 * top-left anchored. xendra-map-base.png has no buildings baked into its art
 * (it's a clean terrain/path canvas -- see LANDMARK_ASSET_OVERRIDES for real
 * artwork placed on top of it), so the only entry here is the kiosk, whose
 * overlay sprite is real geometry the snail should still collide with.
 */
export const OBSTACLE_RECTS: ObstacleRect[] = [
  // Sized to just the kiosk's base/pillars (see KIOSK_CONFIG below), not its
  // full visible silhouette -- the roof overhangs past the walls on every
  // side in this art, and the snail should be able to walk under it.
  { id: 'kiosk-building', x: 448, y: 503, width: 102, height: 59 },
  // Sized to the stage platform + the full bench cluster (see STAGE_CONFIG
  // below), not the whole plaza and not the tall open-air roof truss above
  // the platform. Its bottom edge sits a little above the anchor point (the
  // frontmost bench's own corner), so that point itself -- where the player
  // approaches from the path -- stays walkable.
  { id: 'stage-structure', x: 646, y: 295, width: 286, height: 166 },
];

/** Small round obstacles. Empty for now -- see the OBSTACLE_RECTS comment above. */
export const OBSTACLE_CIRCLES: ObstacleCircle[] = [];

export const SPAWN_POINT: Vector2Like = { x: 1150, y: 780 };

/**
 * Editable placement for the kiosk, expressed as a percentage of the map so
 * it stays meaningful regardless of WORLD_WIDTH/HEIGHT, viewport or zoom.
 * This is the single source of truth for the kiosk: its entry in
 * LANDMARK_POSITIONS below (proximity/interaction) and its artwork's display
 * size in LANDMARK_ASSET_OVERRIDES are both derived from it, so tweaking
 * these three numbers moves the whole kiosk -- art, collision and hotspot --
 * together. Re-tune xPercent/yPercent/widthPercent here; nothing else needs
 * to change.
 */
export const KIOSK_CONFIG = {
  /** Horizontal position, 0-100, percentage of WORLD_WIDTH. */
  xPercent: 19.5,
  /**
   * Vertical position, 0-100, percentage of WORLD_HEIGHT -- the building's
   * own ground-contact point (where its pillars touch the ground), not the
   * center of the PNG canvas, which the shadow and transparent padding would
   * otherwise throw off.
   */
  yPercent: 39.0,
  /**
   * Approved on-screen width (percentage of WORLD_WIDTH) of the *visible
   * building* silhouette only -- not the PNG's full canvas width, which
   * includes transparent padding and a shadow extending past the building.
   */
  widthPercent: 6.092,
};

/**
 * Editable placement for the stage, same pattern as KIOSK_CONFIG above: a
 * single source of truth (percentage of the map) that both
 * LANDMARK_POSITIONS.stage and the artwork's display size in
 * LANDMARK_ASSET_OVERRIDES derive from.
 */
export const STAGE_CONFIG = {
  /** Horizontal position, 0-100, percentage of WORLD_WIDTH. */
  xPercent: 30.8,
  /**
   * Vertical position, 0-100, percentage of WORLD_HEIGHT -- lands on the
   * frontmost bench's own ground-contact corner (the asset's analyzed
   * anchor point), not the center of the PNG canvas.
   */
  yPercent: 32.7,
  /**
   * Approved on-screen width (percentage of WORLD_WIDTH) of the *visible
   * stage + benches* group only -- not the PNG's full canvas width, which
   * includes transparent padding and a shadow extending past them.
   */
  widthPercent: 14,
};

export const LANDMARK_POSITIONS: Record<LandmarkId, Vector2Like> = {
  kiosk: { x: (KIOSK_CONFIG.xPercent / 100) * WORLD_WIDTH, y: (KIOSK_CONFIG.yPercent / 100) * WORLD_HEIGHT },
  stage: { x: (STAGE_CONFIG.xPercent / 100) * WORLD_WIDTH, y: (STAGE_CONFIG.yPercent / 100) * WORLD_HEIGHT },
  school: { x: 1623, y: 543 },
  fountain: { x: 1240, y: 658 },
  trainHistory: { x: 2159, y: 582 },
  bulletinBoard: { x: 988, y: 918 },
  fronton: { x: 1753, y: 933 },
  postbox: { x: 543, y: 781 },
};

export const LANDMARK_INTERACTION_RADIUS = 110;

/**
 * World-unit distance at which a landmark's discovery badge auto-expands
 * (see landmarkIndicatorConfig.tsx) and, for landmarks with a lights overlay
 * (see LandmarkAssetConfig.lightsPath below), at which that overlay ignites.
 * Always larger than LANDMARK_INTERACTION_RADIUS so both anticipate what the
 * player is about to reach rather than only confirming it once they arrive.
 */
export const LANDMARK_REVEAL_RADIUS = 180;

export type LandmarkAssetConfig = {
  /** Path under /public to a real artwork PNG (transparent padding, and a baked semi-transparent drop shadow, are both fine -- see analyzeOpaqueBuildingBounds). */
  path: string;
  /**
   * Optional path to a second PNG on the *exact same canvas* as `path` (same
   * pixel dimensions, same alignment) containing only a glow/lighting layer
   * to composite on top -- e.g. a stage's lamps lit up. Placed using the
   * identical anchor, scale and depth as the base sprite (derived from
   * `path`'s own analysis, never recomputed separately), so the two can
   * never drift apart across zoom or viewport changes. Starts fully
   * transparent; MapScene fades it in/out by proximity -- see
   * `landmarkLights` there.
   */
  lightsPath?: string;
  /**
   * Desired on-screen width (world units) of the *visible building*
   * silhouette only -- not the PNG's full canvas width, which can include
   * transparent padding and a shadow extending past the building itself.
   * The sprite's own display size is derived from this at load time using
   * the asset's analyzed opaque bounding box (aspect ratio preserved, never
   * cropped), so the shadow/padding ratio of the source file doesn't change
   * how big the building reads in-game.
   */
  approvedBuildingWidth: number;
  /**
   * Purely visual nudge (world units) applied on top of the landmark's own
   * position when placing this sprite, in case the analyzed anchor needs a
   * small manual correction. {0, 0} means the sprite's analyzed ground-anchor
   * point lands exactly on LANDMARK_POSITIONS[id].
   */
  renderOffset: Vector2Like;
};

/**
 * Real artwork overlaid on top of the base map for specific landmarks.
 * xendra-map-base.png ships with no buildings baked in, so every landmark
 * that should show a real building needs an entry here; a landmark not
 * listed here simply has no visible structure yet on the base map.
 *
 * Each asset's anchor point (where it lands on `LANDMARK_POSITIONS`) is
 * computed once, when the texture loads, by analyzing its actual opaque
 * pixels -- see analyzeOpaqueBuildingBounds() and
 * MapScene.setUpLandmarkAssetSprites(). Nothing here hand-specifies an
 * origin, so swapping in a re-cropped or differently-sized PNG later needs
 * no config changes beyond the path and the approved building width.
 */
export const LANDMARK_ASSET_OVERRIDES: Partial<Record<LandmarkId, LandmarkAssetConfig>> = {
  kiosk: {
    path: '/assets/landmarks/kiosco-xendra.png',
    approvedBuildingWidth: (KIOSK_CONFIG.widthPercent / 100) * WORLD_WIDTH,
    renderOffset: { x: 0, y: 0 },
  },
  stage: {
    path: '/assets/landmarks/escenario-xendra.png',
    lightsPath: '/assets/landmarks/escenario-xendra-luces.png',
    approvedBuildingWidth: (STAGE_CONFIG.widthPercent / 100) * WORLD_WIDTH,
    renderOffset: { x: 0, y: 0 },
  },
};
