import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin, ViteDevServer } from 'vite';
import {
  KTO_BASE,
  PLACES_BASE,
  KTO_OPS,
  PLACES_SEARCH_FIELD_MASK,
  PLACES_DETAILS_FIELD_MASK,
  decodeServiceKey,
} from '../shared/apiProxy.js';
import { consumePlacesQuota, searchModeToSku } from '../shared/placesQuota.js';

export interface MiyeonApiProxyOptions {
  ktoKey?: string;
  googleKey?: string;
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function handleKto(url: URL, res: ServerResponse, ktoKey: string) {
  const op = url.pathname.replace(/^\/api\/kto\//, '').replace(/\/$/, '');
  if (!KTO_OPS.has(op)) {
    json(res, 400, { error: `Unknown KTO operation: ${op}` });
    return;
  }

  const upstream = new URL(`${KTO_BASE}/${op}`);
  url.searchParams.forEach((value, key) => {
    if (key === 'serviceKey') return;
    upstream.searchParams.set(key, value);
  });
  upstream.searchParams.set('serviceKey', decodeServiceKey(ktoKey));
  if (!upstream.searchParams.has('MobileOS')) upstream.searchParams.set('MobileOS', 'ETC');
  if (!upstream.searchParams.has('MobileApp')) upstream.searchParams.set('MobileApp', 'Miyeon');
  if (!upstream.searchParams.has('_type')) upstream.searchParams.set('_type', 'json');
  if (!upstream.searchParams.has('langDivCd')) upstream.searchParams.set('langDivCd', 'ENG');

  const response = await fetch(upstream);
  const text = await response.text();
  res.statusCode = response.status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(text);
}

async function handlePlacesSearch(req: IncomingMessage, res: ServerResponse, googleKey: string) {
  const raw = await readBody(req);
  let payload: { mode?: string } & Record<string, unknown>;
  try {
    payload = JSON.parse(raw || '{}');
  } catch {
    json(res, 400, { error: 'Invalid JSON body' });
    return;
  }

  const mode = payload.mode === 'text' ? 'text' : 'nearby';
  delete payload.mode;
  const quota = consumePlacesQuota(searchModeToSku(mode));
  if (!quota.ok) {
    json(res, 429, { error: 'quota_exhausted', sku: quota.sku, used: quota.used, cap: quota.cap });
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
  res.statusCode = response.status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(text);
}

async function handlePlacesDetails(url: URL, res: ServerResponse, googleKey: string) {
  const raw = url.searchParams.get('id');
  if (!raw || !/^(places\/)?[A-Za-z0-9_-]+$/.test(raw)) {
    json(res, 400, { error: 'Missing or invalid place id' });
    return;
  }
  const quota = consumePlacesQuota('details_pro');
  if (!quota.ok) {
    json(res, 429, { error: 'quota_exhausted', sku: quota.sku, used: quota.used, cap: quota.cap });
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
  res.statusCode = response.status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(text);
}

function attach(server: ViteDevServer, options: MiyeonApiProxyOptions) {
  server.middlewares.use(async (req, res, next) => {
    const rawUrl = req.url || '';
    if (!rawUrl.startsWith('/api/')) {
      next();
      return;
    }

    try {
      const url = new URL(rawUrl, 'http://localhost');

      if (url.pathname === '/api/health') {
        json(res, 200, {
          kto: Boolean(options.ktoKey),
          google: Boolean(options.googleKey),
        });
        return;
      }

      if (url.pathname.startsWith('/api/kto/')) {
        if (!options.ktoKey) {
          json(res, 503, { error: 'not_configured', service: 'kto' });
          return;
        }
        await handleKto(url, res, options.ktoKey);
        return;
      }

      if (url.pathname === '/api/places/search' && req.method === 'POST') {
        if (!options.googleKey) {
          json(res, 503, { error: 'not_configured', service: 'google' });
          return;
        }
        await handlePlacesSearch(req, res, options.googleKey);
        return;
      }

      if (url.pathname === '/api/places/photo') {
        json(res, 404, { error: 'disabled', service: 'places_photo' });
        return;
      }

      if (url.pathname === '/api/places/details' && req.method === 'GET') {
        if (!options.googleKey) {
          json(res, 503, { error: 'not_configured', service: 'google' });
          return;
        }
        await handlePlacesDetails(url, res, options.googleKey);
        return;
      }

      next();
    } catch (err) {
      json(res, 500, { error: err instanceof Error ? err.message : 'Proxy failed' });
    }
  });
}

export function miyeonApiProxy(options: MiyeonApiProxyOptions): Plugin {
  return {
    name: 'miyeon-api-proxy',
    configureServer(server) {
      attach(server, options);
    },
    configurePreviewServer(server) {
      attach(server as unknown as ViteDevServer, options);
    },
  };
}
