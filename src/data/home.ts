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

export interface MostBookedItem {
  id: string;
  rank: number;
  name: string;
  best?: boolean;
  rating: number;
  reviews: number;
  duration: string;
  location: string;
  fromPrice: number;
}

export const mostBookedItems: MostBookedItem[] = [
  {
    id: 'personal-color-analysis',
    rank: 1,
    name: 'Personal Color Analysis',
    best: true,
    rating: 4.9,
    reviews: 1284,
    duration: '90 min',
    location: 'Hongdae',
    fromPrice: 95,
  },
  {
    id: 'skin-booster',
    rank: 2,
    name: 'Skin Booster',
    rating: 4.8,
    reviews: 962,
    duration: '30 min',
    location: 'Gangnam',
    fromPrice: 120,
  },
  {
    id: 'korean-hair-color',
    rank: 3,
    name: 'Korean Hair Color',
    rating: 4.7,
    reviews: 718,
    duration: '3 hrs',
    location: 'Cheongdam',
    fromPrice: 89,
  },
];

export const testimonials: Testimonial[] = [
  {
    id: 'maya',
    name: 'Maya R.',
    meta: '@mayainseoul · 12K',
    quote: 'I only had 4 days and no idea what was realistic. I walked in knowing exactly what to ask.',
  },
  {
    id: 'alicia',
    name: 'Alicia T.',
    meta: 'Los Angeles',
    quote: 'Nobody told me which lasers were safe for my skin tone.',
  },
  {
    id: 'jess',
    name: 'Jess W.',
    meta: '@jesskbeauty · 28K',
    quote: 'Booked in three taps.',
  },
];
