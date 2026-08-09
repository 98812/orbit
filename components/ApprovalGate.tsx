'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

export default function ApprovalGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'signedout' | 'pending' | 'approved'>('loading');
  const supabase = createClient();

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStatus('signedout');
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('approved')
        .eq('id', user.id)
        .single();

      setStatus(data?.approved ? 'approved' : 'pending');
    }
    check();
  }, []);

  if (status === 'loading') {
    return (
      <main style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>
        <p>Loading…</p>
      </main>
    );
  }

  if (status === 'signedout') {
    return (
      <main style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h2>You need to sign in</h2>
        <p>
          <a href="/" style={{ color: '#FF2E93' }}>Go to the home page to sign in</a>
        </p>
      </main>
    );
  }

  if (status === 'pending') {
    return (
      <main style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <h2 style={{ marginBottom: 12 }}>Waiting for approval</h2>
        <p style={{ color: '#666', lineHeight: 1.6 }}>
          You&apos;re signed in, but an admin needs to let you into the group first.
          Once you&apos;re approved, you&apos;ll have full access — no need to ask again.
        </p>
      </main>
    );
  }

  return <>{children}</>;
}
