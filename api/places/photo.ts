import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(404).json({ error: 'disabled', service: 'places_photo' });
}
