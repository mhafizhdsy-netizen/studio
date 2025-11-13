
type CssVars = {
  [key: string]: string;
};

export type Theme = {
  name: ThemeName;
  displayName: string;
  cssVars: CssVars;
};

export type ThemeName =
  | "misty-blue"
  | "latte-cream"
  | "sage-garden"
  | "soft-lavender"
  | "arctic-gray"
  | "coral-peach"
  | "midnight-calm"
  | "default-dark";

const defaultDarkTheme: Theme = {
  name: "default-dark",
  displayName: "Default Dark",
  cssVars: {
    "--theme-background": "0 0% 11%",
    "--theme-foreground": "0 0% 98%",
    "--theme-card": "0 0% 11%",
    "--theme-card-foreground": "0 0% 98%",
    "--theme-popover": "0 0% 11%",
    "--theme-popover-foreground": "0 0% 98%",
    "--theme-primary": "201 71% 52%",
    "--theme-primary-foreground": "0 0% 100%",
    "--theme-secondary": "240 3.7% 15.9%",
    "--theme-secondary-foreground": "0 0% 98%",
    "--theme-muted": "240 3.7% 15.9%",
    "--theme-muted-foreground": "240 5% 64.9%",
    "--theme-accent": "150 100% 50%",
    "--theme-accent-foreground": "0 0% 0%",
    "--theme-destructive": "0 62.8% 30.6%",
    "--theme-destructive-foreground": "0 0% 98%",
    "--theme-border": "240 3.7% 15.9%",
    "--theme-input": "240 3.7% 15.9%",
    "--theme-ring": "201 71% 52%",
    "--theme-chart-1": "201 71% 52%",
    "--theme-chart-2": "150 100% 50%",
    "--theme-chart-3": "240 5% 65%",
    "--theme-chart-4": "201 71% 62%",
    "--theme-chart-5": "150 100% 60%",
    "--theme-sidebar-background": "0 0% 11%",
    "--theme-sidebar-foreground": "0 0% 98%",
    "--theme-sidebar-primary": "201 71% 52%",
    "--theme-sidebar-primary-foreground": "0 0% 100%",
    "--theme-sidebar-accent": "240 10% 18%",
    "--theme-sidebar-accent-foreground": "0 0% 98%",
    "--theme-sidebar-border": "240 10% 18%",
    "--theme-sidebar-ring": "201 71% 52%",
  },
};

