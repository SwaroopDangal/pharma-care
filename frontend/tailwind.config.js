/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eafaf1',
          100: '#d5f5e3',
          200: '#abebc6',
          300: '#82e0aa',
          400: '#58d68d',
          500: '#2ecc71',
          600: '#27ae60',
          700: '#1e8449',
          800: '#196f3d',
          900: '#145a32',
        },
        secondary: {
          50: '#eaf4fc',
          100: '#d4e9f9',
          200: '#a9d4f3',
          300: '#7ebeec',
          400: '#5dade2',
          500: '#3498db',
          600: '#2e86c1',
          700: '#2471a3',
          800: '#1a5276',
          900: '#154360',
        },
        slate: {
          850: '#1a2332',
        },
        background: '#F8FAFC',
        textDark: '#1F2937',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.12)',
      }
    },
  },
  plugins: [],
};
