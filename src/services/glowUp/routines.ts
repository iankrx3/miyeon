import type {
  GlowUpLanguage,
  GlowUpLeftOut,
  GlowUpMixPreset,
  GlowUpPlace,
  GlowUpPlanV2,
  GlowUpProfile,
  GlowUpRegion,
  GlowUpRoutine,
  GlowUpStop,
  GlowUpSubtype,
} from '../../types';
import { guideFor } from '../../data/categoryGuides';
import { budgetMaxUsdOf, labelForSubtype } from '../../data/glowUpQuiz';
import { buildGlowUpCreatripUrl } from '../../lib/creatrip';
import type { TFunction } from '../../i18n';
import { haversineKm, travelForDistance } from '../itinerary/travel';

// V2 result: instead of a Day 1/2/3 grid of categories, pick a real, bookable venue per
// selected category and group them into a few Glow-up routines. The number of routines follows
// what was picked and what can be booked — never the trip length. Deterministic, no LLM.

export const MIX_LABEL: Record<GlowUpMixPreset, string> = {
  'less-downtime': 'Less Downtime',
  closer: 'Closer to My Hotel',
  'lower-budget': 'Lower Budget',
  iconic: 'More Iconic K-Beauty',
};

export interface RoutineOptions {
  preset?: GlowUpMixPreset | null;
  /** Categories held back for a reason that the user chose to add back anyway. */
  forced?: GlowUpSubtype[];
}

const REGION_CENTRE: Record<Exclude<GlowUpRegion, 'auto'>, [number, number]> = {
  gangnam: [37.5172, 127.0473],
  'hongdae-mapo': [37.5563, 126.9236],
  myeongdong: [37.5636, 126.9822],
  seongsu: [37.5446, 127.0557],
  seomyeon: [35.1579, 129.0595],
  haeundae: [35.1631, 129.1635],
  gwangalli: [35.1532, 129.1186],
  nampo: [35.098, 129.0324],
};

const BUSAN_REGIONS = new Set<string>(['seomyeon', 'haeundae', 'gwangalli', 'nampo']);

const SHORT_REGION: Record<string, string> = {
  gangnam: 'Gangnam',
  'hongdae-mapo': 'Hongdae',
  myeongdong: 'Myeongdong',
  seongsu: 'Seongsu',
  seomyeon: 'Seomyeon',
  haeundae: 'Haeundae',
  gwangalli: 'Gwangalli',
  nampo: 'Nampo',
};
export const shortRegion = (r: string | null | undefined): string => (r && SHORT_REGION[r]) || 'Seoul';

const SKIN_GROUP: GlowUpSubtype[] = ['skin', 'face'];
const STYLE_ORDER: GlowUpSubtype[] = ['personal-color', 'hair', 'makeup', 'permanent-makeup', 'nail', 'photo'];
const RECOVERY_ORDER: GlowUpSubtype[] = ['sauna', 'scrub', 'massage', 'yoga'];

const CITY_LABEL = { seoul: 'Seoul', busan: 'Busan' } as const;

export function profileCity(profile: GlowUpProfile): 'seoul' | 'busan' {
  if (profile.city) return profile.city;
  if (profile.region && BUSAN_REGIONS.has(profile.region)) return 'busan';
  return 'seoul';
}

export const cityLabel = (profile: GlowUpProfile): string => CITY_LABEL[profileCity(profile)];

const preferredRegion = (p: GlowUpProfile): Exclude<GlowUpRegion, 'auto'> | null =>
  p.region && p.region !== 'auto' ? p.region : null;


const point = (pl: GlowUpPlace): [number, number] => [pl.lat ?? 0, pl.lng ?? 0];
const kmBetween = (a: [number, number], b: [number, number]): number =>
  haversineKm({ latitude: a[0], longitude: a[1] }, { latitude: b[0], longitude: b[1] });

