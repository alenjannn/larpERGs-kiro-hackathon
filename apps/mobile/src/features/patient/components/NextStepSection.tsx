import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../../../shared/components/Button';
import ConfirmSheet from '../../../shared/components/ConfirmSheet';
import NextStepCard from '../../../shared/components/NextStepCard';
import Notice from '../../../shared/components/Notice';
import { StatusChipRow } from '../../../shared/components/StatusChip';
import { useConnectivity } from '../../../shared/context/ConnectivityContext';
import type { OutboxItem } from '../../../shared/services/outbox';
import { outboxStatusKeys } from '../../../shared/status';
import type { Appointment } from '../../../shared/types/db.types';
import { formatDateDMY, formatDateTimeDMY } from '../../../shared/utils/date';
import { spacing, text } from '../../../shared/theme';
import { PATIENT_COPY } from '../copy';
import { useReportAttended } from '../hooks/useReportAttended';
import { canReportAttended, findAnotherDateRequest } from '../logic/nextStep';

interface Props {
  appointment: Appointment;
  clinicName?: string;
  patientId: string;
  /** This patient's outbox items (to find an existing "another date" request). */
  requests: OutboxItem[];
  reload: () => Promise<void>;
  onHelp: () => void;
  onAnotherDate: (message: string) => void;
}

/** The next care step with "I already attended", "I need another date" and "I need help" (P-1). */
export default function NextStepSection({ appointment: appt, clinicName, patientId, requests, reload, onHelp, onAnotherDate }: Props) {
  const { isOnline } = useConnectivity();
  const attend = useReportAttended(patientId, reload);
  const [confirming, setConfirming] = useState(false);
  const existing = findAnotherDateRequest(requests, appt);
  const reported = appt.encounter_status === 'patient_reported_attended';
  const attendable = canReportAttended(appt);
  const offline = isOnline === false;
  const when = appt.scheduled_at ? formatDateTimeDMY(appt.scheduled_at) : 'date not set';

  // The sheet closes either way; an error shows on the card and the status stays unchanged.
  const confirm = async () => {
    await attend.report(appt);
    setConfirming(false);
  };

  return (
    <>
      <NextStepCard action={appt.purpose} responsible={clinicName} date={appt.scheduled_at} status={`encounter.${appt.encounter_status}`} onHelp={onHelp}>
        {reported ? <Text style={styles.note}>{PATIENT_COPY.attendWaiting}</Text> : null}
        {attendable ? (
          <>
            <Button
              title={PATIENT_COPY.iAttended}
              onPress={() => setConfirming(true)}
              disabled={offline || attend.busyId !== null}
              loading={attend.busyId === appt.id}
              accessibilityLabel={offline ? `${PATIENT_COPY.iAttended} (needs a connection)` : PATIENT_COPY.iAttended}
            />
            {offline ? <Text style={styles.note}>{PATIENT_COPY.attendOffline}</Text> : null}
          </>
        ) : null}
        {existing ? (
          <View style={styles.existing} accessible accessibilityLabel={`You asked for another date on ${formatDateTimeDMY(existing.created_on_device_at)}`}>
            <Text style={styles.note}>You asked for another date on {formatDateTimeDMY(existing.created_on_device_at)}</Text>
            <StatusChipRow statuses={outboxStatusKeys(existing._sync_status, 'help_request')} />
          </View>
        ) : (
          <Button
            title={PATIENT_COPY.anotherDate}
            variant="secondary"
            onPress={() => onAnotherDate(`About: ${appt.purpose}, ${appt.scheduled_at ? formatDateDMY(appt.scheduled_at) : 'date not set'}`)}
          />
        )}
        {attend.error ? <Notice tone="error" message={attend.error} /> : null}
      </NextStepCard>
      <ConfirmSheet
        visible={confirming}
        title={PATIENT_COPY.attendConfirmTitle}
        message={`${appt.purpose}, ${when}. Your clinic will still confirm it.`}
        confirmLabel={PATIENT_COPY.attendConfirmLabel}
        busy={attend.busyId === appt.id}
        onConfirm={() => void confirm()}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  note: { ...text.body, color: text.muted.color },
  existing: { gap: spacing.xs },
});
