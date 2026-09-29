import type {
  GlowUpLanguage,
  GlowUpMixPreset,
  GlowUpPlace,
  GlowUpPlanV2,
  GlowUpProfile,
  GlowUpRoutine,
  GlowUpStop,
  GlowUpSubtype,
  GlowUpTiming,
} from '../../types';
import { guideFor } from '../../data/categoryGuides';
import { budgetMaxUsdOf, labelForSubtype } from '../../data/glowUpQuiz';
import {
  ATTACH_ORDER,
  EITHER_OF,
  ROUTINE_TEMPLATES,
  SOLO_FALLBACK,
  STAGE_ORDER,
  STAGE_TIMING,
  TIMING_ORDER,
  conflicts,
  type RoutineSlot,
  type RoutineTemplate,
  type SlotKind,
} from '../../data/glowUpRoutines';
import type { TFunction } from '../../i18n';
import { travelForDistance } from '../itinerary/travel';
import {
  COMBO_TOP_N,
  SKIN_GROUP,
  anchorRegion,
  bestCombination,
  budgetFit,
  eligible,
  kmBetween,
  languageFit,
  point,
  topFor,
  type AppRegion,
  type Scored,
  type ScoreInput,
} from './scoring';

export { budgetFit, languageFit } from './scoring';

// V2 result: the traveller's picks become Glow-up routines — each one a template from
// data/glowUpRoutines.ts (FOUNDATION → IDENTITY → FINISH → RECOVER) — and every routine gets real,
// bookable venues chosen together (scoring.ts). Deterministic, no LLM.

export const PLAN_VERSION = 3;

export const MIX_LABEL: Record<GlowUpMixPreset, string> = {
  'less-downtime': 'Less Downtime',
  closer: 'Closer to My Hotel',
  'lower-budget': 'Lower Budget',
  iconic: 'More Iconic K-Beauty',
};

export interface RoutineOptions {
  preset?: GlowUpMixPreset | null;
}

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

/** Skin/face work is clinic work, and booking a clinic on Creatrip is free (the treatment is paid at the clinic). */
export function isClinicSubtype(subtype: GlowUpSubtype): boolean {
  return SKIN_GROUP.includes(subtype);
}

/** A routine never grows past this many stops when leftovers are attached to it (evenings: fewer). */
const MAX_STOPS_PER_ROUTINE = 4;
const MAX_STOPS_EVENING = 3;

const CITY_LABEL = { seoul: 'Seoul', busan: 'Busan' } as const;

export function profileCity(profile: GlowUpProfile): 'seoul' | 'busan' {
  if (profile.city) return profile.city;
  if (profile.region && BUSAN_REGIONS.has(profile.region)) return 'busan';
  return 'seoul';
}

export const cityLabel = (profile: GlowUpProfile): string => CITY_LABEL[profileCity(profile)];

const preferredRegion = (p: GlowUpProfile): AppRegion | null => (p.region && p.region !== 'auto' ? p.region : null);

const noDowntime = (p: GlowUpProfile): boolean => p.fix.downtime === 'no-daily-photos';

/** How many routines to aim for: 1 day → 2, 2–3 days → 3, 4+ days → 4 (never more than the picks). */
function targetCount(profile: GlowUpProfile, picks: number): number {
  const byTrip = profile.tripDays === '1' ? 2 : profile.tripDays === '2-3' || profile.tripDays == null ? 3 : 4;
  return Math.min(byTrip, picks);
}

// ---- time + text helpers ----

