import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import DemoBadge from '../../../shared/components/DemoBadge';
import DeveloperTools from '../../../shared/components/DeveloperTools';
import EmptyState from '../../../shared/components/EmptyState';
import Notice from '../../../shared/components/Notice';
import Screen from '../../../shared/components/Screen';
import SectionHeader from '../../../shared/components/SectionHeader';
import StatTile from '../../../shared/components/StatTile';
import StatusChip from '../../../shared/components/StatusChip';
import { DEMO_PERSONAS } from '../../../shared/config/demo';
import { useLanguage } from '../../../shared/context/DemoRoleContext';
import { helpReasonLabel } from '../../../shared/helpRequests';
import { colors, spacing, text } from '../../../shared/theme';
import { formatDateDMY } from '../../../shared/utils/date';
import AdminDataStates from '../components/AdminDataStates';
import BHWList from '../components/BHWList';
import ConnectionTest from '../components/ConnectionTest';
import DemoClinicInbox from '../components/DemoClinicInbox';
import FieldRecordsFeed from '../components/FieldRecordsFeed';
import QueueTable from '../components/QueueTable';
import { useAdminData } from '../hooks/useAdminData';
import { useOwnerAssignFlow } from '../hooks/useOwnerAssignFlow';
import { BLOCKED_OVERDUE_DAYS, buildNeedsAttention, formatAge, INACTIVE_DAYS, REVIEW_OVERDUE_DAYS } from '../needsAttention';

