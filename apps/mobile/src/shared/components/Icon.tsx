import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { colors } from '../theme';

// Named icons as Unicode text-presentation glyphs (no icon dependency).
// U+FE0E forces text presentation where a glyph also has an emoji form, so
// the colour token applies. Icons are decorative: the adjacent label carries
// the meaning, so they are hidden from screen readers.
const GLYPHS = {
  device: '▯',
  clock: '◷',
  'arrow-up': '↑',
  check: '✓',
  alert: '⚠\uFE0E',
  flag: '⚑',
  calendar: '▦',
  person: '◉',
  repeat: '↻',
  hourglass: '⧗',
  document: '▤',
  circle: '○',
  blocked: '⊘',
  offline: '⌀',
  info: 'ⓘ',
  help: '?',
  close: '✕',
  // Navigation and UI.
  home: '⌂',
  list: '☰',
  map: '⌖',
  chart: '◔',
  heart: '♥︎',
  clinic: '✚',
  swap: '⇄',
  medical: '✎',
  logout: '⇥',
  plus: '+',
  back: '←',
  'chevron-right': '›',
  'chevron-down': '▾',
  'chevron-up': '▴',
  tools: '⚙︎',
} as const;

export type IconName = keyof typeof GLYPHS;

export const ICON_NAMES = Object.keys(GLYPHS) as IconName[];

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export default function Icon({ name, size = 16, color = colors.text, style }: Props) {
  return (
    <Text
      accessibilityElementsHidden
      importantForAccessibility="no"
      aria-hidden
      style={[styles.icon, { fontSize: size, lineHeight: Math.round(size * 1.25), color }, style]}
    >
      {GLYPHS[name]}
    </Text>
  );
}

const styles = StyleSheet.create({
  icon: { fontWeight: '700', textAlign: 'center', includeFontPadding: false },
});