const HHMM = (min: number): string =>
  `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const roundUp15 = (min: number): number => Math.ceil(min / 15) * 15;

const START_MIN: Record<RoutineTemplate['timeOfDay'], number> = { Morning: 10 * 60, Afternoon: 14 * 60, Evening: 19 * 60 };

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
 * category's typical note. */
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

// ---- ① picks → template assignments ----

/** A picked experience. Skin and face together are one clinic visit ('clinic'). */
type Unit = Exclude<SlotKind, 'skin' | 'face'>;

interface Assignment {
  template: RoutineTemplate;
  /** Units in template slot order, then attached extras. */
  units: Unit[];
  /** The slot each unit fills (attached extras get a synthetic slot). */
  slots: RoutineSlot[];
}

function slotFits(slot: RoutineSlot, unit: Unit, wantedSkin: GlowUpSubtype[]): boolean {
  if (slot.kind === 'skin' || slot.kind === 'face') return unit === 'clinic' && wantedSkin.includes(slot.kind);
  return slot.kind === unit;
}

/** Which of `pool` this template would take, or null when a required slot can't be filled. */
function coverage(template: RoutineTemplate, pool: Unit[], wantedSkin: GlowUpSubtype[]): { units: Unit[]; slots: RoutineSlot[] } | null {
  const either = EITHER_OF[template.id];
  const units: Unit[] = [];
  const slots: RoutineSlot[] = [];
  for (const slot of template.slots) {
    const unit = pool.find((u) => !units.includes(u) && slotFits(slot, u, wantedSkin));
    if (unit) {
      units.push(unit);
      slots.push(slot);
    } else if (!slot.optional && !either?.includes(slot.kind)) {
      return null;
    }
  }
  if (units.length === 0) return null;
  if (either && !units.some((u) => either.includes(u))) return null;
  return { units, slots };
}

const isMixed = (t: RoutineTemplate): boolean => t.slots.filter((s) => !s.optional).length >= 2;

function soloTemplate(unit: Unit): RoutineTemplate {
  const subtype: GlowUpSubtype = unit === 'clinic' ? 'skin' : unit;
  const fb = SOLO_FALLBACK[subtype];
  const guide = guideFor(subtype);
  return {
    id: `solo-${unit}`,
    stage: fb?.stage ?? 'identity',
    name: guide?.name ?? labelForSubtype(subtype),
    promise: guide?.headline ?? labelForSubtype(subtype),
    slots: [{ kind: unit, hint: fb?.hint ?? '' }],
    note: fb?.note ?? '',
    timeOfDay: fb?.timeOfDay ?? 'Afternoon',
  };
}

/**
 * Greedy template matching: among templates whose required slots are all picked, take the one that
 * covers the most still-unplaced picks; ties go to mixed templates (the ordering knowledge is the
 * point), then template order. Anything no template covers gets a one-stop routine.
 */
function matchTemplates(pool: Unit[], templates: RoutineTemplate[], wantedSkin: GlowUpSubtype[]): Assignment[] {
  const left = [...pool];
  const out: Assignment[] = [];
  while (left.length > 0) {
    let best: Assignment | null = null;
    for (const template of templates) {
      if (out.some((a) => a.template.id === template.id)) continue;
      const cov = coverage(template, left, wantedSkin);
      if (!cov) continue;
      const better =
        !best ||
        cov.units.length > best.units.length ||
        (cov.units.length === best.units.length && isMixed(template) && !isMixed(best.template));
      if (better) best = { template, units: cov.units, slots: cov.slots };
    }
    if (!best) break;
    out.push(best);
    for (const u of best.units) left.splice(left.indexOf(u), 1);
  }
  for (const unit of left) {
    const template = soloTemplate(unit);
    out.push({ template, units: [unit], slots: template.slots });
  }
  return out;
}

const maxStops = (a: Assignment): number => (a.template.timeOfDay === 'Evening' ? MAX_STOPS_EVENING : MAX_STOPS_PER_ROUTINE);

const RECOVER_UNITS: Unit[] = ['sauna', 'scrub', 'massage', 'yoga'];

/** Recovery picks only fold into recovery routines, and beauty picks only into beauty routines. */
const canJoin = (a: Assignment, unit: Unit): boolean =>
  a.units.length < maxStops(a) &&
  RECOVER_UNITS.includes(unit) === (a.template.stage === 'recover') &&
  a.units.every((u) => !conflicts(u, unit));

function attach(a: Assignment, unit: Unit): Assignment {
  const units = [...a.units, unit];
  const extraSlot: RoutineSlot = { kind: unit, hint: '' };
  const slots = [...a.slots, extraSlot];
  // Template slots keep their order; attached extras slot in by the general ordering rules.
  const order = units.map((u, i) => ({ u, s: slots[i], i }));
  order.sort((x, y) => {
    const xt = x.i < a.units.length;
    const yt = y.i < a.units.length;
    if (xt && yt) return x.i - y.i;
    return ATTACH_ORDER.indexOf(x.u) - ATTACH_ORDER.indexOf(y.u);
  });
  return { template: a.template, units: order.map((o) => o.u), slots: order.map((o) => o.s) };
}

/**
 * Matches the picks to templates, then evens out the count toward the trip-length target: too few →
 * split the biggest mixed routine; too many → fold a routine into a compatible one. A pick is never
 * dropped either way.
 */
function assign(pool: Unit[], profile: GlowUpProfile, wantedSkin: GlowUpSubtype[]): Assignment[] {
  const nd = noDowntime(profile);
  const templates = ROUTINE_TEMPLATES.filter((t) => (nd ? !t.skipNoDowntime : !t.onlyNoDowntime));
  let list = matchTemplates(pool, templates, wantedSkin);
  const target = targetCount(profile, pool.length);

  // Too few: split one pick off the biggest routine and give it its own.
  for (let guard = 0; list.length < target && guard < 12; guard++) {
    const i = list.reduce((bi, a, idx) => (a.units.length > list[bi].units.length ? idx : bi), 0);
    const big = list[i];
    if (big.units.length < 2) break;
    const moved = big.units[big.units.length - 1];
    const rest = big.units.slice(0, -1);
    const others = list.filter((_, idx) => idx !== i);
    const used = new Set(others.map((a) => a.template.id));
    const avail = templates.filter((t) => !used.has(t.id));
    const restMatched = matchTemplates(rest, avail, wantedSkin);
    const restUsed = new Set(restMatched.map((a) => a.template.id));
    const movedMatched = matchTemplates([moved], avail.filter((t) => !restUsed.has(t.id)), wantedSkin);
    list = [...others.slice(0, i), ...restMatched, ...movedMatched, ...others.slice(i)];
  }

  // Too many: fold the smallest routine into one it can share a day with.
  for (let guard = 0; list.length > target && guard < 12; guard++) {
    let merged = false;
    const bySize = list.map((a, idx) => ({ a, idx })).sort((x, y) => x.a.units.length - y.a.units.length || y.idx - x.idx);
    for (const { a: small, idx: si } of bySize) {
      // Prefer a routine in the same stage, then any other.
      const hosts = list
        .map((h, hi) => ({ h, hi }))
        .filter(({ hi }) => hi !== si)
        .sort((x, y) => Number(y.h.template.stage === small.template.stage) - Number(x.h.template.stage === small.template.stage) || x.hi - y.hi);
      const host = hosts.find(({ h }) => small.units.every((u) => canJoin(h, u)) && h.units.length + small.units.length <= maxStops(h));
      if (!host) continue;
      let joined = host.h;
      for (const u of small.units) joined = attach(joined, u);
      list = list.map((x, idx) => (idx === host.hi ? joined : x)).filter((_, idx) => idx !== si);
      merged = true;
      break;
    }
    if (!merged) break;
  }
  return list;
}

// ---- ② assignments → routines with venues ----

function timingOf(template: RoutineTemplate, units: Unit[], profile: GlowUpProfile): { timing: GlowUpTiming; note: string | null } {
  // Photos every day: clinic work moves to the end — any redness happens on the way home.
  if (template.stage === 'foundation' && units.includes('clinic') && noDowntime(profile)) {
    return { timing: 'last', note: 'Last on purpose — any redness happens on your way home.' };
  }
  return { timing: STAGE_TIMING[template.stage], note: null };
}

/** The card's context line — a few templates say something more specific when other picks exist. */
function noteFor(template: RoutineTemplate, pool: Unit[], units: Unit[]): string {
  const clinicElsewhere = pool.includes('clinic') && !units.includes('clinic');
  if (template.stage === 'recover' && clinicElsewhere) return 'Not on your clinic day';
  if (template.id === 'k-salon-souvenir' && pool.includes('personal-color') && !units.includes('personal-color')) return 'Uses your palette result';
  return template.note;
}

function hintFor(template: RoutineTemplate, slot: RoutineSlot, pool: Unit[], units: Unit[]): string {
  if (template.id === 'k-salon-souvenir' && slot.kind === 'hair' && pool.includes('personal-color') && !units.includes('personal-color')) {
    return 'Bring your palette card';
  }
  return slot.hint;
}

function areaLabel(stops: GlowUpStop[]): string {
  return [...new Set(stops.map((s) => shortRegion(s.place.region)))].join(' · ');
}

function buildRoutine(
  a: Assignment,
  pool: Unit[],
  wantedSkin: GlowUpSubtype[],
  profile: GlowUpProfile,
  input: ScoreInput,
  city: 'seoul' | 'busan'
): GlowUpRoutine | null {
  // Candidates per slot; a slot with no venue at all is left out rather than failing the routine.
  const filled = a.units
    .map((unit, i) => {
      const slot = a.slots[i];
      const subtypes: GlowUpSubtype[] =
        unit === 'clinic'
          ? slot.kind === 'skin' || slot.kind === 'face'
            ? [slot.kind, ...wantedSkin.filter((s) => s !== slot.kind)]
            : wantedSkin
          : [unit];
      return { unit, slot, cands: topFor(subtypes, input, city, COMBO_TOP_N) };
    })
    .filter((x) => x.cands.length > 0);
  if (filled.length === 0) return null;

  const combo = bestCombination(filled.map((f) => f.cands)) as Scored[];
  const units = filled.map((f) => f.unit);
  const bestIdx = combo.reduce((bi, s, i) => (s.score > combo[bi].score ? i : bi), 0);

  let clock = START_MIN[a.template.timeOfDay];
  const stops: GlowUpStop[] = combo.map((pick, i) => {
    const prev = combo[i - 1];
    const samePlace = prev && prev.place.id === pick.place.id;
    const travel = prev && !samePlace ? travelForDistance(kmBetween(point(prev.place), point(pick.place))) : null;
    if (prev) clock = roundUp15(clock + stopMinutes(prev.place, prev.subtype) + (travel?.minutes ?? 0) + (travel ? 15 : 0));
    const slotHint = hintFor(a.template, filled[i].slot, pool, units);
    const dt = downtimeText(pick.place, pick.subtype);
    let hint: string | null = slotHint || null;
    let hintTone: GlowUpStop['hintTone'] = 'info';
    if (!hint && dt.warn) {
      hint = dt.text;
      hintTone = 'warn';
    } else if (!hint && prev && travel) {
      hint =
        travel.mode === 'walk'
          ? `${travel.minutes} min walk from ${prev.place.name}`
          : `${travel.minutes} min by ${travel.mode} from ${prev.place.name}`;
    }
    return {
      id: `stop_${pick.subtype}_${pick.place.id}`,
      place: pick.place,
      subtype: pick.subtype,
      startTime: HHMM(clock),
      hint,
      hintTone,
      best: i === bestIdx,
      travel,
      reasons: reasonsFor(pick.place, pick.subtype, profile),
    };
  });

  const { timing, note: timingNote } = timingOf(a.template, units, profile);
  return {
    id: `rt_${a.template.id}`,
    templateId: a.template.id,
    stage: a.template.stage,
    timing,
    title: a.template.name,
    promise: a.template.promise,
    subtypes: stops.map((s) => s.subtype),
    stops,
    totalMinutes: stops.reduce((sum, s) => sum + stopMinutes(s.place, s.subtype) + (s.travel?.minutes ?? 0), 0),
    timeOfDay: a.template.timeOfDay,
    note: noteFor(a.template, pool, units),
    timingNote,
    areaLabel: areaLabel(stops),
  };
}

/** Builds the routines for a quiz profile from the venue list. */
export function buildRoutines(profile: GlowUpProfile, places: GlowUpPlace[], opts: RoutineOptions = {}): GlowUpPlanV2 {
  const preset = opts.preset ?? null;
  const city = profileCity(profile);
  const wantedSkin = SKIN_GROUP.filter((s) => profile.fix.items.includes(s as never));
  const pool: Unit[] = [
    ...(wantedSkin.length > 0 ? (['clinic'] as Unit[]) : []),
    ...(profile.change as Unit[]),
    ...(profile.restore as Unit[]).filter((u) => RECOVER_UNITS.includes(u)),
  ];

  const pref = preferredRegion(profile);
  const pickedSubtypes: GlowUpSubtype[] = [...wantedSkin, ...(profile.change as GlowUpSubtype[]), ...(profile.restore as GlowUpSubtype[])];
  const region = pref ?? (pickedSubtypes.length > 0 ? anchorRegion(pickedSubtypes, profile, places, city, preset) : null);
  const input: ScoreInput = { profile, places, region, preset };

  const routines = assign(pool, profile, wantedSkin)
    .map((a) => buildRoutine(a, pool, wantedSkin, profile, input, city))
    .filter((r): r is GlowUpRoutine => r !== null)
    .map((r, i) => ({ r, i }))
    .sort(
      (x, y) =>
        TIMING_ORDER.indexOf(x.r.timing) - TIMING_ORDER.indexOf(y.r.timing) ||
        STAGE_ORDER.indexOf(x.r.stage) - STAGE_ORDER.indexOf(y.r.stage) ||
        x.i - y.i
    )
    .map(({ r }) => r);

  return { version: PLAN_VERSION, routines, mix: preset, changeNote: null, anchorRegion: pref ? null : region };
}

/** Routines grouped by when in the trip they fit, in trip order — the result page's chips. */
export function groupByTiming(routines: GlowUpRoutine[]): { timing: GlowUpTiming; routines: GlowUpRoutine[] }[] {
  return TIMING_ORDER.map((timing) => ({ timing, routines: routines.filter((r) => r.timing === timing) })).filter((g) => g.routines.length > 0);
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

/** How many other venues on Creatrip also fit this pick — "See N+ More Options". */
export function otherOptionsCount(place: GlowUpPlace, subtype: GlowUpSubtype, profile: GlowUpProfile | undefined, places: GlowUpPlace[]): number {
  const city = profile ? profileCity(profile) : place.city;
  const pool = profile
    ? eligible(subtype, profile, places, city)
    : places.filter((p) => p.city === city && (p.subtype === subtype || p.extraSubtypes.includes(subtype)));
  return pool.filter((p) => p.id !== place.id).length;
}

export interface CheckItem {
  id: 'match' | 'trip' | 'language' | 'budget';
  title: string;
  detail: string;
}

/** "Your match" detail: what was picked + what the venue's session covers. */
const MATCH_DETAIL: Record<GlowUpSubtype, string> = {
  skin: 'Skin + glow boost',
  face: 'Face + contour',
  'personal-color': 'Color + styling',
  hair: 'Hair + styling',
  makeup: 'Makeup + styling',
  'permanent-makeup': 'Brows, lips or liner',
  photo: 'Shoot + retouch',
  nail: 'Nails + design',
  sauna: 'Sauna + bathhouse',
  scrub: 'Full-body scrub',
  massage: 'Body massage',
  yoga: 'Yoga + wellness',
};

/**
 * The "MIYEON CHECKED" grid on the detail page. Every check is shown by default; "On budget" is
 * left out only when the listed price is clearly over the traveller's max (→ 3/3).
 */
export function checksFor(place: GlowUpPlace, subtype: GlowUpSubtype, profile: GlowUpProfile | undefined): CheckItem[] {
  const guide = guideFor(subtype);
  const wantedLangs: GlowUpLanguage[] = profile?.languages.length ? profile.languages : ['English'];
  const langName = wantedLangs.includes('English') ? 'English' : wantedLangs[0];
  const minutes = place.minutes ?? guide?.minutes ?? null;
  const max = profile ? budgetMaxUsdOf(profile) : null;
  const overBudget = profile ? budgetFit(place, profile) === false : false;

  const items: CheckItem[] = [
    { id: 'match', title: 'Your match', detail: MATCH_DETAIL[subtype] ?? guide?.summary ?? labelForSubtype(subtype) },
    {
      id: 'trip',
      title: 'Trip-ready',
      detail: `${minutes ? `${minutes} min · ` : ''}${shortRegion(place.region)}`,
    },
    {
      id: 'language',
      title: `${langName} support`,
      detail: langName === 'English' ? 'No translation app' : `${langName} listed`,
    },
  ];
  if (!overBudget) {
    items.push({
      id: 'budget',
      title: 'On budget',
      detail:
        place.priceType === 'free' && isClinicSubtype(subtype)
          ? 'Free to book'
          : place.priceFromUsd != null
            ? max != null
              ? `$${Math.round(place.priceFromUsd)} in your range`
              : `From $${Math.round(place.priceFromUsd)}`
            : 'Priced at the venue',
    });
  }
  return items;
}
