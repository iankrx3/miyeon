import { renderPlanEmail, type PlanEmailPayload } from './planEmail.js';

/** Abuse limits for the public "Email me my plan" endpoint. Like placesQuota.ts these are
 * per process (each serverless instance counts on its own) — Resend's own daily cap is the
 * durable backstop. GLOBAL_DAILY stays under Resend's free 100/day. */
const PER_IP_HOURLY = 5;
const PER_RECIPIENT_DAILY = 3;
const GLOBAL_DAILY = 90;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const ipHits = new Map<string, number[]>();
const recipientHits = new Map<string, number[]>();
let globalHits: number[] = [];

function recent(hits: number[] | undefined, windowMs: number, now: number): number[] {
  return (hits ?? []).filter((t) => now - t < windowMs);
}

/** Checks and records one send. Returns false when any limit is hit. */
export function consumePlanEmailQuota(ip: string, recipient: string): boolean {
  const now = Date.now();
  const key = recipient.toLowerCase();
  const byIp = recent(ipHits.get(ip), HOUR, now);
  const byRecipient = recent(recipientHits.get(key), DAY, now);
  globalHits = recent(globalHits, DAY, now);

  if (byIp.length >= PER_IP_HOURLY || byRecipient.length >= PER_RECIPIENT_DAILY || globalHits.length >= GLOBAL_DAILY) {
    return false;
  }
  ipHits.set(ip, [...byIp, now]);
  recipientHits.set(key, [...byRecipient, now]);
  globalHits.push(now);
  return true;
}

export type SendResult = { ok: true; id: string } | { ok: false; status: number; error: string };

export async function sendPlanEmail(payload: PlanEmailPayload, opts: { apiKey: string; from: string }): Promise<SendResult> {
  const { subject, html, text } = renderPlanEmail(payload);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${opts.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: opts.from, to: [payload.email], subject, html, text }),
  });
  const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!response.ok || !body.id) {
    return { ok: false, status: response.status, error: body.message ?? `Resend responded ${response.status}` };
  }
  return { ok: true, id: body.id };
}
