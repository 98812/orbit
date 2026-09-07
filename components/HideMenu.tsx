'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

export default function HideMenu({
  contentType,
  contentId,
  onClose,
}: {
  contentType: 'snap' | 'message';
  contentId: string;
  onClose: () => void;
}) {
  const [people, setPeople] = useState<any[]>([]);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();

      const [{ data: profs }, { data: hides }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('approved', true)
          .order('full_name'),
        supabase
          .from('content_hides')
          .select('hidden_from')
          .eq('content_type', contentType)
          .eq('content_id', contentId),
      ]);

      setPeople((profs || []).filter((p: any) => p.id !== user?.id));
      setHidden(new Set((hides || []).map((h: any) => h.hidden_from)));
      setLoading(false);
    }
    load();
  }, [contentId, contentType]);

  async function toggle(personId: string) {
    setBusy(personId);
    const isHidden = hidden.has(personId);

    if (isHidden) {
      const { error } = await supabase
        .from('content_hides')
        .delete()
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('hidden_from', personId);
      if (!error) {
        setHidden((prev) => {
          const next = new Set(prev);
          next.delete(personId);
          return next;
        });
      } else {
        console.error('Unhide failed:', error);
      }
    } else {
      const { error } = await supabase.from('content_hides').insert({
        content_type: contentType,
        content_id: contentId,
        hidden_from: personId,
      });
      if (!error) {
        setHidden((prev) => new Set(prev).add(personId));
      } else {
        console.error('Hide failed:', error);
      }
    }
    setBusy(null);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal hide-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <h2 style={{ margin: '0 0 6px', fontSize: 19 }}>Hide from</h2>
        <p className="muted" style={{ fontSize: 13, marginTop: 0, marginBottom: 18 }}>
          Anyone toggled on won&apos;t see this.
        </p>

        {loading && <p className="muted">Loading…</p>}

        {!loading &&
          people.map((p) => {
            const isHidden = hidden.has(p.id);
            return (
              <button
                key={p.id}
                className={`hide-row ${isHidden ? 'on' : ''}`}
                onClick={() => toggle(p.id)}
                disabled={busy === p.id}
              >
                <span className="hide-name">{p.full_name || 'friend'}</span>
                <span className="hide-state mono">
                  {busy === p.id ? '…' : isHidden ? 'HIDDEN' : 'visible'}
                </span>
              </button>
            );
          })}

        {!loading && people.length === 0 && (
          <p className="muted" style={{ fontSize: 14 }}>No other members yet.</p>
        )}
      </div>
    </div>
  );
}
