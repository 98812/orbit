'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import ApprovalGate from '@/components/ApprovalGate';

function ChatInner() {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
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

      if (error) {
        console.error('Failed to load messages:', error);
        return;
      }
      setMessages(data || []);

      channel = supabase
        .channel('messages-' + Math.random())
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
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 24, display: 'flex', flexDirection: 'column', height: '90vh' }}>
      <h1>The chat</h1>
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12 }}>
        {messages.length === 0 && <p style={{ color: '#888' }}>No messages yet — say hi.</p>}
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 10 }}>
            <strong>{m.profiles?.full_name || 'friend'}: </strong>
            <span>{m.content}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} style={{ display: 'flex', gap: 8 }}>
        <input
          id="chat-input"
          name="chat-message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Say something…"
          style={{ flex: 1, padding: 10 }}
        />
        <button type="submit" className="btn btn-primary">Send</button>
      </form>
    </main>
  );
}

export default function ChatPage() {
  return (
    <ApprovalGate>
      <ChatInner />
    </ApprovalGate>
  );
}
