import curatorMayaCover from '../assets/map/curator-maya-cover.jpg';
import curatorMayaAvatar from '../assets/map/curator-maya-avatar.png';
import curatorJessCover from '../assets/map/curator-jess-cover.jpg';
import curatorJessAvatar from '../assets/map/curator-jess-avatar.png';
import curatorAliciaCover from '../assets/map/curator-alicia-cover.jpg';
import curatorAliciaAvatar from '../assets/map/curator-alicia-avatar.png';

export interface CuratorRouteTeaser {
  id: string;
  name: string;
  meta: string;
  title: string;
  stops: number;
  priceUsd: number;
  cover: string;
  avatar: string;
}

/** Static teaser for the Map page's "Curator routes" shelf — same three curators
 * featured in the Home reviews section. Swap for a real curator feed once one exists. */
export const curatorRouteTeasers: CuratorRouteTeaser[] = [
  {
    id: 'maya',
    name: 'Maya R.',
    meta: '@mayainseoul · 12K',
    title: 'Glass skin in 4 days',
    stops: 3,
    priceUsd: 410,
    cover: curatorMayaCover,
    avatar: curatorMayaAvatar,
  },
  {
    id: 'jess',
    name: 'Jess W.',
    meta: '@jesskbeauty · 28K',
    title: 'The full Gangnam reset',
    stops: 5,
    priceUsd: 780,
    cover: curatorJessCover,
    avatar: curatorJessAvatar,
  },
  {
    id: 'alicia',
    name: 'Alicia T.',
    meta: 'Los Angeles',
    title: 'Color first, then hair',
    stops: 2,
    priceUsd: 240,
    cover: curatorAliciaCover,
    avatar: curatorAliciaAvatar,
  },
];
