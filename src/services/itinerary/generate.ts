import type {
  BeautyBudget,
  BeautyGoal,
  BeautyTripProfile,
  Itinerary,
  ItineraryBlock,
  ItineraryDay,
  RecoveryComfort,
  RegeneratePreference,
  ReplacePreference,
  Spot,
  SpotArea,
  SpotDowntime,
  SpotSubcategory,
} from '../../types';
import { getSpot, getSpots, SUBCATEGORY_LABEL } from '../../data/spots';
import { travelBetween } from './travel';

const BUDGET_RANGE: Record<BeautyBudget, [number, number]> = {
  'under-100': [0, 100],
  '100-300': [100, 300],
  '300-500': [300, 500],
  '500-1000': [500, 1000],
  '1000-plus': [1000, 8000],
};

const DOWNTIME_RANK: Record<SpotDowntime, number> = {
  none: 0,
  'few-hours': 1,
  '1-day': 2,
  '2-3-days': 3,
};

function wantDowntimeRank(d: RecoveryComfort | null): number {
  if (!d || d === 'ok') return 3;
  if (d === 'none') return 0;
  if (d === 'few-hours') return 1;
  if (d === '1-day') return 2;
  return 3;
}

function dayCount(profile: BeautyTripProfile): number {
  if (profile.tripDays === '1') return 1;
  if (profile.tripDays === '2') return 2;
  if (profile.tripDays === '4-plus') return 4;
  return 3;
}

function spotsPerDay(profile: BeautyTripProfile, extra = 0): number {
  const base =
    profile.beautyTime === 'couple-hours'
      ? 1
      : profile.beautyTime === 'full-day'
        ? 3
        : 2;
  return Math.min(4, Math.max(1, base + extra));
}

const GOAL_SUBCATS: Record<Exclude<BeautyGoal, 'dont-know' | 'overall'>, SpotSubcategory[]> = {
  skin: ['skin-care', 'aesthetics'],
  face: ['skin-care', 'aesthetics', 'beauty-makeup'],
  hair: ['color-perm', 'head-spa', 'hair-makeup', 'hair-extensions'],
  'makeup-style': ['color-analysis', 'beauty-makeup', 'hair-makeup'],
  details: ['nail-art', 'waxing', 'glasses', 'id-portrait', 'permanent-makeup'],
};

function wantedSubcats(profile: BeautyTripProfile): SpotSubcategory[] | null {
  const goals = profile.goals.filter((g) => g !== 'dont-know' && g !== 'overall') as Exclude<
    BeautyGoal,
    'dont-know' | 'overall'
  >[];
  if (goals.length === 0) return null;
  const set = new Set<SpotSubcategory>();
  for (const g of goals) GOAL_SUBCATS[g].forEach((s) => set.add(s));
  if (profile.purpose === 'what-suits-me' || profile.purpose === 'korean-experience') {
    set.add('color-analysis');
    set.add('beauty-makeup');
  }
  if (profile.purpose === 'feel-good') {
    set.add('head-spa');
    set.add('aesthetics');
  }
  if (profile.purpose === 'event') {
    set.add('beauty-makeup');
    set.add('hair-makeup');
    set.add('nail-art');
  }
  return [...set];
}

export function passesHardFilter(spot: Spot, profile: BeautyTripProfile): boolean {
  const needlesOff =
    profile.restrictions.includes('no-needles') || profile.needleComfort === 'no';
  if (needlesOff && spot.needleRequired) return false;

  if (profile.restrictions.includes('need-communication') && !spot.languages.includes('English')) {
    return false;
  }
  if (profile.restrictions.includes('no-surprise-costs') && !spot.priceTransparency) return false;
  if (profile.restrictions.includes('no-factory') && spot.factoryLike) return false;
  if (profile.restrictions.includes('no-upsell') && spot.upsellingRisk) return false;

  const maxDt = wantDowntimeRank(profile.downtime);
  if (DOWNTIME_RANK[spot.downtime] > maxDt) return false;
  if (profile.restrictions.includes('no-trip-ruin') && DOWNTIME_RANK[spot.downtime] >= 2) return false;

  if (profile.budget) {
    const [, max] = BUDGET_RANGE[profile.budget];
    if (spot.priceMin > max) return false;
  }

  if (profile.skinExperience === 'relaxing' && (spot.needleRequired || spot.experienceStyle === 'medical')) {
    return false;
  }
  if (profile.skinExperience === 'medical' && spot.parentCategory !== 'dermatology' && profile.goals.includes('skin')) {
    // still allow other goal categories
  }

  const wanted = wantedSubcats(profile);
  if (wanted && !wanted.includes(spot.subcategory)) return false;

  return true;
}

