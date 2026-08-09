'use client';

import GoogleSignInButton from '@/components/GoogleSignInButton';

export default function HomePage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#14121F',
      color: '#F5F3FF',
      fontFamily: 'sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: 24,
    }}>
      <p style={{
        fontFamily: 'monospace',
        color: '#C6FF3D',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontSize: 13,
        marginBottom: 16,
      }}>
        for your actual friends, not your whole timeline
      </p>
      <h1 style={{ fontSize: 56, fontWeight: 800, margin: '0 0 20px', lineHeight: 1 }}>
        Never fall out of <span style={{ color: '#FF2E93' }}>orbit</span>.
      </h1>
      <p style={{ color: '#B9B3D6', maxWidth: 480, marginBottom: 32, fontSize: 18 }}>
        Profiles, group chat, and Snaps with reactions — one private space, just for your group.
      </p>
      <GoogleSignInButton />
    </main>
  );
}
