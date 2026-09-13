import type {
  ChangeItem,
  FixDowntimeAnswer,
  FixItem,
  GlowUpBudget,
  GlowUpLanguage,
  GlowUpRegion,
  GlowUpTripDays,
  RestoreItem,
} from '../types';

// Fully separate from data/quiz.ts, which stays in place for the curator/
// Itinerary flow (ItineraryPage.tsx still imports its regenerateOptions/
// replaceOptions live).

export const fixOptions: { id: FixItem; emoji: string; label: string }[] = [
  { id: 'skin', emoji: '✨', label: 'Skin' },
  { id: 'face', emoji: '🪄', label: 'Face' },
];

export const fixDowntimeOptions: { id: FixDowntimeAnswer; label: string }[] = [
  { id: 'no-daily-photos', label: "No, I take photos every day" },
  { id: 'day-or-two-ok', label: 'A day or two is fine' },
  { id: 'doesnt-matter', label: "Doesn't matter" },
];

/** Keyed by which FIX item(s) were picked, not the downtime answer. */
export const FIX_REACTION_COPY: Record<'skin' | 'face' | 'both', string> = {
  skin: "Got it — we'll focus on tone and texture.",
  face: "Got it — we'll focus on lifting and contouring.",
  both: "Got it — we'll cover both skin and face.",
};

export function fixReactionCopy(items: FixItem[]): string {
  if (items.includes('skin') && items.includes('face')) return FIX_REACTION_COPY.both;
  if (items.includes('face')) return FIX_REACTION_COPY.face;
  return FIX_REACTION_COPY.skin;
}

export const changeOptions: { id: ChangeItem; emoji: string; label: string }[] = [
  { id: 'hair', emoji: '💇', label: 'Hair' },
  { id: 'nail', emoji: '💅', label: 'Nail' },
  { id: 'personal-color', emoji: '🎨', label: 'Personal Color' },
  { id: 'makeup', emoji: '💄', label: 'Makeup' },
  { id: 'permanent-makeup', emoji: '✏️', label: 'Permanent Makeup' },
  { id: 'photo', emoji: '📸', label: 'Photo' },
];

export const restoreOptions: { id: RestoreItem; emoji: string; label: string }[] = [
  { id: 'sauna', emoji: '♨️', label: 'Sauna' },
  { id: 'scrub', emoji: '🧼', label: 'Scrub' },
  { id: 'massage', emoji: '💆', label: 'Massage' },
  { id: 'yoga', emoji: '🧘', label: 'Yoga' },
];

export const tripDaysOptions: { id: GlowUpTripDays; label: string }[] = [
  { id: '1', label: '1 day' },
  { id: '2-3', label: '2-3 days' },
  { id: '4-7', label: '4-7 days' },
  { id: '7-plus', label: 'A week+' },
];

export const regionOptions: { id: GlowUpRegion; label: string }[] = [
  { id: 'gangnam', label: 'Gangnam' },
  { id: 'hongdae-mapo', label: 'Hongdae · Mapo' },
  { id: 'myeongdong', label: 'Myeongdong' },
  { id: 'seongsu', label: 'Seongsu' },
  { id: 'auto', label: 'You decide' },
];

export const budgetOptions: { id: GlowUpBudget; label: string }[] = [
  { id: 'under-100k', label: '~₩100k' },
  { id: '100-300k', label: '₩100k–300k' },
  { id: '300-500k', label: '₩300k–500k' },
  { id: 'no-preference', label: 'No preference' },
];

export const languageOptions: { id: GlowUpLanguage; emoji: string; label: string }[] = [
  { id: 'English', emoji: '🇬🇧', label: 'English' },
  { id: 'Japanese', emoji: '🇯🇵', label: 'Japanese' },
  { id: 'Chinese', emoji: '🇨🇳', label: 'Chinese' },
  { id: 'Vietnamese', emoji: '🇻🇳', label: 'Vietnamese' },
  { id: 'Thai', emoji: '🇹🇭', label: 'Thai' },
];

export const glowUpTransitionMessages = [
  'Checking your trip — Duration · Region',
  'Matching your goals — FIX/CHANGE/RESTORE selections',
  'Building the order — day placement based on downtime & category nature',
  'Applying your filters — Budget · Language',
  'Finding real options — checking real prices, not ad prices',
];

const OPTION_LABEL_BY_SUBTYPE: Record<string, { label: string; emoji: string }> = Object.fromEntries(
  [...fixOptions, ...changeOptions, ...restoreOptions].map((opt) => [opt.id, { label: opt.label, emoji: opt.emoji }])
);

export function labelForSubtype(subtype: string): { label: string; emoji: string } {
  return OPTION_LABEL_BY_SUBTYPE[subtype] ?? { label: subtype, emoji: '✨' };
}

export const regionLabel = (id: GlowUpRegion | null): string =>
  regionOptions.find((r) => r.id === id)?.label ?? "You decide";

export const budgetLabel = (id: GlowUpBudget | null): string =>
  budgetOptions.find((b) => b.id === id)?.label ?? 'No preference';

export const tripDaysLabel = (id: GlowUpTripDays | null): string =>
  tripDaysOptions.find((d) => d.id === id)?.label ?? '2-3 days';
