import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export const LIMITS = {
  guest: {
    lessons: 3, grammar: 3, goethe: 3,
    listening: 3, reading: 3, speaking: 3, writing: 3, ai: 0,
  },
  free: {
    lessons: Infinity, grammar: Infinity,
    goethe: 5, listening: 5, reading: 5, speaking: 5, writing: 2, ai: 5,
  },
  premium: {
    lessons: Infinity, grammar: Infinity, goethe: Infinity,
    listening: Infinity, reading: Infinity, speaking: Infinity,
    writing: Infinity, ai: Infinity,
  },
};

export function useRole() {
  const [state, setState] = useState({
    role: 'guest',
    userId: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session) {
        setState({ role: 'guest', userId: null, profile: null, loading: false });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      setState({
        role: profile?.is_premium ? 'premium' : 'free',
        userId: session.user.id,
        profile,
        loading: false,
      });
    }

    load();
  }, []);

  return state;
}