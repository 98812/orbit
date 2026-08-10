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
    return (
      <div className="page">
        <div className="empty">
          <div className="empty-icon">🛠️</div>
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="page">
        <div className="empty">
          <div className="empty-icon">⛔</div>
          <h2 style={{ marginBottom: 8 }}>Not authorised</h2>
          <p className="muted">Only the group admin can see this page.</p>
        </div>
      </div>
    );
  }

  const pending = people.filter((p) => !p.approved);
  const approved = people.filter((p) => p.approved);

  return (
    <div className="page">
      <p className="eyebrow">who gets in</p>
      <h1>Manage members</h1>

      <h2 style={{ marginTop: 32, marginBottom: 14 }}>
        Waiting for approval{' '}
        <span style={{ color: pending.length ? 'var(--pink)' : 'var(--cloud-dim)' }}>
          ({pending.length})
        </span>
      </h2>

      {pending.length === 0 && <p className="muted">Nobody waiting right now.</p>}

      {pending.map((p) => (
        <div
          key={p.id}
          className="card pop"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
        >
          <div>
            <div style={{ fontWeight: 700 }}>{p.full_name || 'No name'}</div>
            <div className="mono muted" style={{ fontSize: 12, marginTop: 3 }}>
              {p.email}
            </div>
          </div>
          <button onClick={() => setApproval(p.id, true)} className="btn btn-primary btn-sm">
            Approve
          </button>
        </div>
      ))}

      <h2 style={{ marginTop: 36, marginBottom: 14 }}>
        Approved members <span className="muted">({approved.length})</span>
      </h2>

      {approved.map((p) => (
        <div
          key={p.id}
          className="card"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
        >
          <div>
            <div style={{ fontWeight: 700 }}>
              {p.full_name || 'No name'}
              {p.email === ADMIN_EMAIL && (
                <span
                  className="mono"
                  style={{
                    marginLeft: 8,
                    fontSize: 10,
                    padding: '2px 7px',
                    borderRadius: 999,
                    background: 'rgba(198,255,61,0.14)',
                    color: 'var(--lime)',
                  }}
                >
                  ADMIN
                </span>
              )}
            </div>
            <div className="mono muted" style={{ fontSize: 12, marginTop: 3 }}>
              {p.email}
            </div>
          </div>
          {p.email !== ADMIN_EMAIL && (
            <button
              onClick={() => setApproval(p.id, false)}
              className="btn btn-sm"
              style={{ background: 'transparent', color: '#FF6B6B', border: '1.5px solid rgba(255,107,107,0.4)' }}
            >
              Remove
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
