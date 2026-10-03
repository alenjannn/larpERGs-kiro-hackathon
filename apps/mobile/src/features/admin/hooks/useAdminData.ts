import { DEMO_ADMIN_ID } from '../../../shared/config/demo';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { fetchAdmin, fetchBHWs, fetchHelpRequests, fetchPatients, fetchRecords } from '../../../shared/services/api';
import { getStorage } from '../../../shared/services/storage';
import { toUserMessage } from '../../../shared/services/supabase';
import type { Admin, BHW, HealthRecord, HelpRequestWithPatient, Patient } from '../../../shared/types/db.types';
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

interface CachedAdminData {
  admin: Admin | null;
  bhws: BHW[];
  patients: Patient[];
  records: HealthRecord[];
  helpRequests: HelpRequestWithPatient[];
  cachedAt: string;
}

function build(base: CachedAdminData, fromCache: boolean, fetchError: string | null): AdminData {
  const seen = new Set<string>();
  return {
    admin: base.admin,
    bhws: base.bhws,
    patients: base.patients,
    records: base.records,
    // One row per request id (OC-5.5).
    helpRequests: (base.helpRequests ?? []).filter((h) => !seen.has(h.id) && !!seen.add(h.id)),
    activity: computeActivity(base.bhws, base.patients, base.records),
    metrics: computeMetrics(base.bhws, base.patients, base.records),
    fromCache,
    cachedAt: base.cachedAt,
    fetchError,
  };
}

/** Cache-then-network: online data is saved for offline use; offline shows the last copy (OC-8.2). */
async function loadAdminData(adminId: string): Promise<AdminData> {
  const storage = await getStorage();
  const cacheKey = `admin:${adminId}`;
  try {
    const [admin, bhws, patients, records, helpRequests] = await Promise.all([
      fetchAdmin(adminId),
      fetchBHWs(adminId),
      fetchPatients(),
      fetchRecords({ limit: 500 }),
      fetchHelpRequests({ limit: 50 }),
    ]);
    const fresh: CachedAdminData = { admin, bhws, patients, records, helpRequests, cachedAt: new Date().toISOString() };
    let cacheError: string | null = null;
    try {
      await storage.setCache(cacheKey, fresh);
    } catch (error) {
      console.warn('Could not save the admin offline copy:', error);
      cacheError = `Could not save an offline copy on this device: ${error instanceof Error ? error.message : String(error)}`;
    }
    return build(fresh, false, cacheError);
  } catch (error) {
    const cached = await storage.getCache<CachedAdminData>(cacheKey);
    if (!cached) throw error;
    console.warn('Admin data fetch failed, using offline cache:', error);
    return build(cached, true, toUserMessage(error, 'Could not load the latest data.'));
  }
}

/** System-wide view for the Admin: their BHWs, all patients and all field records. */
export function useAdminData(adminId: string = DEMO_ADMIN_ID) {
  return useAsyncData(() => loadAdminData(adminId), [adminId]);
}