export const themes: Theme[] = [
  {
    name: "misty-blue",
    displayName: "Misty Blue",
    cssVars: {
      ...defaultDarkTheme.cssVars,
      "--theme-background": "210 40% 98%", // #f7f9fc
      "--theme-foreground": "210 40% 10%", // #1a202c
      "--theme-card": "0 0% 100%",
      "--theme-card-foreground": "210 40% 10%",
      "--theme-popover": "0 0% 100%",
      "--theme-popover-foreground": "210 40% 10%",
      "--theme-primary": "210 50% 45%", // accent: #376996
      "--theme-primary-foreground": "0 0% 100%",
      "--theme-secondary": "210 40% 90%", // #A7C7E7
      "--theme-secondary-foreground": "210 40% 10%",
      "--theme-muted": "210 40% 90%",
      "--theme-muted-foreground": "210 40% 40%",
      "--theme-accent": "210 50% 45%",
      "--theme-accent-foreground": "0 0% 100%",
      "--theme-border": "210 40% 85%", // #DCEFFF
      "--theme-input": "210 40% 85%",
      "--theme-ring": "210 50% 45%",
      "--theme-chart-1": "210 50% 45%",
      "--theme-chart-2": "190 60% 50%",
      "--theme-sidebar-background": "210 40% 15%",
      "--theme-sidebar-foreground": "210 40% 98%",
    },
  },
  {
    name: "latte-cream",
    displayName: "Latte Cream",
    cssVars: {
      ...defaultDarkTheme.cssVars,
      "--theme-background": "33 60% 97%", // #FFF6E9
      "--theme-foreground": "28 30% 20%",
      "--theme-card": "0 0% 100%",
      "--theme-card-foreground": "28 30% 20%",
      "--theme-popover": "0 0% 100%",
      "--theme-popover-foreground": "28 30% 20%",
      "--theme-primary": "33 58% 64%", // accent: #D4A373
      "--theme-primary-foreground": "28 30% 10%",
      "--theme-secondary": "33 100% 89%", // #FFE8C5
      "--theme-secondary-foreground": "28 30% 20%",
      "--theme-muted": "33 100% 89%",
      "--theme-muted-foreground": "28 30% 50%",
      "--theme-accent": "33 58% 64%",
      "--theme-accent-foreground": "28 30% 10%",
      "--theme-border": "33 100% 93%",
      "--theme-input": "33 100% 93%",
      "--theme-ring": "33 58% 64%",
      "--theme-chart-1": "33 58% 64%",
      "--theme-chart-2": "15 50% 60%",
      "--theme-sidebar-background": "33 30% 25%",
      "--theme-sidebar-foreground": "33 60% 97%",
    },
  },
  {
    name: "sage-garden",
    displayName: "Sage Garden",
    cssVars: {
      ...defaultDarkTheme.cssVars,
      "--theme-background": "140 30% 97%", // #E8F3EC
      "--theme-foreground": "140 25% 15%",
      "--theme-card": "0 0% 100%",
      "--theme-card-foreground": "140 25% 15%",
      "--theme-popover": "0 0% 100%",
      "--theme-popover-foreground": "140 25% 15%",
      "--theme-primary": "130 30% 46%", // accent: #5E8D66
      "--theme-primary-foreground": "0 0% 100%",
      "--theme-secondary": "140 50% 85%", // #CFE8D5
      "--theme-secondary-foreground": "140 25% 15%",
      "--theme-muted": "140 50% 85%",
      "--theme-muted-foreground": "140 25% 45%",
      "--theme-accent": "130 30% 46%",
      "--theme-accent-foreground": "0 0% 100%",
      "--theme-border": "140 50% 90%",
      "--theme-input": "140 50% 90%",
      "--theme-ring": "130 30% 46%",
      "--theme-chart-1": "130 30% 46%",
      "--theme-chart-2": "100 30% 50%",
      "--theme-sidebar-background": "140 30% 20%",
      "--theme-sidebar-foreground": "140 30% 97%",
    },
  },
  {
    name: "soft-lavender",
    displayName: "Soft Lavender",
    cssVars: {
      ...defaultDarkTheme.cssVars,
      "--theme-background": "270 100% 97%", // #F3E9FF
      "--theme-foreground": "270 30% 20%",
      "--theme-card": "0 0% 100%",
      "--theme-card-foreground": "270 30% 20%",
      "--theme-popover": "0 0% 100%",
      "--theme-popover-foreground": "270 30% 20%",
      "--theme-primary": "265 70% 65%", // accent: #A678E2
      "--theme-primary-foreground": "0 0% 100%",
      "--theme-secondary": "270 100% 89%", // #E2C6FF
      "--theme-secondary-foreground": "270 30% 20%",
      "--theme-muted": "270 100% 89%",
      "--theme-muted-foreground": "270 30% 50%",
      "--theme-accent": "265 70% 65%",
      "--theme-accent-foreground": "0 0% 100%",
      "--theme-border": "270 100% 93%",
      "--theme-input": "270 100% 93%",
      "--theme-ring": "265 70% 65%",
      "--theme-chart-1": "265 70% 65%",
      "--theme-chart-2": "240 60% 70%",
      "--theme-sidebar-background": "270 25% 25%",
      "--theme-sidebar-foreground": "270 100% 97%",
    },
  },
  {
    name: "arctic-gray",
    displayName: "Arctic Gray",
    cssVars: {
      ...defaultDarkTheme.cssVars,
      "--theme-background": "220 15% 98%", // #F7F8FA
      "--theme-foreground": "220 15% 20%",
      "--theme-card": "0 0% 100%",
      "--theme-card-foreground": "220 15% 20%",
      "--theme-popover": "0 0% 100%",
      "--theme-popover-foreground": "220 15% 20%",
      "--theme-primary": "210 20% 43%", // accent: #5C7080
      "--theme-primary-foreground": "0 0% 100%",
      "--theme-secondary": "220 15% 91%", // #E5E8EC
      "--theme-secondary-foreground": "220 15% 20%",
      "--theme-muted": "220 15% 91%",
      "--theme-muted-foreground": "220 15% 50%",
      "--theme-accent": "210 20% 43%",
      "--theme-accent-foreground": "0 0% 100%",
      "--theme-border": "220 15% 94%",
      "--theme-input": "220 15% 94%",
      "--theme-ring": "210 20% 43%",
      "--theme-chart-1": "210 20% 43%",
      "--theme-chart-2": "210 15% 60%",
      "--theme-sidebar-background": "220 15% 25%",
      "--theme-sidebar-foreground": "220 15% 98%",
    },
  },
  {
    name: "coral-peach",
    displayName: "Coral Peach",
    cssVars: {
      ...defaultDarkTheme.cssVars,
      "--theme-background": "15 100% 97%", // #FFF0EB
      "--theme-foreground": "15 40% 20%",
      "--theme-card": "0 0% 100%",
      "--theme-card-foreground": "15 40% 20%",
      "--theme-popover": "0 0% 100%",
      "--theme-popover-foreground": "15 40% 20%",
      "--theme-primary": "16 100% 66%", // accent: #FF7F50
      "--theme-primary-foreground": "0 0% 100%",
      "--theme-secondary": "15 100% 90%", // #FFD6C9
      "--theme-secondary-foreground": "15 40% 20%",
      "--theme-muted": "15 100% 90%",
      "--theme-muted-foreground": "15 40% 50%",
      "--theme-accent": "16 100% 66%",
      "--theme-accent-foreground": "0 0% 100%",
      "--theme-border": "15 100% 94%",
      "--theme-input": "15 100% 94%",
      "--theme-ring": "16 100% 66%",
      "--theme-chart-1": "16 100% 66%",
      "--theme-chart-2": "0 80% 70%",
      "--theme-sidebar-background": "15 40% 25%",
      "--theme-sidebar-foreground": "15 100% 97%",
    },
  },
  {
    name: "midnight-calm",
    displayName: "Midnight Calm",
    cssVars: {
      ...defaultDarkTheme.cssVars,
      "--theme-background": "240 10% 13%", // #1E1E26
      "--theme-foreground": "240 10% 85%",
      "--theme-card": "240 10% 17%", // #2C2C38
      "--theme-card-foreground": "240 10% 85%",
      "--theme-popover": "240 10% 13%",
      "--theme-popover-foreground": "240 10% 85%",
      "--theme-primary": "210 20% 63%", // accent: #8AA0B2
      "--theme-primary-foreground": "240 10% 10%",
      "--theme-secondary": "240 10% 22%",
      "--theme-secondary-foreground": "240 10% 85%",
      "--theme-muted": "240 10% 22%",
      "--theme-muted-foreground": "240 10% 60%",
      "--theme-accent": "210 20% 63%",
      "--theme-accent-foreground": "240 10% 10%",
      "--theme-border": "240 10% 20%",
      "--theme-input": "240 10% 20%",
      "--theme-ring": "210 20% 63%",
      "--theme-chart-1": "210 20% 63%",
      "--theme-chart-2": "200 30% 70%",
      "--theme-sidebar-background": "240 10% 10%",
      "--theme-sidebar-foreground": "240 10% 85%",
      "--theme-sidebar-accent": "240 10% 17%",
    },
  },
  defaultDarkTheme,
];
