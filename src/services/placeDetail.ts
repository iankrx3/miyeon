import { hasHangul, isEnglishText, toEnglishAddress } from '../lib/englishAddress';
import type { MedicalTourismMatch, Place } from '../types';
import {
  getPlaceDetails,
  searchText,
  type GooglePlaceDetails,
} from './googlePlaces';
import { detailCommon, detailMedical, type KtoCommonDetail, type KtoMedicalDetail } from './kto';

const enrichCache = new Map<string, Place>();
const MATCH_DISTANCE_M = 200;
/** Google Place Details lookup is off to stop Places API billing. Flip to re-enable. */
const USE_GOOGLE_PLACE_DETAILS = false;

const TYPE_LABEL: Record<string, string> = {
  skin_care_clinic: 'skin-care clinic',
  spa: 'spa',
  medical_clinic: 'medical clinic',
  hospital: 'hospital',
  doctor: 'clinic',
  hair_salon: 'hair salon',
  hair_care: 'hair-care studio',
  nail_salon: 'nail salon',
  beauty_salon: 'beauty salon',
  makeup_artist: 'makeup studio',
  cosmetics_store: 'K-beauty shop',
};

const LANGUAGE_LABEL: Record<string, string> = {
  english: 'English',
  en: 'English',
  eng: 'English',
  영어: 'English',
  japanese: 'Japanese',
  ja: 'Japanese',
  jp: 'Japanese',
  일본어: 'Japanese',
  chinese: 'Chinese',
  zh: 'Chinese',
  cn: 'Chinese',
  중국어: 'Chinese',
  '중국어(간체)': 'Chinese',
  '중국어(번체)': 'Chinese',
  korean: 'Korean',
  ko: 'Korean',
  kr: 'Korean',
  한국어: 'Korean',
  russian: 'Russian',
  러시아어: 'Russian',
  spanish: 'Spanish',
  스페인어: 'Spanish',
  french: 'French',
  프랑스어: 'French',
  german: 'German',
  독일어: 'German',
  thai: 'Thai',
  태국어: 'Thai',
  vietnamese: 'Vietnamese',
  베트남어: 'Vietnamese',
  arabic: 'Arabic',
  아랍어: 'Arabic',
  mongolian: 'Mongolian',
  몽골어: 'Mongolian',
};

const DEPARTMENT_LABEL: Record<string, string> = {
  피부과: 'dermatology',
  성형외과: 'plastic surgery',
  치과: 'dentistry',
  안과: 'ophthalmology',
  한방: 'korean medicine',
  한의과: 'korean medicine',
  산부인과: 'obstetrics and gynecology',
  내과: 'internal medicine',
  dermatology: 'dermatology',
  'plastic surgery': 'plastic surgery',
  dentistry: 'dentistry',
};

function distanceM(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function firstEnglishSentence(text: string, max = 160): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed || hasHangul(trimmed) || !isEnglishText(trimmed)) return '';
  const sentence = trimmed.split(/(?<=[.!?])\s+/)[0] || trimmed;
  if (sentence.length <= max) return sentence.replace(/[.]+$/, '');
  return `${sentence.slice(0, max).replace(/\s+\S*$/, '')}…`;
}

function clipQuote(text: string, max = 120): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed || hasHangul(trimmed)) return '';
  if (trimmed.length <= max) return trimmed.replace(/[.]+$/, '');
  return `${trimmed.slice(0, max).replace(/\s+\S*$/, '')}…`;
}

function mapLabel(raw: string, table: Record<string, string>): string | undefined {
  const key = raw.trim();
  if (!key) return undefined;
  const direct = table[key] ?? table[key.toLowerCase()];
  if (direct) return direct;
  if (isEnglishText(key)) return key;
  return undefined;
}

function uniqueLabels(values: string[], table: Record<string, string>): string[] {
  const mapped = values
    .map((value) => mapLabel(value, table))
    .filter((value): value is string => Boolean(value));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of mapped) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function typeBullet(primaryType?: string, types: string[] = []): string {
  const key = primaryType || types.find((type) => TYPE_LABEL[type]);
  if (!key) return '';
  const label = TYPE_LABEL[key] || TYPE_LABEL[key.replace(/-/g, '_')];
  return label ? `Known as a ${label}` : '';
}

