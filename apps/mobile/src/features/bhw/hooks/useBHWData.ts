import { DEMO_BHW_ID } from '../../../shared/config/demo';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { fetchAdmin, fetchBHW, fetchPatients, fetchRecords } from '../../../shared/services/api';
import { getStorage } from '../../../shared/services/storage';
import { toUserMessage } from '../../../shared/services/supabase';
import type { Admin, BHW, HealthRecord, NewHealthRecord, NewPatient, Patient } from '../../../shared/types/db.types';
import type { BHWData, BHWPatient, BHWRecord } from '../types/bhw.types';

interface CachedBHWData {
  bhw: BHW | null;
  admin: Admin | null;
  patients: Patient[];
  records: HealthRecord[];
  cachedAt: string;
}

/**
 * Online: loads the BHW's assignment (from Admin) and assigned patients from
 * Supabase and caches them locally. Offline: falls back to the cache. Items
 * still in the offline queue are merged in and flagged `pendingSync`.
 */
export async function loadBHWData(bhwId: string): Promise<BHWData> {
  const storage = await getStorage();
  const cacheKey = `bhw:${bhwId}`;
  let fresh: CachedBHWData | null = null;
  let fetchError: string | null = null;

  try {
    const [bhw, patients, records] = await Promise.all([
      fetchBHW(bhwId),
      fetchPatients(bhwId),
      fetchRecords({ bhwId, limit: 100 }),
    ]);
    const admin = bhw ? await fetchAdmin(bhw.admin_id) : null;
    fresh = { bhw, admin, patients, records, cachedAt: new Date().toISOString() };
    await storage.setCache(cacheKey, fresh);
  } catch (error) {
    console.warn('BHW data fetch failed, using offline cache:', error);
    fetchError = toUserMessage(error, 'Could not load the latest data.');
  }

  const base = fresh ?? (await storage.getCache<CachedBHWData>(cacheKey));
  const queue = await storage.getPendingRecords();

  const patients: BHWPatient[] = (base?.patients ?? []).map((p) => ({ ...p, pendingSync: false }));
  const known = new Set(patients.map((p) => p.id));
  for (const item of queue) {
    if (item.entity !== 'patient') continue;
    const p = item.payload as unknown as NewPatient;
    if (known.has(p.id)) continue;
    patients.push({
      sex: null,
      birth_date: null,
      barangay: null,
      address: null,
      latitude: null,
      longitude: null,
      ...p,
      local_id: item.local_id,
      created_at: item.created_at,
      pendingSync: true,
    });
    known.add(p.id);
  }
  patients.sort((a, b) => a.full_name.localeCompare(b.full_name));

  const records: BHWRecord[] = (base?.records ?? []).map((r) => ({ ...r, pendingSync: false }));
  const syncedLocalIds = new Set(records.map((r) => r.local_id).filter(Boolean));
  for (const item of queue) {
    if (item.entity !== 'record' || syncedLocalIds.has(item.local_id)) continue;
    const r = item.payload as unknown as NewHealthRecord;
    records.unshift({
      id: item.local_id,
      notes: null,
      systolic: null,
      diastolic: null,
      temperature_c: null,
      weight_kg: null,
      scheduled_at: null,
      status: null,
      ...r,
      source: 'offline_sync',
      local_id: item.local_id,
      created_at: item.created_at,
      pendingSync: true,
    });
  }

  return {
    bhw: base?.bhw ?? null,
    admin: base?.admin ?? null,
    patients,
    records,
    fromCache: !fresh && !!base,
    cachedAt: base?.cachedAt ?? null,
    fetchError,
  };
}

export function useBHWData(bhwId: string = DEMO_BHW_ID) {
  return useAsyncData(() => loadBHWData(bhwId), [bhwId]);
}
