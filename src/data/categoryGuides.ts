import type { GlowUpSubtype } from '../types';
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

/** Copy behind the Plan result's category cards and the /category/:subtype
 * explainer page (Figma "DETAIL — Personal Color"). Prices are rough
 * order-of-magnitude estimates for planning, not live Creatrip prices — the page
 * always sends people to Creatrip for real availability. */
export interface CategoryGuide {
  subtype: GlowUpSubtype;
  /** Short card name on the result screen, e.g. "Skin Clinic". */
  name: string;
  /** Uppercase kicker on the detail hero, e.g. "PERSONAL COLOR". */
  kicker: string;
  headline: string;
  /** One-line description on the result card, e.g. "Draping + styling". */
  summary: string;
  minutes: number;
  /** Shown as a stat on the detail page, e.g. "None" or "1–2 days". */
  downtime: string;
  fromUsd: number;
  typicalUsd: number;
  /** Small line under a result card. `warn` = downtime, `info` = ordering tip. */
  resultNote?: { tone: 'warn' | 'info'; text: string };
  /** "Day N — {dayTitle}" when this is the day's first stop. */
  dayTitle: string;
  /** Sentence under the day title when this is the day's first stop. */
  orderNote: string;
  whyKorea: string;
  /** Three steps, each with its own illustration (src/assets/steps/{subtype}-{n}.svg). */
  steps: { title: string; body: string; image: string }[];
  leaveWith: { title: string; body: string }[];
  beforeYouBook: string[];
  image: string;
}

type RawGuide = Omit<CategoryGuide, 'steps'> & { steps: { title: string; body: string }[] };

