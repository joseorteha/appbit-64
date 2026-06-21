import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#121414',
          dim:     '#0c0f0f',
          low:     '#1a1c1c',
          mid:     '#1e2020',
          high:    '#282a2b',
          top:     '#333535',
          bright:  '#37393a',
        },
        primary: {
          DEFAULT: '#8aebff',
          dim:     '#2fd9f4',
          on:      '#00363e',
        },
        outline: {
          DEFAULT: '#859397',
          dim:     '#3c494c',
          variant: '#3c494c',
        },
        // MD3 tokens used by Spatial Glass mockups
        secondary: '#ffb2b7',
        error: '#ffb4ab',
        'error-container': '#93000a',
        'tertiary-container': '#ffb13b',
        'on-surface': '#e2e2e2',
        'on-surface-variant': '#bbc9cd',
        'surface-container': '#1e2020',
        'surface-container-high': '#282a2b',
        'surface-container-highest': '#333535',
        'surface-container-lowest': '#0c0f0f',
        'surface-container-low': '#1a1c1c',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        squircle: '1.5rem',
        dock:     '9999px',
      },
    },
  },
  plugins: [],
} satisfies Config
