import type { Itinerary } from '../types';
import { saveBeautyCardRequest, type BeautyCardRequest } from '../lib/localBeautyCardStore';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

/** Actually emails the Beauty Card. Not implemented yet — requests are only stored
 * (lib/localBeautyCardStore.ts). Wire an email service / Supabase Edge Function here
 * and flip the request's status to 'sent' once it succeeds. */
async function deliverBeautyCard(_request: BeautyCardRequest): Promise<void> {
  // TODO(email): send `request.itinerary` to `request.email`.
}

/** "Get my Beauty Card": remembers the email + plan, then hands off to delivery. */
export async function requestBeautyCard(email: string, itinerary: Itinerary): Promise<BeautyCardRequest> {
  const trimmed = email.trim();
  if (!isValidEmail(trimmed)) throw new Error('Please enter a valid email address.');

  const request: BeautyCardRequest = {
    id: `bc_${crypto.randomUUID()}`,
    email: trimmed,
    itinerary: JSON.parse(JSON.stringify(itinerary)) as Itinerary,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  saveBeautyCardRequest(request);
  await deliverBeautyCard(request);
  return request;
}