function scoreSpot(spot: Spot, profile: BeautyTripProfile): number {
  const wanted = wantedSubcats(profile);
  const category = wanted ? (wanted.includes(spot.subcategory) ? 1 : 0.4) : 0.8;

  let personal = 0.7;
  if (profile.purpose === 'what-suits-me' && spot.subcategory === 'color-analysis') personal = 1;
  if (profile.purpose === 'korean-experience' && spot.experienceStyle === 'korean') personal = 1;
  if (profile.purpose === 'feel-good' && spot.experienceStyle === 'relaxing') personal = 1;
  if (profile.purpose === 'new-me' && spot.procedureIntensity !== 'low') personal = 0.95;
  if (profile.purpose === 'event' && (spot.subcategory === 'beauty-makeup' || spot.subcategory === 'hair-makeup')) {
    personal = 1;
  }
  if (spot.touristFriendly) personal = Math.min(1, personal + 0.05);

  let price = 0.7;
  if (profile.budget) {
    const [min, max] = BUDGET_RANGE[profile.budget];
    const mid = (spot.priceMin + spot.priceMax) / 2;
    if (mid >= min && mid <= max) price = 1;
    else if (mid < min) price = 0.75;
    else price = Math.max(0.2, 1 - (mid - max) / 400);
  }

  const hours = /10:00|11:00/.test(spot.openingHours) ? 1 : 0.8;
  const quality = Math.min(1, spot.rating / 5);
  const location = 0.85;

  return (
    personal * 0.3 +
    location * 0.2 +
    price * 0.15 +
    category * 0.15 +
    hours * 0.1 +
    quality * 0.1
  );
}

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function orderByWalk(list: Spot[]): Spot[] {
  if (list.length <= 1) return list;
  const remaining = [...list];
  const path: Spot[] = [remaining.shift()!];
  while (remaining.length) {
    const last = path[path.length - 1];
    remaining.sort(
      (a, b) =>
        (a.latitude - last.latitude) ** 2 +
        (a.longitude - last.longitude) ** 2 -
        ((b.latitude - last.latitude) ** 2 + (b.longitude - last.longitude) ** 2)
    );
    path.push(remaining.shift()!);
  }
  return path;
}

function whyFor(spot: Spot, profile: BeautyTripProfile, firstOfDay: boolean, area: string): string {
  if (spot.subcategory === 'color-analysis' && firstOfDay) {
    return 'We placed color analysis first so you can use your personal colors during the rest of the trip.';
  }
  if (firstOfDay) {
    return `We grouped these experiences in ${area} to reduce unnecessary travel between appointments.`;
  }
  if (spot.experienceStyle === 'relaxing') {
    return 'A lower-intensity stop so the day doesn’t stack recovery on recovery.';
  }
  if (profile.purpose === 'korean-experience' && spot.experienceStyle === 'korean') {
    return 'This one is here because you asked for a distinctly Korean experience.';
  }
  return `A strong match for ${SUBCATEGORY_LABEL[spot.subcategory].toLowerCase()} within your constraints.`;
}

function themeFor(spotsInDay: Spot[]): string {
  if (spotsInDay.some((s) => s.subcategory === 'color-analysis')) return 'Discover what suits you';
  if (spotsInDay.every((s) => s.experienceStyle === 'relaxing' || s.subcategory === 'head-spa')) {
    return 'Go easy on yourself';
  }
  if (spotsInDay.some((s) => s.parentCategory === 'dermatology')) return 'Skin, then the rest';
  if (spotsInDay.some((s) => s.parentCategory === 'hair-salon')) return 'Hair day';
  return 'A neighborhood beauty loop';
}

