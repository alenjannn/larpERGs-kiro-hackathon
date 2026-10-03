import { DEMO_BHW_ID } from '../../../shared/config/demo';
import { useDemoRole } from '../../../shared/context/DemoRoleContext';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { fetchAdmin, fetchBHW, fetchHelpRequests, fetchPatients, fetchRecords } from '../../../shared/services/api';
import { getStorage } from '../../../shared/services/storage';
import { toUserMessage } from '../../../shared/services/supabase';
import type { Admin, BHW, HealthRecord, HelpRequestWithPatient, NewHealthRecord, NewPatient, Patient } from '../../../shared/types/db.types';
import type { BHWData, BHWPatient, BHWRecord } from '../types/bhw.types';

interface CachedBHWData {
  bhw: BHW | null;
  admin: Admin | null;
  patients: Patient[];
  records: HealthRecord[];
  /** Added in Spec 02; older caches have none. */
  helpRequests?: HelpRequestWithPatient[];
  cachedAt: string;
}

/** Help requests in the BHW's Today queue: owned and still open. */
const TODAY_STATUSES = ['assigned', 'acknowledged', 'blocked'] as const;

/**
 * Online: loads the BHW's assignment (from Admin), assigned patients and
 * received help requests from Supabase and caches them locally. Offline:
 * falls back to the cache. Items in the local queue (pending or already
 * synced but not yet in the cache) are merged in, so nothing saved on this
 * device disappears after Sync Now and a reload (OC-8.3).
 */
export async function loadBHWData(bhwId: string): Promise<BHWData> {
  const storage = await getStorage();
  const cacheKey = `bhw:${bhwId}`;
  let fresh: CachedBHWData | null = null;
  let fetchError: string | null = null;

  try {
    const [bhw, patients, records, helpRequests] = await Promise.all([
      fetchBHW(bhwId),
      fetchPatients(bhwId),
      fetchRecords({ bhwId, limit: 100 }),
      fetchHelpRequests({ assignedBhwId: bhwId, statuses: [...TODAY_STATUSES] }),
    ]);
    const admin = bhw ? await fetchAdmin(bhw.admin_id) : null;
    fresh = { bhw, admin, patients, records, helpRequests, cachedAt: new Date().toISOString() };
  } catch (error) {
    console.warn('BHW data fetch failed, using offline cache:', error);
    fetchError = toUserMessage(error, 'Could not load the latest data.');
  }

  // A failed cache write must not hide fresh data; it is reported instead (OC-8.4).
  let cacheError: string | null = null;
  if (fresh) {
    try {
      await storage.setCache(cacheKey, fresh);
    } catch (error) {
      console.warn('Could not save the BHW offline copy:', error);
      cacheError = `Could not save an offline copy on this device: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  const base = fresh ?? (await storage.getCache<CachedBHWData>(cacheKey));
  const queue = await storage.getAllRecords();

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
      pendingSync: item.sync_status !== 'synced',
    });
    known.add(p.id);
  }
  patients.sort((a, b) => a.full_name.localeCompare(b.full_name));

  const records: BHWRecord[] = (base?.records ?? []).map((r) => ({ ...r, pendingSync: false }));
  const cachedLocalIds = new Set(records.map((r) => r.local_id).filter(Boolean));
  // Queue is newest first; unshift in reverse keeps newest at the top.
  for (const item of [...queue].reverse()) {
    if (item.entity !== 'record' || cachedLocalIds.has(item.local_id)) continue;
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
      pendingSync: item.sync_status !== 'synced',
    });
  }

  // One row per request id (OC-5.5).
  const seen = new Set<string>();
  const helpRequests = (base?.helpRequests ?? []).filter((h) => !seen.has(h.id) && !!seen.add(h.id));

  return {
    bhw: base?.bhw ?? null,
    admin: base?.admin ?? null,
    patients,
    records,
    helpRequests,
    fromCache: !fresh && !!base,
    cachedAt: base?.cachedAt ?? null,
    fetchError,
    cacheError,
  };
}

/** The current BHW: the demo persona when the role is BHW. */
export function useCurrentBHWId(): string {
  const { role, personaId } = useDemoRole();
  return role === 'bhw' && personaId ? personaId : DEMO_BHW_ID;
}

export function useBHWData(bhwId?: string) {
  const current = useCurrentBHWId();
  const id = bhwId ?? current;
  return useAsyncData(() => loadBHWData(id), [id]);
}
