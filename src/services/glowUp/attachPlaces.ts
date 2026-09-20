import type {
  BeautyCategory,
  GlowUpDay,
  GlowUpPeriod,
  GlowUpRegion,
  GlowUpResult,
  GlowUpSlotItem,
  GlowUpSubtype,
  Itinerary,
  ItineraryBlock,
  ItineraryDay,
  Place,
  Spot,
  SpotArea,
} from '../../types';
import { AREA_CENTROID, getSpot, ingestPlaces, nearestArea, placeToSpot } from '../../data/spots';
import { discoverVenuesForGlowUp, type GlowUpVenuePools } from '../discovery';
import { travelBetween } from '../itinerary/travel';

const SUBTYPE_CATEGORY: Partial<Record<GlowUpSubtype, BeautyCategory>> = {
  skin: 'skin',
  face: 'face',
  hair: 'hair',
  nail: 'nails',
  makeup: 'makeup',
  'personal-color': 'makeup',
  'permanent-makeup': 'makeup',
};

const SPA_SUBTYPES = new Set<GlowUpSubtype>(['sauna', 'scrub', 'massage']);

const REGION_TO_AREA: Partial<Record<GlowUpRegion, SpotArea>> = {
  gangnam: 'Gangnam',
  'hongdae-mapo': 'Hongdae',
  myeongdong: 'Myeongdong',
  seongsu: 'Seongsu',
};

const PERIOD_START: Record<GlowUpPeriod, string> = {
  morning: '10:30',
  afternoon: '14:00',
  evening: '18:00',
};

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

function originFor(region: GlowUpRegion | null): { lat: number; lng: number } {
  const area = region && region !== 'auto' ? REGION_TO_AREA[region] : undefined;
  return area ? AREA_CENTROID[area] : AREA_CENTROID.Gangnam;
}

function preferredArea(region: GlowUpRegion | null): SpotArea | undefined {
  if (!region || region === 'auto') return undefined;
  return REGION_TO_AREA[region];
}

function ktoRank(place: Place): number {
  return place.source === 'kto' || place.source === 'merged' ? 0 : 1;
}

function sortPlaces(places: Place[], area?: SpotArea): Place[] {
  return places
    .map((place, index) => ({ place, index }))
    .sort((a, b) => {
      const kto = ktoRank(a.place) - ktoRank(b.place);
      if (kto !== 0) return kto;
      if (area) {
        const aIn = nearestArea(a.place.latitude, a.place.longitude) === area ? 0 : 1;
        const bIn = nearestArea(b.place.latitude, b.place.longitude) === area ? 0 : 1;
        if (aIn !== bIn) return aIn - bIn;
      }
      return a.index - b.index;
    })
    .map((row) => row.place);
}

function poolFor(subtype: GlowUpSubtype, pools: GlowUpVenuePools): Place[] {
  const category = SUBTYPE_CATEGORY[subtype];
  if (category) return pools.byCategory[category] ?? [];
  if (SPA_SUBTYPES.has(subtype)) return pools.spa;
  return [];
}

function pickPlace(
  subtype: GlowUpSubtype,
  pools: GlowUpVenuePools,
  area: SpotArea | undefined,
  used: Set<string>
): Place | undefined {
  const unused = poolFor(subtype, pools).filter((place) => !used.has(place.id));
  return sortPlaces(unused, area)[0];
}

function snapshotBlock(place: Place | undefined, item: GlowUpSlotItem, time: string, spot?: Spot): ItineraryBlock {
  const duration = spot?.durationMin ?? 60;
  return {
    id: newId('blk'),
    kind: 'spot',
    spotId: place?.id,
    startTime: time,
    durationMin: duration,
    priceUsd: spot ? Math.round((spot.priceMin + spot.priceMax) / 2) : undefined,
    glowUpSubtype: item.subtype,
    label: `${item.emoji} ${item.label}`,
    reason: place
      ? `Matches your ${item.label} pick in ${nearestArea(place.latitude, place.longitude)}`
      : `Browse ${item.label} listings on Creatrip`,
    venueName: place?.name,
    latitude: place?.latitude,
    longitude: place?.longitude,
    address: place?.address,
    venueSource: place?.source,
  };
}

