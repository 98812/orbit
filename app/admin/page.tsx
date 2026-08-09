'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

const ADMIN_EMAIL = 'aayushranamukti@gmail.com';

export default function AdminPage() {
  const [people, setPeople] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) {
        setIsAdmin(false);
        return;
      }
      setIsAdmin(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load people:', error);
        return;
      }
      setPeople(data || []);
    }
    load();
  }, []);

  async function setApproval(id: string, approved: boolean) {
    const { error } = await supabase.from('profiles').update({ approved }).eq('id', id);
    if (error) {
      console.error('Failed to update:', error);
      return;
    }
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, approved } : p)));
  }

  if (isAdmin === null) {
    return <main style={{ padding: 40, fontFamily: 'sans-serif' }}><p>Loading…</p></main>;
  }

  if (!isAdmin) {
    return (
      <main style={{ padding: 40, fontFamily: 'sans-serif', textAlign: 'center' }}>
        <h2>Not authorised</h2>
        <p style={{ color: '#666' }}>Only the group admin can see this page.</p>
      </main>
    );
  }

  const pending = people.filter((p) => !p.approved);
  const approved = people.filter((p) => p.approved);

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Manage members</h1>

      <h2 style={{ fontSize: 18, marginTop: 28 }}>Waiting for approval ({pending.length})</h2>
      {pending.length === 0 && <p style={{ color: '#888' }}>Nobody waiting right now.</p>}
      {pending.map((p) => (
        <div
          key={p.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            padding: '12px 14px',
            border: '1px solid #ddd',
            borderRadius: 10,
            marginBottom: 10,
          }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>{p.full_name || 'No name'}</div>
            <div style={{ fontSize: 13, color: '#666' }}>{p.email}</div>
          </div>
          <button
            onClick={() => setApproval(p.id, true)}
            style={{ padding: '8px 16px', background: '#111', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            Approve
          </button>
        </div>
      ))}

      <h2 style={{ fontSize: 18, marginTop: 32 }}>Approved members ({approved.length})</h2>
      {approved.map((p) => (
        <div
          key={p.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            padding: '12px 14px',
            border: '1px solid #eee',
            borderRadius: 10,
            marginBottom: 10,
          }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>{p.full_name || 'No name'}</div>
            <div style={{ fontSize: 13, color: '#666' }}>{p.email}</div>
          </div>
          {p.email !== ADMIN_EMAIL && (
            <button
              onClick={() => setApproval(p.id, false)}
              style={{ padding: '8px 16px', background: '#fff', color: '#c00', border: '1px solid #c00', borderRadius: 8, cursor: 'pointer' }}
            >
              Remove
            </button>
          )}
        </div>
      ))}
    </main>
  );
}
