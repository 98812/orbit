'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import Avatar from '@/components/Avatar';

const ADMIN_EMAIL = 'aayushranamukti@gmail.com';

function lastSeenLabel(ts: string | null) {
  if (!ts) return 'never opened';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'online now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function staleness(ts: string | null) {
  if (!ts) return 'cold';
  const days = (Date.now() - new Date(ts).getTime()) / 86400000;
  if (days < 0.05) return 'live';
  if (days < 3) return 'warm';
  if (days < 14) return 'cool';
  return 'cold';
}

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
        .select('id, full_name, email, approved, avatar_url, last_seen, left_at')
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

  // approved members sorted by most inactive first
  const approved = people
    .filter((p) => p.approved)
    .sort((a, b) => {
      const at = a.last_seen ? new Date(a.last_seen).getTime() : 0;
      const bt = b.last_seen ? new Date(b.last_seen).getTime() : 0;
      return at - bt;
    });

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
        <div key={p.id} className="card pop admin-row">
          <Avatar src={p.avatar_url} name={p.full_name} size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
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

      <h2 style={{ marginTop: 36, marginBottom: 6 }}>
        Approved members <span className="muted">({approved.length})</span>
      </h2>
      <p className="muted" style={{ fontSize: 13, marginTop: 0, marginBottom: 14 }}>
        Sorted by least recently active.
      </p>

      {approved.map((p) => (
        <div key={p.id} className="card admin-row">
          <Avatar src={p.avatar_url} name={p.full_name} size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700 }}>
              {p.full_name || 'No name'}
              {p.email === ADMIN_EMAIL && (
                <span className="mono admin-tag">ADMIN</span>
              )}
            </div>
            <div className="mono muted" style={{ fontSize: 12, marginTop: 3 }}>
              {p.email}
            </div>
            <div className="seen-row">
              <span className={`seen-dot ${staleness(p.last_seen)}`} />
              <span className="mono" style={{ fontSize: 11 }}>
                {lastSeenLabel(p.last_seen)}
              </span>
              {p.left_at &&
                (!p.last_seen || new Date(p.left_at) > new Date(p.last_seen)) && (
                  <span className="left-tag mono">signed out</span>
                )}
            </div>
          </div>
          {p.email !== ADMIN_EMAIL && (
            <button onClick={() => setApproval(p.id, false)} className="btn btn-sm btn-danger">
              Remove
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
