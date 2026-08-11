'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase';
import ApprovalGate from '@/components/ApprovalGate';
import Avatar from '@/components/Avatar';
import CameraCapture from '@/components/CameraCapture';
import { sendPush } from '@/lib/push';

const EMOJIS = ['🔥', '😂', '😍', '👀', '💀', '🫡', '🙏', '😟', '🖕', '🤟', '🤙'];

function timeAgo(ts: string) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString([], { day: 'numeric', month: 'short' });
}

function SnapCard({
  snap,
  userId,
  names,
  avatars,
  onReact,
  onComment,
  onOpen,
}: {
  snap: any;
  userId: string | null;
  names: Record<string, string>;
  avatars: Record<string, string>;
  onReact: (snapId: string, emoji: string) => void;
  onComment: (snapId: string, text: string) => Promise<void>;
  onOpen: (snap: any) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [openReaction, setOpenReaction] = useState<string | null>(null);

  const comments = snap.snap_comments || [];
  const reactions = snap.reactions || [];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    await onComment(snap.id, draft);
    setDraft('');
    setSending(false);
  }

  const reactorsFor = (emoji: string) =>
    reactions
      .filter((r: any) => r.emoji === emoji)
      .map((r: any) => (r.user_id === userId ? 'You' : names[r.user_id] || 'someone'));

  return (
    <div className="snap-card">
      {snap.media_type === 'video' ? (
        <div className="snap-video-wrap">
          <video
            src={snap.image_url}
            className="snap-thumb"
            controls
            playsInline
            preload="metadata"
          />
        </div>
      ) : (
        <button className="snap-img-btn" onClick={() => onOpen(snap)} aria-label="View full size">
          <img
            src={snap.image_url}
            alt={`Snap from ${snap.profiles?.full_name || 'a friend'}`}
            className="snap-thumb"
          />
          <span className="snap-expand">⤢</span>
        </button>
      )}
      <div className="snap-meta">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Avatar src={snap.profiles?.avatar_url} name={snap.profiles?.full_name} size={32} />
            <p className="snap-author" style={{ margin: 0 }}>{snap.profiles?.full_name || 'friend'}</p>
          </div>
          <span className="mono muted" style={{ fontSize: 11 }}>
            {timeAgo(snap.created_at)}
          </span>
        </div>

        <div className="reactions">
          {EMOJIS.map((emoji) => {
            const who = reactorsFor(emoji);
            return (
              <button
                key={emoji}
                onClick={() => onReact(snap.id, emoji)}
                onMouseEnter={() => who.length && setOpenReaction(emoji)}
                onMouseLeave={() => setOpenReaction(null)}
                className="reaction"
                style={{ position: 'relative' }}
                title={who.length ? who.join(', ') : undefined}
              >
                {emoji}
                {who.length > 0 && <span className="reaction-count">{who.length}</span>}
                {openReaction === emoji && who.length > 0 && (
                  <span className="reaction-tip">{who.join(', ')}</span>
                )}
              </button>
            );
          })}
        </div>

        {reactions.length > 0 && (
          <p className="mono muted" style={{ fontSize: 11, marginTop: 10, marginBottom: 0 }}>
            {(() => {
              const all = reactions.map((r: any) =>
                r.user_id === userId ? 'You' : names[r.user_id] || 'someone'
              );
              const unique = Array.from(new Set(all));
              if (unique.length === 1) return `${unique[0]} reacted`;
              if (unique.length === 2) return `${unique[0]} and ${unique[1]} reacted`;
              return `${unique[0]}, ${unique[1]} and ${unique.length - 2} more reacted`;
            })()}
          </p>
        )}

        <button
          onClick={() => setShowComments((s) => !s)}
          className="link-btn"
          style={{ marginTop: 12 }}
        >
          💬 {comments.length > 0 ? `${comments.length} ${comments.length === 1 ? 'reply' : 'replies'}` : 'Reply'}
        </button>

        {showComments && (
          <div style={{ marginTop: 12 }}>
            {comments.map((c: any) => (
              <div key={c.id} className="comment">
                <Avatar src={avatars[c.user_id]} name={names[c.user_id]} size={22} />
                <span className="comment-name">
                  {c.user_id === userId ? 'You' : names[c.user_id] || 'friend'}
                </span>
                <span>{c.content}</span>
                <span className="comment-time">{timeAgo(c.created_at)}</span>
              </div>
            ))}

            <form onSubmit={submit} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input
                className="input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a reply…"
                style={{ fontSize: 14, padding: '9px 12px' }}
                autoComplete="off"
              />
              <button type="submit" className="btn btn-pink btn-sm" disabled={sending}>
                {sending ? '…' : 'Send'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}


function Lightbox({
  snaps,
  current,
  names,
  onClose,
  onNavigate,
}: {
  snaps: any[];
  current: any;
  names: Record<string, string>;
  onClose: () => void;
  onNavigate: (snap: any) => void;
}) {
  const items = snaps.filter((s) => s.media_type !== 'video');
  const index = items.findIndex((s) => s.id === current.id);
  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(items[index - 1]);
      if (e.key === 'ArrowRight' && hasNext) onNavigate(items[index + 1]);
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [index, hasPrev, hasNext]);

  const touchStart = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      className="lightbox"
      onClick={onClose}
      onTouchStart={(e) => {
        touchStart.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStart.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStart.current;
        if (dx > 60 && hasPrev) onNavigate(items[index - 1]);
        if (dx < -60 && hasNext) onNavigate(items[index + 1]);
        touchStart.current = null;
      }}
    >
      <button className="lightbox-close" onClick={onClose} aria-label="Close">
        ✕
      </button>

      {hasPrev && (
        <button
          className="lightbox-nav prev"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(items[index - 1]);
          }}
          aria-label="Previous"
        >
          ‹
        </button>
      )}

      <figure className="lightbox-figure" onClick={(e) => e.stopPropagation()}>
        <img src={current.image_url} alt={`Snap from ${current.profiles?.full_name || 'a friend'}`} />
        <figcaption>
          <strong>{current.profiles?.full_name || 'friend'}</strong>
          <span className="mono">{timeAgo(current.created_at)}</span>
          <span className="mono lightbox-count">
            {index + 1} / {items.length}
          </span>
        </figcaption>
      </figure>

      {hasNext && (
        <button
          className="lightbox-nav next"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(items[index + 1]);
          }}
          aria-label="Next"
        >
          ›
        </button>
      )}
    </div>,
    document.body
  );
}

