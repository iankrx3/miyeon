import type {
  ChangeItem,
  FixDowntimeAnswer,
  FixItem,
  GlowUpLanguage,
  GlowUpProfile,
  GlowUpCity,
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

export const fixOptions: { id: FixItem; label: string; headline: string; image: string }[] = [
  { id: 'skin', label: 'Skin', headline: 'Filter-Free Glow', image: fixSkin },
  { id: 'face', label: 'Face', headline: 'Model-Like Lift', image: fixFace },
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

export const changeOptions: { id: ChangeItem; label: string; headline: string; image: string }[] = [
  { id: 'personal-color', label: 'Personal Color', headline: "What's Your Color?", image: changePersonalColor },
  { id: 'hair', label: 'Hair Salon', headline: 'Korea-Exclusive Hair', image: changeHairSalon },
  { id: 'makeup', label: 'Makeup', headline: 'K-Pop Idol Inspired', image: changeMakeup },
  { id: 'permanent-makeup', label: 'Permanent Makeup', headline: 'Matching Eyebrows', image: changePermanentMakeup },
  { id: 'photo', label: 'Photo Studio', headline: "Photos You'll Keep", image: changePhotoStudio },
  { id: 'nail', label: 'Nail Art', headline: 'Nail That Suits You', image: changeNailArt },
];

export const restoreOptions: { id: RestoreItem; label: string; headline: string; image: string }[] = [
  { id: 'sauna', label: 'Sauna / Jjimjilbang', headline: 'The K-Bathhouse', image: restoreSauna },
  { id: 'scrub', label: 'Body Scrub', headline: 'Peel Away The Stress', image: restoreScrub },
  { id: 'massage', label: 'Massage', headline: 'Undo All That Walking', image: restoreMassage },
  { id: 'yoga', label: 'Yoga / Wellness', headline: 'Reset, Even Your Spirit', image: restoreYoga },
];

export const tripDaysOptions: { id: GlowUpTripDays; label: string }[] = [
  { id: '1', label: '1 day' },
  { id: '2-3', label: '2–3 days' },
  { id: '4-7', label: '4–7 days' },
  { id: '7-plus', label: 'A week+' },
];

export const cityOptions: { id: GlowUpCity | 'unsure'; label: string }[] = [
  { id: 'seoul', label: 'Seoul' },
  { id: 'busan', label: 'Busan' },
  { id: 'unsure', label: 'Not sure yet' },
];

const SEOUL_REGIONS: { id: GlowUpRegion; label: string }[] = [
  { id: 'gangnam', label: 'Gangnam' },
  { id: 'hongdae-mapo', label: 'Hongdae · Mapo' },
  { id: 'myeongdong', label: 'Myeongdong' },
  { id: 'seongsu', label: 'Seongsu' },
  { id: 'auto', label: 'Not sure yet' },
];

const BUSAN_REGIONS: { id: GlowUpRegion; label: string }[] = [
  { id: 'seomyeon', label: 'Seomyeon' },
  { id: 'haeundae', label: 'Haeundae' },
  { id: 'gwangalli', label: 'Gwangalli · Suyeong' },
  { id: 'nampo', label: 'Nampo · Jung-gu' },
  { id: 'auto', label: 'Not sure yet' },
];

/** The district chips shown once a base city is picked (none for "Not sure yet"). */
export const regionOptionsFor = (city: GlowUpCity | null): { id: GlowUpRegion; label: string }[] =>
  city === 'seoul' ? SEOUL_REGIONS : city === 'busan' ? BUSAN_REGIONS : [];

export const languageOptions: { id: GlowUpLanguage; label: string }[] = [
  { id: 'English', label: 'English' },
  { id: 'Japanese', label: 'Japanese' },
  { id: 'Chinese', label: 'Chinese' },
  { id: 'Vietnamese', label: 'Vietnamese' },
  { id: 'Thai', label: 'Thai' },
];

export const glowUpTransitionMessages = [
  'Checking your trip — Duration · Region',
  'Matching your goals — FIX/CHANGE/RESTORE selections',
  'Building your routines — order based on downtime & category nature',
  'Applying your filters — Budget · Language',
  'Finding real places — matched to your area, language & budget',
];

const OPTION_LABEL_BY_SUBTYPE: Record<string, string> = Object.fromEntries(
  [...fixOptions, ...changeOptions, ...restoreOptions].map((opt) => [opt.id, opt.label])
);

export function labelForSubtype(subtype: string): string {
  return OPTION_LABEL_BY_SUBTYPE[subtype] ?? subtype;
}

export const regionLabel = (id: GlowUpRegion | null): string =>
  [...SEOUL_REGIONS, ...BUSAN_REGIONS].find((r) => r.id === id)?.label ?? 'Not sure yet';

export const tripDaysLabel = (id: GlowUpTripDays | null): string =>
  tripDaysOptions.find((d) => d.id === id)?.label ?? '2-3 days';

// ---- V2: interstitial copy + budget in USD (Figma "전환화면 1/2") ----

/** Short spoken form of a pick, for "Color first. Hair next." */
const SHORT_LABEL: Record<string, string> = {
  skin: 'Skin',
  face: 'Face',
  'personal-color': 'Color',
  hair: 'Hair',
  makeup: 'Makeup',
  'permanent-makeup': 'Brows',
  photo: 'Photos',
  nail: 'Nails',
  sauna: 'Sauna',
  scrub: 'Scrub',
  massage: 'Massage',
  yoga: 'Yoga',
};

export interface Interlude {
  title: string;
  body: string;
  chips: string[];
}

/** After RESTORE: echo what was picked, in the order they'll be planned. Null when nothing was picked. */
export function pickedInterlude(profile: Pick<GlowUpProfile, 'fix' | 'change' | 'restore'>): Interlude | null {
  const picks: string[] = [...profile.fix.items, ...profile.change, ...profile.restore];
  if (picks.length === 0) return null;

  const shown = picks.slice(0, 3);
  const words = shown.map((p) => SHORT_LABEL[p] ?? labelForSubtype(p));
  const lastIsRestore = profile.restore.length > 0 && shown[shown.length - 1] === profile.restore[profile.restore.length - 1];

  let body: string;
  if (words.length === 1) body = `${words[0]} it is.`;
  else {
    const lead = `${words[0]} first.`;
    const mid = words.slice(1, -1).map((w) => `${w} next.`);
    const last = `${words[words.length - 1]} ${lastIsRestore ? 'for the reset' : 'to finish'}.`;
    body = [lead, ...mid, last].join(' ');
  }

  const chips = shown.map((p) => labelForSubtype(p));
  if (picks.length > shown.length) chips.push(`+${picks.length - shown.length}`);
  return { title: 'Okay, good picks. You have taste.', body, chips };
}

/** Max price per experience (USD) the traveller set: the slider value, or — for plans saved before
 * the slider existed — the old tier's upper bound. null = no limit. */
export function budgetMaxUsdOf(profile: Pick<GlowUpProfile, 'budget' | 'budgetMaxUsd'>): number | null {
  if (profile.budgetMaxUsd !== undefined) return profile.budgetMaxUsd;
  switch (profile.budget) {
    case 'under-100k':
      return 100;
    case '100-300k':
      return 300;
    case '300-500k':
      return 500;
    default:
      return null;
  }
}

/** "Up to $300" — or null when there is no limit. */
export function budgetChipLabel(profile: Pick<GlowUpProfile, 'budget' | 'budgetMaxUsd'>): string | null {
  const max = budgetMaxUsdOf(profile);
  return max == null ? null : `Up to $${max}`;
}

/** After budget + downtime: what we'll filter on. Null when neither answer narrows anything. */
export function constraintsInterlude(profile: Pick<GlowUpProfile, 'budget' | 'budgetMaxUsd' | 'fix'>): Interlude | null {
  const downtime = profile.fix.downtime;
  const max = budgetMaxUsdOf(profile);
  const parts: string[] = [];
  const chips: string[] = [];
  let title = "Got it. We'll work with that.";

  if (downtime === 'no-daily-photos') {
    title = 'Got it. You have places to be.';
    parts.push('Photo-friendly. No major downtime.');
    chips.push('No downtime');
  } else if (downtime === 'day-or-two-ok') {
    title = 'Got it. A little recovery is fine.';
    parts.push('A day or two of downtime is fine.');
    chips.push('A day or two of downtime');
  }
  if (max != null) {
    parts.push(`Up to $${max} each.`);
    chips.unshift(`Up to $${max}`);
  }
  if (parts.length === 0) return null;
  return { title, body: parts.join(' '), chips };
}
