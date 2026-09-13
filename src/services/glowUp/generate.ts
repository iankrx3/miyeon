import type { GlowUpProfile, GlowUpResult, GlowUpSlotItem } from '../../types';
import { buildGlowUpCreatripUrl } from '../../lib/creatrip';
import { labelForSubtype } from '../../data/glowUpQuiz';
import {
  allSlotRefsInOrder,
  buildEmptyGrid,
  buildWhyThisLine,
  dayScope,
  isNonPhotoChange,
  middleDayIndex,
  placeRoundRobin,
  planningDaysFor,
} from './placement';

export function emptyGlowUpProfile(): GlowUpProfile {
  return {
    fix: { items: [], downtime: null },
    change: [],
    restore: [],
    tripDays: null,
    region: null,
    budget: null,
    languages: [],
  };
}

function toSlotItem(
  category: GlowUpSlotItem['category'],
  subtype: GlowUpSlotItem['subtype'],
  profile: GlowUpProfile
): GlowUpSlotItem {
  const { label, emoji } = labelForSubtype(subtype);
  return {
    category,
    subtype,
    label,
    emoji,
    url: buildGlowUpCreatripUrl(subtype, {
      region: profile.region,
      budget: profile.budget,
      languages: profile.languages,
    }),
  };
}

export function buildGlowUpResult(profile: GlowUpProfile): GlowUpResult {
  const planningDays = planningDaysFor(profile.tripDays);
  const days = buildEmptyGrid(planningDays);

  // 1. FIX — both skin and face (if both picked) stack into one cell: Day 1 Morning.
  if (profile.fix.items.length > 0) {
    const fixItems = profile.fix.items.map((item) => toSlotItem('fix', item, profile));
    placeRoundRobin(days, [{ dayIndex: 1, period: 'morning' }], fixItems);
  }

  // 2. RESTORE — same day as FIX (after it) if FIX exists, else any day.
  if (profile.restore.length > 0) {
    const restoreItems = profile.restore.map((item) => toSlotItem('restore', item, profile));
    const scope =
      profile.fix.items.length > 0
        ? [
            { dayIndex: 1, period: 'afternoon' as const },
            { dayIndex: 1, period: 'evening' as const },
          ]
        : allSlotRefsInOrder(days);
    placeRoundRobin(days, scope, restoreItems);
  }

  // 3. CHANGE (photo) — always the last planning day's evening slot.
  if (profile.change.includes('photo')) {
    const photoItem = toSlotItem('change', 'photo', profile);
    placeRoundRobin(days, [{ dayIndex: planningDays, period: 'evening' }], [photoItem]);
  }

  // 4. CHANGE (everything else) — the "middle day" (falls back to the last day
  // for 1-/2-day trips, where no true middle day exists).
  const nonPhotoChange = profile.change.filter(isNonPhotoChange);
  if (nonPhotoChange.length > 0) {
    const changeItems = nonPhotoChange.map((item) => toSlotItem('change', item, profile));
    placeRoundRobin(days, dayScope(middleDayIndex(planningDays)), changeItems);
  }

  return {
    days,
    whyThisLine: buildWhyThisLine(profile, days),
    profileSnapshot: profile,
  };
}
