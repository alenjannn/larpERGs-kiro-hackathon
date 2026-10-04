// Design tokens, defined once (tech.md §6, brief §8). Every screen and shared
// component styles itself from these values; avoid raw sizes and hex codes.
// Existing names are kept as aliases so current screens keep working:
//   warning = pending, danger = error.
// Contrast (WCAG, text on white unless noted): text 14:1, muted 6.4:1,
// primary 5.5:1, pending 4.7:1 on its tint, error 5.9:1, success 6.8:1,
// borderStrong 3.7:1 (input outlines, WCAG 1.4.11), offline 13:1.

import type { TextStyle, ViewStyle } from 'react-native';

const palette = {
  primary: '#0F766E',
  primaryBg: '#ECF7F5',
  primaryStrong: '#0B5D57',
  text: '#102A43',
  bg: '#F4F6F9',
  surface: '#FFFFFF',
  muted: '#52606D',
  mutedBg: '#F0F3F7',
  pending: '#B45309',
  pendingBg: '#FFF6EB',
  error: '#B91C1C',
  errorBg: '#FEF2F2',
  success: '#166534',
  successBg: '#EFFAF2',
};

export const colors = {
  ...palette,
  /** Hairlines between rows and around cards. */
  border: '#E3E8EE',
  /** Inputs and controls: 3:1 against surface. */
  borderStrong: '#7B8794',
  /** Subtle panels inside cards (readings, notes). */
  surfaceAlt: '#F8FAFC',
  primaryText: '#FFFFFF',
  /** Secondary text on a primary-coloured surface (4.6:1 on primary). */
  onPrimaryMuted: '#E3F4F1',
  /** Hover/pressed for destructive buttons. */
  errorStrong: '#991B1B',
  /** Outline of the DEMO DATA badge. */
  pendingBorder: '#F3D9B8',
  /** Placeholder text in inputs. */
  placeholder: '#7B8794',
  /** Keyboard focus ring (web). */
  focus: '#1F6FD1',
  overlay: 'rgba(16, 42, 67, 0.48)',
  // Legacy aliases (do not remove: existing components use them).
  danger: palette.error,
  dangerBg: palette.errorBg,
  warning: palette.pending,
  warningBg: palette.pendingBg,
  info: '#1D69C7',
  infoBg: '#EEF4FD',
  // Offline is calm: navy, never red.
  offlineBg: palette.text,
  offlineText: '#FFFFFF',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 6, md: 10, lg: 14, xl: 18, pill: 999 };

/** Role identity colours (white text on each is >= 4.5:1). */
export const roleColors = {
  admin: { color: '#5B3FB8', tint: '#F3F0FC' },
  bhw: { color: '#0E7C66', tint: '#ECF8F4' },
  patient: { color: '#1D69C7', tint: '#EDF4FD' },
};

/** Soft elevation. Borders stay for structure; shadows only lift surfaces. */
export const shadow = {
  card: { boxShadow: '0 1px 2px rgba(16, 42, 67, 0.04), 0 2px 8px rgba(16, 42, 67, 0.04)' },
  raised: { boxShadow: '0 2px 4px rgba(16, 42, 67, 0.06), 0 8px 24px rgba(16, 42, 67, 0.08)' },
  overlay: { boxShadow: '0 16px 48px rgba(16, 42, 67, 0.24)' },
  button: { boxShadow: '0 1px 2px rgba(16, 42, 67, 0.12)' },
  /** The current step or selected item. */
  highlight: { boxShadow: '0 4px 14px rgba(15, 118, 110, 0.12)' },
  /** Field focus ring (keyboard and pointer). */
  focusRing: { boxShadow: '0 0 0 3px rgba(15, 118, 110, 0.18)' },
  /** Ring on a field with a validation error. */
  errorRing: { boxShadow: '0 0 0 3px rgba(185, 28, 28, 0.12)' },
} satisfies Record<string, ViewStyle>;

/** Typography: body text about 16px, nothing below 12px. */
export const typography = { body: 16, small: 14, caption: 13, title: 18, heading: 24, display: 30, lineHeight: 22 };

/** Ready-made text styles. Prefer these over ad-hoc font sizes. */
export const text = {
  display: { fontSize: typography.display, lineHeight: 36, fontWeight: '800', letterSpacing: -0.6, color: colors.text },
  heading: { fontSize: typography.heading, lineHeight: 30, fontWeight: '700', letterSpacing: -0.4, color: colors.text },
  title: { fontSize: typography.title, lineHeight: 24, fontWeight: '700', letterSpacing: -0.2, color: colors.text },
  body: { fontSize: typography.body, lineHeight: 24, color: colors.text },
  bodyStrong: { fontSize: typography.body, lineHeight: 24, fontWeight: '600', color: colors.text },
  small: { fontSize: typography.small, lineHeight: 20, color: colors.text },
  muted: { fontSize: typography.small, lineHeight: 20, color: colors.muted },
  caption: { fontSize: typography.caption, lineHeight: 18, color: colors.muted },
  label: { fontSize: typography.small, lineHeight: 20, fontWeight: '600', color: colors.text },
  /** Small uppercase section label ("NEXT STEP"). */
  overline: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase', color: colors.muted },
} satisfies Record<string, TextStyle>;

/** Minimum touch target. */
export const touch = { min: 44 };

/** Page widths and breakpoints. */
export const layout = {
  /** Reading width for page content. */
  maxContent: 1000,
  /** Sheets and dialogs. */
  maxSheet: 560,
  /** Tables switch to stacked cards below this width. */
  table: 768,
  /** Navigation moves from the bottom bar to a sidebar at this width. */
  sidebar: 1024,
  /** Sidebar width. */
  sidebarWidth: 260,
};
