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
          background: '#090D16',
          borderRadius: 8
        }}
      >
        <svg width="26" height="26" viewBox="0 0 100 100" fill="none">
          <defs>
            <linearGradient id="iconWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38F2FF" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
            <linearGradient id="iconCoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F0FF" />
              <stop offset="100%" stopColor="#38F2FF" />
            </linearGradient>
          </defs>

          {/* Outer Shield Wings */}
          <path
            d="M50 12 L88 28 L78 68 L50 94 L22 68 L12 28 Z"
            fill="none"
            stroke="url(#iconWingGrad)"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Inner Geometric Monogram FG Shield */}
          <path
            d="M50 24 L76 36 L68 64 L50 82 L32 64 L24 36 Z"
            fill="#090D16"
            stroke="url(#iconCoreGrad)"
            strokeWidth="4"
          />

          {/* Sharp Center V-Tip */}
          <path
            d="M50 50 L64 38 L50 78 L36 38 Z"
            fill="url(#iconWingGrad)"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
