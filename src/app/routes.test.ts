import { describe, expect, it } from 'vitest';
import { PANEL_ROUTES } from './routes';
import { xendraContent } from '../content/xendraContent';

describe('landmark/route/panel correspondence', () => {
  it('maps every landmark to exactly one panel route with a matching route path', () => {
    expect(PANEL_ROUTES).toHaveLength(xendraContent.landmarks.length);

    xendraContent.landmarks.forEach((landmark) => {
      const entry = PANEL_ROUTES.find((route) => route.landmarkId === landmark.id);
      expect(entry, `no panel route for landmark "${landmark.id}"`).toBeDefined();
      expect(entry?.route).toBe(landmark.route);
    });
  });

  it('has a unique landmarkId per panel route', () => {
    const ids = PANEL_ROUTES.map((entry) => entry.landmarkId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
