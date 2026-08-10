'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import ApprovalGate from '@/components/ApprovalGate';
import Avatar from '@/components/Avatar';

function timeAgo(ts: string) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(ts).toLocaleDateString([], { day: 'numeric', month: 'short' });
}

function InboxInner() {
  const [threads, setThreads] = useState<any[]>([]);
  const [everyone, setEveryone] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: dms }, { data: profs }] = await Promise.all([
        supabase
          .from('direct_messages')
          .select('*')
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(300),
        supabase
          .from('profiles')
          .select('id, full_name, avatar_url, talent')
          .eq('approved', true)
          .neq('id', user.id)
          .order('full_name'),
      ]);

      setEveryone(profs || []);

      const byPerson: Record<string, any> = {};
      (dms || []).forEach((m: any) => {
        const other = m.sender_id === user.id ? m.recipient_id : m.sender_id;
        if (!byPerson[other]) {
          byPerson[other] = { other, last: m, unread: 0 };
        }
        if (m.recipient_id === user.id && !m.read_at) {
          byPerson[other].unread += 1;
        }
      });

      const profMap: Record<string, any> = {};
      (profs || []).forEach((p: any) => (profMap[p.id] = p));

      const list = Object.values(byPerson)
        .map((t: any) => ({ ...t, person: profMap[t.other] }))
        .filter((t: any) => t.person)
        .sort(
          (a: any, b: any) =>
            new Date(b.last.created_at).getTime() - new Date(a.last.created_at).getTime()
        );

      setThreads(list);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = everyone.filter((p) =>
    (p.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="page">
        <div className="empty">
          <div className="empty-icon">✉️</div>
          <p>Loading messages…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <p className="eyebrow">just between you two</p>
          <h1>Messages</h1>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowNew((s) => !s)}>
          {showNew ? 'Close' : '+ New'}
        </button>
      </div>

      {showNew && (
        <div className="card" style={{ marginBottom: 20 }}>
          <input
            className="input"
            placeholder="Search people…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          {filtered.length === 0 && <p className="muted" style={{ fontSize: 14 }}>Nobody found.</p>}
          {filtered.map((p) => (
            <Link key={p.id} href={`/messages/${p.id}`} className="thread-row">
              <Avatar src={p.avatar_url} name={p.full_name} size={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="thread-name">{p.full_name || 'friend'}</div>
                {p.talent && <div className="thread-preview muted">{p.talent}</div>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {threads.length === 0 && !showNew && (
        <div className="empty">
          <div className="empty-icon">💌</div>
          <p>No conversations yet.</p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={() => setShowNew(true)}>
            Start one
          </button>
        </div>
      )}

      {threads.map((t) => (
        <Link key={t.other} href={`/messages/${t.other}`} className="thread-row card">
          <Avatar src={t.person.avatar_url} name={t.person.full_name} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="thread-name">{t.person.full_name || 'friend'}</div>
            <div className="thread-preview muted">{t.last.content}</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div className="mono muted" style={{ fontSize: 11 }}>
              {timeAgo(t.last.created_at)}
            </div>
            {t.unread > 0 && <span className="badge" style={{ marginTop: 5 }}>{t.unread}</span>}
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <ApprovalGate>
      <InboxInner />
    </ApprovalGate>
  );
}
