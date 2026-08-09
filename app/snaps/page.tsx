'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

const EMOJIS = ['🔥', '😂', '😍', '👀', '💀', '🫡', '🙏', '😟', '🖕', '🤟', '🤙'];

export default function SnapsPage() {
  const [snaps, setSnaps] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      const { data, error } = await supabase
        .from('snaps')
        .select('*, profiles(full_name), reactions(emoji, user_id)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load snaps:', error);
        return;
      }
      setSnaps(data || []);
    }
    init();
  }, []);

  async function uploadSnap(e: React.ChangeEvent<HTMLInputElement>) {
    let file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploading(true);

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
        const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
        file = new File([blob], newName, { type: 'image/jpeg' });
      } catch (err) {
        console.error('HEIC conversion failed:', err);
        setUploading(false);
        return;
      }
    }

    const path = `${userId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('snaps').upload(path, file);
    if (uploadError) {
      console.error('Upload failed:', uploadError);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('snaps').getPublicUrl(path);

    const { data, error } = await supabase
      .from('snaps')
      .insert({ user_id: userId, image_url: urlData.publicUrl })
      .select('*, profiles(full_name), reactions(emoji, user_id)')
      .single();

    setUploading(false);

    if (error) {
      console.error('Failed to save snap:', error);
      return;
    }

    setSnaps((prev) => [data, ...prev]);
    e.target.value = '';
  }

  async function react(snapId: string, emoji: string) {
    if (!userId) return;
    const { error } = await supabase.from('reactions').insert({ snap_id: snapId, user_id: userId, emoji });
    if (error) {
      console.error('Failed to react:', error);
      return;
    }
    setSnaps((prev) =>
      prev.map((s) =>
        s.id === snapId ? { ...s, reactions: [...(s.reactions || []), { emoji, user_id: userId }] } : s
      )
    );
  }

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
      <h1>Snaps</h1>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <label style={{ padding: '10px 16px', background: '#111', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
          📷 Take Photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={uploadSnap}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
        <label style={{ padding: '10px 16px', background: '#eee', color: '#111', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
          🖼️ Choose from Library
          <input
            type="file"
            accept="image/*,.heic,.heif"
            onChange={uploadSnap}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {uploading && <p>Uploading…</p>}
      {snaps.length === 0 && !uploading && <p style={{ color: '#888' }}>No snaps yet — upload one.</p>}
      {snaps.map((snap) => (
        <div key={snap.id} style={{ marginBottom: 24, border: '1px solid #ddd', borderRadius: 12, overflow: 'hidden' }}>
          <img src={snap.image_url} alt={`Snap from ${snap.profiles?.full_name || 'a friend'}`} style={{ width: '100%', display: 'block' }} />
          <div style={{ padding: 12 }}>
            <p style={{ margin: '0 0 8px' }}>{snap.profiles?.full_name || 'friend'}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {EMOJIS.map((emoji) => (
                <button key={emoji} onClick={() => react(snap.id, emoji)} style={{ fontSize: 18 }}>
                  {emoji} {(snap.reactions || []).filter((r: any) => r.emoji === emoji).length || ''}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
    </main>
  );
}
