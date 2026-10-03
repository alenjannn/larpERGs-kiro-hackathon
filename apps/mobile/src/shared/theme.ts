// Design tokens, defined once (tech.md §6, brief §8).
// Existing names are kept as aliases so current screens keep working:
//   warning = pending, danger = error.
// Contrast (WCAG relative luminance, chip text on its tint): primary 5.3:1,
// muted 6.9:1, pending 4.7:1, error 5.9:1, success 6.8:1, offline 13:1.

const palette = {
  primary: '#0F766E',
  primaryBg: '#F0FDFA',
  text: '#16324F',
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  muted: '#475569',
  mutedBg: '#F1F5F9',
  pending: '#B45309',
  pendingBg: '#FFF7ED',
  error: '#B91C1C',
  errorBg: '#FEF2F2',
  success: '#166534',
  successBg: '#F0FDF4',
};

export const colors = {
  ...palette,
  border: '#DCE5E1',
  primaryText: '#FFFFFF',
  // Legacy aliases (do not remove: existing components use them).
  danger: palette.error,
  dangerBg: palette.errorBg,
  warning: palette.pending,
  warningBg: palette.pendingBg,
  info: '#1F6FD1',
  infoBg: '#E8F1FC',
  // Offline is calm: navy, never red.
  offlineBg: palette.text,
  offlineText: '#FFFFFF',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = { sm: 6, md: 10, lg: 14 };

/** Typography: body text about 16px. */
export const typography = { body: 16, small: 14, caption: 13, title: 20, heading: 24, lineHeight: 22 };

/** Minimum touch target. */
export const touch = { min: 44 };
