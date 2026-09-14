import type { LandmarkId } from '../types/content';

export type AnalyticsEvent =
  | { type: 'landmark_discovered'; landmarkId: LandmarkId }
  | { type: 'panel_opened'; landmarkId: LandmarkId | null; source: 'map' | 'menu' | 'direct' }
  | { type: 'audio_played'; trackId: string }
  | { type: 'contact_started' };

export type AnalyticsSender = (event: AnalyticsEvent) => void;

/** No-op by default. Swap this for a real provider later -- never add trackers without instruction. */
export const sendAnalyticsEvent: AnalyticsSender = () => {};
