import { StyleSheet } from 'react-native';
import Text from '../../../shared/components/Text';
import Card from '../../../shared/components/Card';
import StatusChip from '../../../shared/components/StatusChip';
import { text } from '../../../shared/theme';
import { PATIENT_COPY, PATIENT_COPY_FIL } from '../copy';
import type { ReviewState } from '../logic/nextStep';

/** Clinical review status for the patient (K7). No interpretation of results. */
export default function ReviewStatusCard({ state }: { state: ReviewState }) {
  return (
    <Card title={PATIENT_COPY.reviewStatus} subtitle={PATIENT_COPY_FIL.reviewStatus}>
      {state === 'pending' ? (
        <>
          <StatusChip status="clinical.awaiting_clinical_review" />
          <Text style={styles.body}>{PATIENT_COPY.reviewPendingText}</Text>
        </>
      ) : state === 'released' ? (
        <>
          <StatusChip status="clinical.plan_released" />
          <Text style={styles.body}>{PATIENT_COPY.reviewReleasedText}</Text>
        </>
      ) : (
        <Text style={styles.muted}>{PATIENT_COPY.noReviewWaiting}</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  body: text.body,
  muted: { ...text.body, color: text.muted.color },
});
