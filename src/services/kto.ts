import { pickEnglishAddressParts } from '../lib/englishAddress';

export interface KtoFacility {
  contentId: string;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  tel?: string;
  imageUrl?: string;
  distanceM?: number;
}

export interface KtoMedicalDetail {
  departments: string[];
  languages: string[];
  procedures: string[];
  facilities: string[];
  homepage?: string;
}

export interface KtoCommonDetail {
  overview?: string;
  address?: string;
  title?: string;
}

interface KtoEnvelope {
  response?: {
    header?: { resultCode?: string; resultMsg?: string };
    body?: { items?: { item?: unknown }; totalCount?: number };
  };
}

function pick(record: Record<string, unknown>, ...keys: string[]): string | undefined {
  const lower: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) lower[key.toLowerCase()] = value;
  for (const key of keys) {
    const value = record[key] ?? lower[key.toLowerCase()];
    if (value != null && String(value).trim() !== '') return String(value);
  }
  return undefined;
}

function asItems(raw: unknown): Record<string, unknown>[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (typeof raw === 'object') return [raw as Record<string, unknown>];
  return [];
}

function cleanKtoText(value?: string): string | undefined {
  if (!value) return undefined;
  const cleaned = value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || undefined;
}

function splitList(value?: string): string[] {
  if (!value) return [];
  return value
    .split(/[,;/|\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function mapFacility(item: Record<string, unknown>): KtoFacility | null {
  const contentId = pick(item, 'contentId', 'contentid');
  const title = pick(item, 'title');
  if (!contentId || !title) return null;
  const lat = Number(pick(item, 'mapY', 'mapy') || 0);
  const lng = Number(pick(item, 'mapX', 'mapx') || 0);
  const base = pick(item, 'baseAddr', 'addr1') || '';
  const detail = pick(item, 'detailAddr', 'addr2') || '';
  return {
    contentId,
    title,
    address: pickEnglishAddressParts(base, detail),
    latitude: lat,
    longitude: lng,
    tel: pick(item, 'tel'),
    imageUrl: pick(item, 'orgImage', 'thumbImage', 'firstimage', 'firstimage2'),
    distanceM: pick(item, 'dist') ? Number(pick(item, 'dist')) : undefined,
  };
}

const listCache = new Map<string, Promise<Record<string, unknown>[]>>();

async function ktoGet(op: string, params: Record<string, string | number | undefined>): Promise<Record<string, unknown>[]> {
  const cacheKey = `${op}?${JSON.stringify(params)}`;
  const cached = listCache.get(cacheKey);
  if (cached) return cached;
  const pending = ktoGetUncached(op, params);
  listCache.set(cacheKey, pending);
  try {
    return await pending;
  } catch (err) {
    listCache.delete(cacheKey);
    throw err;
  }
}

async function ktoGetUncached(op: string, params: Record<string, string | number | undefined>): Promise<Record<string, unknown>[]> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '') continue;
    query.set(key, String(value));
  }
  const response = await fetch(`/api/kto/${op}?${query.toString()}`);
  if (response.status === 503) return [];
  if (!response.ok) throw new Error(`KTO ${op} failed (${response.status})`);
  const data = (await response.json()) as KtoEnvelope;
  const code = String(data.response?.header?.resultCode ?? '');
  if (code === '03') return [];
  if (code && code !== '00' && code !== '0000') {
    throw new Error(data.response?.header?.resultMsg || `KTO error ${code}`);
  }
  return asItems(data.response?.body?.items?.item);
}

export async function searchKeyword(keyword: string, opts?: { numOfRows?: number; regionCode?: string }): Promise<KtoFacility[]> {
  const items = await ktoGet('searchKeyword', {
    keyword,
    numOfRows: opts?.numOfRows ?? 20,
    pageNo: 1,
    lDongRegnCd: opts?.regionCode ?? '11',
    arrange: 'A',
  });
  return items.map(mapFacility).filter((item): item is KtoFacility => item !== null);
}

export async function locationBasedList(origin: { lat: number; lng: number }, radiusM = 8000): Promise<KtoFacility[]> {
  const items = await ktoGet('locationBasedList', {
    mapX: origin.lng,
    mapY: origin.lat,
    radius: Math.min(Math.max(radiusM, 1), 20000),
    numOfRows: 20,
    pageNo: 1,
    arrange: 'E',
  });
  return items.map(mapFacility).filter((item): item is KtoFacility => item !== null);
}

export async function detailMedical(contentId: string): Promise<KtoMedicalDetail | null> {
  const items = await ktoGet('detailMdclTursm', { contentId, numOfRows: 1, pageNo: 1 });
  const item = items[0];
  if (!item) return null;
  return {
    departments: splitList(pick(item, 'mainMdlcSubjInfo', 'mdclTursmDivInfo')),
    languages: splitList(pick(item, 'svcLangInfo')),
    procedures: splitList(pick(item, 'specProcMdlcInfo')),
    facilities: splitList(pick(item, 'specFcltyInfo')),
    homepage: pick(item, 'hmpgInfo'),
  };
}

export async function detailCommon(contentId: string): Promise<KtoCommonDetail | null> {
  const items = await ktoGet('detailCommon', { contentId, numOfRows: 1, pageNo: 1 });
  const item = items[0];
  if (!item) return null;
  const base = pick(item, 'baseAddr', 'addr1') || '';
  const detail = pick(item, 'detailAddr', 'addr2') || '';
  return {
    overview: cleanKtoText(pick(item, 'overview')),
    address: pickEnglishAddressParts(base, detail),
    title: pick(item, 'title'),
  };
}
