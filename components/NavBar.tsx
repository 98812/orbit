'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useNotifications } from './NotificationProvider';

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return <span className="badge">{count > 9 ? '9+' : count}</span>;
}

export default function NavBar() {
  const { counts, clear, enableBrowserNotifs, permission } = useNotifications();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith('/chat')) clear('messages');
    if (pathname?.startsWith('/snaps')) clear('snaps');
  }, [pathname]);

  const isActive = (p: string) => pathname === p || pathname?.startsWith(p + '/');

  return (
    <nav className="nav">
      <Link href="/" className="nav-logo">
        Gen-Z<span>.</span>
      </Link>
      <Link href="/chat" className={`nav-link ${isActive('/chat') ? 'active' : ''}`}>
        Chat
        <Badge count={counts.messages} />
      </Link>
      <Link href="/snaps" className={`nav-link ${isActive('/snaps') ? 'active' : ''}`}>
        Snaps
        <Badge count={counts.snaps} />
      </Link>
      <Link href="/members" className={`nav-link ${isActive('/members') ? 'active' : ''}`}>
        Members
      </Link>
      <Link href="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`}>
        Profile
      </Link>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        {permission !== 'granted' && (
          <button onClick={enableBrowserNotifs} className="btn btn-pink btn-sm">
            🔔 Alerts
          </button>
        )}
        <Link href="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`} style={{ fontSize: 14 }}>
          Admin
        </Link>
      </div>
    </nav>
  );
}
