/** Daily Google Places (New) budgets so a spike cannot spend a month of Pro in one day.
 * 150 × 30 = 4,500, under the 5,000/month Pro free cap. Caps are per process;
 * set the same limits in Google Cloud Console as the durable backstop.
 * Glow Up itinerary uses Nearby Pro only (max 4 live calls per generate, 24h cache),
 * never Text Search / Details / Photos. */

export type PlacesSku = 'nearby_pro' | 'text_pro' | 'details_pro' | 'photos';

export const PLACES_DAILY_CAPS: Record<PlacesSku, number> = {
  nearby_pro: 150,
  text_pro: 150,
  details_pro: 0,
  photos: 0,
};

type DayStamp = string;

let day: DayStamp = utcDay();
const used: Record<PlacesSku, number> = {
  nearby_pro: 0,
  text_pro: 0,
  details_pro: 0,
  photos: 0,
};

function utcDay(): DayStamp {
  return new Date().toISOString().slice(0, 10);
}

function rollForward(): void {
  const today = utcDay();
  if (today === day) return;
  day = today;
  used.nearby_pro = 0;
  used.text_pro = 0;
  used.details_pro = 0;
  used.photos = 0;
}

export type QuotaDecision =
  | { ok: true }
  | { ok: false; sku: PlacesSku; used: number; cap: number };

export function consumePlacesQuota(sku: PlacesSku): QuotaDecision {
  rollForward();
  const cap = PLACES_DAILY_CAPS[sku];
  if (used[sku] >= cap) return { ok: false, sku, used: used[sku], cap };
  used[sku] += 1;
  return { ok: true };
}

export function searchModeToSku(mode: 'text' | 'nearby'): PlacesSku {
  return mode === 'text' ? 'text_pro' : 'nearby_pro';
}
