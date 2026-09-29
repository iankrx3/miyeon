import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    kto: Boolean(process.env.KTO_SERVICE_KEY),
    google: Boolean(process.env.GOOGLE_PLACES_API_KEY),
    resend: Boolean(process.env.RESEND_API_KEY),
  });
}
