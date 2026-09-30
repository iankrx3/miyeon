import type { GlowUpStage, GlowUpSubtype, GlowUpTiming } from '../types';

// The Glow-up routine templates. A result routine is always one of these (or a solo fallback for a
// category no template covers alone) — never invented per request. Order within a stage matters:
// it is the tie-break when two templates cover the same picks.

/** A template slot: one category, or 'clinic' (whichever of skin / face was picked). */
export type SlotKind = GlowUpSubtype | 'clinic';

export interface RoutineSlot {
  kind: SlotKind;
  /** Bracketed in the spec: filled only when the traveller picked it. */
  optional?: boolean;
  /** Ordering tip shown under the stop. */
  hint: string;
}

export interface RoutineTemplate {
  id: string;
  stage: GlowUpStage;
  name: string;
  /** One line, fits a phone width (~47 chars). */
  promise: string;
  slots: RoutineSlot[];
  note: string;
  timeOfDay: 'Morning' | 'Afternoon' | 'Evening';
  /** Only offered for this downtime answer. */
  onlyNoDowntime?: boolean;
  /** Not offered when the traveller has photos every day (clinic work moves to the end of the trip). */
  skipNoDowntime?: boolean;
}

export const STAGE_ORDER: GlowUpStage[] = ['foundation', 'identity', 'finish', 'recover'];
export const TIMING_ORDER: GlowUpTiming[] = ['first', 'mid', 'last', 'night'];

export const STAGE_LABEL: Record<GlowUpStage, string> = {
  foundation: 'FOUNDATION',
  identity: 'IDENTITY',
  finish: 'FINISH',
  recover: 'RECOVER',
};

export const TIMING_LABEL: Record<GlowUpTiming, string> = {
  first: 'First days',
  mid: 'Mid-trip',
  last: 'Last days',
  night: 'Any night',
};

export const STAGE_TIMING: Record<GlowUpStage, GlowUpTiming> = {
  foundation: 'first',
  identity: 'mid',
  finish: 'last',
  recover: 'night',
};

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  // ---- FOUNDATION — the base everything else sits on ----
  {
    id: 'holy-grail-base',
    stage: 'foundation',
    name: 'Holy Grail Base',
    promise: 'The K-idol secret? Your colors come first.',
    slots: [
      { kind: 'personal-color', hint: 'Bare face — this goes first' },
      { kind: 'clinic', hint: 'Still bare-faced — right after your colors' },
    ],
    note: 'No makeup needed',
    timeOfDay: 'Morning',
    skipNoDowntime: true,
  },
  {
    id: 'it-girl-essentials',
    stage: 'foundation',
    name: 'It-Girl Essentials',
    promise: 'Glass skin, glazed nails. No notes.',
    slots: [
      { kind: 'clinic', hint: 'Treatment first, while your skin is fresh' },
      { kind: 'nail', hint: 'Hands only — fine the same day' },
    ],
    note: 'Face first, hands after',
    timeOfDay: 'Morning',
  },
  {
    id: 'filter-free-face',
    stage: 'foundation',
    name: 'Filter-Free Face',
    promise: "Stop filtering. Your skin's Seoul-grade now.",
    slots: [{ kind: 'skin', hint: 'Come bare-faced' }],
    note: 'No makeup needed',
    timeOfDay: 'Morning',
    skipNoDowntime: true,
  },
  {
    id: 'snatched-from-day-1',
    stage: 'foundation',
    name: 'Snatched From Day 1',
    promise: 'Snatched from the very first morning.',
    slots: [
      { kind: 'face', hint: 'Face work first thing' },
      { kind: 'hair', optional: true, hint: "Hair doesn't touch the treated area" },
    ],
    note: 'No makeup needed',
    timeOfDay: 'Morning',
    skipNoDowntime: true,
  },
  {
    id: 'hassle-free-makeup',
    stage: 'foundation',
    name: 'Hassle-Free Makeup',
    promise: 'Still drawing brows? Sleep in instead.',
    slots: [
      { kind: 'permanent-makeup', hint: 'Early on — it needs a few days to settle' },
      { kind: 'nail', optional: true, hint: 'Hands only — fine the same day' },
    ],
    note: 'Skip saunas and scrubs after',
    timeOfDay: 'Morning',
  },

  // ---- IDENTITY — find what suits you ----
  {
    id: 'your-k-idol-era',
    stage: 'identity',
    name: 'Your K-Idol Era',
    promise: "New colors, new hair. They'll ask where.",
    slots: [
      { kind: 'personal-color', hint: 'Find your palette first' },
      { kind: 'hair', hint: 'Bring your palette card' },
      { kind: 'nail', optional: true, hint: 'Pick shades from your palette' },
    ],
    note: 'Colors decide the rest',
    timeOfDay: 'Morning',
  },
  {
    id: 'viral-color-analysis',
    stage: 'identity',
    name: 'Viral Color Analysis',
    promise: 'Which colors are secretly aging you?',
    slots: [{ kind: 'personal-color', hint: 'Bare face — they need your real tone' }],
    note: 'No makeup needed',
    timeOfDay: 'Morning',
  },
  {
    id: 'k-salon-souvenir',
    stage: 'identity',
    name: 'K-Salon Souvenir',
    promise: 'The hair everyone back home asks about.',
    slots: [
      { kind: 'hair', hint: 'Show them photos of what you like' },
      { kind: 'nail', optional: true, hint: 'Nails after — no chips while they style' },
    ],
    note: 'Leave the afternoon open',
    timeOfDay: 'Afternoon',
  },

  // ---- FINISH — complete it and keep it ----
  {
    id: 'ig-photo-dump',
    stage: 'finish',
    name: 'IG Photo Dump',
    promise: 'Pro glam, studio light, zero bad shots.',
    slots: [
      { kind: 'hair', optional: true, hint: "Hair first so it's set for the shoot" },
      { kind: 'makeup', hint: 'Glam right before the camera' },
      { kind: 'photo', hint: 'Last stop — fully done' },
    ],
    note: 'Photos go last',
    timeOfDay: 'Afternoon',
  },
  {
    id: 'pinterest-worthy-pfp',
    stage: 'finish',
    name: 'Pinterest-Worthy PFP',
    promise: 'One shoot. A year of PFPs.',
    slots: [{ kind: 'photo', hint: 'Bring two or three outfits' }],
    note: 'Come camera-ready',
    timeOfDay: 'Afternoon',
  },
  {
    id: 'full-body-glaze',
    stage: 'finish',
    name: 'Full-Body Glaze',
    promise: "Skin so soft they'll keep touching it.",
    slots: [
      { kind: 'scrub', hint: 'Scrub first — a clean slate' },
      { kind: 'nail', hint: "Nails after, so the scrub can't chip them" },
    ],
    note: 'Body first, nails last',
    timeOfDay: 'Afternoon',
  },
  {
    id: 'fly-home-glowing',
    stage: 'finish',
    name: 'Fly Home Glowing',
    promise: 'Save your skin for last. Land glowing.',
    slots: [{ kind: 'clinic', hint: 'After your photo days' }],
    note: 'No makeup needed',
    timeOfDay: 'Morning',
    onlyNoDowntime: true,
  },

  // ---- RECOVER — undo the walking ----
  {
    id: 'jjimjilbang-reset',
    stage: 'recover',
    name: 'Jjimjilbang Reset',
    promise: 'Watch years of dead skin roll right off.',
    slots: [
      { kind: 'sauna', hint: 'Heat first, it makes the scrub easier' },
      { kind: 'scrub', hint: 'Book the scrub add-on when you reserve' },
      { kind: 'massage', optional: true, hint: 'Finish loose and warm' },
    ],
    note: 'Bring a change of clothes',
    timeOfDay: 'Evening',
  },
  {
    id: '20k-steps-cure',
    stage: 'recover',
    name: '20K Steps Cure',
    promise: '20K steps? Your legs deserve this.',
    slots: [
      { kind: 'massage', hint: 'Tell them where it hurts' },
      { kind: 'sauna', optional: true, hint: 'Sweat out the rest' },
    ],
    note: 'After a long walking day',
    timeOfDay: 'Evening',
  },
  {
    id: 'flight-prep-mode',
    stage: 'recover',
    name: 'Flight Prep Mode',
    promise: 'Board rested. Land looking brand new.',
    slots: [
      { kind: 'yoga', hint: 'Stretch it out first' },
      { kind: 'sauna', optional: true, hint: 'Sweat out the rest' },
      { kind: 'massage', optional: true, hint: 'Then let someone else do the work' },
    ],
    note: 'Save it for your last night',
    timeOfDay: 'Evening',
  },
];

