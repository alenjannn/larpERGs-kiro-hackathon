import { StyleSheet, Text, View } from 'react-native';
import { formatDateDMY } from '../utils/date';
import { formatMeasurement, NO_READING } from '../utils/format';
import { colors, radius, spacing, text } from '../theme';

interface Props {
  label: string;
  /** null/undefined/NaN/'' → "No reading" (never 0). Pass preformatted strings such as "132/84". */
  value: number | string | null | undefined;
  unit?: string;
  measuredAt: string | null | undefined;
  /** e.g. "Fasting" for glucose. */
  context?: string;
}

/** One dated measurement with its unit. */
export default function MeasurementCard({ label, value, unit, measuredAt, context }: Props) {
  const text = formatMeasurement(value, unit);
  const missing = text === NO_READING;
  const date = missing ? null : measuredAt ? `Measured ${formatDateDMY(measuredAt)}` : 'Date not recorded';
  return (
    <View style={styles.card} accessible accessibilityLabel={[label, text, context, date].filter(Boolean).join(', ')}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, missing && styles.missing]}>{text}</Text>
      {context && !missing ? <Text style={styles.meta}>{context}</Text> : null}
      {date ? <Text style={styles.meta}>{date}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: 150,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
  },
  label: { ...text.caption, fontWeight: '600' },
  value: { ...text.title, fontSize: 20, lineHeight: 26, fontVariant: ['tabular-nums'] },
  missing: { ...text.bodyStrong, color: colors.muted, lineHeight: 26 },
  meta: text.caption,
});
