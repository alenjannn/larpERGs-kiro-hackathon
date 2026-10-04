import type { ComponentProps } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { colors } from '../theme';

// One vector icon family (Feather: outline, uniform 2px stroke), bundled as a
// font so it works offline. App names stay stable; only this map knows Feather.
// Icons are decorative: the adjacent label carries the meaning, so they are
// hidden from screen readers.
const GLYPHS = {
  device: 'smartphone',
  clock: 'clock',
  'arrow-up': 'arrow-up',
  check: 'check',
  alert: 'alert-triangle',
  flag: 'flag',
  calendar: 'calendar',
  person: 'user',
  repeat: 'rotate-ccw',
  hourglass: 'loader',
  document: 'file-text',
  circle: 'circle',
  blocked: 'slash',
  offline: 'wifi-off',
  info: 'info',
  help: 'help-circle',
  close: 'x',
  // Navigation and UI.
  home: 'home',
  list: 'users',
  map: 'map',
  chart: 'bar-chart-2',
  heart: 'heart',
  clinic: 'plus-square',
  swap: 'shuffle',
  medical: 'activity',
  logout: 'log-out',
  plus: 'plus',
  back: 'arrow-left',
  'chevron-right': 'chevron-right',
  'chevron-down': 'chevron-down',
  'chevron-up': 'chevron-up',
  tools: 'settings',
} as const satisfies Record<string, ComponentProps<typeof Feather>['name']>;

export type IconName = keyof typeof GLYPHS;

export const ICON_NAMES = Object.keys(GLYPHS) as IconName[];

/** Icon sizes, as tokens: inline with small text, default, prominent. */
export const iconSize = { sm: 14, md: 18, lg: 22 };

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export default function Icon({ name, size = 16, color = colors.text, style }: Props) {
  return (
    <Feather
      name={GLYPHS[name]}
      size={size}
      color={color}
      style={style}
      accessibilityElementsHidden
      importantForAccessibility="no"
      aria-hidden
    />
  );
}
