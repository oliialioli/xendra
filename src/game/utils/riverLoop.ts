import Phaser from 'phaser';
import type { Vector2Like } from '../../types/content';

/** A closed polyline sampled by arc length, progress 0-1 -- same as the boats' path. */
export class RiverLoop {
  private readonly points: Vector2Like[];
  private readonly cumulative: number[] = [0];
  readonly length: number;

  constructor(points: Vector2Like[]) {
    this.points = [...points, points[0]];
    for (let i = 1; i < this.points.length; i += 1) {
      const a = this.points[i - 1];
      const b = this.points[i];
      this.cumulative.push(this.cumulative[i - 1] + Math.hypot(b.x - a.x, b.y - a.y));
    }
    this.length = this.cumulative[this.cumulative.length - 1];
  }

  sample(progress: number): { x: number; y: number; angle: number } {
    const target = Phaser.Math.Wrap(progress, 0, 1) * this.length;
    let i = 1;
    while (i < this.cumulative.length - 1 && this.cumulative[i] < target) i += 1;
    const a = this.points[i - 1];
    const b = this.points[i];
    const span = this.cumulative[i] - this.cumulative[i - 1] || 1;
    const t = (target - this.cumulative[i - 1]) / span;
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, angle: Math.atan2(b.y - a.y, b.x - a.x) };
  }
}
