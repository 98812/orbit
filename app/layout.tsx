import type { Metadata, Viewport } from 'next';
import './globals.css';
import NotificationProvider from '@/components/NotificationProvider';
import NavBar from '@/components/NavBar';
import InstallPrompt from '@/components/InstallPrompt';
import SwipeNav from '@/components/SwipeNav';
import PresenceTracker from '@/components/PresenceTracker';
import ScrollDepth from '@/components/ScrollDepth';
import PullToRefresh from '@/components/PullToRefresh';

export const metadata: Metadata = {
  title: 'Gen-Z — for revolution',
  description: 'A private space for your friend group: profiles, group chat, and Snaps with reactions.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Gen-Z',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#14121F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NotificationProvider>
          <PullToRefresh />
          <NavBar />
          <SwipeNav>{children}</SwipeNav>
          <InstallPrompt />
          <PresenceTracker />
          <ScrollDepth />
        </NotificationProvider>
      </body>
    </html>
  );
}
