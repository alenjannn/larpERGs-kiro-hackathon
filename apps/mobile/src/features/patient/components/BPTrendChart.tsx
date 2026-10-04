import { useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Text from '../../../shared/components/Text';
import Card from '../../../shared/components/Card';
import type { HealthRecord } from '../../../shared/types/db.types';
import { formatDateDMY } from '../../../shared/utils/date';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { PATIENT_COPY, PATIENT_COPY_FIL } from '../copy';
import { bpTrendPoints } from '../logic/measurements';

const PLOT_HEIGHT = 140;
const PAD_X = 34;
const LABEL_H = 18;
const DOT = 12;

/**
 * Dated BP readings as range bars (diastolic → systolic), placed by date.
 * Only real dated readings are drawn: no lines, no interpolation, no zeros (P-2.5).
 * Systolic is a filled circle, diastolic a hollow square: shape, not colour, tells them apart.
 */
export default function BPTrendChart({ records }: { records: HealthRecord[] }) {
  const points = useMemo(() => bpTrendPoints(records), [records]);
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const description = points.map((p) => `${p.systolic}/${p.diastolic} on ${formatDateDMY(p.date)}`).join('; ');

  if (points.length < 2) {
    return (
      <Card title={PATIENT_COPY.bpTrend} subtitle={PATIENT_COPY_FIL.bpTrend}>
        <Text style={styles.muted}>{PATIENT_COPY.bpTrendTooFew}</Text>
      </Card>
    );
  }

  const tMin = points[0].t;
  const tMax = points[points.length - 1].t;
  const yMin = Math.min(...points.map((p) => p.diastolic)) - 10;
  const yMax = Math.max(...points.map((p) => p.systolic)) + 10;
  const usable = Math.max(0, width - 2 * PAD_X);
  const xOf = (t: number) => PAD_X + ((t - tMin) / Math.max(1, tMax - tMin)) * usable;
  const yOf = (v: number) => LABEL_H + (1 - (v - yMin) / Math.max(1, yMax - yMin)) * PLOT_HEIGHT;

  return (
    <Card title={PATIENT_COPY.bpTrend} subtitle={PATIENT_COPY_FIL.bpTrend}>
      <View
        style={styles.chart}
        onLayout={onLayout}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Blood pressure readings, mmHg: ${description}`}
      >
        <View style={[styles.axis, { top: LABEL_H + PLOT_HEIGHT }]} />
        {width > 0
          ? points.map((p) => {
              const x = xOf(p.t);
              const top = yOf(p.systolic);
              const bottom = yOf(p.diastolic);
              return (
                <View key={p.recordId} style={StyleSheet.absoluteFill} pointerEvents="none">
                  <Text style={[styles.valueLabel, { left: x - 40, top: top - LABEL_H - 2 }]}>
                    {p.systolic}/{p.diastolic}
                  </Text>
                  <View style={[styles.bar, { left: x - 1.5, top, height: Math.max(2, bottom - top) }]} />
                  <View style={[styles.systolic, { left: x - DOT / 2, top: top - DOT / 2 }]} />
                  <View style={[styles.diastolic, { left: x - DOT / 2, top: bottom - DOT / 2 }]} />
                  <Text style={[styles.dateLabel, { left: x - 40, top: LABEL_H + PLOT_HEIGHT + 6 }]}>
                    {formatDateDMY(p.date).slice(0, 6)}
                  </Text>
                </View>
              );
            })
          : null}
      </View>
      <Text style={styles.legend}>● Top number (systolic) · □ Bottom number (diastolic) · mmHg</Text>
      <Text style={styles.muted}>{PATIENT_COPY.bpTrendNote}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  chart: { height: LABEL_H + PLOT_HEIGHT + 30, width: '100%', backgroundColor: colors.bg, borderRadius: radius.md, overflow: 'hidden' },
  axis: { position: 'absolute', left: spacing.sm, right: spacing.sm, height: 1, backgroundColor: colors.border },
  bar: { position: 'absolute', width: 3, backgroundColor: colors.primary, opacity: 0.5 },
  systolic: { position: 'absolute', width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: colors.primary },
  diastolic: { position: 'absolute', width: DOT, height: DOT, borderWidth: 2, borderColor: colors.text, backgroundColor: colors.surface },
  valueLabel: { position: 'absolute', width: 80, textAlign: 'center', fontSize: typography.caption, color: colors.text, fontWeight: '700' },
  dateLabel: { position: 'absolute', width: 80, textAlign: 'center', fontSize: typography.caption, color: colors.muted },
  legend: { fontSize: typography.small, color: colors.text, lineHeight: 20 },
  muted: { fontSize: typography.small, color: colors.muted, lineHeight: 20 },
});
