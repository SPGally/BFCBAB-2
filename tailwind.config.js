/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'barnsley-red': '#E31837',
        'barnsley-dark': '#1A1A1A',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#1A1A1A',
            a: {
              color: '#E31837',
              '&:hover': {
                color: '#B31329',
              },
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/line-clamp'),
  ],
};