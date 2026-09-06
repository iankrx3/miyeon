import type {
  BeautyBudget,
  BeautyGoal,
  BeautyTime,
  NeedleComfort,
  RecoveryComfort,
  Restriction,
  SkinExperience,
  TripDays,
  TripPurpose,
} from '../types';

// Kept so unused quiz widgets still typecheck after the planner pivot.
export interface VibePair {
  a: string;
  b: string;
}
export const purposeOptions: { id: TripPurpose; emoji: string; label: string }[] = [
  { id: 'new-me', emoji: '✨', label: 'I want a whole new me.' },
  { id: 'event', emoji: '📸', label: 'There’s something coming up.' },
  { id: 'korean-experience', emoji: '🇰🇷', label: 'I want the Korean experience.' },
  { id: 'what-suits-me', emoji: '🪞', label: 'I’ve never really known what suits me.' },
  { id: 'feel-good', emoji: '💆', label: 'I just want to feel good again.' },
  { id: 'dont-know', emoji: '🤷', label: 'I honestly don’t know.' },
];

export const goalOptions: { id: BeautyGoal; label: string }[] = [
  { id: 'skin', label: 'SKIN' },
  { id: 'face', label: 'FACE' },
  { id: 'hair', label: 'HAIR' },
  { id: 'makeup-style', label: 'MAKEUP & STYLE' },
  { id: 'details', label: 'DETAILS' },
  { id: 'overall', label: 'MY OVERALL LOOK' },
  { id: 'dont-know', label: "I DON'T KNOW YET" },
];

export const skinExperienceOptions: { id: SkinExperience; label: string }[] = [
  { id: 'relaxing', label: 'Relaxing skincare' },
  { id: 'professional', label: 'Professional skin treatment' },
  { id: 'medical', label: 'Medical dermatology' },
  { id: 'unsure', label: "I'm not sure" },
];

export const needleOptions: { id: NeedleComfort; label: string }[] = [
  { id: 'yes', label: 'Yes' },
  { id: 'no', label: 'No' },
  { id: 'not-sure', label: 'Not sure' },
];

export const restrictionOptions: { id: Restriction; label: string }[] = [
  { id: 'no-needles', label: 'NO NEEDLES.' },
  { id: 'no-trip-ruin', label: 'NOTHING THAT RUINS MY TRIP.' },
  { id: 'need-communication', label: 'I NEED TO BE ABLE TO COMMUNICATE.' },
  { id: 'no-surprise-costs', label: 'NO SURPRISE COSTS.' },
  { id: 'no-factory', label: 'NO FACTORY-LIKE EXPERIENCES.' },
  { id: 'no-upsell', label: "DON'T SELL ME EXTRAS." },
];

export const budgetOptions: { id: BeautyBudget; label: string }[] = [
  { id: 'under-100', label: 'Under $100' },
  { id: '100-300', label: '$100–300' },
  { id: '300-500', label: '$300–500' },
  { id: '500-1000', label: '$500–1,000' },
  { id: '1000-plus', label: '$1,000+' },
];

export const beautyTimeOptions: { id: BeautyTime; label: string }[] = [
  { id: 'couple-hours', label: 'A couple of hours' },
  { id: 'half-day', label: 'Half day' },
  { id: 'full-day', label: 'Full day' },
  { id: 'no-mind', label: "I don't mind" },
];

export const tripDaysOptions: { id: TripDays; label: string }[] = [
  { id: '1', label: '1 day' },
  { id: '2', label: '2 days' },
  { id: '3', label: '3 days' },
  { id: '4-plus', label: '4+ days' },
];

export const downtimeOptions: { id: RecoveryComfort; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'few-hours', label: 'A few hours' },
  { id: '1-day', label: '1 day' },
  { id: '2-3-days', label: '2–3 days' },
  { id: 'ok', label: "I'm okay with recovery" },
];

export const purposeLabel: Record<TripPurpose, string> = {
  'new-me': 'A fresh new look',
  event: 'Something coming up',
  'korean-experience': 'The Korean experience',
  'what-suits-me': 'Finding what suits you',
  'feel-good': 'Feeling good again',
  'dont-know': 'We’ll figure it out together',
};

export const goalLabel: Record<BeautyGoal, string> = {
  skin: 'Skin',
  face: 'Face',
  hair: 'Hair',
  'makeup-style': 'Makeup & Style',
  details: 'Details',
  overall: 'Overall look',
  'dont-know': 'Open to anything',
};

export const restrictionLabel: Record<Restriction, string> = {
  'no-needles': 'No needles',
  'no-trip-ruin': 'Nothing that ruins the trip',
  'need-communication': 'English-friendly',
  'no-surprise-costs': 'No surprise costs',
  'no-factory': 'No factory-like experiences',
  'no-upsell': "Don't sell extras",
};

export const replaceOptions: { id: string; label: string }[] = [
  { id: 'cheaper', label: 'Something cheaper' },
  { id: 'closer', label: 'Closer to my next stop' },
  { id: 'relaxing', label: 'More relaxing' },
  { id: 'korean', label: 'More Korean' },
  { id: 'higher-rated', label: 'Higher rated' },
  { id: 'different-category', label: 'Different category' },
];

export const regenerateOptions: { id: string; label: string }[] = [
  { id: 'cheaper', label: 'Make it cheaper' },
  { id: 'less-travel', label: 'Less travel' },
  { id: 'more-experiences', label: 'More beauty experiences' },
  { id: 'more-korean', label: 'More Korean experiences' },
  { id: 'more-relaxing', label: 'More relaxing' },
  { id: 'more-packed', label: 'More packed' },
  { id: 'start-later', label: 'Start later' },
  { id: 'finish-earlier', label: 'Finish earlier' },
];

export const aiTransitionMessages = [
  'Reading your answers…',
  'Filtering what actually fits…',
  'Grouping by neighborhood…',
  'Building your days…',
];
