/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Core Brand Tokens
        brand: {
          primary: '#6366F1',   // Header, "+" button, focus rings
          accent: '#06B6D4',    // Highlights, hover states, links
        },

        // Surface Hierarchy
        surface: {
          page: '#0D0E11',      // Page background
          card: '#16181D',      // Card background
          border: '#2A2E37',    // Subtle border on cards / empty states
        },

        // Typography Tokens
        text: {
          primary: '#F8FAFC',   // Body text[cite: 1]
          muted: '#94A3B8',     // Captions, dates, counts[cite: 1]
        },

        // Task Type Accent Colors (Milestone 6: tag-style)
        type: {
          feature: '#10B981',   // Feature cards (accent stripe + icon)[cite: 1]
          bug: '#EC4899',       // Bug cards (accent stripe + icon)[cite: 1]
        },

        // Due-Date Time States (Milestone 8: due-tint)
        due: {
          safe: '#3B82F6',      // More than 2 days out[cite: 1]
          warning: '#F59E0B',   // Less than 24 hours[cite: 1]
          overdue: '#EF4444',   // Past due[cite: 1]
          neutral: '#475569',   // Done (overrides date)[cite: 1]
        },
      },
      fontFamily: {
        heading: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