function SnapsInner() {
  const [snaps, setSnaps] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState<any>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      const { data: profs } = await supabase.from('profiles').select('id, full_name, avatar_url');
      const map: Record<string, string> = {};
      const avs: Record<string, string> = {};
      (profs || []).forEach((p: any) => {
        map[p.id] = p.full_name || 'friend';
        if (p.avatar_url) avs[p.id] = p.avatar_url;
      });
      setNames(map);
      setAvatars(avs);

      const { data, error } = await supabase
        .from('snaps')
        .select('*, profiles(full_name, avatar_url), reactions(emoji, user_id), snap_comments(id, content, user_id, created_at)')
        .order('created_at', { ascending: false });

      setLoading(false);

      if (error) {
        console.error('Failed to load snaps:', error);
        return;
      }
      setSnaps(data || []);
    }
    init();
  }, []);

  async function uploadSnap(
    input: File | React.ChangeEvent<HTMLInputElement>,
    kind: 'image' | 'video' = 'image'
  ) {
    let file: File | undefined =
      input instanceof File ? input : input.target.files?.[0];
    const inputEl = input instanceof File ? null : input.target;

    if (!file || !userId) return;
    setUploading(true);

    const isHeic =
      kind === 'image' && (
      file.type === 'image/heic' ||
      file.type === 'image/heif' ||
      file.name.toLowerCase().endsWith('.heic') ||
      file.name.toLowerCase().endsWith('.heif'));

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
        alert('That photo format could not be read. Try exporting it as a JPG first.');
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
      .insert({ user_id: userId, image_url: urlData.publicUrl, media_type: kind })
      .select('*, profiles(full_name, avatar_url), reactions(emoji, user_id), snap_comments(id, content, user_id, created_at)')
      .single();

    setUploading(false);

    if (error) {
      console.error('Failed to save snap:', error);
      return;
    }

    setSnaps((prev) => [data, ...prev]);
    if (inputEl) inputEl.value = '';

    const others = Object.keys(names).filter((id) => id !== userId);
    if (others.length) {
      sendPush({
        recipientIds: others,
        title: 'New Snap',
        message:
          (data.profiles?.full_name || 'Someone') +
          (kind === 'video' ? ' just posted a clip' : ' just posted a Snap'),
        url: '/snaps',
        tag: 'snap',
        senderId: userId || undefined,
      });
    }
  }

  async function react(snapId: string, emoji: string) {
    if (!userId) return;
    const { error } = await supabase
      .from('reactions')
      .insert({ snap_id: snapId, user_id: userId, emoji });
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

  async function addComment(snapId: string, content: string) {
    if (!userId) return;
    const { data, error } = await supabase
      .from('snap_comments')
      .insert({ snap_id: snapId, user_id: userId, content })
      .select('id, content, user_id, created_at')
      .single();

    if (error) {
      console.error('Failed to comment:', error);
      return;
    }

    setSnaps((prev) =>
      prev.map((s) =>
        s.id === snapId ? { ...s, snap_comments: [...(s.snap_comments || []), data] } : s
      )
    );
  }

  return (
    <div className="page">
      <h1>Snaps</h1>

      <div className="upload-row">
        <button
          type="button"
          className={`capture-btn ${uploading ? 'busy' : ''}`}
          onClick={() => setCameraOpen(true)}
          disabled={uploading}
        >
          <span className="capture-ring" aria-hidden="true" />
          <span className="capture-icon" aria-hidden="true">
            {uploading ? '⏳' : '📷'}
          </span>
          <span className="capture-label">{uploading ? 'Uploading…' : 'Take a Snap'}</span>
        </button>
      </div>

      {loading && !uploading && (
        <div className="empty">
          <div className="empty-icon">📸</div>
          <p>Loading Snaps…</p>
        </div>
      )}

      {!loading && !uploading && snaps.length === 0 && (
        <div className="empty">
          <div className="empty-icon">📭</div>
          <p>No Snaps yet — post the first one.</p>
        </div>
      )}

      {cameraOpen && (
        <CameraCapture
          onClose={() => setCameraOpen(false)}
          onCapture={(file, kind) => {
            setCameraOpen(false);
            uploadSnap(file, kind);
          }}
        />
      )}

      {viewer && (
        <Lightbox
          snaps={snaps}
          current={viewer}
          names={names}
          onClose={() => setViewer(null)}
          onNavigate={setViewer}
        />
      )}

      {snaps.map((snap) => (
        <SnapCard
          key={snap.id}
          snap={snap}
          userId={userId}
          names={names}
          avatars={avatars}
          onReact={react}
          onComment={addComment}
          onOpen={setViewer}
        />
      ))}
    </div>
  );
}

export default function SnapsPage() {
  return (
    <ApprovalGate>
      <SnapsInner />
    </ApprovalGate>
  );
}
