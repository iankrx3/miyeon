import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PLACES_BASE, PLACES_DETAILS_FIELD_MASK } from '../../shared/apiProxy.js';

const PLACE_ID = /^(places\/)?[A-Za-z0-9_-]+$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const googleKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!googleKey) {
    res.status(503).json({ error: 'not_configured', service: 'google' });
    return;
  }

  const idParam = req.query.id;
  const raw = Array.isArray(idParam) ? idParam[0] : idParam;
  if (!raw || !PLACE_ID.test(raw)) {
    res.status(400).json({ error: 'Missing or invalid place id' });
    return;
  }

  const placeId = raw.startsWith('places/') ? raw.slice('places/'.length) : raw;
  const upstream = new URL(`${PLACES_BASE}/places/${encodeURIComponent(placeId)}`);
  upstream.searchParams.set('languageCode', 'en');
  upstream.searchParams.set('regionCode', 'KR');

  const response = await fetch(upstream, {
    headers: {
      'X-Goog-Api-Key': googleKey,
      'X-Goog-FieldMask': PLACES_DETAILS_FIELD_MASK,
    },
  });
  const text = await response.text();
  res.status(response.status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send(text);
}
