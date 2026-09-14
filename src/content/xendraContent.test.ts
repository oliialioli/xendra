import { describe, expect, it } from 'vitest';
import { xendraContent } from './xendraContent';

describe('xendraContent landmarks', () => {
  it('has exactly eight destinations', () => {
    expect(xendraContent.landmarks).toHaveLength(8);
  });

  it('has unique landmark ids', () => {
    const ids = xendraContent.landmarks.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique routes', () => {
    const routes = xendraContent.landmarks.map((l) => l.route);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it('gives every landmark a positive interaction radius and a position', () => {
    xendraContent.landmarks.forEach((landmark) => {
      expect(landmark.interactionRadius).toBeGreaterThan(0);
      expect(Number.isFinite(landmark.position.x)).toBe(true);
      expect(Number.isFinite(landmark.position.y)).toBe(true);
    });
  });
});
