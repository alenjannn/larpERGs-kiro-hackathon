import { StyleSheet, View } from 'react-native';
import Text from './Text';
import { colors } from '../theme';

/** The Tuloy logo mark: a rounded teal tile with "T". Decorative; pair it with the name. */
export default function BrandMark({ size = 32, inverse = false }: { size?: number; inverse?: boolean }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.mark,
        { width: size, height: size, borderRadius: Math.round(size * 0.3) },
        inverse ? styles.inverse : styles.normal,
      ]}
    >
      <Text style={[styles.letter, { fontSize: Math.round(size * 0.56), color: inverse ? colors.primary : colors.primaryText }]}>T</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { alignItems: 'center', justifyContent: 'center' },
  normal: { backgroundColor: colors.primary, boxShadow: 'inset 0 -2px 0 rgba(0, 0, 0, 0.12)' },
  inverse: { backgroundColor: colors.surface },
  letter: { fontWeight: '800', includeFontPadding: false },
});
