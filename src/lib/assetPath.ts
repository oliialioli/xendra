/**
 * Prefixes a root-relative public asset path with Vite's configured base
 * ("/" now that the site has its own domain; it was "/xendra/" on
 * <user>.github.io). Vite only rewrites paths
 * it processes at build time (imports, index.html) -- not runtime string
 * literals like the ones Phaser's loader and <img src> use, so those need
 * this applied explicitly.
 */
export function assetPath(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}
