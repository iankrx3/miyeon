export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  rankBadge?: string;
  concernTags: string[];
  oliveYoungUrl: string;
  tagline?: string;
}

// Mock K-beauty product data for the §02-8 "And at home" commerce teaser. oliveYoungUrl is a
// placeholder site-search link (no real affiliate ID yet) — swap in a real product feed/affiliate
// program when one exists.
function oliveYoungSearch(query: string): string {
  return `https://global.oliveyoung.com/search?query=${encodeURIComponent(query)}`;
}

export const mockProducts: Product[] = [
  {
    id: 'p-snail-serum',
    name: 'Snail Mucin Repair Serum',
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600',
    price: 22,
    concernTags: ['Pores', 'Acne', 'Dullness', 'Glow'],
    oliveYoungUrl: oliveYoungSearch('snail mucin serum'),
  },
  {
    id: 'p-vitamin-c',
    name: 'Vitamin C Brightening Ampoule',
    imageUrl: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=600',
    price: 28,
    concernTags: ['Pigmentation', 'Dullness', 'Uneven Skin', 'Glow'],
    oliveYoungUrl: oliveYoungSearch('vitamin c ampoule'),
  },
  {
    id: 'p-barrier-cream',
    name: 'Ceramide Barrier Cream',
    imageUrl: 'https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?q=80&w=600',
    price: 24,
    concernTags: ['Dryness', 'Fine Lines'],
    oliveYoungUrl: oliveYoungSearch('ceramide barrier cream'),
  },
  {
    id: 'p-sunscreen',
    name: 'Daily SPF 50+ Sun Fluid',
    imageUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=600',
    price: 18,
    concernTags: ['Pigmentation', 'Fine Lines', 'Dullness', 'Uneven Skin'],
    oliveYoungUrl: oliveYoungSearch('sunscreen spf 50'),
  },
  {
    id: 'p-pore-toner',
    name: 'BHA Pore Clarifying Toner',
    imageUrl: 'https://images.unsplash.com/photo-1600428853876-fb5a850b444c?q=80&w=600',
    price: 19,
    concernTags: ['Pores', 'Acne'],
    oliveYoungUrl: oliveYoungSearch('bha pore toner'),
  },
  {
    id: 'p-jawline-roller',
    name: 'Gua Sha Contouring Tool',
    imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=600',
    price: 16,
    concernTags: ['Jawline', 'V-Line', 'Contouring', 'Volume', 'Facial Balance'],
    oliveYoungUrl: oliveYoungSearch('gua sha tool'),
  },
];

export const defaultProducts = mockProducts.slice(0, 3);

export const OLIVE_YOUNG_HOME = 'https://global.oliveyoung.com/';

/** Home “Take Korea home with you” shelf — copy and prices match the Home v2 mock. */
export const homeProducts: Product[] = [
  {
    id: 'home-barrier-cream',
    name: 'Barrier Cream',
    tagline: 'Post-treatment care',
    rankBadge: '#1',
    imageUrl: 'https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?q=80&w=600',
    price: 24,
    originalPrice: 32,
    concernTags: ['Dryness', 'Fine Lines'],
    oliveYoungUrl: oliveYoungSearch('barrier cream'),
  },
  {
    id: 'home-gentle-cleanser',
    name: 'Gentle Cleanser',
    tagline: 'Low-pH, no stripping',
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600',
    price: 18,
    originalPrice: 24,
    concernTags: ['Dryness', 'Acne'],
    oliveYoungUrl: oliveYoungSearch('gentle cleanser low ph'),
  },
  {
    id: 'home-spf-fluid',
    name: 'SPF 50+ Fluid',
    tagline: 'Dermatologist pick',
    imageUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=600',
    price: 21,
    originalPrice: 26,
    concernTags: ['Pigmentation', 'Fine Lines'],
    oliveYoungUrl: oliveYoungSearch('sunscreen spf 50 fluid'),
  },
  {
    id: 'home-soothing-mask',
    name: 'Soothing Mask',
    tagline: 'Redness, day 1–3',
    imageUrl: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?q=80&w=600',
    price: 14,
    concernTags: ['Acne', 'Dryness'],
    oliveYoungUrl: oliveYoungSearch('soothing mask'),
  },
];

/** No affiliate tag yet — plain search links. Add `&tag=<id>` here when an Amazon Associates ID exists. */
export function amazonSearch(query: string): string {
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;
}

export interface AftercareProduct {
  id: string;
  /** Real product name — it is also the Amazon search query, so the link lands on that exact item. */
  name: string;
  tagline: string;
  amazonUrl: string;
  /** Fallback product photo for items without a local asset — a stock placeholder until a real
   * affiliate image feed exists. */
  imageUrl?: string;
}

/** "After your clinic" shelf under the Skin Reset routine. */
export const aftercareProducts: AftercareProduct[] = [
  {
    id: 'after-barrier-cream',
    name: 'Dr.Jart+ Ceramidin Cream',
    tagline: 'Rebuilds the barrier',
    amazonUrl: amazonSearch('Dr.Jart+ Ceramidin Cream'),
  },
  {
    id: 'after-gentle-cleanser',
    name: 'COSRX Low pH Good Morning Gel Cleanser',
    tagline: 'Gentle, no stripping',
    amazonUrl: amazonSearch('COSRX Low pH Good Morning Gel Cleanser'),
  },
  {
    id: 'after-spf',
    name: 'Beauty of Joseon Relief Sun SPF50+',
    tagline: 'Sun cover while it heals',
    amazonUrl: amazonSearch('Beauty of Joseon Relief Sun Rice Probiotics SPF50+'),
  },
  {
    id: 'after-toner',
    name: 'Innisfree Green Tea Hyaluronic Toner',
    tagline: 'Hydration boost',
    amazonUrl: amazonSearch('Innisfree Green Tea Hyaluronic Toner'),
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600',
  },
  {
    id: 'after-serum',
    name: 'Torriden DIVE-IN Serum',
    tagline: 'Replenishes moisture',
    amazonUrl: amazonSearch('Torriden DIVE-IN Low Molecule Hyaluronic Acid Serum'),
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600',
  },
  {
    id: 'after-soothing-toner',
    name: 'Anua Heartleaf 77% Soothing Toner',
    tagline: 'Calms redness',
    amazonUrl: amazonSearch('Anua Heartleaf 77% Soothing Toner'),
    imageUrl: 'https://images.unsplash.com/photo-1600428853876-fb5a850b444c?q=80&w=600',
  },
];
