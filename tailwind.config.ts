import type { Config } from 'tailwindcss';

// NVIDIA-green identity ("Jensen" theme). The app historically leaned on blue —
// both the `brand` token and ~480 raw `blue-*` utilities. Rather than sweep
// every class, we re-point the palette at the source: `blue` and `brand` both
// resolve to an NVIDIA-green (yellow-green) scale, so the whole UI turns green
// at once. `green`/`emerald` are intentionally left as their own (bluer) hue so
// success states stay distinguishable from the new lime-green chrome.
const nvidia = {
  50: '#f4f9e9',
  100: '#e4f2c9',
  200: '#cde79b',
  300: '#b1d96a',
  400: '#98cc3f',
  500: '#76b900', // NVIDIA green — the signature accent
  600: '#4e7a00', // readable on white for text / 600-weight chrome
  700: '#3e6100',
  800: '#324e00',
  900: '#283e00',
};

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Re-point both the brand token and Tailwind's blue at NVIDIA green.
        brand: nvidia,
        blue: nvidia,
        // Kept as a distinct, bluer success hue so "done / on-track" never
        // collapses into the lime brand chrome.
        forest: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#43A047',
          600: '#388E3C',
          700: '#2E7D32',
          800: '#1B5E20',
          900: '#1A4A1F',
        },
      },
      backgroundImage: {
        'alembic-gradient': 'linear-gradient(135deg, #283e00 0%, #4e7a00 60%, #76b900 100%)',
        'progress-gradient': 'linear-gradient(90deg, #4e7a00, #76b900)',
        'chevron-gradient': 'linear-gradient(135deg, #4e7a00 0%, #324e00 100%)',
      },
      boxShadow: {
        brand: '0 4px 14px 0 rgba(118, 185, 0, 0.28)',
        forest: '0 4px 14px 0 rgba(67, 160, 71, 0.20)',
        card: '0 1px 3px 0 rgba(40, 62, 0, 0.08), 0 1px 2px -1px rgba(40,62,0,0.04)',
      },
      // Dialog widths. Every modal in the app uses one of these two tokens —
      // they MUST exist here: an undefined max-w-* class emits nothing, and a
      // `w-full` dialog then silently stretches to the whole viewport (the
      // "giant horizontal dialog" bug).
      maxWidth: {
        modal: '34rem', // 544px — forms with explanatory copy (sign-offs)
        'modal-sm': '27rem', // 432px — confirmations and single-field prompts
      },
    },
  },
  plugins: [],
};

export default config;
