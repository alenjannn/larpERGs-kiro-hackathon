import { createContext, forwardRef, useContext } from 'react';
import { Platform, StyleSheet, Text as RNText, type TextProps } from 'react-native';
import { fontFamilyFor, useFontsReady } from '../fonts';

/** True inside another Text, where unstyled text should inherit the parent's typeface. */
const InsideText = createContext(false);

/**
 * Drop-in replacement for React Native's Text that applies the app typeface
 * (Figtree) at the right weight. Import it instead of `Text` from react-native.
 *
 * - Web: keeps fontWeight; the global `font-synthesis: none` rule stops
 *   faux-bold, and the system stack shows until the font file loads.
 * - Native: each weight is its own font file, so fontWeight is reset to avoid
 *   synthetic bold. Until fonts load, the system font is used unchanged.
 * - Nested Text without its own weight or style inherits from its parent.
 */
const Text = forwardRef<RNText, TextProps>(function Text({ style, children, ...props }, ref) {
  const fontsReady = useFontsReady();
  const nested = useContext(InsideText);
  const flat = StyleSheet.flatten(style) ?? {};
  const inherits = nested && flat.fontWeight === undefined && flat.fontStyle === undefined;
  const family = fontsReady && !inherits ? fontFamilyFor(flat) : null;
  const typeface = !family ? null : Platform.OS === 'web' ? { fontFamily: family } : { fontFamily: family, fontWeight: 'normal' as const };
  return (
    <RNText ref={ref} style={typeface ? [style, typeface] : style} {...props}>
      {nested ? children : <InsideText.Provider value>{children}</InsideText.Provider>}
    </RNText>
  );
});

export default Text;
