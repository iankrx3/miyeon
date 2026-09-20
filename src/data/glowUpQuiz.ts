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
import fixSkin from '../assets/quiz/fix-skin.jpg';
import fixFace from '../assets/quiz/fix-face.jpg';
import changePersonalColor from '../assets/quiz/change-personal-color.jpg';
import changeHairSalon from '../assets/quiz/change-hair-salon.jpg';
import changeMakeup from '../assets/quiz/change-makeup.jpg';
import changePermanentMakeup from '../assets/quiz/change-permanent-makeup.jpg';
import changePhotoStudio from '../assets/quiz/change-photo-studio.jpg';
import changeNailArt from '../assets/quiz/change-nail-art.jpg';
import restoreSauna from '../assets/quiz/restore-sauna.jpg';
import restoreScrub from '../assets/quiz/restore-scrub.jpg';
import restoreMassage from '../assets/quiz/restore-massage.jpg';
import restoreYoga from '../assets/quiz/restore-yoga.jpg';

// Fully separate from data/quiz.ts, which stays in place for the curator/
// Itinerary flow (ItineraryPage.tsx still imports its regenerateOptions/
// replaceOptions live).

export const fixOptions: { id: FixItem; emoji: string; label: string; headline: string; image: string }[] = [
  { id: 'skin', emoji: '✨', label: 'Skin', headline: 'Filter-Free Glow', image: fixSkin },
  { id: 'face', emoji: '🪄', label: 'Face', headline: 'Model-Like Lift', image: fixFace },
];

export const fixDowntimeOptions: { id: FixDowntimeAnswer; label: string }[] = [
  { id: 'no-daily-photos', label: 'No — I have photos every day' },
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

export const changeOptions: { id: ChangeItem; emoji: string; label: string; headline: string; image: string }[] = [
  { id: 'personal-color', emoji: '🎨', label: 'Personal Color', headline: "What's Your Color?", image: changePersonalColor },
  { id: 'hair', emoji: '💇', label: 'Hair Salon', headline: 'Korea-Exclusive Hair', image: changeHairSalon },
  { id: 'makeup', emoji: '💄', label: 'Makeup', headline: 'K-Pop Idol Inspired', image: changeMakeup },
  { id: 'permanent-makeup', emoji: '✏️', label: 'Permanent Makeup', headline: 'Matching Eyebrows', image: changePermanentMakeup },
  { id: 'photo', emoji: '📸', label: 'Photo Studio', headline: "Photos You'll Keep", image: changePhotoStudio },
  { id: 'nail', emoji: '💅', label: 'Nail Art', headline: 'Nail That Suits You', image: changeNailArt },
];

export const restoreOptions: { id: RestoreItem; emoji: string; label: string; headline: string; image: string }[] = [
  { id: 'sauna', emoji: '♨️', label: 'Sauna / Jjimjilbang', headline: 'The K-Bathhouse', image: restoreSauna },
  { id: 'scrub', emoji: '🧼', label: 'Body Scrub', headline: 'Peel Away The Stress', image: restoreScrub },
  { id: 'massage', emoji: '💆', label: 'Massage', headline: 'Undo All That Walking', image: restoreMassage },
  { id: 'yoga', emoji: '🧘', label: 'Yoga / Wellness', headline: 'Reset, Even Your Spirit', image: restoreYoga },
];

export const tripDaysOptions: { id: GlowUpTripDays; label: string }[] = [
  { id: '1', label: '1 day' },
  { id: '2-3', label: '2–3 days' },
  { id: '4-7', label: '4–7 days' },
  { id: '7-plus', label: 'A week+' },
];

export const regionOptions: { id: GlowUpRegion; label: string }[] = [
  { id: 'gangnam', label: 'Gangnam' },
  { id: 'hongdae-mapo', label: 'Hongdae · Mapo' },
  { id: 'myeongdong', label: 'Myeongdong' },
  { id: 'seongsu', label: 'Seongsu' },
  { id: 'auto', label: 'Not sure yet' },
];

export const budgetOptions: { id: GlowUpBudget; label: string; caption: string }[] = [
  { id: 'under-100k', label: '~₩100k', caption: 'Nails, scrub, a quick facial' },
  { id: '100-300k', label: '₩100k–300k', caption: 'Most personal color, hair, skin sessions' },
  { id: '300-500k', label: '₩300k–500k', caption: 'Lifting, photo packages, premium clinics' },
  { id: 'no-preference', label: 'No preference', caption: 'Show me everything' },
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
  regionOptions.find((r) => r.id === id)?.label ?? 'Not sure yet';

export const budgetLabel = (id: GlowUpBudget | null): string =>
  budgetOptions.find((b) => b.id === id)?.label ?? 'No preference';

export const tripDaysLabel = (id: GlowUpTripDays | null): string =>
  tripDaysOptions.find((d) => d.id === id)?.label ?? '2-3 days';
