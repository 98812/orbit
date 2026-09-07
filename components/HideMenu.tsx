'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { createPortal } from 'react-dom';

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
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        const { data: profs, error: pErr } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, approved')
          .order('full_name');

        if (pErr) throw new Error('profiles: ' + pErr.message);

        const { data: hides, error: hErr } = await supabase
          .from('content_hides')
          .select('hidden_from')
          .eq('content_type', contentType)
          .eq('content_id', contentId);

        if (hErr) throw new Error('hides: ' + hErr.message);

        if (cancelled) return;

        const others = (profs || [])
          .filter((p: any) => p.approved !== false)
          .filter((p: any) => p.id !== user?.id);

        setPeople(others);
        setHidden(new Set((hides || []).map((h: any) => h.hidden_from)));
        setLoading(false);
      } catch (e: any) {
        console.error('HideMenu load failed:', e);
        if (!cancelled) {
          setErr(e?.message || 'Something went wrong.');
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [contentId, contentType]);

  async function toggle(personId: string) {
    setBusy(personId);
    setErr(null);
    const isHidden = hidden.has(personId);

    try {
      if (isHidden) {
        const { error } = await supabase
          .from('content_hides')
          .delete()
          .eq('content_type', contentType)
          .eq('content_id', contentId)
          .eq('hidden_from', personId);
        if (error) throw error;
        setHidden((prev) => {
          const next = new Set(prev);
          next.delete(personId);
          return next;
        });
      } else {
        const { error } = await supabase.from('content_hides').insert({
          content_type: contentType,
          content_id: contentId,
          hidden_from: personId,
        });
        if (error) throw error;
        setHidden((prev) => new Set(prev).add(personId));
      }
    } catch (e: any) {
      console.error('Toggle failed:', e);
      setErr(e?.message || 'Could not change that.');
    }

    setBusy(null);
  }

  if (!mounted) return null;

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal hide-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <h2 style={{ margin: '0 0 6px', fontSize: 19 }}>Hide from</h2>
        <p className="muted" style={{ fontSize: 13, marginTop: 0, marginBottom: 18 }}>
          Anyone toggled on won&apos;t see this.
        </p>

        {err && (
          <p style={{ color: '#FF6B6B', fontSize: 13, marginBottom: 14 }}>{err}</p>
        )}

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

        {!loading && !err && people.length === 0 && (
          <p className="muted" style={{ fontSize: 14 }}>
            No other members found.
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}
