import type { User } from '@supabase/supabase-js';
import { Creator, UserSession } from '../types';
import { mapAuthSession } from '../lib/mappers';
import { isSupabaseConfigured, requireSupabase, supabase } from '../lib/supabase/client';
import { fetchCreatorByUserId } from './places/places';

export { isSupabaseConfigured };

const RETURN_TAB_KEY = 'miyeon_auth_return_tab';
const MOCK_SESSION_KEY = 'miyeon_mock_session';

export const DEMO_USER: NonNullable<UserSession['user']> = {
  id: 'mock-user',
  google_id: 'mock-google',
  email: 'demo@miyeon.app',
  name: 'Miyeon Demo',
  avatar_url: 'https://ui-avatars.com/api/?name=Miyeon+Demo&background=D49A9A&color=fff',
};

export type AuthReturnTab = 'explore' | 'map' | 'community' | string;

export function rememberReturnTab(tab: AuthReturnTab) {
  sessionStorage.setItem(RETURN_TAB_KEY, tab);
}

export function consumeReturnTab(): AuthReturnTab | null {
  const tab = sessionStorage.getItem(RETURN_TAB_KEY);
  sessionStorage.removeItem(RETURN_TAB_KEY);
  return tab;
}

export async function signInWithGoogle(returnTab: AuthReturnTab = 'explore') {
  const client = requireSupabase();
  rememberReturnTab(returnTab);
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`,
      queryParams: {
        prompt: 'select_account',
      },
    },
  });
  if (error) throw error;
}

export function signInAsDemo(): UserSession {
  const session: UserSession = { isLoggedIn: true, user: DEMO_USER };
  try {
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
  } catch {
    // private mode / quota — session still works for this tab
  }
  return session;
}

export function loadMockSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(MOCK_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserSession;
    if (parsed?.isLoggedIn && parsed.user?.id) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function clearMockSession() {
  try {
    localStorage.removeItem(MOCK_SESSION_KEY);
  } catch {
    // ignore
  }
}

export async function signOut() {
  clearMockSession();
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function buildUserSession(user: User | null): Promise<UserSession> {
  if (!user) return { isLoggedIn: false };
  let creator: Creator | null = null;
  try {
    creator = await fetchCreatorByUserId(user.id);
  } catch (err) {
    console.warn('buildUserSession: fetchCreatorByUserId failed, treating user as non-curator', err);
    creator = null;
  }
  return mapAuthSession(user, creator);
}
