'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import ApprovalGate from '@/components/ApprovalGate';
import Avatar from '@/components/Avatar';

function formatTime(ts: string) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (d.toDateString() === now.toDateString()) return time;
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return `Yesterday ${time}`;
  return `${d.toLocaleDateString([], { day: 'numeric', month: 'short' })} ${time}`;
}

function ThreadInner() {
  const params = useParams();
  const otherId = params?.id as string;

  const [messages, setMessages] = useState<any[]>([]);
  const [other, setOther] = useState<any>(null);
  const [me, setMe] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;
    let channel: any;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setMe(user.id);

      const { data: prof } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, talent')
        .eq('id', otherId)
        .single();
      setOther(prof);

      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true })
        .limit(200);

      setLoading(false);
      if (error) {
        console.error('Failed to load DMs:', error);
        return;
      }
      setMessages(data || []);

      // mark incoming as read
      await supabase
        .from('direct_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', otherId)
        .eq('recipient_id', user.id)
        .is('read_at', null);

      channel = supabase
        .channel('dm-' + Math.random().toString(36).slice(2))
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'direct_messages' },
          (payload) => {
            const m = payload.new as any;
            const relevant =
              (m.sender_id === otherId && m.recipient_id === user.id) ||
              (m.sender_id === user.id && m.recipient_id === otherId);
            if (!relevant) return;
            setMessages((prev) => {
              if (prev.some((x) => x.id === m.id)) return prev;
              return [...prev, m];
            });
          }
        )
        .subscribe();
    }

    init();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [otherId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !me) return;
    const supabase = supabaseRef.current;
    const content = text;
    setText('');

    const { data, error } = await supabase
      .from('direct_messages')
      .insert({ sender_id: me, recipient_id: otherId, content })
      .select('*')
      .single();

    if (error) {
      console.error('Failed to send:', error);
      return;
    }
    setMessages((prev) => {
      if (prev.some((m) => m.id === data.id)) return prev;
      return [...prev, data];
    });
  }

  return (
    <div className="chat-wrap">
      <div className="dm-header">
        <Link href="/messages" className="dm-back" aria-label="Back to messages">
          ‹
        </Link>
        {other && (
          <>
            <Avatar src={other.avatar_url} name={other.full_name} size={38} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{other.full_name || 'friend'}</div>
              {other.talent && (
                <div className="mono muted" style={{ fontSize: 11 }}>
                  {other.talent}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="chat-scroll">
        {loading && (
          <div className="empty">
            <div className="empty-icon">💬</div>
            <p>Loading…</p>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="empty">
            <div className="empty-icon">👋</div>
            <p>No messages yet — say something.</p>
          </div>
        )}

        {messages.map((m, i) => {
          const mine = m.sender_id === me;
          const prev = messages[i - 1];
          const showTime = !prev || new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() > 5 * 60000;

          return (
            <div key={m.id} className={`msg-row ${mine ? 'mine' : ''}`}>
              <div>
                <div className="bubble">{m.content}</div>
                {showTime && (
                  <div className="msg-time" style={{ textAlign: mine ? 'right' : 'left' }}>
                    {formatTime(m.created_at)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="chat-form">
        <input
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          autoComplete="off"
        />
        <button type="submit" className="btn btn-primary">
          Send
        </button>
      </form>
    </div>
  );
}

export default function ThreadPage() {
  return (
    <ApprovalGate>
      <ThreadInner />
    </ApprovalGate>
  );
}