function buildDay(
  area: SpotArea,
  dayIndex: number,
  picked: Spot[],
  profile: BeautyTripProfile,
  startHour: string
): ItineraryDay {
  const ordered = orderByWalk(picked);
  const blocks: ItineraryBlock[] = [];
  let cursor = startHour;
  let minutesOnBeauty = 0;

  ordered.forEach((spot, i) => {
    if (i > 0) {
      const prev = ordered[i - 1];
      const travel = travelBetween(prev, spot);
      blocks.push({
        id: newId('tr'),
        kind: 'travel',
        travel,
        durationMin: travel.minutes,
        startTime: cursor,
      });
      cursor = addMinutes(cursor, travel.minutes);
    }

    if (minutesOnBeauty >= 180 && !blocks.some((b) => b.kind === 'break')) {
      blocks.push({
        id: newId('br'),
        kind: 'break',
        label: 'Lunch break',
        durationMin: 50,
        startTime: cursor,
      });
      cursor = addMinutes(cursor, 50);
    }

    const price = Math.round((spot.priceMin + spot.priceMax) / 2);
    blocks.push({
      id: newId('sp'),
      kind: 'spot',
      spotId: spot.id,
      startTime: cursor,
      durationMin: spot.durationMin,
      priceUsd: price,
      reason: whyFor(spot, profile, i === 0, area),
    });
    cursor = addMinutes(cursor, spot.durationMin);
    minutesOnBeauty += spot.durationMin;
  });

  return {
    dayIndex,
    areaLabel: area.toUpperCase(),
    theme: themeFor(ordered),
    blocks,
  };
}

function estimatedSpend(days: ItineraryDay[]): number {
  return days.reduce(
    (sum, day) => sum + day.blocks.reduce((s, b) => s + (b.priceUsd ?? 0), 0),
    0
  );
}

function pickCover(days: ItineraryDay[]): string | undefined {
  for (const day of days) {
    for (const block of day.blocks) {
      if (block.spotId) {
        const spot = getSpot(block.spotId);
        if (spot?.images[0]) return spot.images[0];
      }
    }
  }
  return undefined;
}

interface GenerateOpts {
  extraSpots?: number;
  startHour?: string;
  preferKorean?: boolean;
  preferRelaxing?: boolean;
  cheaper?: boolean;
  oneArea?: boolean;
  maxDays?: number;
}

function selectSpots(profile: BeautyTripProfile, opts: GenerateOpts): Map<SpotArea, Spot[]> {
  const catalog = getSpots();
  let candidates = catalog.filter((s) => passesHardFilter(s, profile));
  if (candidates.length < 3) {
    candidates = catalog.filter((s) => {
      const clone = { ...profile, goals: profile.goals.includes('dont-know') ? profile.goals : ['dont-know' as const] };
      return passesHardFilter(s, clone);
    });
  }

  const scored = candidates
    .map((spot) => {
      let s = scoreSpot(spot, profile);
      if (opts.preferKorean && spot.experienceStyle === 'korean') s += 0.12;
      if (opts.preferRelaxing && spot.experienceStyle === 'relaxing') s += 0.12;
      if (opts.cheaper) s += Math.max(0, (200 - spot.priceMin) / 400);
      return { spot, s };
    })
    .sort((a, b) => b.s - a.s);

  const byArea = new Map<SpotArea, { spot: Spot; s: number }[]>();
  for (const row of scored) {
    const list = byArea.get(row.spot.area) ?? [];
    list.push(row);
    byArea.set(row.spot.area, list);
  }

  const areaRank = [...byArea.entries()]
    .map(([area, rows]) => ({
      area,
      score: rows.slice(0, 4).reduce((sum, r) => sum + r.s, 0),
    }))
    .sort((a, b) => b.score - a.score);

  const days = Math.min(opts.maxDays ?? dayCount(profile), areaRank.length || 1);
  const perDay = spotsPerDay(profile, opts.extraSpots ?? 0);
  const chosenAreas = opts.oneArea ? areaRank.slice(0, 1) : areaRank.slice(0, days);
  const used = new Set<string>();
  const result = new Map<SpotArea, Spot[]>();

  for (const { area } of chosenAreas) {
    const rows = byArea.get(area) ?? [];
    const picked: Spot[] = [];
    const seenSub = new Set<SpotSubcategory>();
    for (const row of rows) {
      if (used.has(row.spot.id)) continue;
      if (seenSub.has(row.spot.subcategory) && picked.length + 1 < perDay) continue;
      picked.push(row.spot);
      used.add(row.spot.id);
      seenSub.add(row.spot.subcategory);
      if (picked.length >= perDay) break;
    }
    if (picked.length < perDay) {
      for (const row of rows) {
        if (used.has(row.spot.id)) continue;
        picked.push(row.spot);
        used.add(row.spot.id);
        if (picked.length >= perDay) break;
      }
    }
    if (picked.length) result.set(area, picked);
  }

  // Recovery: if a day has high downtime, keep that day as the last one when possible.
  return result;
}