function buildWhyPeopleLikeIt(opts: {
  place: Place;
  google: GooglePlaceDetails | null;
  medical: KtoMedicalDetail | null;
  common: KtoCommonDetail | null;
}): string[] {
  const { place, google, medical, common } = opts;
  const bullets: string[] = [];
  const add = (line?: string) => {
    const text = line?.trim();
    if (!text || bullets.length >= 5) return;
    if (bullets.some((existing) => existing.toLowerCase() === text.toLowerCase())) return;
    bullets.push(text);
  };

  add(firstEnglishSentence(google?.editorialSummary ?? ''));
  add(firstEnglishSentence(common?.overview ?? ''));

  const languages = uniqueLabels(
    medical?.languages?.length ? medical.languages : place.language,
    LANGUAGE_LABEL
  );
  if (languages.includes('English')) add('English-speaking staff');
  else {
    const foreign = languages.filter((lang) => lang !== 'Korean');
    if (foreign.length) add(`Staff languages: ${foreign.join(', ')}`);
  }

  const rating = google?.rating || place.rating;
  const count = google?.reviewCount || place.reviewCount;
  if (rating >= 4 && count > 0) {
    add(`Rated ${rating.toFixed(1)}/5 from ${count.toLocaleString('en-US')} reviews`);
  }

  const departments = uniqueLabels(
    medical?.departments?.length
      ? medical.departments
      : place.medicalTourismMatch?.departments ?? [],
    DEPARTMENT_LABEL
  );
  if (departments.length) add(`Specializes in ${departments.slice(0, 3).join(', ')}`);

  const procedures = (medical?.procedures ?? []).filter(isEnglishText);
  if (procedures.length) add(`Known for ${procedures.slice(0, 3).join(', ').toLowerCase()}`);

  const facility = (medical?.facilities ?? []).find(
    (item) =>
      isEnglishText(item) &&
      /airport|foreign|english|international|hotel|lounge/i.test(item)
  );
  add(facility);

  add(typeBullet(google?.primaryType, google?.types ?? []));

  const quote = google?.reviews.find((review) => review.rating >= 4)?.text;
  add(clipQuote(quote ?? ''));

  if (place.ktoContentId || place.source === 'kto' || place.source === 'merged' || place.medicalTourismMatch) {
    add('Korea Tourism Organization registered medical-tourism facility');
  }

  return bullets;
}

function mergeMatch(
  place: Place,
  medical: KtoMedicalDetail | null,
  common: KtoCommonDetail | null
): MedicalTourismMatch | undefined {
  if (!place.ktoContentId && !place.medicalTourismMatch) return place.medicalTourismMatch;
  const existing = place.medicalTourismMatch;
  return {
    orgName: existing?.orgName || common?.title || place.name,
    address: toEnglishAddress(existing?.address || common?.address || place.address, {
      area: place.area,
    }),
    departments: medical?.departments.length ? medical.departments : existing?.departments ?? [],
    supportedLanguages: medical?.languages.length
      ? medical.languages
      : existing?.supportedLanguages ?? [],
    contact: existing?.contact,
    registered: true,
  };
}

async function resolveGoogleDetails(place: Place): Promise<GooglePlaceDetails | null> {
  let placeId = place.googlePlaceId;
  if (!placeId) {
    try {
      const hits = await searchText({
        textQuery: `${place.name} Seoul`,
        origin: { lat: place.latitude, lng: place.longitude },
        radiusM: 2000,
        maxResultCount: 5,
      });
      const origin = { lat: place.latitude, lng: place.longitude };
      const match = hits.find((hit) => distanceM(origin, { lat: hit.latitude, lng: hit.longitude }) <= MATCH_DISTANCE_M);
      placeId = (match ?? hits[0])?.id;
    } catch (err) {
      console.warn('Google text lookup for place detail failed', err);
    }
  }
  if (!placeId) return null;
  return getPlaceDetails(placeId);
}

export async function enrichPlaceDetail(place: Place): Promise<Place> {
  const cached = enrichCache.get(place.id);
  if (cached) return cached;

  const [google, medical, common] = await Promise.all([
    USE_GOOGLE_PLACE_DETAILS ? resolveGoogleDetails(place) : Promise.resolve(null),
    place.ktoContentId ? detailMedical(place.ktoContentId).catch(() => null) : Promise.resolve(null),
    place.ktoContentId ? detailCommon(place.ktoContentId).catch(() => null) : Promise.resolve(null),
  ]);

  const address = toEnglishAddress(google?.address || common?.address || place.address, {
    components: google?.addressComponents,
    area: place.area,
  });
  const fromApis = buildWhyPeopleLikeIt({ place, google, medical, common });
  const whyPeopleLikeIt =
    google || medical || common
      ? fromApis.length
        ? fromApis
        : place.whyPeopleLikeIt?.filter((line) => line.trim())
      : place.whyPeopleLikeIt?.filter((line) => line.trim());
  const next: Place = {
    ...place,
    address,
    rating: google?.rating || place.rating,
    reviewCount: google?.reviewCount || place.reviewCount,
    googlePlaceId: place.googlePlaceId || google?.id,
    whyPeopleLikeIt: whyPeopleLikeIt?.length ? whyPeopleLikeIt : undefined,
    medicalTourismMatch: mergeMatch(place, medical, common),
    language: medical?.languages.length ? medical.languages : place.language,
    foreignerFriendly:
      place.foreignerFriendly ||
      uniqueLabels(medical?.languages ?? [], LANGUAGE_LABEL).includes('English'),
  };
  enrichCache.set(place.id, next);
  return next;
}
