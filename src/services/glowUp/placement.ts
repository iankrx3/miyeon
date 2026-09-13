import type {
  ChangeItem,
  FixDowntimeAnswer,
  GlowUpDay,
  GlowUpPeriod,
  GlowUpProfile,
  GlowUpSlotItem,
} from '../../types';
import { fixDowntimeOptions, tripDaysLabel } from '../../data/glowUpQuiz';

const PERIODS: GlowUpPeriod[] = ['morning', 'afternoon', 'evening'];

export function planningDaysFor(tripDays: GlowUpProfile['tripDays']): 1 | 2 | 3 {
  if (tripDays === '1') return 1;
  if (tripDays === '2-3') return 2;
  return 3; // '4-7' and '7-plus' both collapse to the top tier, per spec
}

export function buildEmptyGrid(planningDays: 1 | 2 | 3): GlowUpDay[] {
  return Array.from({ length: planningDays }, (_, i) => ({
    dayIndex: i + 1,
    slots: PERIODS.map((period) => ({ period, items: [] as GlowUpSlotItem[] })),
  }));
}

interface SlotRef {
  dayIndex: number;
  period: GlowUpPeriod;
}

/** Fills `scope` with `items` in order, wrapping (stacking into already-used
 * cells) rather than dropping once scope runs out — the product philosophy is
 * "we place what you picked," not "we filter your picks." */
export function placeRoundRobin(grid: GlowUpDay[], scope: SlotRef[], items: GlowUpSlotItem[]): void {
  if (scope.length === 0 || items.length === 0) return;
  items.forEach((item, i) => {
    const ref = scope[i % scope.length];
    const day = grid.find((d) => d.dayIndex === ref.dayIndex);
    const slot = day?.slots.find((s) => s.period === ref.period);
    slot?.items.push(item);
  });
}

export function allSlotRefsInOrder(grid: GlowUpDay[]): SlotRef[] {
  return grid.flatMap((day) => day.slots.map((slot) => ({ dayIndex: day.dayIndex, period: slot.period })));
}

export function dayScope(dayIndex: number): SlotRef[] {
  return PERIODS.map((period) => ({ dayIndex, period }));
}

/** The "middle day" for CHANGE (non-photo) items: day 2 when there are 3
 * planning days; for 1- or 2-day trips there's no true middle day, so it falls
 * back to the last day. */
export function middleDayIndex(planningDays: 1 | 2 | 3): number {
  return planningDays === 3 ? 2 : planningDays;
}

const NON_PHOTO_CHANGE: Exclude<ChangeItem, 'photo'>[] = ['hair', 'nail', 'personal-color', 'makeup', 'permanent-makeup'];

export function isNonPhotoChange(item: ChangeItem): item is Exclude<ChangeItem, 'photo'> {
  return (NON_PHOTO_CHANGE as string[]).includes(item);
}

const DOWNTIME_GLOSS: Record<FixDowntimeAnswer, string> = {
  'no-daily-photos': 'no visible downtime',
  'day-or-two-ok': 'a day or two of downtime is fine',
  'doesnt-matter': "downtime doesn't matter to you",
};

/** One deterministic template sentence — no LLM call, matching how every other
 * piece of quiz-derived copy in this app is built. */
export function buildWhyThisLine(profile: GlowUpProfile, days: GlowUpDay[]): string {
  const parts: string[] = [];

  if (profile.fix.items.length > 0) {
    const fixLabel = profile.fix.items.map((i) => (i === 'skin' ? 'Skin' : 'Face')).join(' & ');
    parts.push(`You picked ${fixLabel} under FIX`);
    if (profile.fix.downtime) {
      const gloss = DOWNTIME_GLOSS[profile.fix.downtime];
      const downtimeLabel = fixDowntimeOptions.find((o) => o.id === profile.fix.downtime)?.label;
      parts.push(`said ${gloss}${downtimeLabel ? ` (“${downtimeLabel}”)` : ''}`);
    }
  }
  parts.push(`it's a ${tripDaysLabel(profile.tripDays).toLowerCase()} trip`);

  const placementBits: string[] = [];
  const firstDayCategories = new Set(days[0]?.slots.flatMap((s) => s.items.map((i) => i.category)) ?? []);
  const hasFixDay1 = firstDayCategories.has('fix');
  if (hasFixDay1) placementBits.push('FIX on day 1');
  if (firstDayCategories.has('restore')) {
    placementBits.push(hasFixDay1 ? 'RESTORE right after for recovery' : 'RESTORE early in the trip');
  }
  const hasMiddleChange = days.some((d, i) => i > 0 && i < days.length - 1 && d.slots.some((s) => s.items.some((it) => it.category === 'change')));
  const lastDay = days[days.length - 1];
  const hasPhotoLast = lastDay?.slots.some((s) => s.items.some((it) => it.subtype === 'photo'));
  if (hasMiddleChange) placementBits.push('styling in the middle');
  if (hasPhotoLast) placementBits.push('photos on the last day, at peak effect');

  const summary = parts.join(', ');
  const placement = placementBits.length ? ` — so we put ${placementBits.join(', ')}.` : '.';
  return `${summary}${placement}`;
}
