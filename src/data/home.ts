export type BrowseAction = 'treatments' | 'salon' | 'products';

export interface BrowseItem {
  id: BrowseAction;
  caption: string;
  title: string;
  description: string;
  highlighted?: boolean;
}

export interface TrendingItem {
  id: string;
  kind: 'TREATMENT' | 'GUIDE' | 'TREND';
  title: string;
  minutes: number;
  href: string;
  imageUrl: string;
}

export interface Testimonial {
  id: string;
  name: string;
  meta: string;
  quote: string;
  chip: string;
  avatarClass: string;
}

export const browseItems: BrowseItem[] = [
  {
    id: 'treatments',
    caption: 'Skin · Hair · Makeup',
    title: 'Plan a trip',
    description: 'Tell us what you want.\nGet a day-by-day itinerary.',
    highlighted: true,
  },
  {
    id: 'salon',
    caption: 'Hair · Nails · Makeup',
    title: 'Salon',
    description: 'Book a chair with\nEnglish-speaking staff.',
  },
  {
    id: 'products',
    caption: 'Skincare · Makeup',
    title: 'Products',
    description: 'What to actually buy\nat Olive Young.',
  },
];

// ids match entries in data/magazine.ts 1:1, so each card deep-links straight to its column.
export const trendingItems: TrendingItem[] = [
  {
    id: 'rejuran-juvelook',
    kind: 'TREATMENT',
    title: 'Rejuran vs Juvelook —\nwhich one is for you?',
    minutes: 5,
    href: '/magazine/rejuran-juvelook',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1200',
  },
  {
    id: 'four-days',
    kind: 'GUIDE',
    title: 'What you can realistically\nget done in 4 days',
    minutes: 7,
    href: '/magazine/four-days',
    imageUrl: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?q=80&w=1200',
  },
  {
    id: 'glass-skin',
    kind: 'TREND',
    title: 'The “glass skin” protocol\nSeoul clinics actually use',
    minutes: 4,
    href: '/magazine/glass-skin',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1200',
  },
];

export const partnerNames = ['Creatrip', 'OLIVE YOUNG', 'amazon', 'Coupang', 'NAVER', 'o3c'] as const;

export const testimonials: Testimonial[] = [
  {
    id: 'maya',
    name: 'Maya R.',
    meta: '@mayainseoul · 12K',
    quote:
      'I had 4 days and no idea what was realistic. Walked into the clinic knowing exactly what to ask.',
    chip: 'Rejuran · Gangnam',
    avatarClass: 'bg-[#f0d2cc]',
  },
  {
    id: 'alicia',
    name: 'Alicia T.',
    meta: 'Los Angeles',
    quote: 'Nobody else told me which lasers were safe for my skin tone. That alone sold me.',
    chip: 'Pico Toning · Hongdae',
    avatarClass: 'bg-[#e8c4bc]',
  },
  {
    id: 'jess',
    name: 'Jess W.',
    meta: '@jesskbeauty · 28K',
    quote: 'Booked in three taps. The consultation card is the part I actually screenshot.',
    chip: 'Ultherapy · Apgujeong',
    avatarClass: 'bg-[#d49a9a]',
  },
];
