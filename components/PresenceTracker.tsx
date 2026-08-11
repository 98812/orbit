'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase';

// how often to refresh last_seen while the app stays open (1 minute)
const INTERVAL_MS = 60 * 1000;

export default function PresenceTracker() {
  useEffect(() => {
    const supabase = createClient();
    let timer: any;
    let cancelled = false;

    async function touch() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        await supabase.rpc('touch_last_seen');
      } catch (err) {
        // presence is best-effort; never break the app over it
        console.debug('presence update skipped', err);
      }
    }

    touch();
    timer = setInterval(touch, INTERVAL_MS);

    function onVisible() {
      if (document.visibilityState === 'visible') touch();
    }

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);

  return null;
}
