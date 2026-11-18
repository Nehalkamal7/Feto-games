import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FETO GAMES - Real-Time Multiplayer Party Gaming Platform',
  description:
    'FETO GAMES is a high-speed, real-time browser party gaming platform supporting up to 15 players per room on mobile, tablet, and desktop.',
  keywords: ['party games', 'multiplayer', 'browser games', 'jackbox alternative', 'feto games', 'socket.io', 'trivia'],
  openGraph: {
    title: 'FETO GAMES - Multiplayer Party Platform',
    description: 'Instant rooms, neon avatars, and up to 15 players on any device.',
    type: 'website'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#07080f'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#07080f] text-slate-100 antialiased selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
