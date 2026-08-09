'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

export default function ProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
    }
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    await supabase.from('profiles').update(profile).eq('id', profile.id);
    setSaved(true);
  }

  if (!profile) return <p>Loading your profile…</p>;

  const fields = [
    ['full_name', 'Name'],
    ['goal', 'Goal'],
    ['mission', 'Mission'],
    ['qualification', 'Qualification'],
    ['talent', 'Talent'],
    ['bio', 'Bio'],
    ['phone_number', 'Phone number'],
    ['contact_note', 'Other contact info'],
  ] as const;

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: 40 }}>
      <h1>Your profile</h1>
      <form onSubmit={save}>
        {fields.map(([key, label]) => (
          <div key={key} style={{ marginBottom: 16 }}>
            <label htmlFor={key}>{label}</label>
            <input
              id={key}
              value={profile[key] || ''}
              onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
        ))}
        <button type="submit" className="btn btn-primary">Save changes</button>
        {saved && <p>Saved.</p>}
      </form>
    </main>
  );
}
