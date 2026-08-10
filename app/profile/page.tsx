'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import ApprovalGate from '@/components/ApprovalGate';

const FIELDS = [
  ['full_name', 'Name', 'What everyone calls you'],
  ['goal', 'Goal', "What you're chasing right now"],
  ['mission', 'Mission', 'The bigger why'],
  ['qualification', 'Qualification', 'Studies, degrees, certs'],
  ['talent', 'Talent', "What you're weirdly good at"],
  ['bio', 'Bio', 'A line or two about you'],
  ['phone_number', 'Phone number', 'Only the group sees this'],
  ['contact_note', 'Other contact', 'Insta, Discord, whatever'],
] as const;

function ProfileInner() {
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

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
    setSaving(true);
    setSaved(false);

    const { id, email, approved, created_at, avatar_url, ...updates } = profile;
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);

    setSaving(false);
    if (error) {
      console.error('Failed to save:', error);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (!profile) {
    return (
      <div className="page">
        <div className="empty">
          <div className="empty-icon">👤</div>
          <p>Loading your profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <p className="eyebrow">your corner of the group</p>
      <h1>Your profile</h1>

      <form onSubmit={save}>
        {FIELDS.map(([key, label, hint]) => (
          <div key={key} className="field">
            <label htmlFor={key}>{label}</label>
            <input
              id={key}
              name={key}
              className="input"
              value={profile[key] || ''}
              placeholder={hint}
              onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
            />
          </div>
        ))}

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 24 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {saved && (
            <span className="pop" style={{ color: 'var(--lime)', fontWeight: 600, fontSize: 14 }}>
              ✓ Saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ApprovalGate>
      <ProfileInner />
    </ApprovalGate>
  );
}