function areaLabelFor(blocks: ItineraryBlock[]): string {
  const areas = new Set<SpotArea>();
  for (const block of blocks) {
    if (block.latitude != null && block.longitude != null) {
      areas.add(nearestArea(block.latitude, block.longitude));
      continue;
    }
    if (!block.spotId) continue;
    const spot = getSpot(block.spotId);
    if (spot) areas.add(spot.area);
  }
  if (areas.size === 1) return [...areas][0];
  return 'Seoul';
}

function coverUrl(days: ItineraryDay[]): string | undefined {
  for (const day of days) {
    for (const block of day.blocks) {
      if (!block.spotId) continue;
      const image = getSpot(block.spotId)?.images[0];
      if (image) return image;
    }
  }
  return undefined;
}

function blocksForDay(
  day: GlowUpDay,
  pools: GlowUpVenuePools,
  area: SpotArea | undefined,
  used: Set<string>
): ItineraryBlock[] {
  const blocks: ItineraryBlock[] = [];
  let lastSpot: Spot | undefined;

  for (const slot of day.slots) {
    let time = PERIOD_START[slot.period];
    for (const item of slot.items) {
      const place = pickPlace(item.subtype, pools, area, used);
      if (place) used.add(place.id);
      const spot = place ? placeToSpot(place) : undefined;
      if (spot && lastSpot) {
        const travel = travelBetween(lastSpot, spot);
        blocks.push({
          id: newId('trv'),
          kind: 'travel',
          travel,
        });
        time = addMinutes(time, travel.minutes);
      }

      blocks.push(snapshotBlock(place, item, time, spot));
      if (spot) lastSpot = spot;
      time = addMinutes(time, spot?.durationMin ?? 60);
    }
  }

  return blocks;
}

function neededCategories(days: GlowUpDay[]): BeautyCategory[] {
  const set = new Set<BeautyCategory>();
  for (const day of days) {
    for (const slot of day.slots) {
      for (const item of slot.items) {
        const category = SUBTYPE_CATEGORY[item.subtype];
        if (category) set.add(category);
      }
    }
  }
  return [...set];
}

function needsSpa(days: GlowUpDay[]): boolean {
  return days.some((day) =>
    day.slots.some((slot) => slot.items.some((item) => SPA_SUBTYPES.has(item.subtype)))
  );
}

export async function attachPlaces(result: Omit<GlowUpResult, 'itinerary'>): Promise<GlowUpResult> {
  const region = result.profileSnapshot.region;
  const area = preferredArea(region);
  const pools = await discoverVenuesForGlowUp(neededCategories(result.days), originFor(region), {
    includeSpa: needsSpa(result.days),
  });

  const ingested: Place[] = [
    ...Object.values(pools.byCategory).flatMap((list) => list ?? []),
    ...pools.spa,
  ];
  ingestPlaces(ingested);

  const used = new Set<string>();
  const days = result.days.map((day) => ({
    ...day,
    slots: day.slots.map((slot) => ({
      ...slot,
      items: slot.items.map((item) => {
        const place = pickPlace(item.subtype, pools, area, used);
        if (!place) return item;
        used.add(place.id);
        return { ...item, spotId: place.id };
      }),
    })),
  }));

  used.clear();
  const itineraryDays: ItineraryDay[] = days.map((day) => {
    const blocks = blocksForDay(day, pools, area, used);
    return {
      dayIndex: day.dayIndex,
      areaLabel: areaLabelFor(blocks),
      theme: `Day ${day.dayIndex}`,
      blocks,
    };
  });

  const spend = itineraryDays.reduce(
    (sum, day) => sum + day.blocks.reduce((inner, block) => inner + (block.priceUsd ?? 0), 0),
    0
  );
  const now = new Date().toISOString();

  const itinerary: Itinerary = {
    id: newId('itn'),
    title: 'Your Glow Up',
    source: 'miyeon',
    glowUpSnapshot: result.profileSnapshot,
    days: itineraryDays,
    estimatedSpendUsd: spend,
    createdAt: now,
    updatedAt: now,
    coverPhotoUrl: coverUrl(itineraryDays),
    description: result.whyThisLine,
  };

  return { ...result, days, itinerary };
}
