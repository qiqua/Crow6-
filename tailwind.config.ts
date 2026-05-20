import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#080b12',
        panel: '#0f1420',
        panelSoft: '#151b2b',
        borderSoft: 'rgba(148, 163, 184, 0.18)',
      },
      boxShadow: {
        glow: '0 0 40px rgba(56, 189, 248, 0.18)',
      },
    },
  },
  plugins: [],
} satisfies Config;
