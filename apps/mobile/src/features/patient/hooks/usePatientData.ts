import { DEMO_PATIENT_ID } from '../../../shared/config/demo';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { fetchAdmin, fetchBHW, fetchPatient } from '../../../shared/services/api';
import type { PatientProfile } from '../types/patient.types';

async function loadProfile(patientId: string): Promise<PatientProfile> {
  const patient = await fetchPatient(patientId);
  const bhw = patient?.bhw_id ? await fetchBHW(patient.bhw_id) : null;
  const admin = bhw ? await fetchAdmin(bhw.admin_id) : null;
  return { patient, bhw, admin };
}

/** Patient profile + assigned BHW + managing Admin (Admin -> BHW -> Patient chain). */
export function usePatientData(patientId: string = DEMO_PATIENT_ID) {
  return useAsyncData(() => loadProfile(patientId), [patientId]);
}