/** RHU coordinator home: exceptions only, each with its age and one action (A-1). */
export default function NeedsAttentionScreen() {
  const router = useRouter();
  const lang = useLanguage();
  const { data, error, loading, reload } = useAdminData();
  const flow = useOwnerAssignFlow(data, reload);
  const na = useMemo(() => (data ? buildNeedsAttention(data) : null), [data]);
  const bhwName = new Map((data?.bhws ?? []).map((b) => [b.id, b.full_name]));
  const actionsDisabled = flow.offline;
  const total = na
    ? na.unassignedRequests.length + na.unassignedPatients.length + na.overdueReviews.length + na.blockedRequests.length + na.inactiveBHWs.length
    : 0;

  return (
    <Screen
      title="Needs Attention"
      subtitle={`${data?.admin?.full_name ?? DEMO_PERSONAS.admin.name} · RHU coordinator. Only items where care is stuck.`}
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
      {data && !data.admin && !data.fromCache ? (
        <Notice tone="warning" message="Admin profile not found. Run supabase/seed.sql to create the demo personas." />
      ) : null}
      {flow.offline && data ? <Notice tone="info" message="You're offline. Actions need a connection; the list shows your saved copy." /> : null}
      {flow.notice ? <Notice tone="success" message={flow.notice} /> : null}

      {na && data ? (
        <>
          <Text style={[styles.summary, total === 0 && styles.summaryOk]} accessibilityRole="summary">
            {total === 0 ? 'Nothing needs attention right now.' : `${total} item${total === 1 ? '' : 's'} need attention.`}
          </Text>
          <View style={styles.stats}>
            <StatTile label="Unassigned requests" value={na.unassignedRequests.length} />
            <StatTile label="Unassigned patients" value={na.unassignedPatients.length} />
            <StatTile label="Overdue reviews" value={na.overdueReviews.length} />
            <StatTile label="Blocked barriers" value={na.blockedRequests.length} />
            <StatTile label="Inactive BHWs" value={na.inactiveBHWs.length} />
          </View>

          <Card title="Unassigned help requests" subtitle="No BHW owns these yet" right={<DemoBadge />}>
            <QueueTable
              accessibilityLabel="Unassigned help requests"
              columns={[
                { key: 'patient', label: 'Patient', flex: 1.4 },
                { key: 'reason', label: 'Reason' },
                { key: 'age', label: 'Waiting' },
                { key: 'action', label: 'Action' },
              ]}
              rows={na.unassignedRequests.map(({ request, ageMs }) => ({
                id: request.id,
                cells: {
                  patient: request.patient?.full_name ?? 'Patient',
                  reason: helpReasonLabel(request.reason, lang),
                  age: formatAge(ageMs),
                  action: (
                    <Button
                      title="Assign"
                      variant="secondary"
                      disabled={actionsDisabled}
                      onPress={() => flow.openRequest(request.id, `${helpReasonLabel(request.reason, lang)} · ${request.patient?.full_name ?? 'Patient'}`)}
                      accessibilityLabel={`Assign help request from ${request.patient?.full_name ?? 'patient'}`}
                    />
                  ),
                },
              }))}
              empty={<EmptyState icon="check" title="No unassigned help requests." />}
            />
          </Card>

          <Card title="Unassigned patients" subtitle="Patients without a BHW">
            <QueueTable
              accessibilityLabel="Unassigned patients"
              columns={[
                { key: 'patient', label: 'Patient', flex: 1.4 },
                { key: 'barangay', label: 'Barangay' },
                { key: 'age', label: 'Registered' },
                { key: 'action', label: 'Action' },
              ]}
              rows={na.unassignedPatients.map(({ patient, ageMs }) => ({
                id: patient.id,
                cells: {
                  patient: patient.full_name,
                  barangay: patient.barangay ?? '—',
                  age: `${formatAge(ageMs)} ago`,
                  action: (
                    <Button
                      title="Assign"
                      variant="secondary"
                      disabled={actionsDisabled}
                      onPress={() => flow.openPatient(patient.id)}
                      accessibilityLabel={`Assign ${patient.full_name} to a BHW`}
                    />
                  ),
                },
              }))}
              empty={<EmptyState icon="check" title="Every patient has a BHW." />}
            />
          </Card>

          <Card title={`Results awaiting review > ${REVIEW_OVERDUE_DAYS} days`} subtitle="Result details are only shown in Clinical Review">
            <QueueTable
              accessibilityLabel="Results awaiting clinical review"
              columns={[
                { key: 'patient', label: 'Patient', flex: 1.4 },
                { key: 'status', label: 'Status', flex: 1.4 },
                { key: 'age', label: 'Waiting' },
                { key: 'action', label: 'Action', flex: 1.2 },
              ]}
              rows={na.overdueReviews.map(({ record, patientName, ageMs }) => ({
                id: record.id,
                cells: {
                  patient: patientName,
                  status: <StatusChip size="sm" status="clinical.awaiting_clinical_review" />,
                  age: formatAge(ageMs),
                  action: (
                    <Button
                      title="Open Clinical Review"
                      variant="secondary"
                      onPress={() => router.push('/admin/clinical-review')}
                      accessibilityLabel={`Open Clinical Review for ${patientName}`}
                    />
                  ),
                },
              }))}
              empty={<EmptyState icon="check" title={`No results waiting more than ${REVIEW_OVERDUE_DAYS} days.`} />}
            />
          </Card>

          <Card title={`Blocked barriers > ${BLOCKED_OVERDUE_DAYS} days`} subtitle="Help requests marked blocked by their BHW">
            <QueueTable
              accessibilityLabel="Blocked help requests"
              columns={[
                { key: 'patient', label: 'Patient', flex: 1.4 },
                { key: 'reason', label: 'Barrier' },
                { key: 'owner', label: 'Owner' },
                { key: 'age', label: 'Waiting' },
                { key: 'action', label: 'Action' },
              ]}
              rows={na.blockedRequests.map(({ request, ageMs }) => ({
                id: request.id,
                cells: {
                  patient: request.patient?.full_name ?? 'Patient',
                  reason: helpReasonLabel(request.reason, lang),
                  owner: request.assigned_bhw_id ? bhwName.get(request.assigned_bhw_id) ?? 'unknown BHW' : 'No owner',
                  age: formatAge(ageMs),
                  action: (
                    <Button
                      title="Reassign"
                      variant="secondary"
                      disabled={actionsDisabled}
                      onPress={() => flow.openRequest(request.id, `${helpReasonLabel(request.reason, lang)} · ${request.patient?.full_name ?? 'Patient'}`)}
                      accessibilityLabel={`Reassign blocked request from ${request.patient?.full_name ?? 'patient'}`}
                    />
                  ),
                },
              }))}
              empty={
                <EmptyState
                  icon="check"
                  title={`No blocked barriers older than ${BLOCKED_OVERDUE_DAYS} days.`}
                  message={
                    na.newerBlockedCount
                      ? `${na.newerBlockedCount} newer blocked request${na.newerBlockedCount === 1 ? ' is' : 's are'} with their BHW.`
                      : undefined
                  }
                />
              }
            />
          </Card>

          <Card title={`BHWs inactive > ${INACTIVE_DAYS} days`} subtitle="Their patients may need another owner">
            <QueueTable
              accessibilityLabel="Inactive BHWs"
              columns={[
                { key: 'bhw', label: 'BHW', flex: 1.4 },
                { key: 'work', label: 'Open work', flex: 1.2 },
                { key: 'age', label: 'Last active' },
                { key: 'action', label: 'Action', flex: 1.2 },
              ]}
              rows={na.inactiveBHWs.map(({ bhw, ageMs, patientCount, openRequestCount }) => ({
                id: bhw.id,
                cells: {
                  bhw: `${bhw.full_name} · ${bhw.barangay}`,
                  work: `${patientCount} patient${patientCount === 1 ? '' : 's'} · ${openRequestCount} open request${openRequestCount === 1 ? '' : 's'}`,
                  age: ageMs === null ? 'No activity recorded' : `${formatAge(ageMs)} ago (${formatDateDMY(bhw.last_active_at)})`,
                  action: (
                    <Button
                      title="Reassign patients"
                      variant="secondary"
                      onPress={() => router.push({ pathname: '/admin/patient-management', params: { bhw: bhw.id } })}
                      accessibilityLabel={`Reassign patients of ${bhw.full_name}`}
                    />
                  ),
                },
              }))}
              empty={<EmptyState icon="check" title="All BHWs were active in the last 3 days." />}
            />
          </Card>

          <SectionHeader title="Activity" subtitle="What has come in from patients and BHWs" />
          <DemoClinicInbox requests={data.helpRequests} bhws={data.bhws} />
          <FieldRecordsFeed records={data.records} patients={data.patients} bhws={data.bhws} />

          <Card title="BHW roster" subtitle="Listed in the order they were added. Not a ranking.">
            <BHWList activity={data.activity} />
          </Card>
          <Text style={styles.footnote}>Counts reflect records received so far. Offline field work appears after the BHW syncs.</Text>
        </>
      ) : null}

      {flow.sheet}
      <DeveloperTools>
        <ConnectionTest />
      </DeveloperTools>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { ...text.bodyStrong, color: colors.pending },
  summaryOk: { color: colors.success },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  footnote: text.caption,
});
