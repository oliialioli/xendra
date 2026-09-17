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
  // Sized to the music school's own building footprint (see SCHOOL_CONFIG
  // below), inset slightly from the analyzed silhouette so its roof's own
  // edge lip stays walkable-adjacent, with its bottom edge a little above
  // the anchor point (the entrance) so the player can approach from the front.
  { id: 'school-building', x: 1496, y: 350, width: 286, height: 223 },
];

/**
 * Small round obstacles -- currently just the fountain's own outer basin
 * (see FOUNTAIN_CONFIG below), centered on the same plaza-center point as
 * LANDMARK_POSITIONS.fountain. Arcade physics only supports circular
 * bodies, so this can't match the basin's slightly elliptical isometric
 * footprint exactly; the radius favors the basin's shorter (vertical) extent
 * so the snail can never visually overlap the front/back rim, at the cost of
 * a little unused walkable slack at the basin's left/right.
 */
export const OBSTACLE_CIRCLES: ObstacleCircle[] = [
  { id: 'fountain-basin', x: 1235, y: 692, radius: 85 },
];

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

/**
 * Editable placement for the music school, same pattern as KIOSK_CONFIG /
 * STAGE_CONFIG above. Starting values converted from a 1672x941 reference
 * screenshot the band measured coordinates on (x:1105, y:420, ~205-220px
 * wide there) into this project's actual WORLD_WIDTH/HEIGHT, then nudged
 * slightly once checked against the real plaza artwork.
 */
export const SCHOOL_CONFIG = {
  /** Horizontal position, 0-100, percentage of WORLD_WIDTH. */
  xPercent: 64.0,
  /**
   * Vertical position, 0-100, percentage of WORLD_HEIGHT -- the building's
   * own ground-contact point (bottom-center of its analyzed silhouette), not
   * the center of the PNG canvas.
   */
  yPercent: 40.9,
  /**
   * Approved on-screen width (percentage of WORLD_WIDTH) of the *visible
   * building* silhouette only -- not the PNG's full canvas width, which
   * includes transparent padding.
   */
  widthPercent: 12.948,
};

/**
 * Editable placement for the fountain, same pattern as KIOSK_CONFIG /
 * STAGE_CONFIG / SCHOOL_CONFIG above, with one difference: the fountain is a
 * free-standing round object, not a building standing on a ground line, so
 * its own visual anchor is its analyzed *center* (see `anchorMode: 'center'`
 * on its LANDMARK_ASSET_OVERRIDES entry below), not a bottom-center
 * ground-contact point.
 *
 * xPercent/yPercent land on the plaza's own geometric center -- found by
 * sampling xendra-map-base.png's paved/grass boundary around the plaza from
 * several directions and fitting an ellipse to those edges, the same
 * approach used to place the music school -- not the raw center of the
 * fountain PNG's canvas, which has uneven transparent padding.
 */
export const FOUNTAIN_CONFIG = {
  /** Horizontal position, 0-100, percentage of WORLD_WIDTH -- the plaza's own center. */
  xPercent: 48.24,
  /** Vertical position, 0-100, percentage of WORLD_HEIGHT -- the plaza's own center. */
  yPercent: 48.06,
  /**
   * Approved on-screen width (percentage of WORLD_WIDTH) of the *visible
   * basin* silhouette only -- not the PNG's full canvas width, which
   * includes transparent padding. Leaves comfortable walking room around the
   * fountain within the plaza on every side.
   */
  widthPercent: 7.0,
  /**
   * Visual-only nudge (world units) applied on top of {xPercent, yPercent}
   * when placing the artwork, in case the asset's own analyzed center needs
   * a small manual correction to sit exactly on the plaza's circle. The
   * interaction/collision anchor (LANDMARK_POSITIONS.fountain) is derived
   * from {xPercent, yPercent} alone and is untouched by this.
   */
  offsetX: 0,
  offsetY: 0,
};

/**
 * Approved on-screen width (percentage of WORLD_WIDTH) of the messages-dock
 * house's *visible building* silhouette only -- same convention as
 * KIOSK_CONFIG/SCHOOL_CONFIG/FOUNTAIN_CONFIG's own widthPercent above. Not a
 * full *_CONFIG object like those: the house's position is
 * LANDMARK_POSITIONS.dockMessages (== dockConfig.dockPosition) directly,
 * already the single source of truth for that landmark's interaction
 * hotspot -- this constant only sizes the artwork, it doesn't duplicate the
 * position.
 */
export const HOUSE_WIDTH_PERCENT = 5.86;

