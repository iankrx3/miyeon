import { useEffect, useState } from 'react';
import type { Creator, UserSession } from '../types';
import { supabase } from '../lib/supabase/client';
import {
  buildUserSession,
  consumeReturnTab,
  loadMockSession,
  signInAsDemo as authSignInAsDemo,
  signOut as authSignOut,
} from '../services/auth';
import { mergeLocalCreator } from '../lib/storage/localCuratorStore';

export function useAuth() {
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<UserSession>({ isLoggedIn: false });
  const [returnTab, setReturnTab] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setSession(mergeLocalCreator(loadMockSession() ?? { isLoggedIn: false }));
      setAuthReady(true);
      return;
    }

    let mounted = true;
    const isAuthCallback =
      new URLSearchParams(window.location.search).has('code') ||
      window.location.hash.includes('access_token');

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const next = await buildUserSession(data.session?.user ?? null);
      if (next.isLoggedIn) {
        setSession(mergeLocalCreator(next));
        const tab = consumeReturnTab();
        if (tab) setReturnTab(tab);
        setAuthReady(true);
        return;
      }
      setSession(mergeLocalCreator(loadMockSession() ?? { isLoggedIn: false }));
      if (!isAuthCallback) setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, authSession) => {
      if (event === 'SIGNED_OUT' || !authSession?.user) {
        if (event === 'INITIAL_SESSION' && isAuthCallback) return;
        setSession(
          event === 'SIGNED_OUT' ? { isLoggedIn: false } : mergeLocalCreator(loadMockSession() ?? { isLoggedIn: false })
        );
        setAuthReady(true);
        return;
      }

      void buildUserSession(authSession.user).then((next) => {
        if (!mounted) return;
        setSession(mergeLocalCreator(next));
        if (event === 'SIGNED_IN') {
          const tab = consumeReturnTab();
          if (tab) setReturnTab(tab);
        }
        setAuthReady(true);
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInAsDemo = () => {
    setSession(mergeLocalCreator(authSignInAsDemo()));
  };

  const signOut = async () => {
    await authSignOut();
    setSession({ isLoggedIn: false });
  };

  const onCreatorUpdated = (creator: Creator) => {
    setSession((prev) => ({ ...prev, creator }));
  };

  return {
    authReady,
    session,
    returnTab,
    setSession,
    signOut,
    signInAsDemo,
    onCreatorUpdated,
  };
}
