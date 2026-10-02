import { describe, expect, it } from 'vitest';
import { PHYSICS, PLAYER } from './config';
import { ROUTE, SOLIDS } from './level';

/**
 * The snail's full, held jump at top running speed, integrated the same way
 * the engine does: for each horizontal distance travelled, how high its
 * underside is above the take-off surface.
 */
function jumpArc(): { dx: number; height: number }[] {
  const arc: { dx: number; height: number }[] = [];
  let x = 0;
  let y = 0;
  let vy = -PHYSICS.jumpSpeed;
  while (y <= 0 || vy < 0) {
    vy = Math.min(PHYSICS.maxFall, vy + PHYSICS.gravity * PHYSICS.step);
    x += PHYSICS.runSpeed * PHYSICS.step;
    y += vy * PHYSICS.step;
    arc.push({ dx: x, height: -y });
    if (y > 400) break;
  }
  return arc;
}

describe('castle level', () => {
  const arc = jumpArc();

  it('has a jump of roughly 130 up and 180 across', () => {
    const apex = Math.max(...arc.map((p) => p.height));
    const across = arc.filter((p) => p.height >= 0).at(-1)!.dx;
    expect(apex).toBeGreaterThan(125);
    expect(across).toBeGreaterThan(170);
  });

  it('only asks for jumps the snail can make, with room to spare', () => {
    for (let i = 0; i < ROUTE.length - 1; i += 1) {
      const from = SOLIDS[ROUTE[i]];
      const to = SOLIDS[ROUTE[i + 1]];
      // Taking off with the snail's back end still on the edge, it has to
      // get its front end past the gap, its underside above the far top.
      const across = to.x - (from.x + from.w) + PLAYER.width + 10;
      const rise = from.y - to.y + 10;
      const point = arc.find((p) => p.dx >= across);
      expect(point, `jump ${i} (${from.x}->${to.x}) is too long`).toBeDefined();
      expect(point!.height, `jump ${i} (${from.x}->${to.x}) is too high`).toBeGreaterThanOrEqual(rise);
    }
  });
});
