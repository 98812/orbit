'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import ApprovalGate from '@/components/ApprovalGate';
import Avatar from '@/components/Avatar';
import Link from 'next/link';

function MembersInner() {
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, goal, mission, qualification, talent, bio, phone_number, contact_note, approved')
        .eq('approved', true)
        .order('full_name', { ascending: true });

      setLoading(false);
      if (error) {
        console.error('Failed to load members:', error);
        return;
      }
      setPeople(data || []);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="empty">
          <div className="empty-icon">👥</div>
          <p>Loading the crew…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <p className="eyebrow">the crew</p>
      <h1>Members</h1>
      <p className="muted" style={{ marginTop: -8, marginBottom: 26 }}>
        {people.length} {people.length === 1 ? 'person' : 'people'} in the group
      </p>

      <div className="member-grid">
        {people.map((p) => (
          <button key={p.id} className="member-card" onClick={() => setOpen(p)}>
            <Avatar src={p.avatar_url} name={p.full_name} size={56} />
            <div className="member-name">{p.full_name || 'No name'}</div>
            {p.talent && <div className="member-tag">{p.talent}</div>}
            {p.bio && <p className="member-bio">{p.bio}</p>}
          </button>
        ))}
      </div>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setOpen(null)} aria-label="Close">
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <Avatar src={open.avatar_url} name={open.full_name} size={64} />
              <div>
                <h2 style={{ margin: 0 }}>{open.full_name || 'No name'}</h2>
                {open.talent && (
                  <div className="mono" style={{ fontSize: 12, color: 'var(--lime)', marginTop: 4 }}>
                    {open.talent}
                  </div>
                )}
              </div>
            </div>

            {[
              ['Bio', open.bio],
              ['Goal', open.goal],
              ['Mission', open.mission],
              ['Qualification', open.qualification],
              ['Phone', open.phone_number],
              ['Contact', open.contact_note],
            ]
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <div key={label as string} style={{ marginBottom: 14 }}>
                  <div
                    className="mono muted"
                    style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}
                  >
                    {label}
                  </div>
                  <div style={{ fontSize: 15, lineHeight: 1.5 }}>{value}</div>
                </div>
              ))}

            <Link href={`/messages/${open.id}`} className="btn btn-primary" style={{ marginBottom: 18 }}>
              ✉️ Message
            </Link>

            {!open.bio && !open.goal && !open.mission && !open.qualification && (
              <p className="muted" style={{ fontSize: 14 }}>
                This one hasn&apos;t filled in their profile yet.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MembersPage() {
  return (
    <ApprovalGate>
      <MembersInner />
    </ApprovalGate>
  );
}
