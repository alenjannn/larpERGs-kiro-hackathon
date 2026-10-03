import { DEMO_PATIENT_ID } from '../../../shared/config/demo';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { fetchRecords } from '../../../shared/services/api';
import type { HealthRecord } from '../../../shared/types/db.types';
import type { PatientHealth } from '../types/patient.types';

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

/** Records the patient's BHW created for them (visits, updates, appointments). */
export function useHealthRecords(patientId: string = DEMO_PATIENT_ID) {
  return useAsyncData(async () => groupRecords(await fetchRecords({ patientId })), [patientId]);
}
