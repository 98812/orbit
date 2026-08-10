'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useNotifications } from './NotificationProvider';

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 18,
        height: 18,
        padding: '0 5px',
        marginLeft: 6,
        borderRadius: 999,
        background: '#FF2E93',
        color: '#fff',
        fontSize: 11,
        fontWeight: 700,
        verticalAlign: 'middle',
      }}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}

export default function NavBar() {
  const { counts, clear, enableBrowserNotifs, permission } = useNotifications();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith('/chat')) clear('messages');
    if (pathname?.startsWith('/snaps')) clear('snaps');
  }, [pathname]);

  return (
    <nav
      style={{
        display: 'flex',
        gap: 18,
        padding: '14px 24px',
        borderBottom: '1px solid #ddd',
        fontFamily: 'sans-serif',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <Link href="/" style={{ fontWeight: 800, textDecoration: 'none', color: '#111' }}>
        Gen-Z
      </Link>
      <Link href="/profile" style={{ textDecoration: 'none', color: '#333' }}>
        Profile
      </Link>
      <Link href="/chat" style={{ textDecoration: 'none', color: '#333' }}>
        Chat<Badge count={counts.messages} />
      </Link>
      <Link href="/snaps" style={{ textDecoration: 'none', color: '#333' }}>
        Snaps<Badge count={counts.snaps} />
      </Link>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 14, alignItems: 'center' }}>
        {permission !== 'granted' && (
          <button
            onClick={enableBrowserNotifs}
            style={{
              padding: '6px 12px',
              fontSize: 13,
              background: '#111',
              color: '#fff',
              border: 'none',
              borderRadius: 999,
              cursor: 'pointer',
            }}
          >
            🔔 Turn on alerts
          </button>
        )}
        <Link href="/admin" style={{ textDecoration: 'none', color: '#888', fontSize: 14 }}>
          Admin
        </Link>
      </div>
    </nav>
  );
}
