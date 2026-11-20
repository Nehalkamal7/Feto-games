import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/shared-types/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        bauhaus: {
          canvas: '#F8F8F8',
          white: '#FFFFFF',
          black: '#010101',
          blue: '#0B89FD',
          yellow: '#FEC90E',
          red: '#FD3F01',
          muted: '#E5E5E5',
          darkMuted: '#525252'
        },
        feto: {
          dark: '#F8F8F8', // Crisp Off-White canvas
          card: '#FFFFFF', // Pure White elevated card surfaces
          cardHover: '#F4F4F5',
          border: '#010101', // Jet Black borders
          blue: '#0B89FD', // Electric Blue primary action
          yellow: '#FEC90E', // Vibrant Gold/Yellow accent
          red: '#FD3F01', // Punchy Red-Orange alert/timer
          cyan: '#0B89FD',
          magenta: '#FD3F01',
          purple: '#0B89FD',
          green: '#10B981',
          orange: '#FD3F01'
        }
      },
      boxShadow: {
        'neo': '4px 4px 0px #010101',
        'neo-sm': '2px 2px 0px #010101',
        'neo-lg': '6px 6px 0px #010101',
        'neo-xl': '8px 8px 0px #010101',
        'neo-blue': '4px 4px 0px #0B89FD',
        'neo-yellow': '4px 4px 0px #FEC90E',
        'neo-red': '4px 4px 0px #FD3F01',
        'neon-cyan': '4px 4px 0px #010101',
        'neon-magenta': '4px 4px 0px #FD3F01',
        'neon-yellow': '4px 4px 0px #FEC90E',
        'neon-green': '4px 4px 0px #010101',
        'neon-purple': '4px 4px 0px #010101',
        'neon-gold': '4px 4px 0px #FEC90E'
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 4s ease-in-out infinite',
        'wiggle': 'wiggle 0.5s ease-in-out infinite'
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 10px rgba(0, 240, 255, 0.8))' },
          '50%': { opacity: '0.6', filter: 'drop-shadow(0 0 2px rgba(0, 240, 255, 0.3))' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' }
        }
      }
    },
  },
  plugins: [],
};

export default config;