/** Does this venue confirm one of the wanted languages? true / false = confirmed no / null = not stated. */
export function languageFit(place: GlowUpPlace, wanted: GlowUpProfile['languages']): boolean | null {
  const langs: GlowUpLanguage[] = wanted.length > 0 ? wanted : ['English'];
  if (place.languages.some((l) => langs.includes(l))) return true;
  if (langs.includes('English') && place.englishSupport === true) return true;
  if (place.koreanOnlyStaff) return false;
  if (place.languages.length > 0) return false;
  if (langs.includes('English') && place.englishSupport === false) return false;
  return null;
}

/** true = fits, false = known to be over budget, null = price not stated. */
export function budgetFit(place: GlowUpPlace, profile: GlowUpProfile): boolean | null {
  const max = budgetMaxUsdOf(profile);
  if (max == null) return true;
  if (place.priceFromUsd == null) return null;
  return place.priceFromUsd <= max;
}

interface Weights {
  quality: number;
  popularity: number;
  region: number;
  proximity: number;
  language: number;
  price: number;
  downtime: number;
  primary: number;
}

const BASE_WEIGHTS: Weights = {
  quality: 0.22,
  popularity: 0.12,
  region: 0.16,
  proximity: 0.14,
  language: 0.12,
  price: 0.08,
  downtime: 0.06,
  primary: 0.1,
};

function weightsFor(preset: GlowUpMixPreset | null | undefined): Weights {
  switch (preset) {
    case 'less-downtime':
      return { ...BASE_WEIGHTS, downtime: 0.5, quality: 0.12, popularity: 0.06 };
    case 'closer':
      return { ...BASE_WEIGHTS, proximity: 0.45, region: 0.2, quality: 0.1, popularity: 0.05 };
    case 'lower-budget':
      return { ...BASE_WEIGHTS, price: 0.5, quality: 0.12, popularity: 0.05 };
    case 'iconic':
      return { ...BASE_WEIGHTS, popularity: 0.36, quality: 0.24, price: 0.02, proximity: 0.06 };
    default:
      return BASE_WEIGHTS;
  }
}

const DOWNTIME_SCORE = { none: 1, mild: 0.2, days: 0 } as const;

function scorePlace(
  place: GlowUpPlace,
  subtype: GlowUpSubtype,
  profile: GlowUpProfile,
  anchor: [number, number] | null,
  w: Weights
): number {
  const quality = place.rating == null ? 0.3 : Math.min(1, Math.max(0, place.rating - 4));
  const popularity = Math.min(1, Math.log10((place.reviewCount ?? 0) + 1) / 3.5);
  const pref = preferredRegion(profile);
  const region = pref ? (place.region === pref ? 1 : 0) : 0.5;
  const proximity = anchor ? Math.max(0, 1 - kmBetween(point(place), anchor) / 6) : 0.5;
  const lang = languageFit(place, profile.languages);
  const language = lang === true ? 1 : lang === null ? 0.4 : 0;
  const max = budgetMaxUsdOf(profile);
  const price =
    place.priceFromUsd == null
      ? 0.4
      : max == null
        ? Math.max(0, 1 - place.priceFromUsd / 250)
        : Math.max(0, 1 - (place.priceFromUsd / max) * 0.6);
  const downtime = place.downtime ? DOWNTIME_SCORE[place.downtime] : 0.5;
  const primary = place.subtype === subtype ? 1 : 0.6;
  return (
    quality * w.quality +
    popularity * w.popularity +
    region * w.region +
    proximity * w.proximity +
    language * w.language +
    price * w.price +
    downtime * w.downtime +
    primary * w.primary
  );
}

/** The venues that can serve `subtype` for this traveller — known conflicts (wrong city, over budget,
 * no wanted language, lasting downtime when they need photo-ready skin) are excluded; unknowns pass. */
