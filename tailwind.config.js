/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#07090E',
        card: '#0F131C',
        cardLight: '#181F2E',
        border: '#1F2A3D',
        primary: {
          DEFAULT: '#00F2FE', // electric bright cyan
          glow: '#00F2FE',
        },
        secondary: {
          DEFAULT: '#94A3B8', // muted slate
          glow: '#38BDF8',
        },
        accent: {
          DEFAULT: '#A855F7', // dynamic violet
          glow: '#C084FC',
        },
        cyberRed: '#FF2A74',
        cyberGreen: '#00E676',
        gold: '#FFD700',
        silver: '#C0C0C0',
        bronze: '#CD7F32'
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-primary': '0 0 15px rgba(0, 242, 254, 0.25)',
        'glow-primary-hover': '0 0 25px rgba(0, 242, 254, 0.5)',
        'glow-accent': '0 0 15px rgba(168, 85, 247, 0.25)',
        'glow-accent-hover': '0 0 25px rgba(168, 85, 247, 0.5)',
        'glow-red': '0 0 15px rgba(255, 42, 116, 0.25)',
        'glow-green': '0 0 15px rgba(0, 230, 118, 0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-slow': 'glow 3s ease-in-out infinite alternate',
        'marquee': 'marquee 30s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 242, 254, 0.15), 0 0 10px rgba(0, 242, 254, 0.1)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 242, 254, 0.4), 0 0 40px rgba(0, 242, 254, 0.2)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      }
    },
  },
  plugins: [],
}
