'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import ApprovalGate from '@/components/ApprovalGate';
import Avatar from '@/components/Avatar';
import { sendPush } from '@/lib/push';
import { useIsAdmin } from '@/lib/useIsAdmin';
import TrashIcon from '@/components/TrashIcon';

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

function StatusCard({
  status,
  userId,
  names,
  avatars,
  onReact,
  onComment,
  isAdmin,
  onDelete,
  onDeleteComment,
}: {
  status: any;
  userId: string | null;
  names: Record<string, string>;
  avatars: Record<string, string>;
  onReact: (id: string, emoji: string) => void;
  onComment: (id: string, text: string) => Promise<void>;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onDeleteComment: (statusId: string, commentId: string) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const comments = status.status_comments || [];
  const reactions = status.status_reactions || [];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    await onComment(status.id, draft);
    setDraft('');
    setSending(false);
  }

  const used = Array.from(new Set(reactions.map((r: any) => r.emoji))) as string[];

  const reactorsFor = (emoji: string) =>
    reactions
      .filter((r: any) => r.emoji === emoji)
      .map((r: any) => (r.user_id === userId ? 'You' : names[r.user_id] || 'someone'));

  return (
    <div className="status-card">
      <div className="status-head">
        <Avatar src={status.profiles?.avatar_url} name={status.profiles?.full_name} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="status-name">{status.profiles?.full_name || 'friend'}</div>
          <div className="mono muted" style={{ fontSize: 11 }}>
            {timeAgo(status.created_at)}
          </div>
        </div>
        {isAdmin && (
          <button className="del-btn" onClick={() => onDelete(status.id)} aria-label="Delete post">
            <TrashIcon />
          </button>
        )}
      </div>

      <p className="status-text">{status.content}</p>

      {used.length > 0 && (
        <div className="status-reactions">
          {used.map((emoji) => {
            const who = reactorsFor(emoji);
            return (
              <button
                key={emoji}
                className="reaction"
                onClick={() => onReact(status.id, emoji)}
                title={who.join(', ')}
              >
                {emoji}
                <span className="reaction-count">{who.length}</span>
              </button>
            );
          })}
        </div>
      )}

      {reactions.length > 0 && (
        <p className="mono muted" style={{ fontSize: 11, margin: '8px 0 0' }}>
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

      <div className="status-actions">
        <button className="link-btn" onClick={() => setShowPicker((s) => !s)}>
          😀 React
        </button>
        <button className="link-btn" onClick={() => setShowComments((s) => !s)}>
          💬 {comments.length > 0 ? `${comments.length} ${comments.length === 1 ? 'reply' : 'replies'}` : 'Reply'}
        </button>
      </div>

      {showPicker && (
        <div className="reactions pop" style={{ marginTop: 10 }}>
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              className="reaction"
              onClick={() => {
                onReact(status.id, emoji);
                setShowPicker(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

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
              {isAdmin && (
                <button
                  className="del-btn"
                  onClick={() => onDeleteComment(status.id, c.id)}
                  aria-label="Delete reply"
                >
                  <TrashIcon />
                </button>
              )}
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
  );
}

function StatusInner() {
  const [statuses, setStatuses] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [me, setMe] = useState<any>(null);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const isAdmin = useIsAdmin();

  useEffect(() => {
    const supabase = supabaseRef.current;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      const { data: profs } = await supabase.from('profiles').select('id, full_name, avatar_url');
      const nameMap: Record<string, string> = {};
      const avMap: Record<string, string> = {};
      (profs || []).forEach((p: any) => {
        nameMap[p.id] = p.full_name || 'friend';
        if (p.avatar_url) avMap[p.id] = p.avatar_url;
      });
      setNames(nameMap);
      setAvatars(avMap);
      if (user) setMe((profs || []).find((p: any) => p.id === user.id) || null);

      const { data, error } = await supabase
        .from('statuses')
        .select(
          '*, profiles(full_name, avatar_url), status_reactions(emoji, user_id), status_comments(id, content, user_id, created_at)'
        )
        .order('created_at', { ascending: false })
        .limit(100);

      setLoading(false);
      if (error) {
        console.error('Failed to load statuses:', error);
        return;
      }
      setStatuses(data || []);
    }

    init();
  }, []);

  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !userId) return;
    setPosting(true);

    const supabase = supabaseRef.current;
    const content = draft.trim();

    const { data, error } = await supabase
      .from('statuses')
      .insert({ user_id: userId, content })
      .select(
        '*, profiles(full_name, avatar_url), status_reactions(emoji, user_id), status_comments(id, content, user_id, created_at)'
      )
      .single();

    setPosting(false);

    if (error) {
      console.error('Failed to post status:', error);
      return;
    }

    setDraft('');
    setStatuses((prev) => [data, ...prev]);

    const others = Object.keys(names).filter((id) => id !== userId);
    if (others.length) {
      sendPush({
        recipientIds: others,
        title: (data.profiles?.full_name || 'Someone') + ' posted',
        message: content.slice(0, 90),
        url: '/status',
        tag: 'status',
        senderId: userId,
      });
    }
  }

  async function removeStatus(id: string) {
    if (!confirm('Delete this post for everyone?')) return;
    const supabase = supabaseRef.current;
    const { error } = await supabase.from('statuses').delete().eq('id', id);
    if (error) {
      console.error('Delete failed:', error);
      alert('Could not delete that post.');
      return;
    }
    setStatuses((prev) => prev.filter((s) => s.id !== id));
  }

  async function removeComment(statusId: string, commentId: string) {
    if (!confirm('Delete this reply?')) return;
    const supabase = supabaseRef.current;
    const { error } = await supabase.from('status_comments').delete().eq('id', commentId);
    if (error) {
      console.error('Delete failed:', error);
      return;
    }
    setStatuses((prev) =>
      prev.map((s) =>
        s.id === statusId
          ? { ...s, status_comments: (s.status_comments || []).filter((c: any) => c.id !== commentId) }
          : s
      )
    );
  }

  async function react(statusId: string, emoji: string) {
    if (!userId) return;
    const supabase = supabaseRef.current;
    const { error } = await supabase
      .from('status_reactions')
      .insert({ status_id: statusId, user_id: userId, emoji });
    if (error) {
      console.error('Failed to react:', error);
      return;
    }
    setStatuses((prev) =>
      prev.map((s) =>
        s.id === statusId
          ? { ...s, status_reactions: [...(s.status_reactions || []), { emoji, user_id: userId }] }
          : s
      )
    );
  }

  async function addComment(statusId: string, content: string) {
    if (!userId) return;
    const supabase = supabaseRef.current;
    const { data, error } = await supabase
      .from('status_comments')
      .insert({ status_id: statusId, user_id: userId, content })
      .select('id, content, user_id, created_at')
      .single();

    if (error) {
      console.error('Failed to comment:', error);
      return;
    }

    setStatuses((prev) =>
      prev.map((s) =>
        s.id === statusId ? { ...s, status_comments: [...(s.status_comments || []), data] } : s
      )
    );
  }

  return (
    <div className="page">
      <p className="eyebrow">say it out loud</p>
      <h1>What&apos;s going on?</h1>

      <form onSubmit={post} className="status-composer">
        <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
          <Avatar src={me?.avatar_url} name={me?.full_name} size={38} />
          <textarea
            className="input status-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="What's going on?"
            rows={2}
            maxLength={500}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button type="submit" className="btn btn-primary btn-sm" disabled={posting || !draft.trim()}>
            {posting ? 'Posting…' : 'Post ↗'}
          </button>
        </div>
      </form>

      {loading && (
        <div className="empty">
          <div className="empty-icon">💭</div>
          <p>Loading…</p>
        </div>
      )}

      {!loading && statuses.length === 0 && (
        <div className="empty">
          <div className="empty-icon">✍️</div>
          <p>Nothing yet — say something first.</p>
        </div>
      )}

      {statuses.map((s) => (
        <StatusCard
          key={s.id}
          status={s}
          userId={userId}
          names={names}
          avatars={avatars}
          onReact={react}
          onComment={addComment}
          isAdmin={isAdmin}
          onDelete={removeStatus}
          onDeleteComment={removeComment}
        />
      ))}
    </div>
  );
}

export default function StatusPage() {
  return (
    <ApprovalGate>
      <StatusInner />
    </ApprovalGate>
  );
}
