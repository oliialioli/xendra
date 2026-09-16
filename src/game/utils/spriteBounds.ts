import type { Vector2Like } from '../../types/content';

const OPAQUE_ALPHA_THRESHOLD = 200;
/** Max summed per-channel RGB difference still considered "the same flat color" while flood-filling a baked shadow. */
const SHADOW_COLOR_TOLERANCE = 10;

export type OpaqueBounds = {
  /** Pixel bounding box of the building silhouette, excluding shadow and transparent padding. */
  bbox: { x0: number; y0: number; x1: number; y1: number };
  /** Origin fraction (0..1 of the full image) for Phaser's setOrigin -- the building's own bottom-center. */
  origin: Vector2Like;
  imageWidth: number;
  imageHeight: number;
};

/**
 * Reads a landmark artwork's pixels and finds the bounding box of the actual
 * building silhouette, excluding transparent padding *and* any baked drop
 * shadow -- so the sprite's anchor point can sit on the building's own
 * ground line instead of the PNG's raw canvas edges (which a shadow or
 * padding would otherwise pull off-center).
 *
 * Shadows in this art style are cast down-and-right and, in the assets seen
 * so far, are baked as a flat, uniform, *fully opaque* color rather than
 * true alpha transparency -- so an alpha-only threshold can't separate them
 * from the building. This additionally flood-fills a same-color region
 * starting from the opaque pixel furthest toward the bottom-right corner
 * (where a down-right shadow necessarily extends past the building itself)
 * and excludes it. A PNG without that kind of baked shadow is unaffected:
 * the flood fill just stays within the building's own bottom-right corner
 * pixels, which get excluded from a tight opaque bbox anyway only if they
 * happen to be perfectly flat-colored (rare for painted architecture).
 *
 * `anchorMode` picks where in that bbox the returned origin lands:
 * `'bottom-center'` (default) for anything that stands on the ground like a
 * building, or `'center'` for a free-standing round object (e.g. a fountain
 * basin) whose own visual center -- not its ground-contact line -- is the
 * meaningful anchor.
 */
export function analyzeOpaqueBuildingBounds(
  image: HTMLImageElement | HTMLCanvasElement,
  anchorMode: 'bottom-center' | 'center' = 'bottom-center',
): OpaqueBounds {
  const width = 'naturalWidth' in image ? image.naturalWidth || image.width : image.width;
  const height = 'naturalHeight' in image ? image.naturalHeight || image.height : image.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    // Extremely unlikely (canvas 2d unsupported); fall back to the full image as-is.
    return {
      bbox: { x0: 0, y0: 0, x1: width - 1, y1: height - 1 },
      origin: { x: 0.5, y: 1 },
      imageWidth: width,
      imageHeight: height,
    };
  }
  ctx.drawImage(image, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);

  const pixelCount = width * height;
  const opaque = new Uint8Array(pixelCount);
  for (let i = 0; i < pixelCount; i += 1) {
    opaque[i] = data[i * 4 + 3] >= OPAQUE_ALPHA_THRESHOLD ? 1 : 0;
  }

  // Seed the shadow flood-fill at the opaque pixel furthest toward the
  // bottom-right (max x+y) -- the tip of a down-right shadow always wins
  // that race against the building itself.
  let seedIndex = -1;
  let bestScore = -1;
  for (let y = 0; y < height; y += 1) {
    const rowBase = y * width;
    for (let x = 0; x < width; x += 1) {
      const idx = rowBase + x;
      if (!opaque[idx]) continue;
      const score = x + y;
      if (score > bestScore) {
        bestScore = score;
        seedIndex = idx;
      }
    }
  }

  const shadow = new Uint8Array(pixelCount);
  if (seedIndex >= 0) {
    const sr = data[seedIndex * 4];
    const sg = data[seedIndex * 4 + 1];
    const sb = data[seedIndex * 4 + 2];
    const stack: number[] = [seedIndex];
    shadow[seedIndex] = 1;

    while (stack.length > 0) {
      const idx = stack.pop()!;
      const x = idx % width;
      const y = (idx - x) / width;

      const neighbors: Array<[number, number]> = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
        [x - 1, y - 1],
        [x + 1, y - 1],
        [x - 1, y + 1],
        [x + 1, y + 1],
      ];
      for (const [nx, ny] of neighbors) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const nIdx = ny * width + nx;
        if (!opaque[nIdx] || shadow[nIdx]) continue;
        const diff =
          Math.abs(data[nIdx * 4] - sr) +
          Math.abs(data[nIdx * 4 + 1] - sg) +
          Math.abs(data[nIdx * 4 + 2] - sb);
        if (diff <= SHADOW_COLOR_TOLERANCE) {
          shadow[nIdx] = 1;
          stack.push(nIdx);
        }
      }
    }
  }

  let x0 = width;
  let x1 = -1;
  let y0 = height;
  let y1 = -1;
  for (let y = 0; y < height; y += 1) {
    const rowBase = y * width;
    for (let x = 0; x < width; x += 1) {
      const idx = rowBase + x;
      if (opaque[idx] && !shadow[idx]) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }

  // Nothing survived the shadow exclusion (shouldn't happen for a real
  // building asset) -- fall back to the plain opaque bbox so we never
  // divide by a degenerate box.
  if (x1 < x0 || y1 < y0) {
    let ax0 = width;
    let ax1 = -1;
    let ay0 = height;
    let ay1 = -1;
    for (let y = 0; y < height; y += 1) {
      const rowBase = y * width;
      for (let x = 0; x < width; x += 1) {
        if (opaque[rowBase + x]) {
          if (x < ax0) ax0 = x;
          if (x > ax1) ax1 = x;
          if (y < ay0) ay0 = y;
          if (y > ay1) ay1 = y;
        }
      }
    }
    x0 = ax0;
    x1 = ax1;
    y0 = ay0;
    y1 = ay1;
  }

  const anchorX = (x0 + x1) / 2;
  const anchorY = anchorMode === 'center' ? (y0 + y1) / 2 : y1;

  return {
    bbox: { x0, y0, x1, y1 },
    origin: { x: anchorX / width, y: anchorY / height },
    imageWidth: width,
    imageHeight: height,
  };
}
