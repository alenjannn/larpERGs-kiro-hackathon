import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../../../shared/components/Text';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import ChipGroup from '../../../shared/components/ChipGroup';
import DemoBadge from '../../../shared/components/DemoBadge';
import EmptyState from '../../../shared/components/EmptyState';
import Notice from '../../../shared/components/Notice';
import Screen from '../../../shared/components/Screen';
import StatusChip from '../../../shared/components/StatusChip';
import { useLanguage } from '../../../shared/context/DemoRoleContext';
import { helpReasonLabel } from '../../../shared/helpRequests';
import { OPEN_COORDINATION, OPEN_ENCOUNTER } from '../../../shared/services/apiAdmin';
import type { StatusKey } from '../../../shared/status';
import type { BHW } from '../../../shared/types/db.types';
import { formatDateTimeDMY } from '../../../shared/utils/date';
import { spacing, text } from '../../../shared/theme';
import AdminDataStates from '../components/AdminDataStates';
import QueueTable from '../components/QueueTable';
import { useAdminData } from '../hooks/useAdminData';
import { useOwnerAssignFlow } from '../hooks/useOwnerAssignFlow';
import { isBHWInactive } from '../needsAttention';

const ALL = 'all';
const UNASSIGNED = 'unassigned';

function ownerLabel(id: string | null, bhws: BHW[]): string {
  if (!id) return 'No owner';
  const bhw = bhws.find((b) => b.id === id);
  if (!bhw) return 'Unknown BHW';
  return isBHWInactive(bhw) ? `${bhw.full_name} (inactive)` : bhw.full_name;
}