const RAW_GUIDES: Record<GlowUpSubtype, RawGuide> = {
  skin: {
    subtype: 'skin',
    name: 'Skin Clinic',
    kicker: 'SKIN',
    headline: 'Glow that survives no filter',
    summary: 'Skin booster',
    minutes: 60,
    downtime: '1–2 days',
    fromUsd: 60,
    typicalUsd: 180,
    resultNote: { tone: 'warn', text: 'Mild redness for 1–2 days' },
    dayTitle: 'start with your skin',
    orderNote: 'Redness settles in 2 days, so this goes first.',
    whyKorea: 'Skin care is a daily habit here, so clinics compete on results, not on upsells.',
    steps: [
      { title: 'Skin check', body: 'A quick look at tone, texture and hydration before anything starts.' },
      { title: 'Treatment', body: 'Boosters, peels or lasers matched to what the check found.' },
      { title: 'Calm-down', body: 'A soothing mask and sunscreen so you can walk out and carry on.' },
    ],
    leaveWith: [
      { title: 'A treated, hydrated face', body: 'Best seen once any redness settles.' },
      { title: 'An aftercare list', body: 'What to use, and what to skip, for the next few days.' },
      { title: 'A rebook window', body: 'When a second session actually makes sense.' },
    ],
    beforeYouBook: [
      'Ask whether the treatment causes visible redness.',
      'Avoid strong actives (retinol, acids) for a few days before.',
      'Book this early in your trip so it can settle.',
    ],
    image: fixSkin,
  },
  face: {
    subtype: 'face',
    name: 'Face Contouring',
    kicker: 'FACE',
    headline: 'A lifted look, no surgery',
    summary: 'Lifting + contour',
    minutes: 60,
    downtime: '2–3 days',
    fromUsd: 120,
    typicalUsd: 250,
    resultNote: { tone: 'warn', text: 'Some swelling for 2–3 days' },
    dayTitle: 'start with your face',
    orderNote: 'Swelling settles in a few days, so this goes first.',
    whyKorea: 'Non-surgical contouring is routine here, with clinics that do little else.',
    steps: [
      { title: 'Consultation', body: 'Talk through what you want to change and what to leave alone.' },
      { title: 'Treatment', body: 'Lifting or contouring, with numbing so it stays comfortable.' },
      { title: 'Aftercare', body: 'Cooling and instructions for the first 48 hours.' },
    ],
    leaveWith: [
      { title: 'A sharper profile', body: 'The full effect shows once swelling goes down.' },
      { title: 'Care instructions', body: 'Sleep, sun and skincare notes for the next week.' },
      { title: 'A follow-up plan', body: 'Whether a touch-up is worth it before you fly home.' },
    ],
    beforeYouBook: [
      'Ask for the exact downtime, not the best case.',
      'Do not book it right before photos or a flight.',
      'Confirm the staff can explain the treatment in English.',
    ],
    image: fixFace,
  },
  hair: {
    subtype: 'hair',
    name: 'Hair Salon',
    kicker: 'HAIR',
    headline: 'The cut and color you can’t get back home',
    summary: 'Cut, color or perm',
    minutes: 150,
    downtime: 'None',
    fromUsd: 50,
    typicalUsd: 120,
    dayTitle: 'change your look',
    orderNote: 'Hair goes in the middle, once your skin has settled.',
    whyKorea: 'Korean stylists are trained on Asian hair and trends move fast here.',
    steps: [
      { title: 'Consult', body: 'Show a reference photo and talk through your hair history.' },
      { title: 'Color or cut', body: 'Bleach, dye, perm or cut, depending on what you booked.' },
      { title: 'Style', body: 'A blow-dry and how to recreate the look at home.' },
    ],
    leaveWith: [
      { title: 'A new look', body: 'Styled to suit your face shape and hair type.' },
      { title: 'Home-care tips', body: 'Shampoo, heat and color-care basics.' },
      { title: 'A reference photo', body: 'To show any stylist back home.' },
    ],
    beforeYouBook: [
      'Bring a photo of the look you want.',
      'Tell them about past bleach or perms.',
      'Bleaching can take most of an afternoon — leave time.',
    ],
    image: changeHairSalon,
  },
  nail: {
    subtype: 'nail',
    name: 'Nail Art',
    kicker: 'NAIL ART',
    headline: 'Tiny art, done properly',
    summary: 'Gel + design',
    minutes: 90,
    downtime: 'None',
    fromUsd: 30,
    typicalUsd: 60,
    dayTitle: 'finish with your hands',
    orderNote: 'Nails last about two to three weeks, so timing is flexible.',
    whyKorea: 'Nail artists here treat each set as a small design project.',
    steps: [
      { title: 'Pick a design', body: 'Browse the artist’s catalog or bring your own reference.' },
      { title: 'Prep', body: 'Shape and cuticle care before any color goes on.' },
      { title: 'Gel + art', body: 'Base, color and detail work, cured layer by layer.' },
    ],
    leaveWith: [
      { title: 'A finished set', body: 'Usually good for two to three weeks.' },
      { title: 'Care tips', body: 'How to keep gel from lifting.' },
      { title: 'Removal advice', body: 'So you can take it off safely later.' },
    ],
    beforeYouBook: [
      'Removal of old gel may cost extra.',
      'Complex art takes longer — book a longer slot.',
      'Book late in your trip so it looks fresh in photos.',
    ],
    image: changeNailArt,
  },
  'personal-color': {
    subtype: 'personal-color',
    name: 'Personal Color',
    kicker: 'PERSONAL COLOR',
    headline: 'Stop guessing what suits you',
    summary: 'Draping + styling',
    minutes: 90,
    downtime: 'None',
    fromUsd: 33,
    typicalUsd: 151,
    resultNote: { tone: 'info', text: 'Book this after your skin settles' },
    dayTitle: 'find your colors',
    orderNote: 'Do this with a calm, bare face for the truest read.',
    whyKorea: 'Back home, it barely exists. Here, it’s an industry.',
    steps: [
      { title: 'Bare face', body: 'You start with a clean, makeup-free face so nothing hides your natural tone.' },
      { title: 'Draping', body: 'Fabric in different colors is held up to your face, one after another, until your season is clear.' },
      { title: 'Your palette', body: 'The consultant walks through the colors that work, and the ones that don’t.' },
    ],
    leaveWith: [
      { title: 'A palette card', body: 'Physical, take it shopping.' },
      { title: 'Your season', body: 'Spring / Summer / Autumn / Winter.' },
      { title: 'Colors to avoid', body: 'The ones making you look tired.' },
    ],
    beforeYouBook: [
      'Ask if the result sheet is in English.',
      'Cheaper options include draping only — no report.',
      'Book 2–3 weeks ahead. Good ones fill up.',
    ],
    image: changePersonalColor,
  },
  makeup: {
    subtype: 'makeup',
    name: 'Makeup',
    kicker: 'MAKEUP',
    headline: 'Idol-level makeup, for one day',
    summary: 'Full-face makeup',
    minutes: 90,
    downtime: 'None',
    fromUsd: 40,
    typicalUsd: 90,
    dayTitle: 'get camera-ready',
    orderNote: 'Great before photos or a night out.',
    whyKorea: 'Artists here work with idols and actors, and it shows in the finish.',
    steps: [
      { title: 'Skin prep', body: 'A base that makes everything after it sit better.' },
      { title: 'Face', body: 'Base, color and definition matched to your features.' },
      { title: 'Finish', body: 'Setting and touch-up tips so it lasts.' },
    ],
    leaveWith: [
      { title: 'A finished look', body: 'Built to last through photos and a long day.' },
      { title: 'A product list', body: 'What was used, so you can find it later.' },
      { title: 'A few technique tips', body: 'Easy things to repeat at home.' },
    ],
    beforeYouBook: [
      'Come with a clean, moisturized face.',
      'Bring a reference photo of the finish you like.',
      'Pair with a photo studio and book them close together.',
    ],
    image: changeMakeup,
  },
  'permanent-makeup': {
    subtype: 'permanent-makeup',
    name: 'Permanent Makeup',
    kicker: 'PERMANENT MAKEUP',
    headline: 'Wake up with your brows done',
    summary: 'Brows, lips or liner',
    minutes: 120,
    downtime: 'About a week',
    fromUsd: 100,
    typicalUsd: 200,
    resultNote: { tone: 'warn', text: 'Looks darker for about a week' },
    dayTitle: 'do the long-lasting things first',
    orderNote: 'Healing takes about a week, so this goes early.',
    whyKorea: 'Artists here specialise in natural, soft results rather than bold lines.',
    steps: [
      { title: 'Design', body: 'The shape is drawn on and adjusted with you before anything starts.' },
      { title: 'Numbing', body: 'A numbing cream so the procedure stays comfortable.' },
      { title: 'Pigment', body: 'Color is applied in fine strokes and checked as it goes.' },
    ],
    leaveWith: [
      { title: 'A defined shape', body: 'It settles and softens as it heals.' },
      { title: 'A healing routine', body: 'What to apply, and what to avoid, day by day.' },
      { title: 'A touch-up plan', body: 'A follow-up is often recommended in the weeks after.' },
    ],
    beforeYouBook: [
      'Healing takes time — book early in your trip.',
      'Ask how the touch-up session works if you’re flying home.',
      'Avoid sun, saunas and swimming while it heals.',
    ],
    image: changePermanentMakeup,
  },
  photo: {
    subtype: 'photo',
    name: 'Photo Studio',
    kicker: 'PHOTO STUDIO',
    headline: 'Photos you’ll actually keep',
    summary: 'Studio shoot',
    minutes: 60,
    downtime: 'None',
    fromUsd: 30,
    typicalUsd: 70,
    dayTitle: 'end with the photos',
    orderNote: 'Last day, when your look is at its best.',
    whyKorea: 'Studios here handle lighting, styling and retouching in one visit.',
    steps: [
      { title: 'Choose a concept', body: 'Backdrops and moods to pick from, or bring your own idea.' },
      { title: 'Shoot', body: 'A guided session where the photographer directs your poses.' },
      { title: 'Pick and retouch', body: 'Choose your favorites and get them lightly retouched.' },
    ],
    leaveWith: [
      { title: 'Retouched photos', body: 'Usually delivered digitally, sometimes printed.' },
      { title: 'Prints or frames', body: 'If you add them on.' },
      { title: 'A shoot you’ll remember', body: 'It’s a fun part of the trip in its own right.' },
    ],
    beforeYouBook: [
      'Ask how many retouched photos are included.',
      'Book hair and makeup before, not after.',
      'Weekend slots go fast — book ahead.',
    ],
    image: changePhotoStudio,
  },
  sauna: {
    subtype: 'sauna',
    name: 'Sauna / Jjimjilbang',
    kicker: 'SAUNA',
    headline: 'The K-bathhouse, explained',
    summary: 'Bathhouse + sauna rooms',
    minutes: 120,
    downtime: 'None',
    fromUsd: 10,
    typicalUsd: 25,
    dayTitle: 'slow down',
    orderNote: 'Good right after your treatments, to reset.',
    whyKorea: 'Jjimjilbang are a Korean tradition — a whole evening of heat, rest and food.',
    steps: [
      { title: 'Check in', body: 'Get your wristband, locker key and a set of loungewear.' },
      { title: 'Bath and heat', body: 'Wash, soak, then rotate through the sauna rooms.' },
      { title: 'Rest', body: 'Lounge, snack and cool down in the shared areas.' },
    ],
    leaveWith: [
      { title: 'Warm, relaxed muscles', body: 'Especially after a long day of walking.' },
      { title: 'Softer skin', body: 'Heat and steam help skin feel smooth.' },
      { title: 'A very Korean evening', body: 'One you’ll want to tell people about.' },
    ],
    beforeYouBook: [
      'Bathing areas are usually nude and gender-separated.',
      'Bring a small towel and a change of clothes.',
      'Skip it right after a fresh treatment or waxing.',
    ],
    image: restoreSauna,
  },
  scrub: {
    subtype: 'scrub',
    name: 'Body Scrub',
    kicker: 'BODY SCRUB',
    headline: 'Peel away the stress',
    summary: 'Full-body scrub',
    minutes: 60,
    downtime: 'None',
    fromUsd: 20,
    typicalUsd: 45,
    dayTitle: 'reset your skin',
    orderNote: 'A good fit right after a sauna or bathhouse.',
    whyKorea: 'The Korean scrub is a classic — the results are unmistakable.',
    steps: [
      { title: 'Soak', body: 'Warm water softens the top layer of skin.' },
      { title: 'Scrub', body: 'A therapist works over your body with a scrub mitt.' },
      { title: 'Finish', body: 'A rinse and a moisturizing treatment to close.' },
    ],
    leaveWith: [
      { title: 'Noticeably smoother skin', body: 'You’ll see what came off.' },
      { title: 'A moisturizing finish', body: 'Skin that stays soft for days.' },
      { title: 'A reset feeling', body: 'Deeply clean and relaxed.' },
    ],
    beforeYouBook: [
      'It can be intense — say so if you’d like it lighter.',
      'Skip it if you have sunburn or open skin.',
      'Do it before a tan or a self-tanning treatment, not after.',
    ],
    image: restoreScrub,
  },
  massage: {
    subtype: 'massage',
    name: 'Massage',
    kicker: 'MASSAGE',
    headline: 'Undo all that walking',
    summary: 'Body massage',
    minutes: 60,
    downtime: 'None',
    fromUsd: 30,
    typicalUsd: 70,
    dayTitle: 'undo the walking',
    orderNote: 'A good way to end a busy day.',
    whyKorea: 'Massage here ranges from traditional to aromatherapy, at very fair prices.',
    steps: [
      { title: 'Tell them your spots', body: 'Say where you’re tight and what pressure you like.' },
      { title: 'Massage', body: 'The therapist works on the areas you flagged.' },
      { title: 'Rest', body: 'A few quiet minutes and a drink before you head out.' },
    ],
    leaveWith: [
      { title: 'Looser muscles', body: 'Especially legs and shoulders.' },
      { title: 'A calmer evening', body: 'An easy way to end a long day.' },
      { title: 'Stretching tips', body: 'For the trouble spots.' },
    ],
    beforeYouBook: [
      'Confirm the pressure level before you start.',
      'Ask about tipping and add-ons.',
      'Eat lightly beforehand.',
    ],
    image: restoreMassage,
  },
  yoga: {
    subtype: 'yoga',
    name: 'Yoga / Wellness',
    kicker: 'WELLNESS',
    headline: 'Reset, even your spirit',
    summary: 'Yoga or wellness class',
    minutes: 60,
    downtime: 'None',
    fromUsd: 20,
    typicalUsd: 40,
    dayTitle: 'reset',
    orderNote: 'A calm way to start or end a day.',
    whyKorea: 'Wellness studios here mix modern classes with quiet, considered spaces.',
    steps: [
      { title: 'Arrive and settle', body: 'A few minutes to change and get comfortable.' },
      { title: 'Class', body: 'A guided session at a pace that suits beginners too.' },
      { title: 'Cool down', body: 'Tea or a stretch before you leave.' },
    ],
    leaveWith: [
      { title: 'A clearer head', body: 'A calm break from a busy trip.' },
      { title: 'A looser body', body: 'Good after long flights and walking.' },
      { title: 'A routine to try', body: 'A few moves you can keep doing.' },
    ],
    beforeYouBook: [
      'Ask if classes are in English.',
      'Book a beginner-friendly class if it’s your first.',
      'Wear something comfortable that stretches.',
    ],
    image: restoreYoga,
  },
};

const stepImages = import.meta.glob('../assets/steps/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

/** Each step gets the illustration whose file name matches: `{subtype}-{stepNumber}.svg`. */
export const CATEGORY_GUIDES = Object.fromEntries(
  Object.entries(RAW_GUIDES).map(([subtype, guide]) => [
    subtype,
    {
      ...guide,
      steps: guide.steps.map((step, i) => ({ ...step, image: stepImages[`../assets/steps/${subtype}-${i + 1}.svg`] })),
    },
  ])
) as Record<GlowUpSubtype, CategoryGuide>;

export function guideFor(subtype: string): CategoryGuide | undefined {
  return (CATEGORY_GUIDES as Record<string, CategoryGuide | undefined>)[subtype];
}
