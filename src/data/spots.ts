import type { BeautyCategory, Place, Spot, SpotSubcategory } from '../types';

const IMG = {
  studio: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200',
  clinic: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=1200',
  hair: 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?q=80&w=1200',
  spa: 'https://images.unsplash.com/photo-1544161515-4ac6ee4e8db4?q=80&w=1200',
  nails: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=1200',
  makeup: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?q=80&w=1200',
  portrait: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200',
  glasses: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?q=80&w=1200',
  wax: 'https://images.unsplash.com/photo-1519415518779-31f12acd77aa?q=80&w=1200',
  brow: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=1200',
  shop: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1200',
};

export const spots: Spot[] = [
];

export const SUBCATEGORY_LABEL: Record<SpotSubcategory, string> = {
  'color-perm': 'Color & Perm',
  'head-spa': 'Head Spa & Treatment',
  'hair-makeup': 'Hair & Makeup',
  'hair-extensions': 'Hair Extensions',
  'color-analysis': 'Color Analysis',
  'beauty-makeup': 'Beauty Makeup',
  'nail-art': 'Nail Art',
  'permanent-makeup': 'Permanent Makeup',
  waxing: 'Waxing & Hair Removal',
  glasses: 'Glasses',
  'id-portrait': 'ID & Portrait',
  aesthetics: 'Aesthetics',
  'skin-care': 'Skin Care',
  shopping: 'K-Beauty Shopping',
};

const SUBCATEGORY_BEAUTY: Record<SpotSubcategory, BeautyCategory> = {
  'color-perm': 'hair',
  'head-spa': 'hair',
  'hair-makeup': 'hair',
  'hair-extensions': 'hair',
  'color-analysis': 'makeup',
  'beauty-makeup': 'makeup',
  'nail-art': 'nails',
  'permanent-makeup': 'makeup',
  waxing: 'skin',
  glasses: 'makeup',
  'id-portrait': 'makeup',
  aesthetics: 'skin',
  'skin-care': 'skin',
  shopping: 'makeup',
};

function priceRange(min: number): Place['priceRange'] {
  if (min < 50) return '$';
  if (min < 120) return '$$';
  if (min < 400) return '$$$';
  return '$$$$';
}

export function getSpot(id: string): Spot | undefined {
  return spots.find((s) => s.id === id);
}

export function getSpots(): Spot[] {
  return spots;
}

export function spotToPlace(spot: Spot): Place {
  return {
    id: spot.id,
    name: spot.name,
    category: SUBCATEGORY_BEAUTY[spot.subcategory],
    address: spot.address,
    area: spot.area,
    latitude: spot.latitude,
    longitude: spot.longitude,
    photoUrl: spot.images[0],
    photos: spot.images,
    priceRange: priceRange(spot.priceMin),
    rating: spot.rating,
    reviewCount: spot.reviewCount,
    representativeTreatment: SUBCATEGORY_LABEL[spot.subcategory],
    treatmentIds: [],
    language: spot.languages,
    foreignerFriendly: spot.touristFriendly,
    bookingUrl: spot.bookingUrl,
    whyPeopleLikeIt: [spot.description],
    source: 'mock',
    googlePlaceId: spot.googlePlaceId,
  };
}

export function allSpotsAsPlaces(): Place[] {
  return spots.map(spotToPlace);
}
