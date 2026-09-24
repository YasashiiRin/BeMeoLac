/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#FBF4E8',
          light: '#FFF8F5',
        },
        parchment: {
          DEFAULT: '#F6EBDD',
          light: '#FFF8F5',
          dim: '#EFE1CF',
        },
        walnut: {
          DEFAULT: '#A67B5B',
          dark: '#7A563C',
          soft: '#C4A482',
        },
        oak: {
          DEFAULT: '#D9B99B',
          light: '#ECDBCB',
        },
        cocoa: {
          DEFAULT: '#5E4636',
          dark: '#3A2B20',
          light: '#806350',
          muted: '#9E8574',
        },
        honey: {
          DEFAULT: '#F3D38A',
          deep: '#D7B973',
          light: '#FDE8B5',
        },
        blush: {
          DEFAULT: '#F2A7B5',
          light: '#F4C2C2',
          soft: '#FEB2C0',
          deep: '#894D59',
        },
        sage: {
          DEFAULT: '#A8C49A',
          light: '#C2D9B7',
          dark: '#4C6542',
        },
        leaf: {
          DEFAULT: '#7FAF6B',
          dark: '#588746',
        },
        mint: {
          DEFAULT: '#CFE8D5',
          light: '#E4F3E8',
        },
        apricot: {
          DEFAULT: '#F6B98B',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'Cambria', 'serif'],
        sans: ['"Nunito Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'arch': '9999px',
        'arch-card': '2.5rem',
      },
    },
  },
  plugins: [],
}
