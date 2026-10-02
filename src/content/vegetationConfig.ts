import type { VegetationKind } from '../game/utils/vegetationArt';

export type VegetationItem = {
  kind: VegetationKind;
  /** World point where it meets the ground (its base). */
  x: number;
  y: number;
  /** Size relative to the kind's own frame. */
  scale: number;
  /** Mirrored horizontally, so repeated shapes don't look copy-pasted. */
  flip?: boolean;
};

/**
 * Every tree, bush and clump of reeds on the map, drawn by
 * game/utils/vegetationArt.ts and placed by game/systems/vegetation.ts.
 *
 * Positions follow the band's map reference (vegetation-reference, the same
 * composition as xendra-map-base-v7-4k.png at 2000px wide, so world = ref x
 * 1.28), each then checked against the real map: trees and bushes moved to
 * the nearest spot whose whole footprint is grass and clear of landmarks,
 * reeds to the nearest bit of bank with water right beside it.
 */
export const VEGETATION: VegetationItem[] = [
  { kind: 'cypress', x: 598, y: 326, scale: 0.95, flip: true },
  { kind: 'cypress', x: 949, y: 317, scale: 1.05, flip: true },
  { kind: 'bush', x: 958, y: 348, scale: 1.01, flip: true },
  { kind: 'cypress', x: 1178, y: 288, scale: 0.87 },
  { kind: 'bush', x: 1226, y: 294, scale: 0.86, flip: true },
  { kind: 'bush', x: 1295, y: 230, scale: 0.87, flip: true },
  { kind: 'bush', x: 1062, y: 198, scale: 0.98 },
  { kind: 'cypress', x: 1408, y: 128, scale: 0.89, flip: true },
  { kind: 'cypress', x: 1523, y: 102, scale: 1.04 },
  { kind: 'bush', x: 1491, y: 361, scale: 1.02, flip: true },
  { kind: 'bush', x: 1399, y: 346, scale: 1.14, flip: true },
  { kind: 'cypress', x: 1628, y: 339, scale: 1.11, flip: true },
  { kind: 'bush', x: 1719, y: 166, scale: 0.89, flip: true },
  { kind: 'bush', x: 1743, y: 192, scale: 0.94 },
  { kind: 'cypress', x: 1880, y: 322, scale: 0.9 },
  { kind: 'cypress', x: 1918, y: 350, scale: 1.04, flip: true },
  { kind: 'reeds', x: 1983, y: 327, scale: 1.01, flip: true },
  { kind: 'reeds', x: 2038, y: 361, scale: 0.87, flip: true },
  { kind: 'tree', x: 1759, y: 467, scale: 1.05, flip: true },
  { kind: 'bush', x: 2172, y: 454, scale: 0.94 },
  { kind: 'bush', x: 1798, y: 602, scale: 0.99, flip: true },
  { kind: 'bush', x: 1446, y: 593, scale: 1.09 },
  { kind: 'cypress', x: 1463, y: 572, scale: 0.92 },
  { kind: 'tree', x: 1992, y: 672, scale: 1.01 },
  { kind: 'tree', x: 2368, y: 634, scale: 1.07, flip: true },
  { kind: 'bush', x: 2406, y: 653, scale: 1.14, flip: true },
  { kind: 'reeds', x: 2386, y: 539, scale: 0.98 },
  { kind: 'reeds', x: 2464, y: 755, scale: 0.9, flip: true },
  { kind: 'cypress', x: 2218, y: 845, scale: 0.86 },
  { kind: 'bush', x: 2253, y: 851, scale: 1.08 },
  { kind: 'cypress', x: 2057, y: 922, scale: 1.11, flip: true },
  { kind: 'bush', x: 2314, y: 826, scale: 1.06 },
  { kind: 'cypress', x: 1318, y: 845, scale: 1.02, flip: true },
  { kind: 'bush', x: 1254, y: 851, scale: 1.1 },
  { kind: 'tree', x: 1037, y: 640, scale: 0.99 },
  { kind: 'cypress', x: 593, y: 506, scale: 0.87 },
  { kind: 'bush', x: 607, y: 515, scale: 1.04 },
  { kind: 'tree', x: 381, y: 582, scale: 1.1, flip: true },
  { kind: 'bush', x: 374, y: 439, scale: 0.97 },
  { kind: 'reeds', x: 203, y: 558, scale: 0.86, flip: true },
  { kind: 'cypress', x: 461, y: 851, scale: 0.9, flip: true },
  { kind: 'bush', x: 483, y: 892, scale: 0.87 },
  { kind: 'reeds', x: 335, y: 886, scale: 0.89, flip: true },
  { kind: 'tree', x: 861, y: 998, scale: 0.97 },
  { kind: 'bush', x: 899, y: 1007, scale: 0.87, flip: true },
  { kind: 'reeds', x: 591, y: 1044, scale: 1.01 },
  { kind: 'cypress', x: 1587, y: 998, scale: 1.1 },
  { kind: 'bush', x: 1610, y: 1018, scale: 0.93, flip: true },
  { kind: 'reeds', x: 1918, y: 1140, scale: 0.96 },
  { kind: 'reeds', x: 1287, y: 1223, scale: 1.14, flip: true },
  { kind: 'tree', x: 211, y: 38, scale: 0.9, flip: true },
  { kind: 'cypress', x: 273, y: 58, scale: 0.92, flip: true },
  { kind: 'cypress', x: 73, y: 126, scale: 1.03, flip: true },
  { kind: 'tree', x: 2246, y: 51, scale: 0.85, flip: true },
  { kind: 'cypress', x: 2326, y: 97, scale: 0.96 },
  { kind: 'cypress', x: 2386, y: 149, scale: 1.14 },
  { kind: 'cypress', x: 81, y: 1188, scale: 1.0 },
  { kind: 'tree', x: 314, y: 1293, scale: 1.05, flip: true },
  { kind: 'cypress', x: 412, y: 1300, scale: 1.12 },
  { kind: 'cypress', x: 446, y: 1319, scale: 1.11 },
  { kind: 'tree', x: 2323, y: 1286, scale: 0.97, flip: true },
  { kind: 'cypress', x: 2432, y: 1338, scale: 0.88 },
  { kind: 'cypress', x: 2490, y: 1357, scale: 0.87, flip: true },
  { kind: 'cypress', x: 2131, y: 1370, scale: 0.91, flip: true },
  { kind: 'reeds', x: 686, y: 1397, scale: 0.95, flip: true },
];

/** On-map size of each kind relative to its frame, matched to the reference against the landmarks (e.g. a round tree about half the kiosk's width). */
export const VEGETATION_KIND_SCALE: Record<VegetationKind, number> = {
  cypress: 1.15,
  tree: 1.7,
  bush: 1.5,
  reeds: 1.2,
};

/** Trunk radius (world units, at scale 1) the snail can't walk through; bushes and reeds have none. */
export const TRUNK_RADIUS: Partial<Record<VegetationKind, number>> = {
  cypress: 6,
  tree: 6,
};
