import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { DEMO_PATIENT_ID } from '../../../shared/config/demo';
import { useConnectivity } from '../../../shared/context/ConnectivityContext';
import { useDemoRole } from '../../../shared/context/DemoRoleContext';
import {
  fetchAdmin,
  fetchAppointments,
  fetchBHW,
  fetchClinic,
  fetchPatient,
  fetchRecords,
  fetchReleasedCarePlan,
} from '../../../shared/services/api';
import { currentEpoch } from '../../../shared/services/resetEpoch';
import { getStorage, type LocalV1Key } from '../../../shared/services/storage';
import { supabase, toUserMessage } from '../../../shared/services/supabase';
import type { Admin, Appointment, BHW, CarePlan, Clinic, HealthRecord, Patient } from '../../../shared/types/db.types';

/** Last successful online load of the patient's Home data (Spec 02, OC-13). */
export interface PatientSnapshot {
  v: 1;
  patient_id: string;
  last_updated_at: string;
  patient: Patient | null;
  bhw: BHW | null;
  admin: Admin | null;
  clinic: Clinic | null;
  clinician: Admin | null;
  appointments: Appointment[];
  /** Latest released plan only; drafts are never stored for the patient. */
  care_plan: CarePlan | null;
  records: HealthRecord[];
}

export type SnapshotStatus = 'loading' | 'ready' | 'none';

export interface SnapshotState {
  snapshot: PatientSnapshot | null;
  /** 'none' = no stored snapshot and no fresh data (show "Connect once…"). */
  status: SnapshotStatus;
  /** Showing the stored copy (offline, or the online load failed). */
  fromCache: boolean;
  /** Why fresh data isn't shown, or why the offline copy couldn't be saved. */
  error: string | null;
  loading: boolean;
}

export const snapshotKey = (patientId: string): LocalV1Key => `tuloy:v1:patient_snapshot:${patientId}`;

export function isSnapshot(value: unknown, patientId?: string): value is PatientSnapshot {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.v === 1 &&
    typeof v.patient_id === 'string' &&
    (!patientId || v.patient_id === patientId) &&
    typeof v.last_updated_at === 'string' &&
    Array.isArray(v.appointments) &&
    Array.isArray(v.records)
  );
}

/** The patient whose Home is shown: the demo persona when the role is patient. */
export function useCurrentPatientId(): string {
  const { role, personaId } = useDemoRole();
  return role === 'patient' && personaId ? personaId : DEMO_PATIENT_ID;
}

async function loadFresh(patientId: string): Promise<PatientSnapshot> {
  // All-or-nothing: any rejection fails the whole load and the stored snapshot stays as is.
  const [patient, appointments, carePlan, records] = await Promise.all([
    fetchPatient(patientId),
    fetchAppointments(patientId),
    fetchReleasedCarePlan(patientId),
    fetchRecords({ patientId }),
  ]);
  const [bhw, clinic, clinician] = await Promise.all([
    patient?.bhw_id ? fetchBHW(patient.bhw_id) : Promise.resolve(null),
    patient?.clinic_id ? fetchClinic(patient.clinic_id) : Promise.resolve(null),
    carePlan?.clinician_admin_id ? fetchAdmin(carePlan.clinician_admin_id) : Promise.resolve(null),
  ]);
  const admin = bhw ? await fetchAdmin(bhw.admin_id) : null;
  return {
    v: 1,
    patient_id: patientId,
    last_updated_at: new Date().toISOString(),
    patient,
    bhw,
    admin,
    clinic,
    clinician,
    appointments,
    care_plan: carePlan,
    records,
  };
}

// One Realtime channel per patient, shared by every mounted screen.
// supabase.channel(name) returns the existing channel for a topic that is
// already subscribed, and calling .on() on it throws. Home stays mounted while
// other tabs mount, so each hook creating its own channel crashed the app.
type RecordsListener = () => void;
const recordChannels = new Map<string, { listeners: Set<RecordsListener>; remove: () => void }>();
// removeChannel() is async, so a quick remount could get the old, closing
// channel back for a reused topic. A fresh topic per channel avoids that.
let channelGeneration = 0;

