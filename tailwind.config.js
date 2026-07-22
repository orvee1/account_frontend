/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          hover: "hsl(var(--secondary-hover))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          hover: "hsl(var(--accent-hover))",
        },
        highlight: {
          /* Added for new colorful theme */ DEFAULT: "hsl(var(--highlight))",
          foreground: "hsl(var(--highlight-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /* Custom ECB Colors from CSS variables */
        "ecb-background": "hsl(var(--ecb-background))",
        "ecb-foreground": "hsl(var(--ecb-foreground))",
        "ecb-primary": "hsl(var(--ecb-primary))",
        "ecb-primary-foreground": "hsl(var(--ecb-primary-foreground))",
        "ecb-secondary": "hsl(var(--ecb-secondary))",
        "ecb-secondary-foreground": "hsl(var(--ecb-secondary-foreground))",
        "ecb-accent": "hsl(var(--ecb-accent))",
        "ecb-accent-foreground": "hsl(var(--ecb-accent-foreground))",
        "ecb-highlight": "hsl(var(--ecb-highlight))",
        "ecb-highlight-foreground": "hsl(var(--ecb-highlight-foreground))",
        "ecb-textDark": "hsl(var(--ecb-textDark))",
        "ecb-textLight": "hsl(var(--ecb-textLight))",
        "ecb-border": "hsl(var(--ecb-border))",
        "ecb-input": "hsl(var(--ecb-input))",
        "ecb-ring": "hsl(var(--ecb-ring))",

        /* Dark mode specific custom colors (also from CSS vars) */
        "dark-background": "hsl(var(--dark-background))",
        "dark-foreground": "hsl(var(--dark-foreground))",
        "dark-primary": "hsl(var(--dark-primary))",
        "dark-primary-foreground": "hsl(var(--dark-primary-foreground))",
        "dark-primary-hover": "hsl(var(--dark-primary-hover))",
        "dark-secondary": "hsl(var(--dark-secondary))",
        "dark-secondary-foreground": "hsl(var(--dark-secondary-foreground))",
        "dark-secondary-hover": "hsl(var(--dark-secondary-hover))",
        "dark-accent": "hsl(var(--dark-accent))",
        "dark-accent-foreground": "hsl(var(--dark-accent-foreground))",
        "dark-accent-hover": "hsl(var(--dark-accent-hover))",
        "dark-textDark": "hsl(var(--dark-textDark))",
        "dark-textLight": "hsl(var(--dark-textLight))",
        "dark-card": "hsl(var(--dark-card))",
        "dark-card-foreground": "hsl(var(--dark-card-foreground))",
        "dark-popover": "hsl(var(--dark-popover))",
        "dark-popover-foreground": "hsl(var(--dark-popover-foreground))",
        "dark-border": "hsl(var(--dark-border))",
        "dark-input": "hsl(var(--dark-input))",
        "dark-ring": "hsl(var(--dark-ring))",
        "dark-muted": "hsl(var(--dark-muted))",
        "dark-muted-foreground": "hsl(var(--dark-muted-foreground))",
        "dark-destructive": "hsl(var(--dark-destructive))",
        "dark-destructive-foreground":
          "hsl(var(--dark-destructive-foreground))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: "hsl(var(--foreground))",
            a: {
              color: "hsl(var(--primary))",
              "&:hover": {
                color: "hsl(var(--primary-hover))",
              },
            },
            h1: { color: "hsl(var(--primary))" },
            h2: { color: "hsl(var(--primary))" },
            h3: { color: "hsl(var(--primary))" },
          },
        },
        dark: {
          css: {
            color: "hsl(var(--dark-foreground))",
            a: {
              color: "hsl(var(--dark-primary))",
              "&:hover": {
                color: "hsl(var(--dark-primary-hover))",
              },
            },
            h1: { color: "hsl(var(--dark-primary))" },
            h2: { color: "hsl(var(--dark-primary))" },
            h3: { color: "hsl(var(--dark-primary))" },
          },
        },
      }),
    },
  },
   plugins: [],
};
