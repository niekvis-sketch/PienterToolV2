/** @type {import('tailwindcss').Config} */

// Kompas design system — Tailwind-thema.
// Bron van waarheid: client/src/styles/kompas/*.css (kopie van "Kompas Design System/tokens").
//
// De standaard Tailwind-paletten (gray, green, red, blue, amber, …) zijn hieronder
// bewust overschreven met Kompas-tinten. Zo volgt élke bestaande utility-class
// (bv. `text-gray-500`, `bg-green-100`) automatisch het design system: warme
// neutrals i.p.v. koud grijs, warm getinte statuskleuren i.p.v. neon.
// Nieuwe code: gebruik bij voorkeur de Kompas-namen (`pienter`, `ink`, `cream`,
// `accent`, `highlight`) of de CSS-variabelen (`var(--primary-strong)` etc.).

// Sage groen. 500 = merk-identiteit (#48B070, decoratief / fills / focus).
// 600 = --primary-strong (#2C7D49): knoppen, groene tekst, actieve nav — AA met wit.
const sage = {
  50: '#F2FAF5',
  100: '#E9F5EE', // --primary-soft
  200: '#CCE9D7', // --primary-soft-2
  300: '#9FD5B3',
  400: '#6FC290',
  500: '#48B070', // --primary
  600: '#2C7D49', // --primary-strong
  700: '#24673C', // --primary-strong-hover
  800: '#1D5331', // --primary-strong-press
  900: '#163F26',
  950: '#0F2A19',
}

// Warme neutrals, afgestemd op --line / --ink-* .
const warmGray = {
  50: '#FAF8F3', // --surface-2
  100: '#F3F0E8', // --bg-elev
  200: '#ECE7DA', // --line
  300: '#D9D2C0', // --line-strong
  400: '#9AA198', // tussen --ink-mute en --ink-3 (meta-tekst blijft leesbaar)
  500: '#828B82', // --ink-3
  600: '#4E5A50', // --ink-2
  700: '#3A463D',
  800: '#2A352D',
  900: '#1F2A22', // --ink
  950: '#141C16',
}

// Statuskleuren (warm getint).
const danger = {
  50: '#FBF1F1',
  100: '#F4DEDE', // --danger-soft
  200: '#EBC2C2',
  300: '#DC9A9A',
  400: '#CC6B6B',
  500: '#C04C4C',
  600: '#B83A3A', // --danger
  700: '#9F3232',
  800: '#812A2A',
  900: '#662323',
}

const info = {
  50: '#F0F4FA',
  100: '#E0E8F4', // --info-soft
  200: '#C3D3EA',
  300: '#9AB5DC',
  400: '#6D93CB',
  500: '#4F7FC2',
  600: '#3D6EB8', // --info
  700: '#325B99',
  800: '#29497A',
  900: '#213A61',
}

const warning = {
  50: '#FBF5EC',
  100: '#F6EAD7', // --warning-soft
  200: '#EDD3B0',
  300: '#E0B585',
  400: '#D4985C',
  500: '#C77F3D', // --warning
  600: '#AD6A2E',
  700: '#8E5626',
  800: '#70441F',
  900: '#553418',
}

// Amber highlight (tags / pop).
const amber = {
  50: '#FFF7EB',
  100: '#FFE9CC', // --highlight-soft
  200: '#FFD299',
  300: '#FFBD66',
  400: '#FFAB40', // --highlight
  500: '#F39A28', // --highlight-hover
  600: '#E08815', // --highlight-press
  700: '#B86A0F',
  800: '#8F520C',
  900: '#6B3E0A',
}

// Zachte roze accent (decoratief). 700 = --accent-deep, leesbaar op wit.
const rose = {
  50: '#FDF4F7',
  100: '#FCE9EE', // --accent-soft
  200: '#F9D2DB', // --accent-soft-2
  300: '#F6BDCA', // --accent
  400: '#F0A6B7', // --accent-hover
  500: '#E58FA4', // --accent-press
  600: '#C56D85',
  700: '#B85674', // --accent-deep
  800: '#8E3F58',
  900: '#5C2839',
}

// Lila (Kompas accent-variant) voor de enkele paarse categorie-tags.
const lilac = {
  50: '#F7F4FC',
  100: '#EFE9F8',
  200: '#DECEEC',
  300: '#C9B6E8',
  400: '#B69FDC',
  500: '#9D85C6',
  600: '#8069B3',
  700: '#6A53A0',
  800: '#54417F',
  900: '#3F3160',
}

const shadow1 = '0 1px 0 rgba(20,36,27,0.04), 0 1px 2px rgba(20,36,27,0.04)'
const shadow2 = '0 1px 0 rgba(20,36,27,0.04), 0 6px 16px -6px rgba(20,36,27,0.10)'
const shadow3 = '0 2px 0 rgba(20,36,27,0.04), 0 18px 32px -12px rgba(20,36,27,0.14)'

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', '"SF Mono"', 'Menlo', 'monospace'],
      },
      colors: {
        // Kompas-namen
        pienter: sage,
        accent: rose,
        highlight: amber,
        cream: {
          50: '#FFFFFF', // --surface
          100: '#FAF8F3', // --surface-2
          200: '#F9F7F2', // --bg
          300: '#F3F0E8', // --bg-elev
          400: '#ECE7DA', // --line
          500: '#D9D2C0', // --line-strong
        },
        ink: {
          DEFAULT: '#1F2A22',
          2: '#4E5A50',
          3: '#828B82',
          mute: '#B0B6AE',
        },

        // Standaard Tailwind-paletten → Kompas
        black: '#1F2A22', // nooit puur zwart; ook voor overlays (bg-black/30)
        gray: warmGray,
        slate: warmGray,
        zinc: warmGray,
        neutral: warmGray,
        stone: warmGray,
        green: sage,
        emerald: sage,
        teal: sage,
        lime: sage,
        red: danger,
        rose,
        pink: rose,
        blue: info,
        sky: info,
        cyan: info,
        indigo: info,
        amber,
        yellow: amber,
        orange: warning,
        purple: lilac,
        violet: lilac,
        fuchsia: lilac,
      },
      borderRadius: {
        // Kompas: subtiel 4 / 6 / 8 / 12px. Tailwind rounded / -md / -lg / -xl
        // vallen daar al op; alles groter wordt afgetopt op 12px.
        '2xl': '12px',
        '3xl': '12px',
        veld: '6px',
      },
      boxShadow: {
        // Papier-zachte, warm getinte schaduwen in drie stappen.
        sm: shadow1,
        DEFAULT: shadow1,
        md: shadow2,
        lg: shadow3,
        xl: shadow3,
        '2xl': shadow3,
        1: shadow1,
        2: shadow2,
        3: shadow3,
        'veld-1': shadow1,
        'veld-2': shadow2,
        'veld-3': shadow3,
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
    },
  },
  plugins: [],
}
