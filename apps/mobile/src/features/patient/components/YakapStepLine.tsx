import { StyleSheet, Text, View } from 'react-native';
import type { YakapStage } from '../../../shared/types/db.types';
import { colors, radius, spacing, typography } from '../../../shared/theme';

/** Brief §3 stage names. Clinic selection stays "confirmation pending" until clinic-confirmed. */
export const YAKAP_STAGE_LABELS: Record<YakapStage, string> = {
  need_help_getting_started: 'Need help getting started',
  clinic_selected_pending: 'Clinic selected · confirmation pending',
  first_checkup_planned: 'First checkup planned',
  checkup_and_assessment: 'Checkup and risk assessment',
  tests_requested: 'Tests requested',
  results_review_pending: 'Results available · review pending',
  plan_available: 'Plan available',
  continued_monitoring: 'Continued monitoring',
};

/** "My YAKAP Checkup: <current stage>". The full tracker is Spec 03. */
export default function YakapStepLine({ stage }: { stage: YakapStage | null | undefined }) {
  return (
    <View style={styles.box}>
      <Text style={styles.label}>My YAKAP Checkup</Text>
      <Text style={styles.value}>{stage ? YAKAP_STAGE_LABELS[stage] : 'Not started yet'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.primaryBg,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
  },
  label: { fontSize: typography.caption, color: colors.primary, fontWeight: '700' },
  value: { fontSize: typography.body, color: colors.text, fontWeight: '600' },
});
