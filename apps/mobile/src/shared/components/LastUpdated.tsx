import { StyleSheet, Text } from 'react-native';
import { formatDateTimeDMY } from '../utils/date';
import { colors, typography } from '../theme';

/** "Last updated 04 Oct 2026, 9:15 AM", shown next to cached content. */
export default function LastUpdated({ at }: { at: string | null | undefined }) {
  const text = at ? `Last updated ${formatDateTimeDMY(at)}` : 'Not updated yet';
  return <Text style={styles.text}>{text}</Text>;
}

const styles = StyleSheet.create({
  text: { fontSize: typography.caption, color: colors.muted },
});
