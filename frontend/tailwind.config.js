/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nexus: {
          bg: '#f8fafc',      // Slate 50 (Very light gray background)
          card: '#ffffff',    // Pure white for cards
          primary: '#4f46e5', // Indigo 600 (Primary Action Color)
          text: '#1e293b',    // Slate 800 (Dark text for readability)
          subtext: '#64748b', // Slate 500 (Muted text)
        },
        glass: {
          100: 'rgba(255, 255, 255, 0.7)', // Frosted white
          border: 'rgba(226, 232, 240, 0.8)', // Light border
        }
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)', // Gentle shadow
      }
    },
  },
  plugins: [],
}