import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mavora: {
          navy: '#0B1F3A',
          blue: '#1769FF',
          teal: '#00C2B8',
          charcoal: '#17202A',
          light: '#F4F7FA',
        },
      },
    },
  },
  plugins: [],
};

export default config;