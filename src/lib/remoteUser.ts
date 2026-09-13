import { DEMO_USER } from '../services/auth';
import { supabase } from './supabase';

/** Google-authenticated users write through to Supabase. Demo / mock sessions
 * stay on localStorage so they never pollute the shared tables. */
export function isRemoteUser(userId?: string): boolean {
  return Boolean(supabase && userId && userId !== DEMO_USER.id && !userId.startsWith('mock-'));
}

/** Same client as inserts. Null if there is no Google session to send with the request. */
export async function getAuthedSupabase() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) console.warn('getAuthedSupabase: getSession failed', error);
  if (!data.session) return null;
  return supabase;
}
