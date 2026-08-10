'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { createClient } from '@/lib/supabase';

type Counts = { messages: number; snaps: number };

const NotifContext = createContext<{
  counts: Counts;
  clear: (kind: 'messages' | 'snaps') => void;
  enableBrowserNotifs: () => void;
  permission: string;
}>({
  counts: { messages: 0, snaps: 0 },
  clear: () => {},
  enableBrowserNotifs: () => {},
  permission: 'default',
});

export function useNotifications() {
  return useContext(NotifContext);
}

function notify(title: string, body: string) {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, icon: '/favicon.ico' });
  } catch (e) {
    console.error('Notification failed:', e);
  }
}

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = useState<Counts>({ messages: 0, snaps: 0 });
  const [permission, setPermission] = useState('default');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let msgChannel: any;
    let snapChannel: any;

    async function setup() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('approved')
        .eq('id', user.id)
        .single();
      if (!profile?.approved) return;

      const suffix = Math.random().toString(36).slice(2);

      msgChannel = supabase
        .channel('notif-messages-' + suffix)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          if (payload.new.user_id === user.id) return;
          setCounts((c) => ({ ...c, messages: c.messages + 1 }));
          if (document.hidden || !location.pathname.startsWith('/chat')) {
            notify('New message in Gen-Z', payload.new.content?.slice(0, 80) || 'Someone sent a message');
          }
        })
        .subscribe();

      snapChannel = supabase
        .channel('notif-snaps-' + suffix)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'snaps' }, (payload) => {
          if (payload.new.user_id === user.id) return;
          setCounts((c) => ({ ...c, snaps: c.snaps + 1 }));
          if (document.hidden || !location.pathname.startsWith('/snaps')) {
            notify('New Snap in Gen-Z', 'Someone just posted a Snap');
          }
        })
        .subscribe();
    }

    setup();

    return () => {
      if (msgChannel) supabase.removeChannel(msgChannel);
      if (snapChannel) supabase.removeChannel(snapChannel);
    };
  }, []);

  function clear(kind: 'messages' | 'snaps') {
    setCounts((c) => ({ ...c, [kind]: 0 }));
  }

  function enableBrowserNotifs() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Your browser does not support notifications.');
      return;
    }
    Notification.requestPermission().then((p) => {
      setPermission(p);
      if (p === 'granted') {
        notify('Notifications on', "You'll get alerts for new messages and Snaps.");
      }
    });
  }

  return (
    <NotifContext.Provider value={{ counts, clear, enableBrowserNotifs, permission }}>
      {children}
    </NotifContext.Provider>
  );
}
