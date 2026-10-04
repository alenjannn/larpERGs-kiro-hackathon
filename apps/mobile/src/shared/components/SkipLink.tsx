import { Platform } from 'react-native';
import Text from './Text';

/** Element id on every Screen's main region (see Screen.tsx). */
export const MAIN_CONTENT_ID = 'main-content';

/**
 * Web only: "Skip to main content", the first tab stop. Hidden until focused
 * (CSS in app/+html.tsx). Tabs keep several screens mounted, so it focuses the
 * visible main region rather than relying on the #id jump alone.
 */
export default function SkipLink() {
  if (Platform.OS !== 'web') return null;
  const focusMain = (e: { preventDefault?: () => void }) => {
    if (typeof document === 'undefined') return;
    const visible = Array.from(document.querySelectorAll<HTMLElement>(`[id="${MAIN_CONTENT_ID}"]`)).find((el) => el.offsetParent !== null);
    if (!visible) return;
    e.preventDefault?.();
    visible.focus();
  };
  // react-native-web renders Text with href as a real <a>.
  const linkProps = { href: `#${MAIN_CONTENT_ID}` } as object;
  return (
    <Text accessibilityRole="link" onPress={focusMain} {...linkProps}>
      Skip to main content
    </Text>
  );
}
