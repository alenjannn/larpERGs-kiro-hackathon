import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

/** Label for synthetic data (security.md requires "DEMO DATA" labels in the UI). */
export default function DemoBadge({ label = 'DEMO DATA' }: { label?: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', backgroundColor: colors.warningBg, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  text: { fontSize: 10, fontWeight: '700', color: colors.warning, letterSpacing: 0.5 },
});
