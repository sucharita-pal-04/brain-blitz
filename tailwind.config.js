/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: { ink: '#080511', neon: '#7c3aed', cyan: '#22d3ee', hot: '#f472b6' },
      fontFamily: { display: ['Orbitron', 'sans-serif'], body: ['Inter', 'sans-serif'] },
      boxShadow: { neon: '0 0 24px rgba(34,211,238,.28)', purple: '0 0 28px rgba(124,58,237,.35)' }
    }
  },
  plugins: []
};
