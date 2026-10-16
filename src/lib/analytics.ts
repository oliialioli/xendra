import type { LandmarkId } from '../types/content';

export type AnalyticsEvent =
  | { type: 'landmark_discovered'; landmarkId: LandmarkId }
  | { type: 'panel_opened'; landmarkId: LandmarkId | null; source: 'map' | 'menu' | 'direct' }
  | { type: 'audio_played'; trackId: string };

export type AnalyticsSender = (event: AnalyticsEvent) => void;

/**
 * Google Analytics (GA4), only with the visitor's consent: nothing from
 * Google is loaded, and no cookie set, until they accept it in the consent
 * notice (AnalyticsConsent.tsx). The choice is kept in this browser and can
 * be changed from the menu. Page views (every address, language included)
 * are counted by GA's own "browser history" measurement; the events below
 * add what happens on the map.
 *
 * Only on the published site: the dev server never loads it, so testing
 * doesn't count as visits.
 */
export const GA_MEASUREMENT_ID = 'G-4C1FNN2GR2';

export type AnalyticsConsent = 'granted' | 'denied';

const CONSENT_KEY = 'xendra:analytics';
const ENABLED = import.meta.env.PROD;

type Gtag = (...args: unknown[]) => void;
type GtagWindow = { dataLayer?: unknown[]; gtag?: Gtag; [flag: string]: unknown };
const gtagWindow = (): GtagWindow => window as unknown as GtagWindow;

let loaded = false;
let consent: AnalyticsConsent | null = readConsent();
const listeners = new Set<() => void>();

function readConsent(): AnalyticsConsent | null {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

function load(): void {
  if (loaded || !ENABLED) return;
  loaded = true;
  const w = gtagWindow();
  w[`ga-disable-${GA_MEASUREMENT_ID}`] = false;
  w.dataLayer = w.dataLayer ?? [];
  // gtag's own snippet: it has to push the arguments object itself.
  w.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments);
  };
  w.gtag('js', new Date());
  w.gtag('config', GA_MEASUREMENT_ID);
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

/** Withdrawn consent: GA stops sending, and its cookies (_ga, _ga_...) go. */
function stop(): void {
  gtagWindow()[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
  const host = window.location.hostname;
  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0].trim();
    if (!/^_ga(_|$)/.test(name)) return;
    for (const domain of ['', `; domain=${host}`, `; domain=.${host}`]) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
    }
  });
}

/** The visitor's choice, or null if they haven't made one yet (the notice shows). */
export function analyticsConsent(): AnalyticsConsent | null {
  return consent;
}

export function setAnalyticsConsent(choice: AnalyticsConsent): void {
  consent = choice;
  try {
    window.localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    // Storage blocked: the choice holds for this visit only.
  }
  if (choice === 'granted') {
    if (loaded) gtagWindow()[`ga-disable-${GA_MEASUREMENT_ID}`] = false;
    else load();
  } else {
    stop();
  }
  listeners.forEach((listener) => listener());
}

/** Asks again (the menu's "cookie settings"): the notice comes back. */
export function reopenAnalyticsConsent(): void {
  consent = null;
  listeners.forEach((listener) => listener());
}

export function subscribeAnalyticsConsent(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** On start: a visitor who accepted on an earlier visit is counted from the first page. */
export function startAnalytics(): void {
  if (consent === 'granted') load();
}

const PARAMS: { [K in AnalyticsEvent['type']]: (event: Extract<AnalyticsEvent, { type: K }>) => Record<string, string> } = {
  landmark_discovered: (event) => ({ landmark_id: event.landmarkId }),
  panel_opened: (event) => ({ landmark_id: event.landmarkId ?? '', source: event.source }),
  audio_played: (event) => ({ track_id: event.trackId }),
};

export const sendAnalyticsEvent: AnalyticsSender = (event) => {
  if (!loaded || consent !== 'granted') return;
  const params = (PARAMS[event.type] as (event: AnalyticsEvent) => Record<string, string>)(event);
  gtagWindow().gtag?.('event', event.type, params);
};
