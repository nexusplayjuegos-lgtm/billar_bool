'use client';

export type AnalyticsEventName =
  | 'game_started'
  | 'game_won'
  | 'game_lost'
  | 'mission_completed'
  | 'achievement_unlocked'
  | 'shop_purchase'
  | 'pool_pass_purchase'
  | 'first_game'
  | 'retention_d1';

type AnalyticsValue = string | number | boolean | null | undefined;
export type AnalyticsParams = Record<string, AnalyticsValue>;

type GtagCommand = 'config' | 'event' | 'js';
type GtagValue = string | Date;
type GtagParams = Record<string, AnalyticsValue>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (command: GtagCommand, target: GtagValue, params?: GtagParams) => void;
  }
}

const FIRST_GAME_KEY = 'bool_analytics_first_game';
const FIRST_SEEN_KEY = 'bool_analytics_first_seen_at';
const RETENTION_D1_KEY = 'bool_analytics_retention_d1';

function isBrowser() {
  return typeof window !== 'undefined';
}

function cleanParams(params?: AnalyticsParams): GtagParams {
  if (!params) return {};
  return Object.entries(params).reduce<GtagParams>((acc, [key, value]) => {
    if (value !== undefined) acc[key] = value;
    return acc;
  }, {});
}

export function trackEvent(name: AnalyticsEventName, params?: AnalyticsParams) {
  if (!isBrowser()) return;
  const payload = cleanParams(params);

  if (window.gtag) {
    window.gtag('event', name, payload);
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[analytics]', name, payload);
  }
}

export function trackFirstGame(params?: AnalyticsParams) {
  if (!isBrowser()) return;
  if (window.localStorage.getItem(FIRST_GAME_KEY)) return;
  window.localStorage.setItem(FIRST_GAME_KEY, new Date().toISOString());
  trackEvent('first_game', params);
}

export function markFirstSeenAndTrackRetention() {
  if (!isBrowser()) return;
  const now = Date.now();
  const stored = window.localStorage.getItem(FIRST_SEEN_KEY);

  if (!stored) {
    window.localStorage.setItem(FIRST_SEEN_KEY, String(now));
    return;
  }

  if (window.localStorage.getItem(RETENTION_D1_KEY)) return;
  const firstSeen = Number(stored);
  if (!Number.isFinite(firstSeen)) {
    window.localStorage.setItem(FIRST_SEEN_KEY, String(now));
    return;
  }

  const oneDayMs = 24 * 60 * 60 * 1000;
  if (now - firstSeen >= oneDayMs) {
    window.localStorage.setItem(RETENTION_D1_KEY, new Date().toISOString());
    trackEvent('retention_d1');
  }
}
