import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#010101',
          borderRadius: 8
        }}
      >
        <svg width="28" height="28" viewBox="0 0 160 160" fill="none">
          {/* Main Shield Body */}
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

          {/* Bottom V-Tip: Electric Blue #0B89FD */}
          <path
            d="M60 112 L80 146 L100 112 L80 124 Z"
            fill="#0B89FD"
            stroke="#010101"
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
