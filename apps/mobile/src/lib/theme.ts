/**
 * Native-friendly theme tokens — Clonk aesthetic.
 *
 * Warm off-white canvas, hot orange accent, dark night surfaces.
 * Matches the web app's CSS variables in apps/web/src/app/globals.css.
 */

export const colors = {
  // Surface / background
  background: '#fafaf8',
  surface: '#ffffff',
  surfaceMuted: '#f5f5f3',
  surfaceElevated: '#ffffff',

  // Text
  textPrimary: '#101010',
  textSecondary: '#262626',
  textMuted: '#676767',
  textInverse: '#ffffff',

  // Brand (hot orange — #c64210 hits WCAG AA contrast vs both white and #fafaf8)
  primary: '#c64210',
  primarySoft: '#ff7a47',
  primaryMuted: '#fff0eb',
  primaryForeground: '#ffffff',

  // Night (inverted)
  night: '#101010',
  nightSoft: '#1b1b1b',

  // Status
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
  info: '#2563eb',

  // Borders / dividers
  border: '#e5e5e5',
  borderStrong: '#d4d4d4',
  divider: '#e5e5e5',

  // Overlays
  overlay: 'rgba(16, 16, 16, 0.55)',
  scrim: 'rgba(16, 16, 16, 0.35)',

  transparent: 'transparent',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

export const radii = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 22,
  full: 9999,
} as const;

export const fontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const lineHeights = {
  tight: 1.15,
  normal: 1.4,
  relaxed: 1.6,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#101010',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#101010',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  lg: {
    shadowColor: '#101010',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;

export const theme = {
  colors,
  spacing,
  radii,
  fontSizes,
  fontWeights,
  lineHeights,
  shadows,
} as const;

export type Theme = typeof theme;
export default theme;
