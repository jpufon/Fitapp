import { useEffect, useState } from 'react';
import type { AuthenticatedUser } from '../utils/supabase';
import { hasSupabaseConfig, supabase } from '../utils/supabase';
import { getCachedJson, setCachedJson } from '../lib/storage';

const guestUser = {
  id: 'guest-user',
  app_metadata: {},
  user_metadata: {
    displayName: 'Athlete',
  },
  aud: 'authenticated',
  created_at: new Date(0).toISOString(),
  email: 'athlete@local.dev',
} as AuthenticatedUser;

const USER_CACHE_KEY = 'profile.user';

type UseUserState = {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  error: Error | null;
  isOfflineFallback: boolean;
};

export function useUser(): UseUserState {
  const [state, setState] = useState<UseUserState>(() => ({
    user: getCachedJson<AuthenticatedUser>(USER_CACHE_KEY),
    isLoading: true,
    error: null,
    isOfflineFallback: false,
  }));

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setState({
        user: guestUser,
        isLoading: false,
        error: null,
        isOfflineFallback: false,
      });
      return;
    }

    const client = supabase;
    let active = true;

    const loadUser = async () => {
      try {
        const { data, error } = await client.auth.getUser();
        if (!active) {
          return;
        }

        setState({
          user: data.user ?? null,
          isLoading: false,
          error: error ?? null,
          isOfflineFallback: false,
        });
        if (data.user) {
          setCachedJson(USER_CACHE_KEY, data.user);
        }
      } catch (error) {
        if (!active) {
          return;
        }

        const cached = getCachedJson<AuthenticatedUser>(USER_CACHE_KEY);
        setState({
          user: cached,
          isLoading: false,
          error: cached ? null : error instanceof Error ? error : new Error('Failed to load user.'),
          isOfflineFallback: Boolean(cached),
        });
      }
    };

    void loadUser();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) {
        return;
      }

      setState((current) => ({
        ...current,
        user: session?.user ?? null,
        isLoading: false,
        error: null,
        isOfflineFallback: false,
      }));
      if (session?.user) {
        setCachedJson(USER_CACHE_KEY, session.user);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
