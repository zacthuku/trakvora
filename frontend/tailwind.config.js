/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#041627",
        "primary-container": "#1a2b3c",
        secondary: "#fe6a34",
        "secondary-container": "#fe6a34",
        "tertiary-fixed-dim": "#4fdbcc",
        surface: "#f8f9fa",
        "surface-variant": "#e8ecef",
        outline: "#8a9199",
        error: "#ef4444",
        success: "#4fdbcc",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Space Grotesk", "system-ui", "sans-serif"],
        "data-mono": ["Space Grotesk", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem",
      },
    },
  },
  plugins: [],
};
