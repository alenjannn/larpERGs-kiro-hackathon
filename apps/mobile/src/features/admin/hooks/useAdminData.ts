import { DEMO_ADMIN_ID } from '../../../shared/config/demo';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { fetchAdmin, fetchBHWs, fetchHelpRequests, fetchPatients, fetchRecords } from '../../../shared/services/api';
import { fetchAllAppointments } from '../../../shared/services/apiAdmin';
import { getStorage } from '../../../shared/services/storage';
import { toUserMessage } from '../../../shared/services/supabase';
import type { Admin, Appointment, BHW, HealthRecord, HelpRequestWithPatient, Patient } from '../../../shared/types/db.types';
import { isWithinDays } from '../../../shared/utils/date';
import type { AdminData, BHWActivity } from '../types/admin.types';

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

interface CachedAdminData {
  admin: Admin | null;
  bhws: BHW[];
  patients: Patient[];
  records: HealthRecord[];
  helpRequests: HelpRequestWithPatient[];
  /** Missing in caches written before Spec 05. */
  appointments?: Appointment[];
  cachedAt: string;
}

function uniqueById<T extends { id: string }>(rows: T[] | undefined): T[] {
  const seen = new Set<string>();
  return (rows ?? []).filter((r) => !seen.has(r.id) && !!seen.add(r.id));
}

function build(base: CachedAdminData, fromCache: boolean, fetchError: string | null): AdminData {
  return {
    admin: base.admin,
    bhws: base.bhws,
    patients: base.patients,
    records: base.records,
    appointments: uniqueById(base.appointments),
    // One row per request id (OC-5.5, A-5.2).
    helpRequests: uniqueById(base.helpRequests),
    activity: computeActivity(base.bhws, base.patients, base.records),
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
    const [admin, bhws, patients, records, helpRequests, appointments] = await Promise.all([
      fetchAdmin(adminId),
      fetchBHWs(adminId),
      fetchPatients(),
      fetchRecords({ limit: 500 }),
      fetchHelpRequests({ limit: 200 }),
      fetchAllAppointments(),
    ]);
    const fresh: CachedAdminData = { admin, bhws, patients, records, helpRequests, appointments, cachedAt: new Date().toISOString() };
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

/** System-wide view for the RHU coordinator: their BHWs, all patients, field records, appointments and help requests. */
export function useAdminData(adminId: string = DEMO_ADMIN_ID) {
  return useAsyncData(() => loadAdminData(adminId), [adminId]);
}
