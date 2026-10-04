import { StyleSheet, Text, View } from 'react-native';
import Icon from '../../../shared/components/Icon';
import { useLanguage } from '../../../shared/context/DemoRoleContext';
import type { YakapStage } from '../../../shared/types/db.types';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { PATIENT_COPY } from '../copy';
import { stageIndex, stageLabel, YAKAP_STAGES } from '../logic/yakap';

/**
 * The eight brief §3 YAKAP stages. The current one is marked by a border,
 * "You are here" and an icon (never colour alone). Earlier: "Done"; later: "Later".
 */
export default function YakapTracker({ stage, clinicConfirmed }: { stage: YakapStage | null | undefined; clinicConfirmed: boolean }) {
  const lang = useLanguage();
  // The other language stays as a smaller second line, as before.
  const otherLang = lang === 'fil' ? 'en' : 'fil';
  const current = stageIndex(stage);
  return (
    <View style={styles.list}>
      {current === -1 ? <Text style={styles.notStarted}>{PATIENT_COPY.notStarted}</Text> : null}
      {YAKAP_STAGES.map((info, i) => {
        const label = stageLabel(info, clinicConfirmed, lang);
        const secondary = stageLabel(info, clinicConfirmed, otherLang);
        const state = current === -1 ? 'Later' : i < current ? 'Done' : i === current ? PATIENT_COPY.youAreHere : 'Later';
        const isCurrent = i === current;
        return (
          <View
            key={info.stage}
            style={[styles.row, isCurrent && styles.current]}
            accessible
            accessibilityLabel={`Step ${i + 1} of ${YAKAP_STAGES.length}: ${label}, ${state}${isCurrent ? `. ${info.patientAction}` : ''}`}
          >
            <Icon
              name={isCurrent ? 'flag' : i < current ? 'check' : 'circle'}
              size={18}
              color={isCurrent ? colors.primary : i < current ? colors.success : colors.muted}
            />
            <View style={styles.text}>
              <Text style={[styles.label, isCurrent && styles.currentLabel]}>
                {i + 1}. {label}
              </Text>
              {/* FIL: needs native-speaker review */}
              <Text style={styles.fil}>{secondary}</Text>
              <Text style={[styles.state, isCurrent && styles.currentState]}>{state}</Text>
              {isCurrent ? <Text style={styles.action}>{info.patientAction}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  notStarted: { fontSize: typography.body, color: colors.text, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 44,
  },
  current: { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primaryBg, boxShadow: '0 4px 14px rgba(15, 118, 110, 0.12)' },
  text: { flex: 1, gap: 2 },
  label: { fontSize: typography.body, color: colors.text, fontWeight: '600' },
  currentLabel: { fontWeight: '800' },
  fil: { fontSize: typography.caption, color: colors.muted },
  state: { fontSize: typography.small, color: colors.muted },
  currentState: { color: colors.primary, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  action: { fontSize: typography.body, color: colors.text, lineHeight: typography.lineHeight },
});
