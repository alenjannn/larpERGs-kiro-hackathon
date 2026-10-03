import { StyleSheet, Text } from 'react-native';
import Card from '../../../shared/components/Card';
import StatusChip from '../../../shared/components/StatusChip';
import type { Admin, CarePlan } from '../../../shared/types/db.types';
import { formatDateDMY } from '../../../shared/utils/date';
import { colors, typography } from '../../../shared/theme';

/** The latest released care plan (patients never see drafts). The full Care Plan tab is Spec 03. */
export default function CarePlanSummaryCard({ plan, clinician }: { plan: CarePlan | null; clinician: Admin | null }) {
  if (!plan) {
    return (
      <Card title="Care plan">
        <Text style={styles.muted}>No released care plan yet.</Text>
      </Card>
    );
  }
  return (
    <Card title="Care plan" right={<StatusChip status="clinical.plan_released" size="sm" />}>
      <Text style={styles.body}>{plan.summary}</Text>
      {plan.next_steps ? <Text style={styles.body}>Next steps: {plan.next_steps}</Text> : null}
      <Text style={styles.muted}>
        Released by {clinician?.full_name ?? 'your clinician'}
        {plan.released_at ? ` on ${formatDateDMY(plan.released_at)}` : ''}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: typography.body, color: colors.text, lineHeight: typography.lineHeight },
  muted: { fontSize: typography.small, color: colors.muted },
});
