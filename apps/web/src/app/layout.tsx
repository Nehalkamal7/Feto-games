import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://fetogames.com'),
  title: {
    default: 'FETO GAMES — 15-Player Chaotic Party Games Online',
    template: '%s | FETO GAMES'
  },
  description:
    'The ultimate free online party game arcade! Play with up to 15 friends or strangers on mobile or desktop with Zero Downloads: Imposter, Draw & Guess, Quiz Battle, Word Battle, Truth or Dare, Hot Potato & more.',
  keywords: [
    'party games',
    'multiplayer party games',
    'free browser games',
    'jackbox online free',
    'imposter party game',
    'draw and guess online',
    'feto games',
    'mobile party games',
    'sip edition',
    'hot potato game',
    '15 player game'
  ],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FETO GAMES'
  },
  openGraph: {
    title: 'FETO GAMES — 15-Player Chaotic Party Games Online',
    description:
      'Jump into instant party rooms with up to 15 players on mobile or desktop! Zero Downloads • 10 Full Party Games • 100% Free.',
    url: 'https://fetogames.com',
    siteName: 'FETO GAMES',
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FETO GAMES — 15-Player Chaotic Party Games Online',
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
  themeColor: '#07080f'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-[100dvh] bg-[#07080f] text-slate-100 antialiased selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
