/**
 * Ruined castle sitting on the island's hill, rendered by MapScene's
 * setUpCastleAsset() the same way the waterfall is overlaid (see
 * dockConfig's waterfallConfig) -- decorative only, no interaction/proximity,
 * no LandmarkId. Its own opaque bounds are analyzed the same way a real
 * landmark building's are (see LANDMARK_ASSET_OVERRIDES in mapGeometry.ts),
 * so `approvedWidth` sizes just the visible ruin silhouette, not the PNG's
 * padded canvas.
 *
 * `x`/`y` (world units) were checked against a composite of the real
 * xendra-map-base-v7-4k.png crop -- nestled right against the bend the
 * path makes crossing the hill, not guessed from the reference image alone.
 */
export const castleConfig = {
  enabled: true,
  assetSrc: '/assets/landmarks/castillo.png',
  x: 1500,
  y: 230,
  approvedWidth: 230,
};
