import type { Vector2Like } from '../../types/content';
import { boatPathConfig } from '../../content/boatPathConfig';
import { waterfallConfig, type WaterfallRoutePoint } from '../../content/dockConfig';
import { samplePathAtProgress, segmentFraction } from './boatPath';

/**
 * A boat's way through the waterfall: inside waterfallConfig's segment it
 * leaves the river path for a hand-placed route (waterfallConfig.route) that
 * actually goes over one of the falls -- rather than sliding along the weir
 * and fading behind its rocks -- then rejoins the path below.
 *
 * Progress still advances at the boat's own steady speed; it's only *mapped*
 * onto the route by time, leg by leg (`pace`), so the boat dawdles at the
 * lip and then tips over fast.
 */
export type WaterfallPose = {
  x: number;
  y: number;
  /** The direction it's moving in (y-down atan2), smoothed so corners don't snap the drawing's tilt. */
  headingRad: number;
  /** How much of the boat's lane offset to keep: 1 at the segment's ends, 0 through the falls (one fall, one boat at a time). */
  laneWeight: number;
  /** 0-1 through the drop while falling, otherwise 0. */
  falling: number;
  /** World units travelled since landing at the foot of the fall, or null before it gets there. */
  sinceLanding: number | null;
};

type Leg = { from: Vector2Like; to: Vector2Like; length: number; startTime: number; time: number; fall: boolean };

/** How far into the segment (as a travel fraction) the lane offset fades out / back in. */
const LANE_FADE = 0.14;
/** Travel fraction either side of a point used to smooth its heading. */
const HEADING_WINDOW = 0.02;

let cachedLegs: Leg[] | null = null;

function legs(): Leg[] {
  if (cachedLegs) return cachedLegs;
  const { segmentStart, segmentEnd, route } = waterfallConfig;
  const forward = boatPathConfig.direction > 0;
  const entry = samplePathAtProgress(forward ? segmentStart : segmentEnd);
  const exit = samplePathAtProgress(forward ? segmentEnd : segmentStart);
  const points: WaterfallRoutePoint[] = [...route, { x: exit.x, y: exit.y, pace: 1 }];

  let previous: Vector2Like = entry;
  let time = 0;
  const built: Leg[] = points.map((point) => {
    const length = Math.hypot(point.x - previous.x, point.y - previous.y);
    const legTime = length / point.pace;
    const leg = { from: previous, to: point, length, startTime: time, time: legTime, fall: Boolean(point.fall) };
    time += legTime;
    previous = point;
    return leg;
  });
  // Normalize so the whole route spans a travel fraction of 0-1.
  built.forEach((leg) => {
    leg.startTime /= time;
    leg.time /= time;
  });
  cachedLegs = built;
  return built;
}

function travelFraction(progress: number): number | null {
  const fraction = segmentFraction(progress, { start: waterfallConfig.segmentStart, end: waterfallConfig.segmentEnd });
  if (fraction === null) return null;
  return boatPathConfig.direction > 0 ? fraction : 1 - fraction;
}

function pointAt(t: number): { point: Vector2Like; leg: Leg; local: number } {
  const all = legs();
  const clamped = Math.min(1, Math.max(0, t));
  const leg = all.find((candidate) => clamped <= candidate.startTime + candidate.time) ?? all[all.length - 1];
  const local = leg.time > 0 ? (clamped - leg.startTime) / leg.time : 1;
  return {
    point: { x: leg.from.x + (leg.to.x - leg.from.x) * local, y: leg.from.y + (leg.to.y - leg.from.y) * local },
    leg,
    local,
  };
}

function smoothstep(x: number): number {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

/** Where a boat at `progress` is while crossing the falls, or null outside waterfallConfig's segment. */
export function waterfallPose(progress: number): WaterfallPose | null {
  if (!waterfallConfig.enabled) return null;
  const t = travelFraction(progress);
  if (t === null) return null;

  const { point, leg, local } = pointAt(t);
  const before = pointAt(t - HEADING_WINDOW).point;
  const after = pointAt(t + HEADING_WINDOW).point;
  const headingRad = Math.atan2(after.y - before.y, after.x - before.x);

  const all = legs();
  const fallIndex = all.findIndex((candidate) => candidate.fall);
  const legIndex = all.indexOf(leg);
  let sinceLanding: number | null = null;
  if (fallIndex >= 0 && legIndex > fallIndex) {
    sinceLanding = all.slice(fallIndex + 1, legIndex).reduce((sum, passed) => sum + passed.length, 0) + leg.length * local;
  }

  return {
    x: point.x,
    y: point.y,
    headingRad,
    laneWeight: 1 - smoothstep(t / LANE_FADE) * smoothstep((1 - t) / LANE_FADE),
    falling: leg.fall ? local : 0,
    sinceLanding,
  };
}
