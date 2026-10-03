import { DEMO_ADMIN_ID } from '../../../shared/config/demo';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { fetchAdmin, fetchBHWs, fetchPatients, fetchRecords } from '../../../shared/services/api';
import type { BHW, HealthRecord, Patient } from '../../../shared/types/db.types';
import { isWithinDays } from '../../../shared/utils/date';
import { isElevatedBP } from '../../../shared/utils/format';
import type { AdminData, BHWActivity, HealthMetrics } from '../types/admin.types';

export function computeActivity(bhws: BHW[], patients: Patient[], records: HealthRecord[], now = Date.now()): BHWActivity[] {
  return bhws.map((bhw) => {
    const own = records.filter((r) => r.bhw_id === bhw.id);
    return {
      bhw,
      patientCount: patients.filter((p) => p.bhw_id === bhw.id).length,
      recordsLast7Days: own.filter((r) => isWithinDays(r.created_at, 7, now)).length,
      offlineSyncedRecords: own.filter((r) => r.source === 'offline_sync').length,
      // records arrive newest-first
      lastActivityAt: own[0]?.created_at ?? null,
    };
  });
}

export function computeMetrics(bhws: BHW[], patients: Patient[], records: HealthRecord[], now = Date.now()): HealthMetrics {
  const bhwIds = new Set(bhws.map((b) => b.id));
  const latestBP = new Map<string, HealthRecord>();
  for (const r of records) {
    if (r.systolic != null && r.diastolic != null && !latestBP.has(r.patient_id)) latestBP.set(r.patient_id, r);
  }
  return {
    activeBHWs: bhws.filter((b) => b.status === 'active').length,
    totalBHWs: bhws.length,
    totalPatients: patients.length,
    unassignedPatients: patients.filter((p) => !p.bhw_id || !bhwIds.has(p.bhw_id)).length,
    visitsLast7Days: records.filter((r) => r.record_type === 'visit' && isWithinDays(r.created_at, 7, now)).length,
    upcomingAppointments: records.filter(
      (r) => r.record_type === 'appointment' && r.scheduled_at && new Date(r.scheduled_at).getTime() >= now && r.status !== 'missed'
    ).length,
    elevatedBPPatients: [...latestBP.values()].filter(isElevatedBP).length,
  };
}

async function loadAdminData(adminId: string): Promise<AdminData> {
  const [admin, bhws, patients, records] = await Promise.all([
    fetchAdmin(adminId),
    fetchBHWs(adminId),
    fetchPatients(),
    fetchRecords({ limit: 500 }),
  ]);
  return {
    admin,
    bhws,
    patients,
    records,
    activity: computeActivity(bhws, patients, records),
    metrics: computeMetrics(bhws, patients, records),
  };
}

/** System-wide view for the Admin: their BHWs, all patients and all field records. */
export function useAdminData(adminId: string = DEMO_ADMIN_ID) {
  return useAsyncData(() => loadAdminData(adminId), [adminId]);
}
