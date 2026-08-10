'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import ApprovalGate from '@/components/ApprovalGate';

function formatTime(ts: string) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (sameDay) return time;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${time}`;
  return `${d.toLocaleDateString([], { day: 'numeric', month: 'short' })} ${time}`;
}

function ChatInner() {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;
    let channel: any;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: true })
        .limit(100);

      setLoading(false);

      if (error) {
        console.error('Failed to load messages:', error);
        return;
      }
      setMessages(data || []);

      channel = supabase
        .channel('chat-' + Math.random().toString(36).slice(2))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        })
        .subscribe();
    }

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !userId) return;
    const supabase = supabaseRef.current;
    const content = text;
    setText('');

    const { data, error } = await supabase
      .from('messages')
      .insert({ user_id: userId, content })
      .select('*, profiles(full_name)')
      .single();

    if (error) {
      console.error('Failed to send message:', error);
      return;
    }

    setMessages((prev) => {
      if (prev.some((m) => m.id === data.id)) return prev;
      return [...prev, data];
    });
  }

  return (
    <div className="chat-wrap">
      <h1 style={{ marginBottom: 16 }}>The chat</h1>

      <div className="chat-scroll">
        {loading && (
          <div className="empty">
            <div className="empty-icon">💬</div>
            <p>Loading messages…</p>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="empty">
            <div className="empty-icon">👋</div>
            <p>No messages yet — say hi.</p>
          </div>
        )}

        {messages.map((m, i) => {
          const mine = m.user_id === userId;
          const prev = messages[i - 1];
          const showName = !prev || prev.user_id !== m.user_id;

          return (
            <div key={m.id} className={`msg-row ${mine ? 'mine' : ''}`}>
              <div>
                {showName && (
                  <div className="msg-name" style={{ textAlign: mine ? 'right' : 'left' }}>
                    {mine ? 'You' : m.profiles?.full_name || 'friend'}
                  </div>
                )}
                <div className="bubble">{m.content}</div>
                <div
                  className="msg-time"
                  style={{ textAlign: mine ? 'right' : 'left' }}
                >
                  {formatTime(m.created_at)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="chat-form">
        <input
          id="chat-input"
          name="chat-message"
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Say something…"
          autoComplete="off"
        />
        <button type="submit" className="btn btn-primary">
          Send
        </button>
      </form>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ApprovalGate>
      <ChatInner />
    </ApprovalGate>
  );
}
