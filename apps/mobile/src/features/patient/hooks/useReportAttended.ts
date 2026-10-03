import { useCallback, useState } from 'react';
import { useConnectivity } from '../../../shared/context/ConnectivityContext';
import { reportAttended } from '../../../shared/services/apiPatient';
import { currentEpoch } from '../../../shared/services/resetEpoch';
import { getStorage } from '../../../shared/services/storage';
import { toUserMessage } from '../../../shared/services/supabase';
import type { Appointment } from '../../../shared/types/db.types';
import { PATIENT_COPY } from '../copy';
import { isSnapshot, snapshotKey } from './usePatientSnapshot';

/** Writes the updated appointment into the stored snapshot so Home shows it offline too. */
async function patchSnapshot(patientId: string, row: Appointment, epoch: number): Promise<void> {
  const storage = await getStorage();
  const stored = await storage.getItem<unknown>(snapshotKey(patientId));
  if (!isSnapshot(stored, patientId) || epoch !== currentEpoch()) return;
  await storage.setItem(snapshotKey(patientId), {
    ...stored,
    appointments: stored.appointments.map((a) => (a.id === row.id ? row : a)),
  });
}

/** "I already attended": online only (K4). Never sets clinic-confirmed. */
export function useReportAttended(patientId: string, reload: () => Promise<void>) {
  const { isOnline } = useConnectivity();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const report = useCallback(
    async (appt: Appointment): Promise<boolean> => {
      if (isOnline === false || busyId) return false;
      setBusyId(appt.id);
      setError(null);
      const epoch = currentEpoch();
      try {
        const row = await reportAttended(appt.id, patientId);
        if (!row) {
          setError(PATIENT_COPY.attendAlreadyUpdated);
          await reload();
          return false;
        }
        try {
          await patchSnapshot(patientId, row, epoch);
        } catch (e) {
          console.warn('Could not update the saved copy of your appointments:', e);
        }
        await reload();
        return true;
      } catch (e) {
        console.error('Attendance update failed:', e);
        setError(toUserMessage(e, PATIENT_COPY.attendFailed));
        return false;
      } finally {
        setBusyId(null);
      }
    },
    [busyId, isOnline, patientId, reload]
  );

  return { busyId, error, report, clearError: () => setError(null) };
}
