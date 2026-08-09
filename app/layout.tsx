import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Gen-Z — for revolution',
  description: 'A private space for your friend group: profiles, group chat, and Snaps with reactions.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <nav
          style={{
            display: 'flex',
            gap: 20,
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
            Chat
          </Link>
          <Link href="/snaps" style={{ textDecoration: 'none', color: '#333' }}>
            Snaps
          </Link>
          <Link href="/admin" style={{ textDecoration: 'none', color: '#888', marginLeft: 'auto', fontSize: 14 }}>
            Admin
          </Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
