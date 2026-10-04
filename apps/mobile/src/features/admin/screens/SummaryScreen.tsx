import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from '../../../shared/components/Text';
import TileGrid from '../../../shared/components/TileGrid';
import Card from '../../../shared/components/Card';
import Icon from '../../../shared/components/Icon';
import ChipGroup from '../../../shared/components/ChipGroup';
import MetricTile from '../../../shared/components/MetricTile';
import Notice from '../../../shared/components/Notice';
import Screen from '../../../shared/components/Screen';
import { formatDateTimeDMY } from '../../../shared/utils/date';
import { colors, radius, spacing, text, typography } from '../../../shared/theme';
import AdminDataStates from '../components/AdminDataStates';
import MetricCaseList from '../components/MetricCaseList';
import { useAdminData } from '../hooks/useAdminData';
import {
  COHORT_RULE,
  computeSummary,
  DEFAULT_PERIOD,
  OPERATIONAL_NOTE,
  PERIODS,
  periodLabel,
  type MetricKey,
  type PeriodDays,
} from '../summaryMetrics';

const ORDER: MetricKey[] = ['first_checkup', 'follow_up', 'clinical_review', 'ownership'];

/** Four operational metrics as "N of D (P%)" with period, cohort and unknowns (A-3). */
export default function SummaryScreen() {
  const { data, error, loading, reload } = useAdminData();
  const [period, setPeriod] = useState<PeriodDays>(DEFAULT_PERIOD);
  const [selected, setSelected] = useState<MetricKey | null>(null);
  const summary = useMemo(() => (data ? computeSummary(data, period) : null), [data, period]);
  const b = summary?.followUpBreakdown;

  return (
    <Screen title="Summary" subtitle="Follow-through for tracked patients" refreshing={loading && !!data} onRefresh={reload}>
      <AdminDataStates
        loading={loading}
        hasData={!!data}
        error={error}
        fromCache={data?.fromCache}
        cachedAt={data?.cachedAt}
        fetchError={data?.fetchError}
        onRetry={reload}
      />
      {summary && data ? (
        <>
          <Notice tone="info" message={OPERATIONAL_NOTE} />
          <ChipGroup
            label="Period"
            options={PERIODS.map((p) => ({ value: String(p), label: periodLabel(p) }))}
            value={String(period)}
            onChange={(v) => setPeriod(Number(v) as PeriodDays)}
          />
          <Text style={styles.meta}>
            Data as of {formatDateTimeDMY(data.cachedAt)}
            {data.fromCache ? ' (saved copy)' : ''} · {COHORT_RULE}
          </Text>

          <TileGrid minTileWidth={220} maxColumns={4}>
            {ORDER.map((key) => {
              const m = summary.metrics[key];
              const isSelected = selected === key;
              const unknownText = `Unknown: ${m.unknown}${m.unknownInDenominator ? ' (included above)' : ' (not counted)'}`;
              return (
                <Pressable
                  key={key}
                  onPress={() => setSelected(isSelected ? null : key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityHint="Shows the cases behind this number"
                  style={[styles.tileWrap, isSelected && styles.tileSelected]}
                >
                  <MetricTile
                    label={m.label}
                    numerator={m.numerator}
                    denominator={m.denominator}
                    hint={`${m.period}\nCohort: ${m.cohort}\n${unknownText}`}
                  />
                  <View style={styles.tapRow}>
                    <Icon name={isSelected ? 'chevron-up' : 'chevron-down'} size={14} color={colors.primary} />
                    <Text style={styles.tap}>{isSelected ? 'Hide cases (shown below)' : 'Show cases'}</Text>
                  </View>
                </Pressable>
              );
            })}
          </TileGrid>

          {b ? (
            <Card title="Follow-up breakdown" subtitle={`${periodLabel(period)} · each appointment counted once`}>
              {summary.breakdownReconciles ? (
                <TileGrid minTileWidth={110} maxColumns={5}>
                  {(
                    [
                      ['Completed', b.completed],
                      ['Confirmed missed', b.missed],
                      ['Rescheduled', b.rescheduled],
                      ['Unknown', b.unknown],
                    ] as const
                  ).map(([label, n]) => (
                    <View key={label} style={styles.cell} accessible accessibilityLabel={`${label}: ${n}`}>
                      <Text style={styles.cellValue}>{n}</Text>
                      <Text style={styles.cellLabel}>{label}</Text>
                    </View>
                  ))}
                  <View style={styles.cell} accessible accessibilityLabel={`Total due: ${summary.metrics.follow_up.denominator}`}>
                    <Text style={styles.cellValue}>{summary.metrics.follow_up.denominator}</Text>
                    <Text style={styles.cellLabel}>Total due</Text>
                  </View>
                </TileGrid>
              ) : (
                <Notice tone="warning" message="The breakdown does not add up to the total, so it is hidden. Refresh and check the appointment data." />
              )}
            </Card>
          ) : null}

          {selected ? <MetricCaseList metric={summary.metrics[selected]} /> : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  meta: text.caption,
  tileWrap: { flexGrow: 1, borderRadius: radius.lg + 2, borderWidth: 2, borderColor: 'transparent', gap: spacing.xs },
  tileSelected: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  tapRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, paddingBottom: spacing.xs },
  tap: { fontSize: typography.caption, color: colors.primary, fontWeight: '700' },
  cell: {
    flexGrow: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    minHeight: 44,
  },
  cellValue: { ...text.heading, fontVariant: ['tabular-nums'] },
  cellLabel: text.caption,
});