function assemble(
  profile: BeautyTripProfile,
  byArea: Map<SpotArea, Spot[]>,
  startHour: string
): ItineraryDay[] {
  const entries = [...byArea.entries()];
  entries.sort((a, b) => {
    const aHeavy = a[1].some((s) => DOWNTIME_RANK[s.downtime] >= 2) ? 1 : 0;
    const bHeavy = b[1].some((s) => DOWNTIME_RANK[s.downtime] >= 2) ? 1 : 0;
    return aHeavy - bHeavy;
  });
  return entries.map(([area, list], i) => buildDay(area, i + 1, list, profile, startHour));
}

export function generateItinerary(
  profile: BeautyTripProfile,
  opts: GenerateOpts = {}
): Itinerary {
  const byArea = selectSpots(profile, opts);
  const startHour = opts.startHour ?? '10:30';
  const days = assemble(profile, byArea, startHour);
  const now = new Date().toISOString();
  const spend = estimatedSpend(days);
  const n = days.reduce((c, d) => c + d.blocks.filter((b) => b.kind === 'spot').length, 0);

  return {
    id: newId('itn'),
    title: 'Your Seoul Beauty Trip',
    source: 'miyeon',
    profileSnapshot: profile,
    days,
    estimatedSpendUsd: spend,
    createdAt: now,
    updatedAt: now,
    coverPhotoUrl: pickCover(days),
    description: `${days.length} day${days.length === 1 ? '' : 's'} · ${n} experience${n === 1 ? '' : 's'}`,
  };
}

export function regenerateItinerary(
  current: Itinerary,
  preference: RegeneratePreference
): Itinerary {
  const profile = current.profileSnapshot;
  if (!profile) return current;
  const opts: GenerateOpts = {};
  if (preference === 'cheaper') opts.cheaper = true;
  if (preference === 'less-travel') opts.oneArea = true;
  if (preference === 'more-experiences' || preference === 'more-packed') opts.extraSpots = 1;
  if (preference === 'more-korean') opts.preferKorean = true;
  if (preference === 'more-relaxing') opts.preferRelaxing = true;
  if (preference === 'start-later') opts.startHour = '12:00';
  if (preference === 'finish-earlier') {
    opts.extraSpots = -1;
    opts.startHour = '10:00';
  }
  const next = generateItinerary(profile, opts);
  return { ...next, id: current.id, createdAt: current.createdAt };
}

function usedSpotIds(itinerary: Itinerary): Set<string> {
  const ids = new Set<string>();
  for (const day of itinerary.days) {
    for (const b of day.blocks) if (b.spotId) ids.add(b.spotId);
  }
  return ids;
}

