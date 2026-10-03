import type { Itinerary } from '../../types';
import { EMAIL_RE, type PlanEmailPayload } from '../../../shared/planEmail';
import { saveBeautyCardRequest, markBeautyCardSent, type BeautyCardRequest } from '../../lib/storage/localBeautyCardStore';
import { tripDaysLabel } from '../../data/glowUpQuiz';
import { cityLabel } from './routines';

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

/** The trimmed plan the /api/plan-email function renders into the email. */
function toPlanEmailPayload(email: string, itinerary: Itinerary): PlanEmailPayload {
  const profile = itinerary.glowUpSnapshot;
  return {
    email,
    city: profile ? cityLabel(profile) : 'Seoul',
    tripDays: tripDaysLabel(profile?.tripDays ?? null),
    routines: (itinerary.glowUpV2?.routines ?? []).map((r) => ({
      title: r.title,
      promise: r.promise,
      timing: r.timing,
      totalMinutes: r.totalMinutes,
      stops: r.stops.map((s) => ({
        name: s.place.name,
        branch: s.place.branch,
        startTime: s.startTime,
        addressEn: s.place.addressEn,
        subway: s.place.subway,
        hint: s.hint,
        bookingUrl: s.place.bookingUrl || null,
        priceFromUsd: s.place.priceFromUsd,
      })),
    })),
  };
}

/** Emails the plan through /api/plan-email (Resend). Errors are user-facing and translated by the form. */
async function deliverBeautyCard(request: BeautyCardRequest): Promise<void> {
  let response: Response;
  try {
    response = await fetch('/api/plan-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toPlanEmailPayload(request.email, request.itinerary)),
    });
  } catch {
    throw new Error("Couldn't send the email. Check your connection and try again.");
  }
  if (response.status === 429) throw new Error('Too many requests — please try again later.');
  if (!response.ok) throw new Error("Couldn't send the email. Please try again.");
  markBeautyCardSent(request.id);
}

/** "Email me my plan": remembers the email + plan, then sends it. */
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
