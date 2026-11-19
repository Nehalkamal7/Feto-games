import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface Props {
  params: { code: string };
}

export default function JoinOpenGraphImage({ params }: Props) {
  const code = (params?.code || 'PARTY').toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '48px 56px',
          background: '#090D16',
          position: 'relative',
          fontFamily: 'sans-serif'
        }}
      >
        {/* Background Radial Glows */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            left: 200,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 242, 255, 0.22) 0%, rgba(9, 13, 22, 0) 70%)'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            right: 200,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, rgba(9, 13, 22, 0) 70%)'
          }}
        />

        {/* Outer Cyber Border Frame */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            right: 20,
            bottom: 20,
            border: '2px solid rgba(56, 242, 255, 0.5)',
            borderRadius: 24,
            pointerEvents: 'none'
          }}
        />

        {/* Top Header Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 24px',
            borderRadius: 9999,
            background: 'rgba(234, 179, 8, 0.1)',
            border: '1.5px solid rgba(234, 179, 8, 0.5)'
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#FACC15',
              boxShadow: '0 0 10px #FACC15'
            }}
          />
          <span
            style={{
              color: '#FDE047',
              fontSize: 16,
              fontWeight: 900,
              letterSpacing: '3px',
              textTransform: 'uppercase'
            }}
          >
            Direct Party Invitation • Lobby Open
          </span>
        </div>

        {/* Center Hero: Shield Emblem + Invitation Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* High-Precision SVG Shield Emblem */}
            <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
              <defs>
                <linearGradient id="joinShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38F2FF" />
                  <stop offset="100%" stopColor="#A855F7" />
                </linearGradient>
                <linearGradient id="joinCoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00F0FF" />
                  <stop offset="100%" stopColor="#38F2FF" />
                </linearGradient>
              </defs>

              <path
                d="M50 10 L90 26 L80 70 L50 96 L20 70 L10 26 Z"
                fill="none"
                stroke="url(#joinShieldGrad)"
                strokeWidth="5"
                strokeLinejoin="round"
              />

              <path
                d="M50 22 L78 35 L70 66 L50 84 L30 66 L22 35 Z"
                fill="#090D16"
                stroke="url(#joinCoreGrad)"
                strokeWidth="4"
              />

              <path
                d="M50 48 L66 36 L50 78 L34 36 Z"
                fill="url(#joinShieldGrad)"
              />
            </svg>

            <h2
              style={{
                fontSize: 48,
                fontWeight: 900,
                color: '#38F2FF',
                letterSpacing: '2px',
                margin: 0,
                textShadow: '0 0 25px rgba(56, 242, 255, 0.6)'
              }}
            >
              FETO GAMES
            </h2>
          </div>

          <h1
            style={{
              fontSize: 52,
              fontWeight: 900,
              color: '#FFFFFF',
              margin: 0,
              textAlign: 'center',
              letterSpacing: '1px'
            }}
          >
            YOU'RE INVITED TO THE PARTY!
          </h1>

          {/* Big Glowing Room Code Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '16px 48px',
              borderRadius: 20,
              background: 'rgba(56, 242, 255, 0.08)',
              border: '2.5px solid #38F2FF',
              boxShadow: '0 0 40px rgba(56, 242, 255, 0.35)'
            }}
          >
            <span
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: '#94A3B8',
                letterSpacing: '2px'
              }}
            >
              ROOM CODE:
            </span>
            <span
              style={{
                fontSize: 54,
                fontWeight: 900,
                fontFamily: 'monospace',
                color: '#38F2FF',
                letterSpacing: '4px'
              }}
            >
              {code}
            </span>
          </div>

          <p
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#C084FC',
              margin: 0,
              textAlign: 'center'
            }}
          >
            Tap link to enter lobby instantly • Pick your avatar • Up to 15 players
          </p>
        </div>

        {/* Bottom Feature Badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            paddingTop: 12,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <span style={{ color: '#4ADE80', fontSize: 18, fontWeight: 800 }}>
            ⚡ 100% Free Browser Game • Zero App Installation Required
          </span>
          <span style={{ color: '#38F2FF', fontSize: 18, fontWeight: 900 }}>
            fetogames.com
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