/** Sauna and scrub each open a Jjimjilbang Reset on their own; the other is optional then. */
export const EITHER_OF: Record<string, SlotKind[]> = {
  'jjimjilbang-reset': ['sauna', 'scrub'],
};

/** Categories no template covers on their own get a one-stop routine in their natural stage. */
export const SOLO_FALLBACK: Partial<Record<GlowUpSubtype, { stage: GlowUpStage; timeOfDay: RoutineTemplate['timeOfDay']; note: string; hint: string }>> = {
  nail: { stage: 'finish', timeOfDay: 'Afternoon', note: 'Late in the trip keeps them fresh', hint: 'Bring a photo of the design you like' },
  makeup: { stage: 'finish', timeOfDay: 'Afternoon', note: 'Plan something to dress up for', hint: 'Come with a clean, bare face' },
  scrub: { stage: 'recover', timeOfDay: 'Evening', note: 'Bring a change of clothes', hint: 'Book the scrub add-on when you reserve' },
};

/** Same-day conflicts: never inside one routine. Clinic work before heat, scrubs, makeup or a shoot. */
const CONFLICTS: [SlotKind, SlotKind][] = [
  ['clinic', 'sauna'],
  ['clinic', 'scrub'],
  ['clinic', 'massage'],
  ['clinic', 'makeup'],
  ['clinic', 'photo'],
  ['permanent-makeup', 'sauna'],
  ['permanent-makeup', 'scrub'],
  ['permanent-makeup', 'photo'],
];

const asUnit = (k: SlotKind): SlotKind => (k === 'skin' || k === 'face' ? 'clinic' : k);

export function conflicts(a: SlotKind, b: SlotKind): boolean {
  const x = asUnit(a);
  const y = asUnit(b);
  return CONFLICTS.some(([p, q]) => (p === x && q === y) || (p === y && q === x));
}

/** Where a stop added to an existing routine goes: colors first, clinic next, the shoot last. */
export const ATTACH_ORDER: SlotKind[] = [
  'personal-color',
  'clinic',
  'permanent-makeup',
  'yoga',
  'sauna',
  'scrub',
  'massage',
  'hair',
  'makeup',
  'nail',
  'photo',
];
