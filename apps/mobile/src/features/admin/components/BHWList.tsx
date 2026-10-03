import { StyleSheet, Text, View } from 'react-native';
import Button from '../../../shared/components/Button';
import type { BHW } from '../../../shared/types/db.types';
import { timeAgo } from '../../../shared/utils/date';
import { colors, spacing } from '../../../shared/theme';
import type { BHWActivity } from '../types/admin.types';

interface Props {
  activity: BHWActivity[];
  /** When provided, shows Activate/Deactivate buttons. */
  onToggleStatus?: (bhw: BHW) => void;
  busyId?: string | null;
}

/** BHW roster with field-activity monitoring. */
export default function BHWList({ activity, onToggleStatus, busyId }: Props) {
  if (activity.length === 0) return <Text style={styles.empty}>No BHW accounts yet.</Text>;
  return (
    <View>
      {activity.map(({ bhw, patientCount, recordsLast7Days, offlineSyncedRecords, lastActivityAt }) => (
        <View key={bhw.id} style={styles.row}>
          <View style={styles.main}>
            <Text style={styles.name}>
              🏥 {bhw.full_name}{' '}
              <Text style={[styles.status, bhw.status === 'active' ? styles.active : styles.inactive]}>
                {bhw.status.toUpperCase()}
              </Text>
            </Text>
            <Text style={styles.meta}>
              {bhw.barangay}
              {bhw.email ? ` · ${bhw.email}` : ''}
            </Text>
            <Text style={styles.meta}>
              {patientCount} patients · {recordsLast7Days} records this week · {offlineSyncedRecords} synced from field · last activity{' '}
              {timeAgo(lastActivityAt)}
            </Text>
          </View>
          {onToggleStatus ? (
            <Button
              compact
              variant={bhw.status === 'active' ? 'secondary' : 'primary'}
              title={bhw.status === 'active' ? 'Deactivate' : 'Activate'}
              loading={busyId === bhw.id}
              onPress={() => onToggleStatus(bhw)}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  main: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  status: { fontSize: 10, fontWeight: '800' },
  active: { color: colors.success },
  inactive: { color: colors.danger },
  meta: { fontSize: 12, color: colors.muted },
  empty: { fontSize: 13, color: colors.muted },
});
