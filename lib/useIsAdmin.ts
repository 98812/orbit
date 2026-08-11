'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

export const ADMIN_EMAIL = 'aayushranamukti@gmail.com';

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!cancelled) setIsAdmin(!!user && user.email === ADMIN_EMAIL);
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  return isAdmin;
}
