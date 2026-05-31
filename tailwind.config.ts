import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-syne)', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
      colors: {
        // New light theme colors
        paper: '#F8F7F4',
        ink: '#1E1E1E',
        line: '#E5E5E0',
        primary: '#2563EB',
        'surface-blue': '#ffffff',
        'surface-green': '#ECFDF5',
        muted: '#6B7280',
        
        // Keep dark theme colors for potential dark mode
        void:    '#050508',
        deep:    '#090910',
        panel:   '#0f0f1a',
        surface: '#141424',
        raised:  '#1a1a2e',
        acid:    '#39ff8f',
        plasma:  '#00d4ff',
        violet:  '#c77dff',
        bio:     '#ff6b35',
        danger:  '#ff3b5c',
        warn:    '#ffca3a',
      },
      backgroundImage: {
        'grid-dim': "linear-gradient(rgba(229,229,224,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(229,229,224,0.5) 1px,transparent 1px)",
      },
      backgroundSize: {
        'grid': '44px 44px',
      },
      animation: {
        'shimmer': 'shimmer 3s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
