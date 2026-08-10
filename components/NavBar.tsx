'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import Avatar from './Avatar';
import { useNotifications } from './NotificationProvider';

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return <span className="badge nav-badge">{count > 9 ? '9+' : count}</span>;
}

const ICONS: Record<string, React.ReactNode> = {
  chat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  snaps: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  members: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <path d="M22 6l-10 7L2 6" />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
};

type NavLink = {
  href: string;
  label: string;
  icon: string;
  badge?: 'messages' | 'snaps' | 'dms';
};

const LINKS: NavLink[] = [
  { href: '/chat', label: 'Chat', icon: 'chat', badge: 'messages' },
  { href: '/snaps', label: 'Snaps', icon: 'snaps', badge: 'snaps' },
  { href: '/messages', label: 'Messages', icon: 'mail', badge: 'dms' },
  { href: '/members', label: 'Members', icon: 'members' },
  { href: '/profile', label: 'Profile', icon: 'profile' },
];

export default function NavBar() {
  const { counts, clear, enableBrowserNotifs, permission } = useNotifications();
  const pathname = usePathname();
  const [me, setMe] = useState<{ avatar_url?: string; full_name?: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function loadMe() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('id', user.id)
        .single();
      if (data) setMe(data);
    }
    loadMe();

    function onAvatarUpdate(e: any) {
      setMe((prev) => (prev ? { ...prev, avatar_url: e.detail } : prev));
    }
    window.addEventListener('genz-avatar-updated', onAvatarUpdate);
    return () => window.removeEventListener('genz-avatar-updated', onAvatarUpdate);
  }, []);

  useEffect(() => {
    if (pathname?.startsWith('/chat')) clear('messages');
    if (pathname?.startsWith('/snaps')) clear('snaps');
    if (pathname?.startsWith('/messages')) clear('dms');
  }, [pathname]);

  const isActive = (p: string) => pathname === p || pathname?.startsWith(p + '/');

  return (
    <nav className="nav">
      <Link href="/" className="nav-logo">
        Gen-Z<span>.</span>
      </Link>

      <div className="nav-links">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`nav-link ${isActive(l.href) ? 'active' : ''}`}
            aria-label={l.label}
            title={l.label}
          >
            <span className="nav-icon">
              {l.href === '/profile' && me ? (
                <Avatar src={me.avatar_url} name={me.full_name} size={21} />
              ) : (
                ICONS[l.icon]
              )}
            </span>
            <span className="nav-text">{l.label}</span>
            {l.badge && <Badge count={counts[l.badge]} />}
          </Link>
        ))}
      </div>

      <div className="nav-right">
        {permission !== 'granted' && (
          <button
            onClick={enableBrowserNotifs}
            className="icon-btn"
            aria-label="Turn on alerts"
            title="Turn on alerts"
          >
            <span className="nav-icon">{ICONS.bell}</span>
          </button>
        )}
        <Link
          href="/admin"
          className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
          aria-label="Admin"
          title="Admin"
        >
          <span className="nav-icon">{ICONS.admin}</span>
          <span className="nav-text">Admin</span>
        </Link>
      </div>
    </nav>
  );
}
