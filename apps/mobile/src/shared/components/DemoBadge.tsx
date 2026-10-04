import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

/** Label for synthetic data (security.md requires "DEMO DATA" labels in the UI). */
export default function DemoBadge({ label = 'DEMO DATA' }: { label?: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.warningBg,
    borderWidth: 1,
    borderColor: '#F3D9B8',
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: { fontSize: 12, fontWeight: '700', color: colors.warning, letterSpacing: 0.5 },
});
