import { useCallback, useState } from 'react';
import { DEMO_CLINICIAN_ID } from '../../../shared/config/demo';
import { useConnectivity } from '../../../shared/context/ConnectivityContext';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { fetchPatients, fetchRecords } from '../../../shared/services/api';
import { fetchCarePlans, releaseCarePlan, saveCarePlanDraft, type CarePlanInput } from '../../../shared/services/apiAdmin';
import { getStorage } from '../../../shared/services/storage';
import { toUserMessage } from '../../../shared/services/supabase';
import type { CarePlan, HealthRecord, Patient } from '../../../shared/types/db.types';

export const OFFLINE_RELEASE_NOTICE = 'Saving or releasing a plan needs a connection. Your text stays in the form.';

export interface ClinicalReviewData {
  patients: Patient[];
  records: HealthRecord[];
  carePlans: CarePlan[];
  cachedAt: string;
  fromCache: boolean;
  fetchError: string | null;
}

type Cached = Omit<ClinicalReviewData, 'fromCache' | 'fetchError'>;

async function load(clinicianId: string): Promise<ClinicalReviewData> {
  const storage = await getStorage();
  const key = `admin:clinical:${clinicianId}`;
  try {
    const [patients, records, carePlans] = await Promise.all([fetchPatients(), fetchRecords({ limit: 500 }), fetchCarePlans()]);
    const fresh: Cached = { patients, records, carePlans, cachedAt: new Date().toISOString() };
    let fetchError: string | null = null;
    try {
      await storage.setCache(key, fresh);
    } catch (error) {
      console.warn('Could not save the clinical review offline copy:', error);
      fetchError = `Could not save an offline copy on this device: ${error instanceof Error ? error.message : String(error)}`;
    }
    return { ...fresh, fromCache: false, fetchError };
  } catch (error) {
    const cached = await storage.getCache<Cached>(key);
    if (!cached) throw error;
    return { ...cached, fromCache: true, fetchError: toUserMessage(error, 'Could not load the latest data.') };
  }
}

/**
 * Clinician-only data. When `enabled` is false (clinician mode off) nothing is
 * fetched and no clinical data is held in memory (A-4.1).
 */
export function useClinicalReview(enabled: boolean, clinicianId: string = DEMO_CLINICIAN_ID) {
  const { isOnline } = useConnectivity();
  const offline = isOnline === false;
  const query = useAsyncData<ClinicalReviewData | null>(() => (enabled ? load(clinicianId) : Promise.resolve(null)), [enabled, clinicianId]);
  const [busy, setBusy] = useState<'draft' | 'release' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (kind: 'draft' | 'release', input: CarePlanInput): Promise<CarePlan | null> => {
      if (offline) {
        setError(OFFLINE_RELEASE_NOTICE);
        return null;
      }
      setBusy(kind);
      setError(null);
      try {
        const plan = kind === 'draft' ? await saveCarePlanDraft(input) : await releaseCarePlan(input);
        await query.reload();
        return plan;
      } catch (e) {
        console.error(`Care plan ${kind} failed:`, e);
        setError(toUserMessage(e, kind === 'draft' ? 'Could not save the draft.' : 'Could not release the plan.'));
        return null;
      } finally {
        setBusy(null);
      }
    },
    [offline, query]
  );

  const saveDraft = useCallback((input: CarePlanInput) => run('draft', input), [run]);
  const release = useCallback((input: CarePlanInput) => run('release', input), [run]);

  return { ...query, offline, busy, actionError: error, clearActionError: () => setError(null), saveDraft, release, clinicianId };
}
