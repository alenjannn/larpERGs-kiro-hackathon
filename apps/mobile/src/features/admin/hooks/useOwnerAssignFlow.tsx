import { useCallback, useMemo, useState } from 'react';
import type { BHW } from '../../../shared/types/db.types';
import { OPEN_COORDINATION, OPEN_ENCOUNTER } from '../../../shared/services/apiAdmin';
import { useAssignments, OFFLINE_ASSIGN_NOTICE } from './useAssignments';
import { availableBHWs } from '../needsAttention';
import type { AdminData } from '../types/admin.types';
import AssignSheet, { type AssignTarget } from '../components/AssignSheet';

/**
 * Shared assign/reassign state for Needs Attention and Assignments:
 * open the sheet for a target, run the write, reload, close on success.
 */
export function useOwnerAssignFlow(data: AdminData | null, reload: () => void) {
  const assignments = useAssignments(reload);
  const [target, setTarget] = useState<AssignTarget | null>(null);
  const bhws = useMemo(() => data?.bhws ?? [], [data]);
  const available = useMemo(() => availableBHWs(bhws), [bhws]);

  /** "Also moves 1 open help request and 2 open appointments to the new BHW." */
  const patientNote = useCallback(
    (patientId: string): string | undefined => {
      if (!data) return undefined;
      const requests = data.helpRequests.filter((r) => r.patient_id === patientId && OPEN_COORDINATION.includes(r.coordination_status)).length;
      const appts = data.appointments.filter((a) => a.patient_id === patientId && OPEN_ENCOUNTER.includes(a.encounter_status)).length;
      if (!requests && !appts) return 'This patient has no open help requests or appointments.';
      const parts = [
        requests ? `${requests} open help request${requests === 1 ? '' : 's'}` : null,
        appts ? `${appts} open appointment${appts === 1 ? '' : 's'}` : null,
      ].filter(Boolean);
      return `Also moves ${parts.join(' and ')} to the new BHW.`;
    },
    [data]
  );

  const openPatient = useCallback(
    (patientId: string) => {
      const p = data?.patients.find((x) => x.id === patientId);
      if (!p) return;
      assignments.clearMessages();
      setTarget({ kind: 'patient', id: p.id, label: p.full_name, currentOwnerId: p.bhw_id, note: patientNote(p.id) });
    },
    [data, assignments, patientNote]
  );

  const openRequest = useCallback(
    (requestId: string, label: string) => {
      const r = data?.helpRequests.find((x) => x.id === requestId);
      if (!r) return;
      assignments.clearMessages();
      setTarget({ kind: 'help_request', id: r.id, label, currentOwnerId: r.assigned_bhw_id });
    },
    [data, assignments]
  );

  const onAssign = useCallback(
    async (t: AssignTarget, bhw: BHW) => {
      const ok =
        t.kind === 'patient'
          ? await assignments.assignPatient(t.id, bhw.id, bhw.full_name)
          : await assignments.assignRequest(t.id, bhw.id, bhw.full_name);
      if (ok) setTarget(null);
    },
    [assignments]
  );

  const sheet = (
    <AssignSheet
      target={target}
      bhws={available}
      allBhws={bhws}
      busy={!!target && assignments.busy === target.id}
      error={assignments.error}
      disabledReason={assignments.offline ? OFFLINE_ASSIGN_NOTICE : null}
      onAssign={onAssign}
      onClose={() => setTarget(null)}
    />
  );

  return { sheet, openPatient, openRequest, notice: assignments.notice, offline: assignments.offline, busy: assignments.busy };
}
