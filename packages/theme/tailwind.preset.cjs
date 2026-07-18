/** Shared WordVrs cosmic design tokens, consumed by both the Writer and Reader apps. */
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "var(--wv-bg)",
        surface: "var(--wv-surface)",
        surface2: "var(--wv-surface-2)",
        primary: {
          DEFAULT: "var(--wv-primary)",
          fg: "var(--wv-primary-fg)",
        },
        secondary: "var(--wv-secondary)",
        accent: "var(--wv-accent)",
        text: "var(--wv-text)",
        muted: "var(--wv-muted)",
        border: "var(--wv-border)",
        danger: "var(--wv-danger)",
        success: "var(--wv-success)",
      },
      fontFamily: {
        display: ["Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Source Serif 4", "Georgia", "ui-serif", "serif"],
      },
      boxShadow: {
        glow: "0 0 60px -15px var(--wv-primary)",
        card: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -8px rgba(20,10,60,0.12)",
      },
      backgroundImage: {
        cosmic:
          "radial-gradient(ellipse 80% 50% at 50% -10%, var(--wv-nebula-1), transparent 60%), radial-gradient(ellipse 60% 40% at 100% 100%, var(--wv-nebula-2), transparent 55%)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
};
