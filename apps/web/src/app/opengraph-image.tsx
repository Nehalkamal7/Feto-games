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
          background: '#F8F8F8',
          position: 'relative',
          fontFamily: 'sans-serif'
        }}
      >
        {/* Outer Neo-Brutalist Hard Border Frame */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            right: 20,
            bottom: 20,
            border: '4px solid #010101',
            borderRadius: 24,
            boxShadow: '8px 8px 0px #010101',
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
            background: '#FEC90E',
            border: '3px solid #010101',
            boxShadow: '3px 3px 0px #010101'
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#FD3F01',
              border: '2px solid #010101'
            }}
          />
          <span
            style={{
              color: '#010101',
              fontSize: 16,
              fontWeight: 900,
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
            {/* High-Precision SVG Bauhaus Shield Emblem */}
            <svg width="120" height="120" viewBox="0 0 160 160" fill="none">
              {/* Offset Hard Shadow */}
              <path
                d="M80 14 L142 42 C146 72 138 112 104 142 L80 156 L56 142 C22 112 14 72 18 42 Z"
                fill="#010101"
                transform="translate(6, 6)"
              />
              {/* Main White Shield Body */}
              <path
                d="M80 14 L142 42 C146 72 138 112 104 142 L80 156 L56 142 C22 112 14 72 18 42 Z"
                fill="#FFFFFF"
                stroke="#010101"
                strokeWidth="6"
                strokeLinejoin="round"
              />
              {/* Top Chevron: Vibrant Gold #FEC90E */}
              <path
                d="M80 20 L134 46 L120 62 L80 42 L40 62 L26 46 Z"
                fill="#FEC90E"
                stroke="#010101"
                strokeWidth="4"
                strokeLinejoin="round"
              />
              {/* Left Wing: Electric Blue #0B89FD */}
              <path
                d="M34 56 L76 72 L76 112 L44 98 C36 84 34 70 34 56 Z"
                fill="#0B89FD"
                stroke="#010101"
                strokeWidth="4"
                strokeLinejoin="round"
              />
              {/* Right Wing: Arcade Red-Orange #FD3F01 */}
              <path
                d="M126 56 L84 72 L84 112 L116 98 C124 84 126 70 126 56 Z"
                fill="#FD3F01"
                stroke="#010101"
                strokeWidth="4"
                strokeLinejoin="round"
              />
              {/* Center Controller D-Pad */}
              <circle cx="80" cy="84" r="16" fill="#FFFFFF" stroke="#010101" strokeWidth="4" />
              <rect x="76" y="74" width="8" height="20" rx="2" fill="#010101" />
              <rect x="70" y="80" width="20" height="8" rx="2" fill="#010101" />
              {/* Bottom V-Tip */}
              <path
                d="M60 112 L80 146 L100 112 L80 124 Z"
                fill="#0B89FD"
                stroke="#010101"
                strokeWidth="4"
                strokeLinejoin="round"
              />
            </svg>

            {/* Wordmark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1
                style={{
                  fontSize: 88,
                  fontWeight: 900,
                  color: '#010101',
                  letterSpacing: '-1px',
                  margin: 0
                }}
              >
                FETO
              </h1>
              <h1
                style={{
                  fontSize: 88,
                  fontWeight: 900,
                  color: '#0B89FD',
                  letterSpacing: '-1px',
                  margin: 0
                }}
              >
                GAMES
              </h1>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: '#FEC90E',
                  border: '4px solid #010101',
                  boxShadow: '2px 2px 0px #010101'
                }}
              />
            </div>
          </div>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 32,
              fontWeight: 900,
              color: '#010101',
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
              fontWeight: 700,
              color: '#525252',
              margin: 0,
              textAlign: 'center'
            }}
          >
            Who Is Imposter? • Draw & Guess • Quiz Battle • Hot Potato • Sip or Spill 🥤
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
            { label: '🎮 10 Full Party Games', color: '#0B89FD', bg: '#FFFFFF' },
            { label: '👥 Up to 15 Players', color: '#010101', bg: '#FEC90E' },
            { label: '⚡ Zero Downloads Required', color: '#010101', bg: '#FFFFFF' },
            { label: '🥤 Sip Edition & Sabotage', color: '#FFFFFF', bg: '#FD3F01' }
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: '10px 22px',
                borderRadius: 14,
                background: item.bg,
                border: '3px solid #010101',
                boxShadow: '3px 3px 0px #010101',
                color: item.color,
                fontSize: 16,
                fontWeight: 900
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
            borderTop: '2px solid #010101'
          }}
        >
          <span style={{ color: '#525252', fontSize: 16, fontWeight: 800 }}>
            Play Instantly in Your Mobile or Desktop Browser
          </span>
          <span style={{ color: '#0B89FD', fontSize: 20, fontWeight: 900, letterSpacing: '1px' }}>
            fetogames.com
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
