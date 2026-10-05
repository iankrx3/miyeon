import { supabase } from './supabase/client';

const VISITOR_KEY = 'miyeon_vid';
const UTM_KEY = 'miyeon_utm';
const QUIZ_STARTED_KEY = 'miyeon_quiz_started';

const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const;

export const EVENT_NAMES = [
  'page_view',
  'quiz_start',
  'quiz_step',
  'quiz_complete',
  'result_view',
  'outbound_click',
  'plan_email',
  'map_pin',
] as const;

export type AnalyticsEvent = (typeof EVENT_NAMES)[number];

type PropValue = string | number | boolean | null;
export type AnalyticsProps = Record<string, PropValue>;

const seenResults = new Set<string>();
const warned = new Set<string>();
let lastPage = '';
let lastPageAt = 0;

function visitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (existing && existing.length >= 8 && existing.length <= 64) return existing;
    const next = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, next);
    return next;
  } catch {
    return 'anonymous';
  }
}

function readLang(): string {
  try {
    const stored = localStorage.getItem('miyeon_lang');
    if (stored === 'ja' || stored === 'zh' || stored === 'vi' || stored === 'th' || stored === 'en') return stored;
  } catch {
    // private mode
  }
  return 'en';
}

function readUtm(): AnalyticsProps {
  try {
    const raw = sessionStorage.getItem(UTM_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const utm: AnalyticsProps = {};
    for (const key of UTM_PARAMS) {
      const value = parsed[key];
      if (typeof value === 'string' && value.length > 0 && value.length <= 80 && !value.includes('@')) {
        utm[key] = value;
      }
    }
    return utm;
  } catch {
    return {};
  }
}

/** Keep the first landing campaign for the rest of the tab, including after in-app navigation. */
export function captureLandingUtm(): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const found: Record<string, string> = {};
  for (const key of UTM_PARAMS) {
    const value = params.get(key);
    if (value && value.length <= 80 && !value.includes('@')) found[key] = value;
  }
  if (Object.keys(found).length === 0) return;
  try {
    sessionStorage.setItem(UTM_KEY, JSON.stringify(found));
  } catch {
    // private mode — this page's events still send, later pages won't carry the campaign
  }
}

function cleanProps(props: AnalyticsProps): AnalyticsProps {
  const out: AnalyticsProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (value == null) continue;
    if (typeof value === 'string') {
      if (value.includes('@') || value.length > 80) continue;
      out[key] = value;
    } else if (typeof value === 'number') {
      if (Number.isFinite(value)) out[key] = value;
    } else if (typeof value === 'boolean') {
      out[key] = value;
    }
  }
  return out;
}

export function track(name: AnalyticsEvent, props: AnalyticsProps = {}): void {
  if (!supabase || typeof window === 'undefined') return;
  const path = window.location.pathname.slice(0, 180);
  const body = cleanProps({ lang: readLang(), ...readUtm(), ...props, path });
  void supabase
    .from('product_events')
    .insert({ name, visitor_id: visitorId(), path, props: body })
    .then(({ error }) => {
      if (!error || warned.has(error.message)) return;
      warned.add(error.message);
      console.warn('analytics insert failed', error.message);
    });
}

export function trackPageView(path: string): void {
  if (path === '/insights') return;
  const now = Date.now();
  if (path === lastPage && now - lastPageAt < 1000) return;
  lastPage = path;
  lastPageAt = now;
  track('page_view', { path });
}

/** Once per browser tab. `/start` and the home button both count as a start. */
export function trackQuizStart(entry: 'home' | 'start'): void {
  try {
    if (sessionStorage.getItem(QUIZ_STARTED_KEY)) return;
    sessionStorage.setItem(QUIZ_STARTED_KEY, entry);
  } catch {
    // still send — a duplicate start is less useful than a missing one
  }
  track('quiz_start', { entry });
}

export function budgetBand(max: number | null | undefined): string {
  if (max == null) return 'any';
  if (max <= 100) return 'to-100';
  if (max <= 300) return 'to-300';
  if (max <= 500) return 'to-500';
  return 'over-500';
}

export function trackResultView(itineraryId: string, placeCount: number): void {
  if (seenResults.has(itineraryId)) return;
  seenResults.add(itineraryId);
  track('result_view', { place_count: placeCount });
}
