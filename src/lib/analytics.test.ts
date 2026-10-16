import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const gaScripts = () => document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]').length;

/** A fresh copy of the module, as on the published site (it never loads in development). */
async function freshAnalytics() {
  vi.resetModules();
  vi.stubEnv('PROD', true);
  return import('./analytics');
}

describe('analytics', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.head.innerHTML = '';
  });
  afterEach(() => vi.unstubAllEnvs());

  it('loads nothing from Google until the visitor accepts', async () => {
    const analytics = await freshAnalytics();
    analytics.startAnalytics();
    analytics.sendAnalyticsEvent({ type: 'audio_played', trackId: 'track-1' });
    expect(analytics.analyticsConsent()).toBeNull();
    expect(gaScripts()).toBe(0);

    analytics.setAnalyticsConsent('granted');
    expect(gaScripts()).toBe(1);
    expect(window.localStorage.getItem('xendra:analytics')).toBe('granted');
  });

  it('remembers a yes for the next visit, and a no stays a no', async () => {
    window.localStorage.setItem('xendra:analytics', 'granted');
    let analytics = await freshAnalytics();
    analytics.startAnalytics();
    expect(gaScripts()).toBe(1);

    document.head.innerHTML = '';
    window.localStorage.setItem('xendra:analytics', 'denied');
    analytics = await freshAnalytics();
    analytics.startAnalytics();
    expect(analytics.analyticsConsent()).toBe('denied');
    expect(gaScripts()).toBe(0);
  });

  it("stops GA and deletes its cookies when consent is taken back", async () => {
    const analytics = await freshAnalytics();
    analytics.setAnalyticsConsent('granted');
    document.cookie = '_ga=GA1.1.123; path=/';
    document.cookie = '_ga_SBZWB372DG=GS1.1.456; path=/';
    document.cookie = 'other=1; path=/';

    analytics.setAnalyticsConsent('denied');
    expect((window as unknown as Record<string, unknown>)[`ga-disable-${analytics.GA_MEASUREMENT_ID}`]).toBe(true);
    expect(document.cookie).not.toMatch(/_ga/);
    expect(document.cookie).toContain('other=1');
  });

  it('asks again from the menu', async () => {
    const analytics = await freshAnalytics();
    analytics.setAnalyticsConsent('denied');
    const listener = vi.fn();
    analytics.subscribeAnalyticsConsent(listener);
    analytics.reopenAnalyticsConsent();
    expect(analytics.analyticsConsent()).toBeNull();
    expect(listener).toHaveBeenCalled();
  });
});
