import defaultTheme from "tailwindcss/defaultTheme"

export default {
  // ... rest of your config (content, plugins, etc.)
  theme: {
    extend: {
      fontFamily: {
        // Access fontFamily from the defaultTheme object
        sans: ["var(--font-inter)", ...defaultTheme.fontFamily.sans],
        heading: ["var(--font-space)", ...defaultTheme.fontFamily.sans],
      },
    },
  },
}