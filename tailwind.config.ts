
import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
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
      fontFamily: {
        body: ['Plus Jakarta Sans', 'sans-serif'],
        headline: ['Poppins', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--theme-background))',
        foreground: 'hsl(var(--theme-foreground))',
        card: {
          DEFAULT: 'hsl(var(--theme-card))',
          foreground: 'hsl(var(--theme-card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--theme-popover))',
          foreground: 'hsl(var(--theme-popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--theme-primary))',
          foreground: 'hsl(var(--theme-primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--theme-secondary))',
          foreground: 'hsl(var(--theme-secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--theme-muted))',
          foreground: 'hsl(var(--theme-muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--theme-accent))',
          foreground: 'hsl(var(--theme-accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--theme-destructive))',
          foreground: 'hsl(var(--theme-destructive-foreground))',
        },
        border: 'hsl(var(--theme-border))',
        input: 'hsl(var(--theme-input))',
        ring: 'hsl(var(--theme-ring))',
        chart: {
          '1': 'hsl(var(--theme-chart-1))',
          '2': 'hsl(var(--theme-chart-2))',
          '3': 'hsl(var(--theme-chart-3))',
          '4': 'hsl(var(--theme-chart-4))',
          '5': 'hsl(var(--theme-chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--theme-sidebar-background))',
          foreground: 'hsl(var(--theme-sidebar-foreground))',
          primary: 'hsl(var(--theme-sidebar-primary))',
          'primary-foreground': 'hsl(var(--theme-sidebar-primary-foreground))',
          accent: 'hsl(var(--theme-sidebar-accent))',
          'accent-foreground': 'hsl(var(--theme-sidebar-accent-foreground))',
          border: 'hsl(var(--theme-sidebar-border))',
          ring: 'hsl(var(--theme-sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
