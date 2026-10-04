import { StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../../../shared/context/DemoRoleContext';
import type { YakapStage } from '../../../shared/types/db.types';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { PATIENT_COPY } from '../copy';
import { YAKAP_STAGES } from '../logic/yakap';

/** Brief §3 stage names, from the single list in logic/yakap.ts. */
export const YAKAP_STAGE_LABELS = Object.fromEntries(YAKAP_STAGES.map((s) => [s.stage, s.label])) as Record<YakapStage, string>;
/** FIL: needs native-speaker review */
const YAKAP_STAGE_LABELS_FIL = Object.fromEntries(YAKAP_STAGES.map((s) => [s.stage, s.fil])) as Record<YakapStage, string>;

/** "My YAKAP Checkup: <current stage>". The full tracker is on the YAKAP & Clinics tab. */
export default function YakapStepLine({ stage }: { stage: YakapStage | null | undefined }) {
  const lang = useLanguage();
  const labels = lang === 'fil' ? YAKAP_STAGE_LABELS_FIL : YAKAP_STAGE_LABELS;
  return (
    <View style={styles.box}>
      <Text style={styles.label}>{PATIENT_COPY.yakapTitle}</Text>
      <Text style={styles.value}>{stage ? labels[stage] : PATIENT_COPY.notStarted}</Text>
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
