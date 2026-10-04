import { describe, expect, it } from 'vitest';
import { boatPathConfig } from '../../content/boatPathConfig';
import { dockConfig, waterfallConfig } from '../../content/dockConfig';
import { samplePathAtProgress } from './boatPath';
import { waterfallPose } from './waterfallRoute';

const { segmentStart, segmentEnd } = waterfallConfig;

describe('waterfallPose', () => {
  it('is only active inside the waterfall segment', () => {
    expect(waterfallPose(segmentStart - 0.001)).toBeNull();
    expect(waterfallPose(segmentEnd + 0.001)).toBeNull();
    expect(waterfallPose((segmentStart + segmentEnd) / 2)).not.toBeNull();
  });

  it('meets the river path at both ends, so boats never jump', () => {
    [segmentStart, segmentEnd].forEach((edge) => {
      const pose = waterfallPose(edge)!;
      const path = samplePathAtProgress(edge);
      expect(Math.hypot(pose.x - path.x, pose.y - path.y)).toBeLessThan(1);
      expect(pose.laneWeight).toBeCloseTo(1, 2);
    });
  });

  it('goes over the drop once, then counts the distance since landing', () => {
    const step = 0.0002 * boatPathConfig.direction;
    const from = boatPathConfig.direction < 0 ? segmentEnd : segmentStart;
    let sawFall = false;
    let lastLanding = -1;
    for (let p = from; waterfallPose(p); p += step) {
      const pose = waterfallPose(p)!;
      if (pose.falling > 0) sawFall = true;
      if (pose.sinceLanding !== null) {
        expect(sawFall).toBe(true);
        expect(pose.sinceLanding).toBeGreaterThanOrEqual(lastLanding);
        lastLanding = pose.sinceLanding;
      }
    }
    expect(sawFall).toBe(true);
    expect(lastLanding).toBeGreaterThan(0);
  });

  it('hands launched boats over right below the end of the pier', () => {
    const entry = waterfallPose(boatPathConfig.launchProgress)!;
    expect(entry).not.toBeNull();
    expect(entry.y).toBeGreaterThan(dockConfig.launchPoint.y);
    expect(Math.hypot(entry.x - dockConfig.launchPoint.x, entry.y - dockConfig.launchPoint.y)).toBeLessThan(80);
  });
});
