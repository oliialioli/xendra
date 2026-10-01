/**
 * Campfire ring with three logs in the round dirt clearing just below the
 * train (south of the track, east of the fountain plaza) -- decorative only,
 * rendered by MapScene the same way as the castle (see castleConfig): no
 * interaction, its own depth so the snail can walk around it, and a small
 * collider on the fire ring (OBSTACLE_CIRCLES in mapGeometry.ts).
 *
 * Cut from the same illustration as the train (tren.png) and kept at the
 * same scale, 0.242 world units per source pixel. `x`/`y` is the bottom-centre
 * of the logs, chosen so the stone ring lands at (2150, 680), the middle of
 * the clearing, as measured on xendra-map-base-v7-4k.png.
 */
export const campfireConfig = {
  enabled: true,
  assetSrc: '/assets/landmarks/fogata.png',
  x: 2162,
  y: 710,
  approvedWidth: 151,
};
