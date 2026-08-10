'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import GoogleSignInButton from '@/components/GoogleSignInButton';

export default function HomePage() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [name, setName] = useState<string>('');

  useEffect(() => {
    const supabase = createClient();
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      setSignedIn(!!user);
      if (user) {
        const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        setName(data?.full_name?.split(' ')[0] || '');
      }
    }
    check();
  }, []);

  return (
    <main
      style={{
        minHeight: 'calc(100vh - 62px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: 520,
          height: 520,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,46,147,0.16), transparent 68%)',
          top: '-10%',
          filter: 'blur(20px)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: 420,
          height: 420,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(123,47,247,0.18), transparent 68%)',
          bottom: '-14%',
          right: '-8%',
          filter: 'blur(24px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 560 }}>
        <p className="eyebrow rise" style={{ animationDelay: '0.05s' }}>
          for your actual friends, not your whole timeline
        </p>

        <h1
          className="rise"
          style={{ fontSize: 'clamp(38px, 8vw, 68px)', lineHeight: 1, marginBottom: 20, animationDelay: '0.15s' }}
        >
          {signedIn && name ? (
            <>
              Welcome back,
              <br />
              <span style={{ color: 'var(--pink)' }}>{name}</span>.
            </>
          ) : (
            <>
              Never fall out of <span style={{ color: 'var(--pink)' }}>orbit</span>.
            </>
          )}
        </h1>

        <p
          className="muted rise"
          style={{ fontSize: 17, lineHeight: 1.6, marginBottom: 32, animationDelay: '0.25s' }}
        >
          Profiles, group chat, and Snaps with reactions — one private space, just for the group.
        </p>

        <div
          className="rise"
          style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', animationDelay: '0.35s' }}
        >
          {signedIn === null ? null : signedIn ? (
            <>
              <Link href="/chat" className="btn btn-primary">
                Open chat ↗
              </Link>
              <Link href="/snaps" className="btn btn-ghost">
                See Snaps
              </Link>
            </>
          ) : (
            <GoogleSignInButton />
          )}
        </div>
      </div>
    </main>
  );
}
