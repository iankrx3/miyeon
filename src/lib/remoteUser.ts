import { DEMO_USER } from '../services/auth';
import { supabase } from './supabase';

/** Google-authenticated users write through to Supabase. Demo / mock sessions
 * stay on localStorage so they never pollute the shared tables. */
export function isRemoteUser(userId?: string): boolean {
  return Boolean(supabase && userId && userId !== DEMO_USER.id && !userId.startsWith('mock-'));
}
