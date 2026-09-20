import type {
  GlowUpDay,
  GlowUpPeriod,
  GlowUpProfile,
  GlowUpResult,
  Itinerary,
  ItineraryBlock,
  ItineraryDay,
} from '../../types';
import { guideFor } from '../../data/categoryGuides';
import { regionLabel } from '../../data/glowUpQuiz';

const PERIOD_START: Record<GlowUpPeriod, string> = {
  morning: '10:00',
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

function blocksForDay(day: GlowUpDay): ItineraryBlock[] {
  const blocks: ItineraryBlock[] = [];
  for (const slot of day.slots) {
    let time = PERIOD_START[slot.period];
    for (const item of slot.items) {
      const guide = guideFor(item.subtype);
      blocks.push({
        id: newId('blk'),
        kind: 'spot',
        startTime: time,
        durationMin: guide?.minutes,
        priceUsd: guide?.typicalUsd,
        glowUpSubtype: item.subtype,
        label: guide?.name ?? item.label,
        note: guide?.resultNote?.text,
      });
      time = addMinutes(time, guide?.minutes ?? 60);
    }
  }
  return blocks;
}

function dayTheme(day: GlowUpDay, blocks: ItineraryBlock[]): string {
  const first = blocks[0]?.glowUpSubtype;
  const guide = first ? guideFor(first) : undefined;
  return guide ? `Day ${day.dayIndex} — ${guide.dayTitle}` : `Day ${day.dayIndex} — free time`;
}

function coverUrl(blocks: ItineraryBlock[]): string | undefined {
  const first = blocks.find((b) => b.glowUpSubtype);
  return first?.glowUpSubtype ? guideFor(first.glowUpSubtype)?.image : undefined;
}

/** Builds the Plan result as category recommendations (Skin Clinic, Personal
 * Color, …) rather than specific venues — each stop links to its category page
 * and to a filtered Creatrip list. No network calls. */
export function buildCategoryItinerary(
  result: Omit<GlowUpResult, 'itinerary'>,
  profile: GlowUpProfile
): GlowUpResult {
  const area = regionLabel(profile.region);
  const hasRegion = profile.region != null && profile.region !== 'auto';
  const cityName = profile.city === 'busan' ? 'Busan' : profile.city === 'seoul' || hasRegion ? 'Seoul' : 'Korea';

  const itineraryDays: ItineraryDay[] = result.days.map((day) => {
    const blocks = blocksForDay(day);
    return {
      dayIndex: day.dayIndex,
      areaLabel: hasRegion ? area : cityName,
      theme: dayTheme(day, blocks),
      blocks,
    };
  });

  const spend = itineraryDays.reduce(
    (sum, day) => sum + day.blocks.reduce((inner, block) => inner + (block.priceUsd ?? 0), 0),
    0
  );
  const now = new Date().toISOString();
  const n = itineraryDays.length;

  const itinerary: Itinerary = {
    id: newId('itn'),
    title: `${n} day${n === 1 ? '' : 's'} in ${cityName}, in the right order`,
    source: 'miyeon',
    glowUpSnapshot: result.profileSnapshot,
    days: itineraryDays,
    estimatedSpendUsd: spend,
    createdAt: now,
    updatedAt: now,
    coverPhotoUrl: coverUrl(itineraryDays.flatMap((d) => d.blocks)),
    description: result.whyThisLine,
  };

  return { ...result, itinerary };
}