function candidatesFor(subtype: GlowUpSubtype, profile: GlowUpProfile, places: GlowUpPlace[]): GlowUpPlace[] {
  const city = profileCity(profile);
  return places.filter((p) => {
    if (p.subtype !== subtype && !p.extraSubtypes.includes(subtype)) return false;
    // Skin/face work is clinic work: a hair or makeup studio that lists skin care on the side doesn't count.
    if (SKIN_GROUP.includes(subtype) && !SKIN_GROUP.includes(p.subtype)) return false;
    if (p.city !== city) return false;
    if (p.lat == null || p.lng == null) return false;
    if (languageFit(p, profile.languages) === false) return false;
    if (budgetFit(p, profile) === false) return false;
    if (SKIN_GROUP.includes(subtype) && profile.fix.downtime === 'no-daily-photos') {
      if (p.downtime === 'days' || p.downtime === 'mild') return false;
    }
    return true;
  });
}

const HHMM = (min: number): string =>
  `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const toMin = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const roundUp15 = (min: number): number => Math.ceil(min / 15) * 15;

export function formatDuration(minutes: number, t?: TFunction): string {
  const tt: TFunction = t ?? ((key, vars) => key.replace(/\{(\w+)\}/g, (m, n) => String(vars?.[n] ?? m)));
  if (minutes < 60) return tt('{n} min', { n: minutes });
  const h = minutes / 60;
  return tt('{n} hr', { n: Number.isInteger(h) ? h : (Math.round(h * 2) / 2).toString() });
}

/** Stop hints are stored in English; this renders the fixed shapes (travel time, downtime notes) in the
 * traveller's language and leaves venue-specific text as written. */
export function translateHint(hint: string, t: TFunction): string {
  const walk = hint.match(/^(\d+) min walk from (.+)$/);
  if (walk) return t('{n} min walk from {name}', { n: walk[1], name: walk[2] });
  const ride = hint.match(/^(\d+) min by (\w+) from (.+)$/);
  if (ride) return t('{n} min by {mode} from {name}', { n: ride[1], mode: t(ride[2]), name: ride[3] });
  return t(hint);
}

/** What to tell the traveller about aftercare for this venue. Venue-stated facts win; otherwise the
 * category's typical note. Returns null-tone 'none' when there is nothing to warn about. */
export function downtimeText(place: GlowUpPlace, subtype: GlowUpSubtype): { text: string; warn: boolean } {
  if (place.downtimeNote) return { text: place.downtimeNote, warn: place.downtime !== 'none' };
  if (place.downtime === 'none') return { text: 'No downtime', warn: false };
  if (place.downtime === 'mild') return { text: 'Mild redness or swelling possible', warn: true };
  if (place.downtime === 'days') return { text: 'Plan a few days of recovery', warn: true };
  const note = guideFor(subtype)?.resultNote;
  if (note?.tone === 'warn') return { text: note.text, warn: true };
  return { text: 'No downtime', warn: false };
}

function stopMinutes(place: GlowUpPlace, subtype: GlowUpSubtype): number {
  return place.minutes ?? guideFor(subtype)?.minutes ?? 60;
}

function reasonsFor(place: GlowUpPlace, subtype: GlowUpSubtype, profile: GlowUpProfile): string[] {
  const out: string[] = [];
  const pref = preferredRegion(profile);
  if (pref && place.region === pref) out.push(`In ${shortRegion(place.region)}, your preferred area`);
  else if (pref && place.region) out.push(`Nearest good fit — in ${shortRegion(place.region)}`);
  if (languageFit(place, profile.languages) === true) {
    const wanted: GlowUpLanguage[] = profile.languages.length > 0 ? profile.languages : ['English'];
    const hit = wanted.find((l) => place.languages.includes(l) || (l === 'English' && place.englishSupport)) ?? 'English';
    out.push(`${hit} support listed`);
  }
  if (budgetFit(place, profile) === true && place.priceFromUsd != null) out.push(`From ~$${Math.round(place.priceFromUsd)}, within your budget`);
  if (place.rating != null && place.reviewCount) out.push(`Rated ${place.rating.toFixed(1)} by ${place.reviewCount.toLocaleString()} travelers`);
  if (subtype !== place.subtype) out.push(`Also offers ${labelForSubtype(subtype).toLowerCase()}`);
  return out;
}

function pickOne(
  subtype: GlowUpSubtype,
  profile: GlowUpProfile,
  places: GlowUpPlace[],
  taken: Set<string>,
  chosen: GlowUpPlace[],
  w: Weights
): GlowUpPlace | null {
  const pool = candidatesFor(subtype, profile, places).filter((p) => !taken.has(p.id));
  if (pool.length === 0) return null;
  const pref = preferredRegion(profile);
  const anchor: [number, number] | null = chosen.length
    ? [chosen.reduce((s, p) => s + (p.lat ?? 0), 0) / chosen.length, chosen.reduce((s, p) => s + (p.lng ?? 0), 0) / chosen.length]
    : pref
      ? REGION_CENTRE[pref]
      : null;
  return [...pool]
    .map((p) => ({ p, s: scorePlace(p, subtype, profile, anchor, w) }))
    .sort((a, b) => b.s - a.s || a.p.id.localeCompare(b.p.id))[0].p;
}

interface Pick {
  subtype: GlowUpSubtype;
  place: GlowUpPlace;
}

function buildStops(picks: Pick[], startTime: string, profile: GlowUpProfile): GlowUpStop[] {
  let clock = toMin(startTime);
  return picks.map((pick, i) => {
    const prev = picks[i - 1];
    const travel = prev ? travelForDistance(kmBetween(point(prev.place), point(pick.place))) : null;
    if (prev && travel) clock = roundUp15(clock + stopMinutes(prev.place, prev.subtype) + travel.minutes + 15);
    const dt = downtimeText(pick.place, pick.subtype);
    const guide = guideFor(pick.subtype);
    let hint: string | null = null;
    let hintTone: GlowUpStop['hintTone'] = 'info';
    if (dt.warn) {
      hint = dt.text;
      hintTone = 'warn';
    } else if (prev && travel) {
      const from = prev.place.name;
      hint =
        travel.mode === 'walk'
          ? `${travel.minutes} min walk from ${from}`
          : `${travel.minutes} min by ${travel.mode} from ${from}`;
    } else if (pick.place.highlights[0]) {
      hint = pick.place.highlights[0];
    } else if (guide?.resultNote?.tone === 'info') {
      hint = guide.resultNote.text;
    }
    return {
      id: `stop_${pick.subtype}_${pick.place.id}`,
      place: pick.place,
      subtype: pick.subtype,
      startTime: HHMM(clock),
      hint,
      hintTone,
      travel,
      reasons: reasonsFor(pick.place, pick.subtype, profile),
    };
  });
}

function totalMinutes(stops: GlowUpStop[]): number {
  return stops.reduce((sum, s) => sum + stopMinutes(s.place, s.subtype) + (s.travel?.minutes ?? 0), 0);
}

function areaLabel(stops: GlowUpStop[]): string {
  const areas = [...new Set(stops.map((s) => shortRegion(s.place.region)))];
  return areas.join(' / ');
}

function timingFor(kind: 'skin' | 'style' | 'recovery', hasPhoto: boolean, tripDays: GlowUpProfile['tripDays']): string {
  if (tripDays === '1') return kind === 'skin' ? 'Best first thing in the morning' : kind === 'style' ? 'Best around midday' : 'Best in the evening';
  if (kind === 'skin') return 'Best early in your trip';
  if (kind === 'style') return hasPhoto ? 'Best late in your trip, after your styling' : 'Best mid-trip';
  return 'Best in the evening';
}

function makeRoutine(
  key: 'skin' | 'style' | 'recovery',
  picks: Pick[],
  profile: GlowUpProfile,
  opts: { attachedRecovery?: boolean } = {}
): GlowUpRoutine {
  const start = key === 'skin' ? '10:00' : key === 'style' ? '11:00' : '19:00';
  const stops = buildStops(picks, start, profile);
  const subtypes = picks.map((p) => p.subtype);
  const warn = stops.map((s) => downtimeText(s.place, s.subtype)).find((d) => d.warn);
  const title =
    key === 'skin'
      ? opts.attachedRecovery
        ? 'Skin, Then Exhale'
        : 'Your Skin Reset'
      : key === 'style'
        ? 'Your K-Idol Era'
        : subtypes.some((s) => s === 'sauna' || s === 'scrub')
          ? 'Stress? Scrubbed'
          : 'Slow Down, Reset';
  return {
    id: `rt_${key}`,
    tab: key === 'skin' ? 'Skin Reset' : key === 'style' ? 'Style Session' : 'Recovery',
    title,
    subtypes,
    stops,
    totalMinutes: totalMinutes(stops),
    bestTiming: timingFor(key, subtypes.includes('photo'), profile.tripDays),
    downtimeNote: warn?.text ?? 'No downtime',
    areaLabel: areaLabel(stops),
  };
}

function leftOutNoVenue(subtype: GlowUpSubtype, profile: GlowUpProfile): GlowUpLeftOut {
  const label = labelForSubtype(subtype);
  const constrained = budgetMaxUsdOf(profile) != null ? ' that fits your budget and language' : '';
  return {
    subtype,
    label,
    reason: `We don't have a ${label.toLowerCase()} we can book${constrained} yet. Compare options on Creatrip.`,
    // No region filter: a district-filtered list is the one most likely to come back empty.
    url: buildGlowUpCreatripUrl(subtype, { region: null, languages: profile.languages }),
    canAdd: false,
    reasonCode: constrained ? 'no-venue-budget' : 'no-venue',
  };
}

