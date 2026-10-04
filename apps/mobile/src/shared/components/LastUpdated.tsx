import { StyleSheet, View } from 'react-native';
import Text from './Text';
import Icon from './Icon';
import { formatDateTimeDMY } from '../utils/date';
import { colors, spacing, text } from '../theme';

/** "Last updated 04 Oct 2026, 9:15 AM", shown next to cached content. */
export default function LastUpdated({ at }: { at: string | null | undefined }) {
  const label = at ? `Last updated ${formatDateTimeDMY(at)}` : 'Not updated yet';
  return (
    <View style={styles.row} accessible accessibilityLabel={label}>
      <Icon name="clock" size={13} color={colors.muted} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  text: text.caption,
});
