'use client';

import { createClient } from '@/lib/supabase';

export default function GoogleSignInButton() {
  const supabase = createClient();

  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  return (
    <button onClick={signIn} className="btn btn-primary">
      Sign in with Google
    </button>
  );
}
