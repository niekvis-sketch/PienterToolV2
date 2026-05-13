/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', '"SF Mono"', 'Menlo', 'monospace'],
      },
      colors: {
        // Pienter = sage green (Veld --primary). Bestaande bg-pienter-* / text-pienter-*
        // mappings blijven werken, maar tonen nu de Veld-kleuren.
        pienter: {
          50: '#E5F0E7',
          100: '#C9E0CE',
          200: '#A8CCAF',
          300: '#8BB592',
          400: '#6DA378',
          500: '#53935E',
          600: '#467F51',
          700: '#3B6E44',
          800: '#2F5736',
          900: '#23402A',
          950: '#152918',
        },
        // Decoratieve roze accent
        accent: {
          50:  '#FDF4F7',
          100: '#FCE9EE',
          200: '#F9D2DB',
          300: '#F6BDCA',
          400: '#F0A6B7',
          500: '#E58FA4',
          600: '#C56D85',
          700: '#B85674',
          800: '#8E3F58',
          900: '#5C2839',
        },
        // Amber highlight voor pop-tags
        highlight: {
          50:  '#FFF5E0',
          100: '#FFE9CC',
          200: '#FFD299',
          300: '#FFB866',
          400: '#FFAB40',
          500: '#F39A28',
          600: '#E08815',
          700: '#9C5A0E',
        },
        // Warme neutrals
        cream: {
          50:  '#FFFFFF',
          100: '#FAF8F3',
          200: '#F9F7F2',
          300: '#F3F0E8',
          400: '#ECE7DA',
          500: '#D9D2C0',
        },
        ink: {
          DEFAULT: '#1F2A22',
          2: '#4E5A50',
          3: '#828B82',
          mute: '#B0B6AE',
        },
      },
      borderRadius: {
        veld: '6px',
      },
      boxShadow: {
        'veld-1': '0 1px 0 rgba(20,36,27,0.04), 0 1px 2px rgba(20,36,27,0.04)',
        'veld-2': '0 1px 0 rgba(20,36,27,0.04), 0 6px 16px -6px rgba(20,36,27,0.10)',
        'veld-3': '0 2px 0 rgba(20,36,27,0.04), 0 18px 32px -12px rgba(20,36,27,0.14)',
      },
    },
  },
  plugins: [],
}
