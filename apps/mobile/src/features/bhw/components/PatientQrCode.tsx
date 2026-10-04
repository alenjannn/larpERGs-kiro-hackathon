import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../../../shared/components/Text';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { buildQrMatrix } from '../patientQr';

// Pure black on white keeps the code readable by any scanner.
const DARK = '#000000';
const LIGHT = '#FFFFFF';
/** Quiet zone, in modules, required around a QR code. */
const QUIET = 4;

interface Props {
  /** The full reference string, e.g. "tuloy:patient:<id>". */
  value: string;
  /** Approximate rendered size in px (rounded down to whole modules). */
  size?: number;
}

interface Run {
  dark: boolean;
  length: number;
}

/** Collapses each row into runs of equal modules so fewer Views are drawn. */
function toRuns(row: boolean[]): Run[] {
  const runs: Run[] = [];
  for (const dark of row) {
    const last = runs[runs.length - 1];
    if (last && last.dark === dark) last.length += 1;
    else runs.push({ dark, length: 1 });
  }
  return runs;
}

/**
 * QR code drawn with plain Views, so it renders the same on web and native
 * with no SVG or native module. Generated on the device; works offline.
 */
export default function PatientQrCode({ value, size = 200 }: Props) {
  const result = useMemo(() => {
    try {
      return { rows: buildQrMatrix(value).map(toRuns), error: null };
    } catch {
      return { rows: null, error: 'QR code could not be generated. Use the reference text below.' };
    }
  }, [value]);

  if (!result.rows) {
    return (
      <View style={[styles.fallback, { width: size, minHeight: size }]} accessibilityRole="alert">
        <Text style={styles.fallbackText}>{result.error}</Text>
      </View>
    );
  }

  const count = result.rows.length;
  // Whole-pixel modules avoid hairline gaps between rows.
  const cell = Math.max(2, Math.floor(size / (count + QUIET * 2)));

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`QR code. Patient reference ${value}`}
      style={[styles.frame, { padding: cell * QUIET }]}
    >
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {result.rows.map((runs, r) => (
          <View key={r} style={[styles.row, { height: cell }]}>
            {runs.map((run, i) => (
              <View key={i} style={{ width: run.length * cell, height: cell, backgroundColor: run.dark ? DARK : LIGHT }} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { backgroundColor: LIGHT, alignSelf: 'flex-start', borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row' },
  fallback: {
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.errorBg,
  },
  fallbackText: { fontSize: typography.small, color: colors.error, fontWeight: '600' },
});
