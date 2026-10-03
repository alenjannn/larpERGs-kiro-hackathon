import { StyleSheet, Text, View } from 'react-native';
import EmptyState from '../../../shared/components/EmptyState';
import LastUpdated from '../../../shared/components/LastUpdated';
import Notice from '../../../shared/components/Notice';
import { useConnectivity } from '../../../shared/context/ConnectivityContext';
import { NO_SNAPSHOT_MESSAGE, NO_SNAPSHOT_TITLE, OFFLINE_HOME_NOTICE } from '../../../shared/helpRequests';
import { colors, spacing, typography } from '../../../shared/theme';
import type { SnapshotStatus as Status } from '../hooks/usePatientSnapshot';

interface Props {
  status: Status;
  lastUpdatedAt: string | null;
  /** Why fresh data isn't shown (only while a saved copy is shown). */
  staleReason: string | null;
  /** Shown on Home only: "Changes from your care team will show after you reconnect." */
  showOfflineNote?: boolean;
}

/** "Last updated …" for the patient snapshot, or "Connect once to load your information" (OC-1.2, OC-1.3). */
export default function SnapshotStatus({ status, lastUpdatedAt, staleReason, showOfflineNote }: Props) {
  const { isOnline } = useConnectivity();
  if (status === 'none') {
    return <EmptyState icon="device" title={NO_SNAPSHOT_TITLE} message={NO_SNAPSHOT_MESSAGE} />;
  }
  if (status !== 'ready') return null;
  return (
    <View style={styles.wrap}>
      <LastUpdated at={lastUpdatedAt} />
      {showOfflineNote && isOnline === false ? <Text style={styles.note}>{OFFLINE_HOME_NOTICE}</Text> : null}
      {staleReason ? <Notice tone="info" message={`Showing saved information. ${staleReason}`} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  note: { fontSize: typography.small, color: colors.muted },
});