export const LANDMARK_POSITIONS: Record<LandmarkId, Vector2Like> = {
  kiosk: { x: (KIOSK_CONFIG.xPercent / 100) * WORLD_WIDTH, y: (KIOSK_CONFIG.yPercent / 100) * WORLD_HEIGHT },
  stage: { x: (STAGE_CONFIG.xPercent / 100) * WORLD_WIDTH, y: (STAGE_CONFIG.yPercent / 100) * WORLD_HEIGHT },
  school: { x: (SCHOOL_CONFIG.xPercent / 100) * WORLD_WIDTH, y: (SCHOOL_CONFIG.yPercent / 100) * WORLD_HEIGHT },
  fountain: { x: (FOUNTAIN_CONFIG.xPercent / 100) * WORLD_WIDTH, y: (FOUNTAIN_CONFIG.yPercent / 100) * WORLD_HEIGHT },
  trainHistory: { x: 2159, y: 582 },
  bulletinBoard: { x: 988, y: 918 },
  // dockMessages' own position lives in dockConfig.ts (dockPosition) --
  // kept there, not here, since it needs to be shared with the boat
  // launch/river-entry logic without this file importing that one.
  dockMessages: { x: 1800, y: 1025 },
  postbox: { x: 543, y: 781 },
};

export const LANDMARK_INTERACTION_RADIUS = 110;

/**
 * The fountain's own interaction radius -- a comfortable margin larger than
 * its OBSTACLE_CIRCLES collision radius above (85), so the interact prompt
 * reaches just past the rim itself rather than requiring the snail to
 * already be touching the stone.
 */
export const FOUNTAIN_INTERACTION_RADIUS = 130;

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
  /**
   * Where in the analyzed opaque bounding box the sprite's origin lands --
   * `'bottom-center'` (default when omitted) for anything standing on the
   * ground, `'center'` for a free-standing round object whose own visual
   * center is the meaningful anchor (currently just the fountain).
   */
  anchorMode?: 'bottom-center' | 'center';
  /**
   * Opts this sprite into a subtle proximity "glow" pulse (see
   * MapScene.updateLandmarkGlow) instead of a full second lit-state artwork
   * (LandmarkAssetConfig.lightsPath) -- for a landmark with only one PNG that
   * should still react faintly (brighter highlights) as the snail
   * approaches. Reuses the base sprite itself; no second asset needed.
   */
  proximityGlow?: boolean;
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
    proximityGlow: true,
  },
  // Stage gets its own dedicated lit-state artwork (lightsPath) instead of
  // proximityGlow -- a real "lamps turning on" image reads better than a
  // generic highlight for a landmark that's specifically about its lights.
  stage: {
    path: '/assets/landmarks/escenario-xendra.png',
    lightsPath: '/assets/landmarks/escenario-xendra-luces.png',
    approvedBuildingWidth: (STAGE_CONFIG.widthPercent / 100) * WORLD_WIDTH,
    renderOffset: { x: 0, y: 0 },
  },
  // "default" state art. A future "active" state
  // (escuela-musica-xendra-active.png) will reuse this exact position, size
  // and anchor -- no config changes needed beyond adding its own path once
  // that asset exists.
  school: {
    path: '/assets/landmarks/escuela-musica-xendra-default.png',
    approvedBuildingWidth: (SCHOOL_CONFIG.widthPercent / 100) * WORLD_WIDTH,
    renderOffset: { x: 0, y: 0 },
    proximityGlow: true,
  },
  fountain: {
    path: '/assets/landmarks/fuente-xendra.png',
    approvedBuildingWidth: (FOUNTAIN_CONFIG.widthPercent / 100) * WORLD_WIDTH,
    renderOffset: { x: FOUNTAIN_CONFIG.offsetX, y: FOUNTAIN_CONFIG.offsetY },
    anchorMode: 'center',
    proximityGlow: true,
  },
  // The messages-dock's house, replacing the provisional bare pencil badge
  // with a real building -- same bottom-center-anchor pattern as every
  // other landmark here. Position comes from LANDMARK_POSITIONS.dockMessages
  // (== dockConfig.dockPosition), verified against the actual river-bend
  // clearing on xendra-map-base-v7-4k.png, not guessed from a reference image.
  dockMessages: {
    path: '/assets/landmarks/casa_rio.png',
    approvedBuildingWidth: (HOUSE_WIDTH_PERCENT / 100) * WORLD_WIDTH,
    renderOffset: { x: 0, y: 0 },
    proximityGlow: true,
  },
};
