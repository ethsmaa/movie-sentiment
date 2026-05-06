import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper:        '#efe5cd',
        'paper-2':    '#f7efd9',
        'paper-dark': '#e5d9be',
        ink:          '#1b1612',
        'ink-soft':   '#3d342a',
        red:          { DEFAULT: '#9b2614', deep: '#7a1c10' },
        amber:        { DEFAULT: '#e8a23a', deep: '#7a4d10' },
        teal:         '#2b8a8e',
        kraft:        '#8a6a3a',
        green:        '#3d6b3a',
        tape: {
          1: '#9b2614',
          2: '#e8a23a',
          3: '#2b8a8e',
          4: '#3d6b3a',
          5: '#6b3a8a',
        },
      },
      fontFamily: {
        display: ['Anton', 'Impact', '"Arial Narrow"', 'sans-serif'],
        serif:   ['"Playfair Display"', 'Georgia', 'serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'monospace'],
        body:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'meta-xxs': ['8px',   { lineHeight: '1',    letterSpacing: '1.5px' }],
        'meta-xs':  ['9px',   { lineHeight: '1',    letterSpacing: '1.5px' }],
        'meta-sm':  ['10px',  { lineHeight: '1',    letterSpacing: '1.5px' }],
        'meta':     ['11px',  { lineHeight: '1',    letterSpacing: '1px'   }],
        'body-sm':  ['13px',  { lineHeight: '1.5'                          }],
        'tape':     ['16px',  { lineHeight: '1.05', letterSpacing: '0.4px' }],
        'd-xs':     ['40px',  { lineHeight: '1.05', letterSpacing: '0.5px' }],
        'd-s':      ['48px',  { lineHeight: '1' }],
        'd-m':      ['56px',  { lineHeight: '1' }],
        'd-l':      ['72px',  { lineHeight: '0.95' }],
        'd-xl':     ['120px', { lineHeight: '0.9',  letterSpacing: '-1px'  }],
        'hero':     ['96px',  { lineHeight: '0.92', letterSpacing: '-0.5px' }],
      },
      boxShadow: {
        vhs:      '4px 4px 0 #1b1612',
        'vhs-sm': '3px 3px 0 rgba(27, 22, 18, 0.3)',
        'vhs-lg': '6px 6px 0 #1b1612',
      },
      transitionTimingFunction: {
        vhs: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      transitionDuration: {
        120: '120ms',
        180: '180ms',
        260: '260ms',
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          from: { backgroundPosition: '-200px 0' },
          to:   { backgroundPosition: 'calc(200px + 100%) 0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
