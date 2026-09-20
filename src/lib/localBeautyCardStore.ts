import type { Itinerary } from '../types';

export interface BeautyCardRequest {
  id: string;
  email: string;
  /** Copy of the plan at request time — what the email will be built from. */
  itinerary: Itinerary;
  createdAt: string;
  /** 'pending' until an email service is wired up (see services/beautyCard.ts). */
  status: 'pending' | 'sent';
}

const KEY = 'miyeon_beauty_card_requests';

export function readBeautyCardRequests(): BeautyCardRequest[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as BeautyCardRequest[]) : [];
  } catch {
    return [];
  }
}

export function saveBeautyCardRequest(request: BeautyCardRequest) {
  try {
    localStorage.setItem(KEY, JSON.stringify([request, ...readBeautyCardRequests()]));
  } catch {
    // private mode / quota — the caller still shows the confirmation for this session
  }
}
