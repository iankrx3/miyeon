import type { MagazineArticle } from '../types';
// Same photos as the home "Know What's Next" cards (components/home/HomeTrending.tsx), so the
// article you land on matches the card you clicked.
import trendingTreatment from '../assets/home/trending-treatment.jpg';
import trendingGuide from '../assets/home/trending-guide.jpg';

// Seed content for the Community tab's "Magazine" view — editorial columns, not user posts.
// Real curator-submitted columns (via MagazineComposer) are merged on top of this list at fetch
// time (see services/magazine.ts); these entries have no curatorId since they aren't authored by
// a registered curator.
const EDITORIAL_AUTHOR = 'Miyeon Editorial';
const EDITORIAL_AVATAR = 'https://i.pravatar.cc/150?img=5';

export const mockMagazineArticles: MagazineArticle[] = [
  {
    id: 'rejuran-juvelook',
    kind: 'TREATMENT',
    title: 'Rejuran vs Juvelook — which one is for you?',
    minutes: 5,
    imageUrl: trendingTreatment,
    excerpt:
      'Both are skin-booster injectables, but they solve different problems. Here’s how clinics actually pick.',
    body:
      'Rejuran and Juvelook get lumped together as "the Korean skin booster," but clinics in Seoul treat them as two different tools.\n\n' +
      'Rejuran is polynucleotide-based — it comes from salmon DNA fragments and is best known for calming inflammation and speeding up wound healing. That’s why it’s the go-to pick for acne scarring, redness, and skin that’s been through a rough patch (post-laser, post-peel, or just chronically irritated). Results build slowly and feel more like "my skin stopped overreacting" than "my skin looks different."\n\n' +
      'Juvelook is PDLLA-based, closer in spirit to a collagen stimulator like Sculptra. It’s picked when the main complaint is volume loss or fine lines rather than irritation — cheeks that have started to look hollow, or early nasolabial folds. The collagen response takes 4-8 weeks to show but tends to last longer per session.\n\n' +
      'The rule of thumb clinics use: if your skin is angry, start with Rejuran. If your skin is just tired and thinning, start with Juvelook. Some longer Seoul itineraries combine both a few weeks apart — but for a first trip, picking based on which problem is louder is the simpler call.',
    authorName: EDITORIAL_AUTHOR,
    authorAvatarUrl: EDITORIAL_AVATAR,
    createdAt: '2026-01-12T09:00:00Z',
  },
  {
    id: 'four-days',
    kind: 'GUIDE',
    title: 'What you can realistically get done in 4 days',
    minutes: 7,
    imageUrl: trendingGuide,
    excerpt: 'A day-by-day plan for a short trip, so downtime never overlaps with your flight home.',
    body:
      'Four days sounds short, but it’s enough for one meaningful treatment plus a buffer — if you sequence it right.\n\n' +
      'Day 1: land, do nothing skin-related. Jet lag plus a treatment on the same day is how people end up with worse swelling than expected. Use the day to scout your clinic in person and confirm the consult.\n\n' +
      'Day 2: the main treatment. Morning appointments give you the rest of the day to ice, rest, and see how your skin reacts before you’re out and about.\n\n' +
      'Day 3: this is your downtime buffer, not a sightseeing day. Most laser and injectable redness peaks around 24-48 hours in. Keep it light — a slow café day, no sun, no alcohol.\n\n' +
      'Day 4: by now most people are camera-ready or close to it. This is when it’s safe to add a second, gentler treatment (a hydrating facial, LED) if you want one — but don’t schedule anything aggressive with a flight the next morning.\n\n' +
      'The mistake most first-timers make is booking the treatment for day 3 or 4 "to be safe" and then having zero recovery buffer before their flight. Front-load it instead.',
    authorName: EDITORIAL_AUTHOR,
    authorAvatarUrl: EDITORIAL_AVATAR,
    createdAt: '2026-01-18T09:00:00Z',
  },
  {
    id: 'glass-skin',
    kind: 'TREND',
    title: 'The "glass skin" protocol Seoul clinics actually use',
    minutes: 4,
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1200',
    excerpt: 'Less about products, more about a specific order of lasers and toners. We break down the protocol.',
    body:
      '"Glass skin" gets sold abroad as a 10-step product routine, but the clinics that coined the look treat it as a procedure sequence, not a shelf of serums.\n\n' +
      'The base is usually a toning laser (low-fluence Q-switch or picosecond) done in a short series, spaced 2-4 weeks apart, to even out tone without visible downtime. On top of that, most protocols add a hydrating booster — Rejuran or a similar polynucleotide/HA blend — to plump the surface so light reflects more evenly. That reflection, not whitening, is what actually reads as "glass" in photos.\n\n' +
      'Skincare still matters, but it’s doing a smaller job than people assume: a gentle low-pH cleanser and a barrier-repair moisturizer for the week around each session, so the skin isn’t fighting irritation while it’s trying to heal and reflect light evenly.\n\n' +
      'For a single trip, one toning session plus one booster session is enough to see the effect start — the full look is a cumulative one built over several visits, which is why it reads as a "resident of Seoul" thing more than a single-treatment thing.',
    authorName: EDITORIAL_AUTHOR,
    authorAvatarUrl: EDITORIAL_AVATAR,
    createdAt: '2026-01-22T09:00:00Z',
  },
  {
    id: 'ingredient-glossary',
    kind: 'GUIDE',
    title: 'The 6 K-beauty ingredients worth knowing before you shop',
    minutes: 6,
    imageUrl: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=1200',
    excerpt: 'Snail mucin, centella, PDRN — what they do, and which skin concerns they’re actually good for.',
    body:
      'Olive Young shelves are overwhelming if you don’t already know what the ingredient names mean. Here’s the short version of the six that come up constantly.\n\n' +
      'Snail mucin — a repair-and-hydrate ingredient, good for dullness and a compromised barrier. It’s the safest "just try it" pick for most skin types.\n\n' +
      'Centella asiatica (cica) — calming and anti-redness. Reach for this after a laser, a peel, or any time skin feels reactive rather than just dry.\n\n' +
      'PDRN (polydeoxyribonucleotide) — the at-home cousin of Rejuran; lower concentration, but same wound-healing, regenerative logic. Good for post-treatment weeks.\n\n' +
      'Niacinamide — brightening and oil control, the closest thing to a universal ingredient. Most tolerate it well even layered with actives.\n\n' +
      'Propolis — antibacterial and soothing, a good pick for anyone dealing with breakouts alongside sensitivity, where a harsher acne ingredient would be too much.\n\n' +
      'Ceramides — not an "active," but the barrier-repair ingredient everything else depends on. If your skin is reacting badly to a new routine, the fix is usually adding ceramides back in, not removing more products.',
    authorName: EDITORIAL_AUTHOR,
    authorAvatarUrl: EDITORIAL_AVATAR,
    createdAt: '2026-01-27T09:00:00Z',
  },
  {
    id: 'booking-in-english',
    kind: 'GUIDE',
    title: 'How to book a Seoul clinic in English, without the guesswork',
    minutes: 5,
    imageUrl: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?q=80&w=1200',
    excerpt: 'What to ask before you land, and the phrases that get you an English-speaking consult.',
    body:
      'Most Gangnam-area clinics see foreign patients regularly, but "English-speaking" can mean anything from a fully bilingual coordinator to a translation app passed back and forth. It’s worth confirming before you book, not after you land.\n\n' +
      'When you message a clinic, ask directly: "Do you have an English-speaking coordinator for consultations?" rather than "do you speak English" — clinics often have one specific staff member who handles international patients, and naming the role gets you routed to them faster.\n\n' +
      'Confirm the consult is free and non-committal before you go — nearly all are, but it’s worth hearing it stated, since it changes how much you should feel obligated to book on the spot.\n\n' +
      'Bring (or have ready on your phone) a short list of what you want addressed, in plain language, not treatment names — "the redness on my cheeks" gets you a more useful recommendation than guessing at a procedure yourself.\n\n' +
      'Last thing: ask about downtime in days, not "how long does swelling last" — clinics tend to answer the first question more conservatively, which is the number you actually want when you’re planning a trip.',
    authorName: EDITORIAL_AUTHOR,
    authorAvatarUrl: EDITORIAL_AVATAR,
    createdAt: '2026-02-02T09:00:00Z',
  },
  {
    id: 'winter-skin-trend',
    kind: 'TREND',
    title: 'Why "skip-care" is replacing 10-step routines this season',
    minutes: 4,
    imageUrl: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=1200',
    excerpt: 'Seoul dermatologists are pushing fewer, stronger steps. Here’s what to cut first.',
    body:
      'The "10-step routine" that made K-beauty famous abroad is quietly out of fashion in the clinics that used to recommend it. The replacement, "skip-care" (생략 스킨케어), is built on doing less, better.\n\n' +
      'The logic: layering many mild actives can leave skin barrier-stressed without any single ingredient being the obvious cause. Dermatologists have started recommending 3-4 steps — cleanser, one targeted serum, moisturizer, SPF — and letting the serum step rotate based on what skin actually needs that week, rather than applying every serum every day.\n\n' +
      'What gets cut first: extra toners and essences that exist mainly to add a step, and multiple exfoliants used back-to-back. What stays: a barrier-repair moisturizer and daily SPF, which are treated as non-negotiable regardless of how minimal the rest of the routine gets.\n\n' +
      'For travelers, this is good news — it means the "correct" at-home routine to pair with a clinic treatment is now simpler to pack and follow, not a suitcase of ten bottles.',
    authorName: EDITORIAL_AUTHOR,
    authorAvatarUrl: EDITORIAL_AVATAR,
    createdAt: '2026-02-08T09:00:00Z',
  },
];