/** Builds the routines for a quiz profile from the venue list. */
export function buildRoutines(profile: GlowUpProfile, places: GlowUpPlace[], opts: RoutineOptions = {}): GlowUpPlanV2 {
  const preset = opts.preset ?? null;
  const forced = opts.forced ?? [];
  const w = weightsFor(preset);

  const wanted = new Set<GlowUpSubtype>([...profile.fix.items, ...profile.change, ...profile.restore]);
  const leftOut: GlowUpLeftOut[] = [];

  // A photo session wants its own day after the styling — a 1–3 day trip can't spare one. Offer it back.
  const hasStyling = profile.change.some((s) => s !== 'photo') || profile.fix.items.length > 0;
  if (
    wanted.has('photo') &&
    !forced.includes('photo') &&
    hasStyling &&
    (profile.tripDays === '1' || profile.tripDays === '2-3')
  ) {
    wanted.delete('photo');
    leftOut.push({
      subtype: 'photo',
      label: labelForSubtype('photo'),
      reason: 'It works best on a day after your styling, and your trip is too tight. Still want it?',
      url: buildGlowUpCreatripUrl('photo', { region: null, languages: profile.languages }),
      canAdd: true,
      reasonCode: 'tight-trip',
    });
  }

  const taken = new Set<string>();
  const chosen: GlowUpPlace[] = [];
  const picks = new Map<GlowUpSubtype, Pick>();

  const ordered: GlowUpSubtype[] = [
    ...SKIN_GROUP.filter((s) => wanted.has(s)),
    ...STYLE_ORDER.filter((s) => wanted.has(s)),
    ...RECOVERY_ORDER.filter((s) => wanted.has(s)),
  ];
  for (const subtype of ordered) {
    const place = pickOne(subtype, profile, places, taken, chosen, w);
    if (!place) {
      leftOut.push(leftOutNoVenue(subtype, profile));
      continue;
    }
    taken.add(place.id);
    chosen.push(place);
    picks.set(subtype, { subtype, place });
  }

  const skinPicks = SKIN_GROUP.map((s) => picks.get(s)).filter((p): p is Pick => Boolean(p));
  const stylePicks = STYLE_ORDER.map((s) => picks.get(s)).filter((p): p is Pick => Boolean(p));
  const recoveryPicks = RECOVERY_ORDER.map((s) => picks.get(s)).filter((p): p is Pick => Boolean(p));

  // "Skin, then exhale": a recovery stop close to the last skin stop rides along with it.
  let attached: Pick | null = null;
  if (skinPicks.length > 0 && recoveryPicks.length > 0) {
    const last = skinPicks[skinPicks.length - 1];
    if (kmBetween(point(last.place), point(recoveryPicks[0].place)) <= 3) attached = recoveryPicks[0];
  }

  const routines: GlowUpRoutine[] = [];
  if (skinPicks.length > 0) {
    routines.push(makeRoutine('skin', attached ? [...skinPicks, attached] : skinPicks, profile, { attachedRecovery: Boolean(attached) }));
  }
  if (stylePicks.length > 0) routines.push(makeRoutine('style', stylePicks, profile));
  const restPicks = recoveryPicks.filter((p) => p !== attached);
  if (restPicks.length > 0) routines.push(makeRoutine('recovery', restPicks, profile));

  return { routines, leftOut, mix: preset, forced, changeNote: null };
}

