import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validatePlanPayload } from '../shared/planEmail.js';
import { consumePlanEmailQuota, sendPlanEmail } from '../shared/sendPlanEmail.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PLAN_EMAIL_FROM;
  if (!apiKey || !from) {
    res.status(503).json({ error: 'not_configured', service: 'resend' });
    return;
  }

  let body: unknown = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = null;
    }
  }
  const checked = validatePlanPayload(body);
  if (!checked.ok) {
    res.status(400).json({ error: checked.error });
    return;
  }

  const forwarded = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  if (!consumePlanEmailQuota(ip, checked.payload.email)) {
    res.status(429).json({ error: 'rate_limited' });
    return;
  }

  const result = await sendPlanEmail(checked.payload, { apiKey, from });
  if (!result.ok) {
    console.error('[plan-email] Resend failed', result.status, result.error);
    res.status(502).json({ error: 'send_failed' });
    return;
  }
  res.status(200).json({ ok: true, id: result.id });
}
