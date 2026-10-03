import type { AsyncData } from '../../../shared/hooks/useAsyncData';
import type { HealthRecord } from '../../../shared/types/db.types';
import type { PatientHealth } from '../types/patient.types';
import type { SnapshotMeta } from './usePatientData';
import { usePatientSnapshot } from './usePatientSnapshot';

export function groupRecords(all: HealthRecord[], now = Date.now()): PatientHealth {
  const appointments = all.filter((r) => r.record_type === 'appointment');
  const isUpcoming = (r: HealthRecord) => !!r.scheduled_at && new Date(r.scheduled_at).getTime() >= now && r.status !== 'missed';
  return {
    all,
    visits: all.filter((r) => r.record_type === 'visit'),
    updates: all.filter((r) => r.record_type === 'health_update'),
    upcomingAppointments: appointments
      .filter(isUpcoming)
      .sort((a, b) => (a.scheduled_at ?? '').localeCompare(b.scheduled_at ?? '')),
    pastAppointments: appointments.filter((r) => !isUpcoming(r)),
  };
}

/** Records the patient's BHW created for them, read from the patient snapshot (works offline). */
export function useHealthRecords(patientId?: string): AsyncData<PatientHealth> & SnapshotMeta {
  const s = usePatientSnapshot(patientId);
  const snap = s.snapshot;
  return {
    data: snap ? groupRecords(snap.records) : null,
    error: snap ? null : s.error,
    loading: s.loading && !snap,
    reload: s.reload,
    status: s.status,
    fromCache: s.fromCache,
    lastUpdatedAt: snap?.last_updated_at ?? null,
    staleReason: snap ? s.error : null,
  };
}
