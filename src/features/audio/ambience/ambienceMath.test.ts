import { describe, expect, it } from 'vitest';
import { DUCK, REACH } from './ambienceConfig';
import {
  ambienceDuck,
  falloff,
  fireProximity,
  fountainProximity,
  nearestOnPolygon,
  panFor,
  schoolProximity,
  waterProximity,
} from './ambienceMath';

const square = [
  { x: 0, y: 0 },
  { x: 1000, y: 0 },
  { x: 1000, y: 1000 },
  { x: 0, y: 1000 },
];

describe('ambience math', () => {
  it('fades smoothly from full to nothing', () => {
    expect(falloff(0, 30, 400)).toBe(1);
    expect(falloff(30, 30, 400)).toBe(1);
    expect(falloff(400, 30, 400)).toBe(0);
    const mid = falloff(215, 30, 400);
    expect(mid).toBeGreaterThan(0.4);
    expect(mid).toBeLessThan(0.6);
  });

  it('finds the nearest point on the shore', () => {
    const hit = nearestOnPolygon({ x: 500, y: 40 }, square);
    expect(hit.d).toBeCloseTo(40);
    expect(hit).toMatchObject({ x: 500, y: 0 });
  });

  it('hears the river loud on the bank, faintly inland, and the falls only near them', () => {
    const view = { center: 500, half: 400 };
    const onBank = waterProximity({ x: 500, y: 20 }, square, { x: 900, y: 900 }, view.center, view.half);
    const inland = waterProximity({ x: 500, y: 500 }, square, { x: 900, y: 900 }, view.center, view.half);
    expect(onBank.river).toBe(1);
    expect(inland.river).toBe(0); // 500 from every shore, past REACH.riverEdge
    expect(REACH.riverEdge).toBeLessThan(500);
    expect(onBank.waterfall).toBe(0);
    const atFalls = waterProximity({ x: 880, y: 880 }, square, { x: 900, y: 900 }, view.center, view.half);
    expect(atFalls.waterfall).toBe(1);
    expect(atFalls.waterfallPan).toBeGreaterThan(0); // to the right of the view's centre
  });

  it('hears the campfire only while lit, louder close by', () => {
    const fire = { x: 500, y: 500 };
    expect(fireProximity({ x: 520, y: 500 }, { ...fire, lit: false }, 500, 400).level).toBe(0);
    expect(fireProximity({ x: 520, y: 500 }, { ...fire, lit: true }, 500, 400).level).toBe(1);
    const further = fireProximity({ x: 700, y: 500 }, { ...fire, lit: true }, 500, 400).level;
    expect(further).toBeGreaterThan(0);
    expect(further).toBeLessThan(1);
    expect(fireProximity({ x: 520, y: 500 }, null, 500, 400).level).toBe(0);
  });

  it('hears the fountain and the rehearsal louder the nearer they are, and not at all far off', () => {
    const at = { x: 1000, y: 1000 };
    expect(fountainProximity({ x: 1050, y: 1000 }, at, 1000, 400).level).toBe(1);
    expect(fountainProximity({ x: 1000 + REACH.fountainEdge + 10, y: 1000 }, at, 1000, 400).level).toBe(0);
    const near = schoolProximity({ x: 1100, y: 1000 }, at, 1000, 400).level;
    const mid = schoolProximity({ x: 1000 + (REACH.schoolFull + REACH.schoolEdge) / 2, y: 1000 }, at, 1000, 400).level;
    expect(near).toBe(1);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(near);
    expect(schoolProximity({ x: 1000 + REACH.schoolEdge + 10, y: 1000 }, at, 1000, 400).level).toBe(0);
  });

  it('pans by where a sound sits in the view', () => {
    expect(panFor(500, 500, 400)).toBe(0);
    expect(panFor(100, 500, 400)).toBe(-1);
    expect(panFor(2000, 500, 400)).toBe(1);
  });

  it('steps back for sections, music and videos, the quietest reason winning', () => {
    expect(ambienceDuck({ panelRoute: null, musicPlaying: false, mediaPlaying: false })).toBe(1);
    expect(ambienceDuck({ panelRoute: '/merch', musicPlaying: false, mediaPlaying: false })).toBe(DUCK.panel);
    expect(ambienceDuck({ panelRoute: '/musica', musicPlaying: false, mediaPlaying: false })).toBe(DUCK.music);
    expect(ambienceDuck({ panelRoute: '/gaztelua', musicPlaying: false, mediaPlaying: false })).toBe(DUCK.music);
    expect(ambienceDuck({ panelRoute: '/archivo', musicPlaying: false, mediaPlaying: true })).toBe(DUCK.media);
    expect(ambienceDuck({ panelRoute: null, musicPlaying: true, mediaPlaying: false })).toBe(DUCK.music);
  });
});
