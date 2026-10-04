import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../../../shared/components/Button';
import ConfirmSheet from '../../../shared/components/ConfirmSheet';
import EmptyState from '../../../shared/components/EmptyState';
import Icon from '../../../shared/components/Icon';
import type { BHW } from '../../../shared/types/db.types';
import { timeAgo } from '../../../shared/utils/date';
import { colors, radius, spacing, text } from '../../../shared/theme';
import type { BHWActivity } from '../types/admin.types';

interface Props {
  activity: BHWActivity[];
  /** When provided, shows Activate/Deactivate buttons. Deactivating asks for confirmation first. */
  onToggleStatus?: (bhw: BHW) => void;
  busyId?: string | null;
}

function StatusBadge({ active }: { active: boolean }) {
  const color = active ? colors.success : colors.muted;
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: active ? colors.successBg : colors.mutedBg }]}>
      <Icon name={active ? 'check' : 'blocked'} size={12} color={color} />
      <Text style={[styles.badgeText, { color }]}>{active ? 'Active' : 'Inactive'}</Text>
    </View>
  );
}

/** BHW roster with field-activity monitoring. */
export default function BHWList({ activity, onToggleStatus, busyId }: Props) {
  const [confirm, setConfirm] = useState<BHW | null>(null);
  if (activity.length === 0) return <EmptyState icon="person" title="No BHW accounts yet." />;
  return (
    <View>
      {activity.map(({ bhw, patientCount, recordsLast7Days, offlineSyncedRecords, lastActivityAt }) => {
        const active = bhw.status === 'active';
        return (
          <View key={bhw.id} style={styles.row}>
            <View style={styles.main}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{bhw.full_name}</Text>
                <StatusBadge active={active} />
              </View>
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
                variant="secondary"
                title={active ? 'Deactivate' : 'Activate'}
                loading={busyId === bhw.id}
                onPress={() => (active ? setConfirm(bhw) : onToggleStatus(bhw))}
                accessibilityLabel={`${active ? 'Deactivate' : 'Activate'} ${bhw.full_name}`}
              />
            ) : null}
          </View>
        );
      })}
      {onToggleStatus ? (
        <ConfirmSheet
          visible={confirm !== null}
          title={`Deactivate ${confirm?.full_name ?? 'this BHW'}?`}
          message="They will no longer be offered as an owner for new patients or help requests. You can activate them again at any time."
          confirmLabel="Deactivate"
          destructive
          onConfirm={() => {
            if (confirm) onToggleStatus(confirm);
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  main: { flex: 1, minWidth: 220, gap: 2 },
  nameRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  name: text.bodyStrong,
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 1 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  meta: text.caption,
});
