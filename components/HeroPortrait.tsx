'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

export default function HeroPortrait() {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      if (!cancelled && data?.avatar_url) setUrl(data.avatar_url);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!url || failed) return null;

  return (
    <div className="hero-portrait" aria-hidden="true">
      <img
        src={url}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
