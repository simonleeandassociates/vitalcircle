/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fef7ee',
          100: '#fdecd3',
          200: '#fad5a5',
          300: '#f7b76b',
          400: '#f3902e',
          500: '#f0720e',
          600: '#e15809',
          700: '#ba4009',
          800: '#94330f',
          900: '#782c0f',
        },
        warm: {
          50:  '#fdfaf7',
          100: '#faf3ea',
          200: '#f3e2cc',
          300: '#e9caA3',
          400: '#dcaf73',
          500: '#d09050',
          600: '#c27840',
          700: '#a25e35',
          800: '#834c30',
          900: '#6b3f2a',
        },
      },
      fontSize: {
        base: ['18px', '1.6'],
        lg:   ['20px', '1.6'],
        xl:   ['22px', '1.6'],
        '2xl':['26px', '1.4'],
        '3xl':['30px', '1.3'],
        '4xl':['36px', '1.2'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
}