function subscribeToPatientRecords(patientId: string, listener: RecordsListener): () => void {
  const client = supabase;
  if (!client) return () => {};
  let entry = recordChannels.get(patientId);
  if (!entry) {
    const listeners = new Set<RecordsListener>();
    const channel = client
      .channel(`patient_records:${patientId}:${++channelGeneration}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'records', filter: `patient_id=eq.${patientId}` }, () => {
        listeners.forEach((l) => {
          try {
            l();
          } catch (error) {
            console.error('Patient records listener failed:', error);
          }
        });
      })
      .subscribe();
    entry = { listeners, remove: () => void client.removeChannel(channel) };
    recordChannels.set(patientId, entry);
  }
  const current = entry;
  current.listeners.add(listener);
  return () => {
    current.listeners.delete(listener);
    if (current.listeners.size === 0 && recordChannels.get(patientId) === current) {
      recordChannels.delete(patientId);
      current.remove();
    }
  };
}

const inFlight = new Map<string, Promise<PatientSnapshot>>();

/** Shared per patient, so Home, Profile and My Health loading together fetch once. */
export function fetchPatientSnapshot(patientId: string): Promise<PatientSnapshot> {
  let promise = inFlight.get(patientId);
  if (!promise) {
    promise = loadFresh(patientId).finally(() => inFlight.delete(patientId));
    inFlight.set(patientId, promise);
  }
  return promise;
}

async function readStored(patientId: string): Promise<PatientSnapshot | null> {
  try {
    const value = await (await getStorage()).getItem<unknown>(snapshotKey(patientId));
    return isSnapshot(value, patientId) ? value : null;
  } catch (error) {
    console.warn('Could not read the saved patient snapshot:', error);
    return null;
  }
}

/** Cache-then-network: the stored snapshot first, then fresh data when online (OC-1.5). */
export function usePatientSnapshot(patientId?: string): SnapshotState & { reload: () => Promise<void> } {
  const currentId = useCurrentPatientId();
  const id = patientId ?? currentId;
  const { isOnline, onReconnect } = useConnectivity();
  const onlineRef = useRef(isOnline);
  onlineRef.current = isOnline;
  const [state, setState] = useState<SnapshotState>({ snapshot: null, status: 'loading', fromCache: false, error: null, loading: true });
  const requestId = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    const req = ++requestId.current;
    const current = () => mounted.current && req === requestId.current;
    setState((s) => ({ ...s, loading: true }));

    const stored = await readStored(id);
    if (!current()) return;
    if (stored) setState((s) => (s.snapshot && !s.fromCache ? s : { ...s, snapshot: stored, status: 'ready', fromCache: true }));

    if (onlineRef.current === false) {
      setState({ snapshot: stored, status: stored ? 'ready' : 'none', fromCache: true, error: null, loading: false });
      return;
    }

    const epoch = currentEpoch();
    try {
      const fresh = await fetchPatientSnapshot(id);
      let writeError: string | null = null;
      if (epoch === currentEpoch()) {
        try {
          await (await getStorage()).setItem(snapshotKey(id), fresh);
        } catch (error) {
          writeError = `Could not save an offline copy on this device: ${error instanceof Error ? error.message : String(error)}`;
        }
      }
      if (current()) setState({ snapshot: fresh, status: 'ready', fromCache: false, error: writeError, loading: false });
    } catch (error) {
      console.warn('Patient data load failed; showing the saved copy if there is one:', error);
      if (current()) {
        setState({
          snapshot: stored,
          status: stored ? 'ready' : 'none',
          fromCache: true,
          error: toUserMessage(error, 'Could not load the latest information.'),
          loading: false,
        });
      }
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  useEffect(() => onReconnect(() => void reload()), [onReconnect, reload]);

  // Realtime: reload when this patient's records change (shared channel, see subscribeToPatientRecords).
  useEffect(() => {
    if (!id) return;
    return subscribeToPatientRecords(id, () => void reload());
  }, [id, reload]);

  return { ...state, reload };
}
