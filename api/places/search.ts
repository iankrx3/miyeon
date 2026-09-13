import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PLACES_BASE, PLACES_SEARCH_FIELD_MASK } from '../../shared/apiProxy.js';
import { consumePlacesQuota, searchModeToSku } from '../../shared/placesQuota.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const googleKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!googleKey) {
    res.status(503).json({ error: 'not_configured', service: 'google' });
    return;
  }

  const payload: { mode?: string } & Record<string, unknown> = { ...(req.body ?? {}) };
  const mode = payload.mode === 'text' ? 'text' : 'nearby';
  delete payload.mode;
  const quota = consumePlacesQuota(searchModeToSku(mode));
  if (!quota.ok) {
    res.status(429).json({ error: 'quota_exhausted', sku: quota.sku, used: quota.used, cap: quota.cap });
    return;
  }
  const path = mode === 'text' ? 'places:searchText' : 'places:searchNearby';

  const response = await fetch(`${PLACES_BASE}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': googleKey,
      'X-Goog-FieldMask': PLACES_SEARCH_FIELD_MASK,
    },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  res.status(response.status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send(text);
}
