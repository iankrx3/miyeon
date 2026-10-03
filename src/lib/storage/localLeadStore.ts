export interface LocalLead {
  id: string;
  email: string;
  tripDate: string | null;
  category: string | null;
  concerns: string[];
  vibes: string[];
  topTreatmentId: string | null;
  createdAt: string;
}

// Fallback persistence for the §02-9 email-capture card when Supabase isn't configured, or the
// insert fails. Mirrors localCommunityStore.ts's pattern.
const LEADS_KEY = 'miyeon_local_leads';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode / quota — write still applies for this tab's in-memory state
  }
}

export function readLocalLeads(): LocalLead[] {
  return readJson<LocalLead[]>(LEADS_KEY, []);
}

export function saveLocalLead(lead: LocalLead) {
  writeJson(LEADS_KEY, [lead, ...readLocalLeads()]);
}
