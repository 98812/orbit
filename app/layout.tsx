import type { Metadata } from 'next';
import NotificationProvider from '@/components/NotificationProvider';
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'Gen-Z — for revolution',
  description: 'A private space for your friend group: profiles, group chat, and Snaps with reactions.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <NotificationProvider>
          <NavBar />
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}
