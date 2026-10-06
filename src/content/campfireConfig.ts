/**
 * Campfire ring with three logs in the round dirt clearing just below the
 * train (south of the track, east of the fountain plaza) -- decorative only,
 * rendered by MapScene the same way as the castle (see castleConfig): no
 * interaction, its own depth so the snail can walk around it, and a small
 * collider on the fire ring (OBSTACLE_CIRCLES in mapGeometry.ts).
 *
 * Cut from the same illustration as the train (tren.webp) and kept at the
 * same scale, 0.242 world units per source pixel. `x`/`y` is the bottom-centre
 * of the logs, chosen so the stone ring lands at (2150, 680), the middle of
 * the clearing, as measured on xendra-map-base-v7-4k.webp.
 *
 * The art is split in two on the same 512x512 canvas: `assetSrc` is the
 * unlit fire (stones, ash, logs -- the back stones the flame used to hide
 * were rebuilt from the ring's own stones) and `flameSrc` the flame alone,
 * which the Campfire entity lights, flickers and puts out as the snail comes
 * and goes. `flameBasePx` is the flame's bottom-centre in that canvas.
 */
export const campfireConfig = {
  enabled: true,
  assetSrc: '/assets/landmarks/fogata-base.webp',
  flameSrc: '/assets/landmarks/fogata-llama.png',
  flameBasePx: { x: 233, y: 384 },
  x: 2162,
  y: 710,
  approvedWidth: 151,
};
