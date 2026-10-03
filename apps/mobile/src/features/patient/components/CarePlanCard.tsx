import { StyleSheet, Text, View } from 'react-native';
import Card from '../../../shared/components/Card';
import DemoBadge from '../../../shared/components/DemoBadge';
import StatusChip from '../../../shared/components/StatusChip';
import type { Admin, CarePlan } from '../../../shared/types/db.types';
import { formatDateDMY } from '../../../shared/utils/date';
import { colors, spacing, typography } from '../../../shared/theme';

/** A released care plan (patients never receive drafts). Read-only: no edit, release or sign actions. */
export default function CarePlanCard({ plan, clinician, title }: { plan: CarePlan; clinician: Admin | null; title: string }) {
  return (
    <Card title={title} right={<DemoBadge />}>
      <StatusChip status="clinical.plan_released" />
      <Text style={styles.body}>{plan.summary}</Text>
      {plan.next_steps ? (
        <View style={styles.section}>
          <Text style={styles.label}>Next steps</Text>
          <Text style={styles.body}>{plan.next_steps}</Text>
        </View>
      ) : null}
      <Text style={styles.muted}>
        Released by {clinician?.full_name ?? 'your clinician'} · {plan.released_at ? formatDateDMY(plan.released_at) : 'date not recorded'}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.xs },
  label: { fontSize: typography.small, color: colors.muted, fontWeight: '700' },
  body: { fontSize: typography.body, color: colors.text, lineHeight: typography.lineHeight },
  muted: { fontSize: typography.small, color: colors.muted },
});
