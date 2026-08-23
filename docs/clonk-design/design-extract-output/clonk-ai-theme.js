// React Theme — extracted from https://www.clonk.ai/
// Compatible with: Chakra UI, Stitches, Vanilla Extract, or any CSS-in-JS

/**
 * TypeScript type definition for this theme:
 *
 * interface Theme {
 *   colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    neutral50: string;
    neutral100: string;
    neutral200: string;
    neutral300: string;
    neutral400: string;
    neutral500: string;
    neutral600: string;
    neutral700: string;
    neutral800: string;
    neutral900: string;
 *   };
 *   fonts: {
    body: string;
 *   };
 *   fontSizes: {
    '34': string;
    '38': string;
    '42': string;
    '44': string;
    '54': string;
    '56': string;
    '58': string;
    '60': string;
    '62': string;
    '64': string;
    '68': string;
    '80': string;
 *   };
 *   space: {
    '2': string;
    '48': string;
    '56': string;
    '64': string;
    '80': string;
    '96': string;
    '112': string;
    '127': string;
    '160': string;
    '173': string;
    '178': string;
    '200': string;
    '208': string;
    '232': string;
    '260': string;
    '279': string;
 *   };
 *   radii: {
    md: string;
    lg: string;
    xl: string;
    full: string;
 *   };
 *   shadows: {
    sm: string;
 *   };
 *   states: {
 *     hover: { opacity: number };
 *     focus: { opacity: number };
 *     active: { opacity: number };
 *     disabled: { opacity: number };
 *   };
 * }
 */

export const theme = {
  "colors": {
    "primary": "#ff551d",
    "secondary": "#dff58b",
    "accent": "#ff7a47",
    "background": "#000000",
    "foreground": "#ffffff",
    "neutral50": "#262626",
    "neutral100": "#ffffff",
    "neutral200": "#000000",
    "neutral300": "#555555",
    "neutral400": "#f1f1f1",
    "neutral500": "#101010",
    "neutral600": "#1b1b1b",
    "neutral700": "#676767",
    "neutral800": "#e5e5e5",
    "neutral900": "#757575"
  },
  "fonts": {
    "body": "'__degularDisplay_1e8a8c', sans-serif"
  },
  "fontSizes": {
    "34": "34px",
    "38": "38px",
    "42": "42px",
    "44": "44px",
    "54": "54px",
    "56": "56px",
    "58": "58px",
    "60": "60px",
    "62": "62px",
    "64": "64px",
    "68": "68px",
    "80": "80px"
  },
  "space": {
    "2": "2px",
    "48": "48px",
    "56": "56px",
    "64": "64px",
    "80": "80px",
    "96": "96px",
    "112": "112px",
    "127": "127px",
    "160": "160px",
    "173": "173px",
    "178": "178px",
    "200": "200px",
    "208": "208px",
    "232": "232px",
    "260": "260px",
    "279": "279px"
  },
  "radii": {
    "md": "7px",
    "lg": "14px",
    "xl": "22px",
    "full": "9999px"
  },
  "shadows": {
    "sm": "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.043) 0px 10px 26px 0px"
  },
  "states": {
    "hover": {
      "opacity": 0.08
    },
    "focus": {
      "opacity": 0.12
    },
    "active": {
      "opacity": 0.16
    },
    "disabled": {
      "opacity": 0.38
    }
  }
};

// MUI v5 theme
export const muiTheme = {
  "palette": {
    "primary": {
      "main": "#ff551d",
      "light": "hsl(15, 100%, 71%)",
      "dark": "hsl(15, 100%, 41%)"
    },
    "secondary": {
      "main": "#dff58b",
      "light": "hsl(72, 84%, 90%)",
      "dark": "hsl(72, 84%, 60%)"
    },
    "background": {
      "default": "#000000",
      "paper": "#fafaf8"
    },
    "text": {
      "primary": "#ffffff",
      "secondary": "#fafafa"
    }
  },
  "typography": {
    "fontFamily": "'__neueMontreal_8db69f', sans-serif",
    "h1": {
      "fontSize": "58px",
      "fontWeight": "700",
      "lineHeight": "58px"
    }
  },
  "shape": {
    "borderRadius": 7
  },
  "shadows": [
    "rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(33, 28, 20, 0.12) 0px 12px 34px 0px",
    "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.15) 0px 6px 16px 0px",
    "rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.07) 0px 0px 0px 1px, rgba(0, 0, 0, 0.08) 0px 4px 24px 0px",
    "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.12) 0px 2px 6px -2px",
    "rgb(255, 255, 255) 0px 0px 0px 0px inset, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0) 0px 0px 0px 0px"
  ]
};

export default theme;
