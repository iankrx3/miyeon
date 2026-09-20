import type {
  GlowUpDay,
  GlowUpPeriod,
  GlowUpRegion,
  GlowUpResult,
  GlowUpSlotItem,
  GlowUpSubtype,
  Itinerary,
  ItineraryBlock,
  ItineraryDay,
  Spot,
  SpotArea,
  SpotSubcategory,
} from '../../types';
import { getSpot, getSpots } from '../../data/spots';
import { travelBetween } from '../itinerary/travel';

/** Catalog spots only carry one representative subcategory per BeautyCategory. */
const SUBTYPE_SUBCATEGORY: Partial<Record<GlowUpSubtype, SpotSubcategory>> = {
  skin: 'skin-care',
  face: 'aesthetics',
  hair: 'color-perm',
  nail: 'nail-art',
  makeup: 'beauty-makeup',
  'personal-color': 'beauty-makeup',
  'permanent-makeup': 'beauty-makeup',
};

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

function pickSpot(subtype: GlowUpSubtype, region: GlowUpRegion | null, used: Set<string>): Spot | undefined {
  const subcategory = SUBTYPE_SUBCATEGORY[subtype];
  if (!subcategory) return undefined;

  const preferredArea = region && region !== 'auto' ? REGION_TO_AREA[region] : undefined;
  const unused = getSpots()
    .filter((s) => s.subcategory === subcategory && !used.has(s.id))
    .sort((a, b) => b.rating - a.rating);

  if (preferredArea) {
    const inArea = unused.filter((s) => s.area === preferredArea);
    if (inArea[0]) return inArea[0];
  }
  return unused[0];
}

function attachToItems(
  items: GlowUpSlotItem[],
  region: GlowUpRegion | null,
  used: Set<string>
): GlowUpSlotItem[] {
  return items.map((item) => {
    const spot = pickSpot(item.subtype, region, used);
    if (!spot) return item;
    used.add(spot.id);
    return { ...item, spotId: spot.id };
  });
}

function areaLabelFor(blocks: ItineraryBlock[]): string {
  const areas = new Set<SpotArea>();
  for (const block of blocks) {
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

function blocksForDay(day: GlowUpDay): ItineraryBlock[] {
  const blocks: ItineraryBlock[] = [];
  let lastSpot: Spot | undefined;

  for (const slot of day.slots) {
    let time = PERIOD_START[slot.period];
    for (const item of slot.items) {
      const spot = item.spotId ? getSpot(item.spotId) : undefined;
      if (spot && lastSpot) {
        const travel = travelBetween(lastSpot, spot);
        blocks.push({
          id: newId('trv'),
          kind: 'travel',
          travel,
        });
        time = addMinutes(time, travel.minutes);
      }

      const duration = spot?.durationMin ?? 60;
      blocks.push({
        id: newId('blk'),
        kind: 'spot',
        spotId: spot?.id,
        startTime: time,
        durationMin: duration,
        priceUsd: spot ? Math.round((spot.priceMin + spot.priceMax) / 2) : undefined,
        glowUpSubtype: item.subtype,
        label: `${item.emoji} ${item.label}`,
        reason: spot
          ? `Matches your ${item.label} pick in ${spot.area}`
          : `Browse ${item.label} listings on Creatrip`,
      });

      if (spot) lastSpot = spot;
      time = addMinutes(time, duration);
    }
  }

  return blocks;
}

export function attachPlaces(result: Omit<GlowUpResult, 'itinerary'>): GlowUpResult {
  const used = new Set<string>();
  const region = result.profileSnapshot.region;
  const days = result.days.map((day) => ({
    ...day,
    slots: day.slots.map((slot) => ({
      ...slot,
      items: attachToItems(slot.items, region, used),
    })),
  }));

  const itineraryDays: ItineraryDay[] = days.map((day) => {
    const blocks = blocksForDay(day);
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
