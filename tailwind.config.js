/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        obsidian: "#0d0a0e",
        void: "#110d12",
        surface: "#1a1520",
        card: "#211b27",
        border: "#2e2535",
        gold: "#c9a96e",
        "gold-light": "#e0c992",
        burgundy: "#7c2d3e",
        "burgundy-light": "#a63d52",
        sage: "#8e9e7a",
        mist: "#9b8ab4",
        rose: "#b87c8a",
        text: "#e8dff0",
        muted: "#9e8fb0",
        subtle: "#6b5f7a",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      backgroundImage: {
        "grain": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
