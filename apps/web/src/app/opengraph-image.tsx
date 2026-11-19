import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'FETO GAMES — 15-Player Chaotic Party Games Online';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
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
            top: -100,
            left: 100,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 242, 255, 0.18) 0%, rgba(9, 13, 22, 0) 70%)'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -100,
            right: 100,
            width: 550,
            height: 550,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.22) 0%, rgba(9, 13, 22, 0) 70%)'
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
            border: '2px solid rgba(56, 242, 255, 0.4)',
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
            background: 'rgba(56, 242, 255, 0.08)',
            border: '1.5px solid rgba(56, 242, 255, 0.35)'
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#38F2FF',
              boxShadow: '0 0 10px #38F2FF'
            }}
          />
          <span
            style={{
              color: '#38F2FF',
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: '3px',
              textTransform: 'uppercase'
            }}
          >
            Real-Time Multiplayer Party Arcade
          </span>
        </div>

        {/* Center Hero: Shield Emblem + Brand Wordmark */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {/* High-Precision SVG Shield Emblem */}
            <svg width="110" height="110" viewBox="0 0 100 100" fill="none">
              <defs>
                <linearGradient id="ogShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38F2FF" />
                  <stop offset="100%" stopColor="#A855F7" />
                </linearGradient>
                <linearGradient id="ogCoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00F0FF" />
                  <stop offset="100%" stopColor="#38F2FF" />
                </linearGradient>
              </defs>

              <path
                d="M50 10 L90 26 L80 70 L50 96 L20 70 L10 26 Z"
                fill="none"
                stroke="url(#ogShieldGrad)"
                strokeWidth="5"
                strokeLinejoin="round"
              />

              <path
                d="M50 22 L78 35 L70 66 L50 84 L30 66 L22 35 Z"
                fill="#090D16"
                stroke="url(#ogCoreGrad)"
                strokeWidth="4"
              />

              <path
                d="M50 48 L66 36 L50 78 L34 36 Z"
                fill="url(#ogShieldGrad)"
              />
            </svg>

            {/* Glowing Wordmark */}
            <h1
              style={{
                fontSize: 84,
                fontWeight: 900,
                color: '#38F2FF',
                letterSpacing: '2px',
                margin: 0,
                textShadow: '0 0 35px rgba(56, 242, 255, 0.65)'
              }}
            >
              FETO GAMES
            </h1>
          </div>

          {/* Catchy Subtitle */}
          <p
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: '#FFFFFF',
              margin: 0,
              textAlign: 'center',
              letterSpacing: '0.5px'
            }}
          >
            15-Player Chaotic Party Games Online
          </p>

          <p
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: '#A855F7',
              margin: 0,
              textAlign: 'center'
            }}
          >
            Who Is Imposter? • Draw & Guess • Hot Potato • Sip or Spill 🥤 • Truth or Dare
          </p>
        </div>

        {/* Feature Badges Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16
          }}
        >
          {[
            { label: '🎮 10 Full Party Games', color: '#38F2FF' },
            { label: '👥 Up to 15 Players', color: '#FACC15' },
            { label: '⚡ Zero Downloads Required', color: '#4ADE80' },
            { label: '🥤 Sip Edition & Sabotage', color: '#F472B6' }
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: '10px 20px',
                borderRadius: 14,
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1.5px solid ${item.color}55`,
                color: item.color,
                fontSize: 16,
                fontWeight: 800
              }}
            >
              {item.label}
            </div>
          ))}
        </div>

        {/* Bottom CTA / Domain */}
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
          <span style={{ color: '#94A3B8', fontSize: 16, fontWeight: 700 }}>
            Play Instantly in Your Mobile or Desktop Browser
          </span>
          <span style={{ color: '#38F2FF', fontSize: 18, fontWeight: 900, letterSpacing: '1px' }}>
            fetogames.com
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