/** Assign and reassign patients and help requests so every task has an owner (A-2). */
export default function AssignmentsScreen() {
  const router = useRouter();
  const lang = useLanguage();
  const params = useLocalSearchParams<{ bhw?: string }>();
  const filter = typeof params.bhw === 'string' && params.bhw ? params.bhw : ALL;
  const { data, error, loading, reload } = useAdminData();
  const flow = useOwnerAssignFlow(data, reload);
  const bhws = useMemo(() => data?.bhws ?? [], [data]);

  const matches = (ownerId: string | null) =>
    filter === ALL ? true : filter === UNASSIGNED ? !ownerId || !bhws.some((b) => b.id === ownerId) : ownerId === filter;

  // Unassigned first, then by name. Never ordered by BHW performance.
  const patients = useMemo(
    () =>
      (data?.patients ?? [])
        .filter((p) => matches(p.bhw_id))
        .sort((a, b) => Number(!!a.bhw_id) - Number(!!b.bhw_id) || a.full_name.localeCompare(b.full_name)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, filter]
  );
  const requests = useMemo(
    () =>
      (data?.helpRequests ?? [])
        .filter((r) => OPEN_COORDINATION.includes(r.coordination_status) && matches(r.assigned_bhw_id))
        .sort((a, b) => Number(!!a.assigned_bhw_id) - Number(!!b.assigned_bhw_id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, filter]
  );

  const filterOptions = [
    { value: ALL, label: 'All' },
    { value: UNASSIGNED, label: 'Unassigned' },
    ...bhws.map((b) => ({ value: b.id, label: isBHWInactive(b) ? `${b.full_name} (inactive)` : b.full_name })),
  ];
  const setFilter = (value: string) => router.setParams({ bhw: value === ALL ? '' : value });
  const filteredBhw = bhws.find((b) => b.id === filter);

  return (
    <Screen
      title="Assignments"
      subtitle="Give every patient and open help request an owner"
      refreshing={loading && !!data}
      onRefresh={reload}
    >
      <AdminDataStates
        loading={loading}
        hasData={!!data}
        error={error}
        fromCache={data?.fromCache}
        cachedAt={data?.cachedAt}
        fetchError={data?.fetchError}
        onRetry={reload}
      />
      {flow.offline && data ? <Notice tone="info" message="You're offline. Assigning needs a connection; the list shows your saved copy." /> : null}
      {flow.notice ? <Notice tone="success" message={flow.notice} /> : null}

      {data ? (
        <>
          <ChipGroup label="Filter by owner" options={filterOptions} value={filter} onChange={setFilter} />
          {filteredBhw && isBHWInactive(filteredBhw) ? (
            <Notice tone="warning" message={`${filteredBhw.full_name} has been inactive. Reassign their patients to an active BHW; their open tasks move too.`} />
          ) : null}

          <Card title={`Patients (${patients.length})`} subtitle="Reassigning a patient also moves their open help requests and appointments" right={<DemoBadge />}>
            <QueueTable
              accessibilityLabel="Patients"
              columns={[
                { key: 'patient', label: 'Patient', flex: 1.5 },
                { key: 'barangay', label: 'Barangay', flex: 1.2 },
                { key: 'owner', label: 'Owner', flex: 1.3 },
                { key: 'open', label: 'Open tasks', flex: 0.8 },
                { key: 'action', label: 'Action' },
              ]}
              rows={patients.map((p) => {
                const open =
                  data.helpRequests.filter((r) => r.patient_id === p.id && OPEN_COORDINATION.includes(r.coordination_status)).length +
                  data.appointments.filter((a) => a.patient_id === p.id && OPEN_ENCOUNTER.includes(a.encounter_status)).length;
                const assigned = !!p.bhw_id && bhws.some((b) => b.id === p.bhw_id);
                return {
                  id: p.id,
                  cells: {
                    patient: p.full_name,
                    barangay: p.barangay ?? '—',
                    owner: assigned ? ownerLabel(p.bhw_id, bhws) : <StatusChip size="sm" status="coordination.unassigned" />,
                    open: String(open),
                    action: (
                      <Button
                        title={assigned ? 'Reassign' : 'Assign'}
                        variant="secondary"
                      compact
                        disabled={flow.offline}
                        onPress={() => flow.openPatient(p.id)}
                        accessibilityLabel={`${assigned ? 'Reassign' : 'Assign'} ${p.full_name}`}
                      />
                    ),
                  },
                };
              })}
              empty={<EmptyState title={filter === ALL ? 'No patients registered yet.' : 'No patients match this filter.'} />}
            />
          </Card>

          <Card title={`Open help requests (${requests.length})`} subtitle="Not completed. The owner acknowledges new assignments on their Today list.">
            <QueueTable
              accessibilityLabel="Open help requests"
              columns={[
                { key: 'patient', label: 'Patient', flex: 1.4 },
                { key: 'reason', label: 'Reason' },
                { key: 'received', label: 'Received', flex: 1.3 },
                { key: 'owner', label: 'Owner', flex: 1.2 },
                { key: 'status', label: 'Status', flex: 1.1 },
                { key: 'action', label: 'Action' },
              ]}
              rows={requests.map((r) => {
                const name = r.patient?.full_name ?? 'Patient';
                return {
                  id: r.id,
                  cells: {
                    patient: name,
                    reason: helpReasonLabel(r.reason, lang),
                    received: formatDateTimeDMY(r.received_at),
                    owner: ownerLabel(r.assigned_bhw_id, bhws),
                    status: <StatusChip size="sm" status={`coordination.${r.coordination_status}` as StatusKey} />,
                    action: (
                      <Button
                        title={r.assigned_bhw_id ? 'Reassign' : 'Assign'}
                        variant="secondary"
                      compact
                        disabled={flow.offline}
                        onPress={() => flow.openRequest(r.id, `${helpReasonLabel(r.reason, lang)} · ${name}`)}
                        accessibilityLabel={`${r.assigned_bhw_id ? 'Reassign' : 'Assign'} help request from ${name}`}
                      />
                    ),
                  },
                };
              })}
              empty={<EmptyState icon="check" title={filter === ALL ? 'No open help requests.' : 'No open help requests match this filter.'} />}
            />
          </Card>
          <View style={styles.footnote}>
            <Text style={styles.footnoteText}>Only active BHWs are offered as owners. Create or activate BHWs on the BHWs tab.</Text>
          </View>
        </>
      ) : null}
      {flow.sheet}
    </Screen>
  );
}

const styles = StyleSheet.create({
  footnote: { paddingHorizontal: spacing.xs },
  footnoteText: text.caption,
});