export function replaceSpotInItinerary(
  itinerary: Itinerary,
  dayIndex: number,
  blockId: string,
  preference: ReplacePreference
): Itinerary {
  const profile = itinerary.profileSnapshot ?? emptyProfileFallback();
  const day = itinerary.days.find((d) => d.dayIndex === dayIndex);
  if (!day) return itinerary;
  const block = day.blocks.find((b) => b.id === blockId && b.kind === 'spot');
  if (!block?.spotId) return itinerary;
  const current = getSpot(block.spotId);
  if (!current) return itinerary;

  const used = usedSpotIds(itinerary);
  used.delete(current.id);

  const neighbors = day.blocks
    .filter((b) => b.kind === 'spot' && b.spotId && b.id !== blockId)
    .map((b) => getSpot(b.spotId!))
    .filter((s): s is Spot => Boolean(s));

  let pool = getSpots().filter((s) => !used.has(s.id) && passesHardFilter(s, profile));
  if (preference === 'cheaper') pool = pool.filter((s) => s.priceMax < current.priceMax);
  if (preference === 'relaxing') pool = pool.filter((s) => s.experienceStyle === 'relaxing' || s.downtime === 'none');
  if (preference === 'korean') pool = pool.filter((s) => s.experienceStyle === 'korean');
  if (preference === 'different-category') pool = pool.filter((s) => s.subcategory !== current.subcategory);
  if (preference === 'higher-rated') pool = pool.filter((s) => s.rating >= current.rating);
  if (preference === 'closer' && neighbors[0]) {
    const anchor = neighbors[0];
    pool = [...pool].sort(
      (a, b) =>
        (a.latitude - anchor.latitude) ** 2 +
        (a.longitude - anchor.longitude) ** 2 -
        ((b.latitude - anchor.latitude) ** 2 + (b.longitude - anchor.longitude) ** 2)
    );
  } else {
    pool = [...pool].sort((a, b) => scoreSpot(b, profile) - scoreSpot(a, profile));
  }

  const sameArea = pool.filter((s) => s.area === current.area);
  const nextSpot = (sameArea[0] ?? pool[0]) as Spot | undefined;
  if (!nextSpot) return itinerary;

  const daySpots = day.blocks
    .filter((b) => b.kind === 'spot')
    .map((b) => (b.id === blockId ? nextSpot : getSpot(b.spotId!)))
    .filter((s): s is Spot => Boolean(s));

  const rebuilt = buildDay(current.area, day.dayIndex, daySpots, profile, day.blocks[0]?.startTime ?? '10:30');
  const days = itinerary.days.map((d) => (d.dayIndex === dayIndex ? rebuilt : d));
  const updated: Itinerary = {
    ...itinerary,
    days,
    estimatedSpendUsd: estimatedSpend(days),
    updatedAt: new Date().toISOString(),
    coverPhotoUrl: pickCover(days),
  };
  const n = days.reduce((c, d) => c + d.blocks.filter((b) => b.kind === 'spot').length, 0);
  updated.description = `${days.length} day${days.length === 1 ? '' : 's'} · ${n} experience${n === 1 ? '' : 's'}`;
  return updated;
}

export function removeSpotFromItinerary(
  itinerary: Itinerary,
  dayIndex: number,
  blockId: string
): Itinerary {
  const profile = itinerary.profileSnapshot ?? emptyProfileFallback();
  const day = itinerary.days.find((d) => d.dayIndex === dayIndex);
  if (!day) return itinerary;
  const remaining = day.blocks
    .filter((b) => b.kind === 'spot' && b.id !== blockId)
    .map((b) => getSpot(b.spotId!))
    .filter((s): s is Spot => Boolean(s));
  if (remaining.length === 0) {
    const days = itinerary.days.filter((d) => d.dayIndex !== dayIndex).map((d, i) => ({ ...d, dayIndex: i + 1 }));
    return {
      ...itinerary,
      days,
      estimatedSpendUsd: estimatedSpend(days),
      updatedAt: new Date().toISOString(),
    };
  }
  const area = remaining[0].area;
  const rebuilt = buildDay(area, day.dayIndex, remaining, profile, '10:30');
  const days = itinerary.days.map((d) => (d.dayIndex === dayIndex ? rebuilt : d));
  return {
    ...itinerary,
    days,
    estimatedSpendUsd: estimatedSpend(days),
    updatedAt: new Date().toISOString(),
  };
}

export function moveSpotToDay(
  itinerary: Itinerary,
  fromDay: number,
  blockId: string,
  toDay: number
): Itinerary {
  if (fromDay === toDay) return itinerary;
  const profile = itinerary.profileSnapshot ?? emptyProfileFallback();
  const src = itinerary.days.find((d) => d.dayIndex === fromDay);
  const dst = itinerary.days.find((d) => d.dayIndex === toDay);
  if (!src || !dst) return itinerary;
  const block = src.blocks.find((b) => b.id === blockId && b.kind === 'spot');
  const spot = block?.spotId ? getSpot(block.spotId) : undefined;
  if (!spot) return itinerary;

  const srcSpots = src.blocks
    .filter((b) => b.kind === 'spot' && b.id !== blockId)
    .map((b) => getSpot(b.spotId!))
    .filter((s): s is Spot => Boolean(s));
  const dstSpots = [
    ...dst.blocks
      .filter((b) => b.kind === 'spot')
      .map((b) => getSpot(b.spotId!))
      .filter((s): s is Spot => Boolean(s)),
    spot,
  ];

  const days = itinerary.days
    .map((d) => {
      if (d.dayIndex === fromDay) {
        if (srcSpots.length === 0) return null;
        return buildDay(srcSpots[0].area, d.dayIndex, srcSpots, profile, '10:30');
      }
      if (d.dayIndex === toDay) {
        return buildDay(dstSpots[0].area, d.dayIndex, dstSpots, profile, '10:30');
      }
      return d;
    })
    .filter((d): d is ItineraryDay => Boolean(d))
    .map((d, i) => ({ ...d, dayIndex: i + 1 }));

  return {
    ...itinerary,
    days,
    estimatedSpendUsd: estimatedSpend(days),
    updatedAt: new Date().toISOString(),
  };
}

