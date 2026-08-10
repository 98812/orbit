'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

export default function ApprovalGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'signedout' | 'pending' | 'approved'>('loading');

  useEffect(() => {
    const supabase = createClient();
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStatus('signedout');
        return;
      }
      const { data } = await supabase.from('profiles').select('approved').eq('id', user.id).single();
      setStatus(data?.approved ? 'approved' : 'pending');
    }
    check();
  }, []);

  if (status === 'loading') {
    return (
      <div className="page">
        <div className="empty">
          <div className="empty-icon">🛰️</div>
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  if (status === 'signedout') {
    return (
      <div className="page">
        <div className="empty">
          <div className="empty-icon">🔒</div>
          <h2 style={{ marginBottom: 10 }}>You need to sign in</h2>
          <p className="muted" style={{ marginBottom: 24 }}>
            This space is private to the group.
          </p>
          <Link href="/" className="btn btn-primary">
            Go to sign in ↗
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="page">
        <div className="empty">
          <div className="empty-icon">⏳</div>
          <h2 style={{ marginBottom: 10 }}>Waiting for approval</h2>
          <p className="muted" style={{ lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
            You&apos;re signed in, but an admin has to let you into the group first. Once you&apos;re
            approved you&apos;ll have full access — you won&apos;t need to ask again.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
