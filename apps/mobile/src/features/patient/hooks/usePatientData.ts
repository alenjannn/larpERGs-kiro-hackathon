import type { AsyncData } from '../../../shared/hooks/useAsyncData';
import type { PatientProfile } from '../types/patient.types';
import { usePatientSnapshot, type SnapshotState } from './usePatientSnapshot';

export type SnapshotMeta = Pick<SnapshotState, 'status' | 'fromCache'> & {
  lastUpdatedAt: string | null;
  /** Why fresh data isn't shown while a saved copy is (null when showing fresh data). */
  staleReason: string | null;
};

/**
 * Patient profile + assigned BHW + managing Admin (Admin -> BHW -> Patient chain),
 * read from the patient snapshot so it also works offline (Spec 02, OC-1.4).
 * `error` is only set when there is nothing to show.
 */
export function usePatientData(patientId?: string): AsyncData<PatientProfile> & SnapshotMeta {
  const s = usePatientSnapshot(patientId);
  const snap = s.snapshot;
  return {
    data: snap ? { patient: snap.patient, bhw: snap.bhw, admin: snap.admin } : null,
    error: snap ? null : s.error,
    loading: s.loading && !snap,
    reload: s.reload,
    status: s.status,
    fromCache: s.fromCache,
    lastUpdatedAt: snap?.last_updated_at ?? null,
    staleReason: snap ? s.error : null,
  };
}
