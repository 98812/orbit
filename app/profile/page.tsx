'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import ApprovalGate from '@/components/ApprovalGate';
import { sendPush } from '@/lib/push';
import Avatar from '@/components/Avatar';

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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [signingOut, setSigningOut] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
    }
    load();
  }, []);

  async function changePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    let file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploadingPhoto(true);

    const isHeic =
      file.type === 'image/heic' ||
      file.type === 'image/heif' ||
      file.name.toLowerCase().endsWith('.heic') ||
      file.name.toLowerCase().endsWith('.heif');

    if (isHeic) {
      try {
        const heic2any = (await import('heic2any')).default;
        const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
        const blob = Array.isArray(converted) ? converted[0] : converted;
        file = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
      } catch (err) {
        console.error('HEIC conversion failed:', err);
        setUploadingPhoto(false);
        alert('That photo format could not be read. Try a JPG or PNG.');
        return;
      }
    }

    const path = `avatars/${profile.id}-${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from('snaps').upload(path, file, { upsert: true });
    if (upErr) {
      console.error('Avatar upload failed:', upErr);
      setUploadingPhoto(false);
      alert('Could not upload that photo.');
      return;
    }

    const { data: urlData } = supabase.storage.from('snaps').getPublicUrl(path);
    const newUrl = urlData.publicUrl;

    const { error } = await supabase.from('profiles').update({ avatar_url: newUrl }).eq('id', profile.id);
    setUploadingPhoto(false);

    if (error) {
      console.error('Failed to save avatar:', error);
      return;
    }

    setProfile({ ...profile, avatar_url: newUrl });
    window.dispatchEvent(new CustomEvent('genz-avatar-updated', { detail: newUrl }));
    if (fileRef.current) fileRef.current.value = '';
  }

  async function signOut() {
    if (!confirm('Sign out of Gen-Z?')) return;
    setSigningOut(true);

    try {
      // stamp the departure so the admin page can show it
      await supabase
        .from('profiles')
        .update({ left_at: new Date().toISOString() })
        .eq('id', profile.id);

      // tell the admin someone left
      const { data: admins } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', 'aayushranamukti@gmail.com');

      const adminIds = (admins || [])
        .map((a: any) => a.id)
        .filter((id: string) => id !== profile.id);

      if (adminIds.length) {
        await sendPush({
          recipientIds: adminIds,
          title: 'Someone signed out',
          message: (profile.full_name || 'A member') + ' signed out of Gen-Z',
          url: '/admin',
          tag: 'signout',
          senderId: profile.id,
        });
      }
    } catch (err) {
      console.error('Sign-out bookkeeping failed:', err);
    }

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }

    router.push('/');
    router.refresh();
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setSaved(false);

    const { id, email, approved, created_at, ...updates } = profile;
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

      <div className="avatar-editor">
        <div className="avatar-editor-pic">
          <Avatar src={profile.avatar_url} name={profile.full_name} size={84} />
          {uploadingPhoto && <div className="avatar-uploading">…</div>}
        </div>
        <div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploadingPhoto}
          >
            {uploadingPhoto ? 'Uploading…' : profile.avatar_url ? 'Change photo' : 'Add photo'}
          </button>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 8, marginBottom: 0 }}>
            Pick one from your gallery — everyone in the group will see it.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.heic,.heif"
            onChange={changePhoto}
            style={{ display: 'none' }}
          />
        </div>
      </div>

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

      <div className="signout-row">
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Signed in</div>
          {profile.email && (
            <div className="mono muted" style={{ fontSize: 12, marginTop: 3 }}>
              {profile.email}
            </div>
          )}
        </div>
        <button type="button" className="btn btn-danger btn-sm" onClick={signOut} disabled={signingOut}>
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
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
