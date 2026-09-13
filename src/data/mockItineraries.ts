import type { Itinerary } from '../types';
import { mockCreators, mockPlaces } from './mock';

function placePhoto(id: string): string | undefined {
  return mockPlaces.find((p) => p.id === id)?.photoUrl;
}

const now = '2025-03-01T00:00:00Z';

/** Demo curator trips. Built from mockPlaces so they stay visible even when
 * live Google/KTO discovery is empty or IDs have changed. */
export const mockCuratorItineraries: Itinerary[] = [
  {
    id: 'itn_seed_seoulskin',
    title: 'Soft Seoul, two days',
    source: 'curator',
    curatorId: mockCreators[0].id,
    description: 'Laser first, then a recovery facial — Gangnam, no drama.',
    coverPhotoUrl: placePhoto('place-glow-derma'),
    estimatedSpendUsd: 790,
    createdAt: now,
    updatedAt: now,
    days: [
      {
        dayIndex: 1,
        areaLabel: 'GANGNAM',
        theme: 'Skin reset',
        blocks: [
          {
            id: 'seed-a-d1-sp1',
            kind: 'spot',
            spotId: 'place-glow-derma',
            startTime: '10:30',
            durationMin: 60,
            priceUsd: 250,
            reason: 'English-speaking laser toning — the trip’s anchor appointment.',
          },
          {
            id: 'seed-a-d1-tr1',
            kind: 'travel',
            travel: { mode: 'walk', minutes: 12 },
            durationMin: 12,
            startTime: '11:30',
          },
          {
            id: 'seed-a-d1-br1',
            kind: 'break',
            label: 'Lunch in Apgujeong',
            durationMin: 50,
            startTime: '11:45',
          },
          {
            id: 'seed-a-d1-sp2',
            kind: 'spot',
            spotId: 'place-pore-clinic',
            startTime: '12:40',
            durationMin: 60,
            priceUsd: 115,
            reason: 'A calmer facial after laser — budget-friendly and first-timer safe.',
          },
        ],
      },
      {
        dayIndex: 2,
        areaLabel: 'GANGNAM',
        theme: 'Soft contour',
        blocks: [
          {
            id: 'seed-a-d2-sp1',
            kind: 'spot',
            spotId: 'place-vline-clinic',
            startTime: '11:00',
            durationMin: 90,
            priceUsd: 425,
            reason: 'Natural lifting if you want a little more definition without surgery.',
          },
        ],
      },
    ],
  },
  {
    id: 'itn_seed_mina',
    title: 'Hongdae hair & makeup',
    source: 'curator',
    curatorId: mockCreators[1].id,
    description: 'A short, very Korean afternoon — nails, then a K-idol perm.',
    coverPhotoUrl: placePhoto('place-seongsu-hair'),
    estimatedSpendUsd: 355,
    createdAt: '2025-03-05T00:00:00Z',
    updatedAt: '2025-03-05T00:00:00Z',
    days: [
      {
        dayIndex: 1,
        areaLabel: 'HONGDAE · SEONGSU',
        theme: 'Hair & details',
        blocks: [
          {
            id: 'seed-b-d1-sp1',
            kind: 'spot',
            spotId: 'place-clean-nails',
            startTime: '13:00',
            durationMin: 60,
            priceUsd: 65,
            reason: 'Clean-girl gel in Hongdae — walk-ins, English OK.',
          },
          {
            id: 'seed-b-d1-tr1',
            kind: 'travel',
            travel: { mode: 'subway', minutes: 28 },
            durationMin: 28,
            startTime: '14:00',
          },
          {
            id: 'seed-b-d1-sp2',
            kind: 'spot',
            spotId: 'place-seongsu-hair',
            startTime: '14:30',
            durationMin: 120,
            priceUsd: 130,
            reason: 'Soft K-idol perm without frying the hair — Mina’s usual chair.',
          },
          {
            id: 'seed-b-d1-tr2',
            kind: 'travel',
            travel: { mode: 'subway', minutes: 22 },
            durationMin: 22,
            startTime: '16:30',
          },
          {
            id: 'seed-b-d1-sp3',
            kind: 'spot',
            spotId: 'place-glam-makeup',
            startTime: '17:00',
            durationMin: 75,
            priceUsd: 160,
            reason: 'Photoshoot-ready makeup that actually works on Western features.',
          },
        ],
      },
    ],
  },
];