/** One line on what a "See another version" changed, comparing venue picks per category. */
export function describeChange(before: GlowUpPlanV2, after: GlowUpPlanV2): string {
  const flat = (plan: GlowUpPlanV2) => new Map(plan.routines.flatMap((r) => r.stops.map((s) => [s.subtype, s.place] as const)));
  const a = flat(before);
  const b = flat(after);
  const diffs: string[] = [];
  for (const [subtype, place] of b) {
    const old = a.get(subtype);
    if (old && old.id !== place.id) diffs.push(`${labelForSubtype(subtype)}: ${old.name} → ${place.name}`);
  }
  const label = after.mix ? MIX_LABEL[after.mix] : 'your picks';
  if (diffs.length === 0) return `Already the best fit for “${label}” — nothing changed.`;
  const shown = diffs.slice(0, 2).join(' · ');
  const more = diffs.length > 2 ? ` · +${diffs.length - 2} more` : '';
  return `Rebuilt for “${label}”. ${shown}${more}`;
}

export interface CheckItem {
  id: 'match' | 'trip' | 'language' | 'budget';
  title: string;
  detail: string;
  ok: boolean;
}

/** The "MIYEON CHECKED" grid on the detail page. An item is only ticked when the venue data confirms it. */
export function checksFor(place: GlowUpPlace, subtype: GlowUpSubtype, profile: GlowUpProfile | undefined): CheckItem[] {
  const guide = guideFor(subtype);
  const pref = profile ? preferredRegion(profile) : null;
  const wantedLangs: GlowUpLanguage[] = profile?.languages.length ? profile.languages : ['English'];
  const lang = profile ? languageFit(place, profile.languages) : place.languages.includes('English') || place.englishSupport === true ? true : null;
  const langName = wantedLangs.includes('English') ? 'English' : wantedLangs[0];
  const budget = profile ? budgetFit(place, profile) : null;
  const minutes = place.minutes ?? guide?.minutes ?? null;

  const inArea = place.region ? (pref ? place.region === pref : true) : false;
  return [
    {
      id: 'match',
      title: 'Your match',
      detail: place.tagline ?? guide?.name ?? labelForSubtype(subtype),
      ok: true,
    },
    {
      id: 'trip',
      title: 'Trip-ready',
      detail: `${minutes ? `${minutes} min · ` : ''}${place.region ? shortRegion(place.region) : 'Location not confirmed'}`,
      ok: inArea,
    },
    {
      id: 'language',
      title: `${langName} support`,
      detail: lang === true ? 'Listed on the booking page' : lang === false ? 'Not offered' : 'Not confirmed',
      ok: lang === true,
    },
    {
      id: 'budget',
      title: 'On budget',
      detail:
        place.priceFromUsd != null
          ? `${budget === false ? 'Above your range · ' : ''}from ~$${Math.round(place.priceFromUsd)}`
          : 'Price not confirmed',
      ok: budget === true && place.priceFromUsd != null,
    },
  ];
}
