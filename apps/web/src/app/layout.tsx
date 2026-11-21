import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://fetogames.com'),
  title: {
    default: 'FETO GAMES — 15-Player Party Games Online',
    template: '%s | FETO GAMES'
  },
  description:
    'Play instant online party games with friends on mobile or desktop: Imposter, Draw & Guess, Quiz Battle, Word Battle, Truth or Dare, Hot Potato & more. Zero downloads, 100% free.',
  keywords: [
    'party games',
    'multiplayer party games',
    'free browser games',
    'imposter party game',
    'draw and guess online',
    'feto games',
    'mobile party games',
    'hot potato game',
    '15 player game'
  ],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FETO GAMES'
  },
  openGraph: {
    title: 'FETO GAMES — 15-Player Party Games Online',
    description:
      'Jump into instant party rooms with up to 15 players on mobile or desktop! Zero Downloads • 10 Full Party Games • 100% Free.',
    url: 'https://fetogames.com',
    siteName: 'FETO GAMES',
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FETO GAMES — 15-Player Party Games Online',
    description:
      'Jump into instant party rooms with up to 15 players on mobile or desktop! Zero Downloads • 10 Full Party Games • 100% Free.',
    creator: '@fetogames'
  },
  robots: {
    index: true,
    follow: true
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: '#F9FAFB'
};

import { LanguageProvider } from '@/hooks/useLanguage';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-[#F9FAFB]">
      <body className="min-h-[100dvh] w-full bg-[#F9FAFB] text-gray-900 antialiased selection:bg-blue-600 selection:text-white overflow-x-hidden">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