function emptyProfileFallback(): BeautyTripProfile {
  return {
    purpose: 'dont-know',
    goals: ['dont-know'],
    skinExperience: null,
    needleComfort: null,
    restrictions: [],
    nothingOffLimits: true,
    budget: '300-500',
    beautyTime: 'half-day',
    tripDays: '3',
    downtime: 'few-hours',
  };
}

export function emptyProfile(): BeautyTripProfile {
  return {
    purpose: null,
    goals: [],
    skinExperience: null,
    needleComfort: null,
    restrictions: [],
    nothingOffLimits: false,
    budget: null,
    beautyTime: null,
    tripDays: null,
    downtime: null,
  };
}

export function itinerarySpotCount(itinerary: Itinerary): number {
  return itinerary.days.reduce((c, d) => c + d.blocks.filter((b) => b.kind === 'spot').length, 0);
}

export function rebuildDayFromSpots(
  itinerary: Itinerary,
  dayIndex: number,
  spotList: Spot[],
  startHour = '10:30'
): Itinerary {
  const profile = itinerary.profileSnapshot ?? emptyProfileFallback();
  if (spotList.length === 0) {
    const days = itinerary.days.filter((d) => d.dayIndex !== dayIndex).map((d, i) => ({ ...d, dayIndex: i + 1 }));
    return { ...itinerary, days, estimatedSpendUsd: estimatedSpend(days), updatedAt: new Date().toISOString() };
  }
  const rebuilt = buildDay(spotList[0].area, dayIndex, spotList, profile, startHour);
  const days = itinerary.days.map((d) => (d.dayIndex === dayIndex ? rebuilt : d));
  return {
    ...itinerary,
    days,
    estimatedSpendUsd: estimatedSpend(days),
    updatedAt: new Date().toISOString(),
    coverPhotoUrl: pickCover(days),
    description: `${days.length} day${days.length === 1 ? '' : 's'} · ${itinerarySpotCount({ ...itinerary, days })} experiences`,
  };
}

export function createBlankItinerary(curatorId: string, title: string): Itinerary {
  const now = new Date().toISOString();
  return {
    id: `itn_${crypto.randomUUID()}`,
    title,
    source: 'curator',
    curatorId,
    days: [{ dayIndex: 1, areaLabel: 'SEOUL', theme: 'Day 1', blocks: [] }],
    estimatedSpendUsd: 0,
    createdAt: now,
    updatedAt: now,
    description: 'A curator itinerary',
  };
}

export function addSpotToDay(itinerary: Itinerary, dayIndex: number, spot: Spot, note?: string): Itinerary {
  const day = itinerary.days.find((d) => d.dayIndex === dayIndex);
  const existing =
    day?.blocks
      .filter((b) => b.kind === 'spot')
      .map((b) => getSpot(b.spotId!))
      .filter((s): s is Spot => Boolean(s)) ?? [];
  if (existing.some((s) => s.id === spot.id)) return itinerary;
  let next = itinerary;
  if (!day) {
    next = {
      ...itinerary,
      days: [...itinerary.days, { dayIndex, areaLabel: spot.area.toUpperCase(), blocks: [] }],
    };
  }
  next = rebuildDayFromSpots(next, dayIndex, [...existing, spot]);
  if (note) {
    next = {
      ...next,
      days: next.days.map((d) =>
        d.dayIndex === dayIndex
          ? {
              ...d,
              blocks: d.blocks.map((b) => (b.spotId === spot.id ? { ...b, note } : b)),
            }
          : d
      ),
    };
  }
  return next;
}

export function addEmptyDay(itinerary: Itinerary): Itinerary {
  const dayIndex = itinerary.days.length + 1;
  return {
    ...itinerary,
    days: [...itinerary.days, { dayIndex, areaLabel: 'SEOUL', theme: `Day ${dayIndex}`, blocks: [] }],
    updatedAt: new Date().toISOString(),
  };
}
