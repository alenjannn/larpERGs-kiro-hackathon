import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useConnectivity } from '../../../shared/context/ConnectivityContext';
import { fetchClinics } from '../../../shared/services/apiPatient';
import { currentEpoch } from '../../../shared/services/resetEpoch';
import { getStorage, type LocalV1Key } from '../../../shared/services/storage';
import { toUserMessage } from '../../../shared/services/supabase';
import type { Clinic } from '../../../shared/types/db.types';

// Clinic list for the YAKAP & Clinics finder, cache-then-network (K9).

export const CLINICS_KEY: LocalV1Key = 'tuloy:v1:clinics';

interface ClinicCache {
  v: 1;
  last_updated_at: string;
  clinics: Clinic[];
}

function isClinicCache(value: unknown): value is ClinicCache {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return v.v === 1 && typeof v.last_updated_at === 'string' && Array.isArray(v.clinics);
}

export interface ClinicsState {
  clinics: Clinic[];
  /** 'none' = nothing stored and nothing loaded. */
  status: 'loading' | 'ready' | 'none';
  lastUpdatedAt: string | null;
  fromCache: boolean;
  error: string | null;
  loading: boolean;
}

export function useClinics() {
  const { isOnline, onReconnect } = useConnectivity();
  const onlineRef = useRef(isOnline);
  onlineRef.current = isOnline;
  const mounted = useRef(true);
  const requestId = useRef(0);
  const [state, setState] = useState<ClinicsState>({
    clinics: [],
    status: 'loading',
    lastUpdatedAt: null,
    fromCache: false,
    error: null,
    loading: true,
  });

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

    let stored: ClinicCache | null = null;
    try {
      const value = await (await getStorage()).getItem<unknown>(CLINICS_KEY);
      stored = isClinicCache(value) ? value : null;
    } catch (error) {
      console.warn('Could not read the saved clinic list:', error);
    }
    if (!current()) return;
    if (stored) {
      const cached = stored;
      setState((s) => (s.status === 'ready' && !s.fromCache ? s : { ...s, clinics: cached.clinics, status: 'ready', lastUpdatedAt: cached.last_updated_at, fromCache: true }));
    }

    if (onlineRef.current === false) {
      setState({
        clinics: stored?.clinics ?? [],
        status: stored ? 'ready' : 'none',
        lastUpdatedAt: stored?.last_updated_at ?? null,
        fromCache: true,
        error: null,
        loading: false,
      });
      return;
    }

    const epoch = currentEpoch();
    try {
      const clinics = await fetchClinics();
      const fresh: ClinicCache = { v: 1, last_updated_at: new Date().toISOString(), clinics };
      let writeError: string | null = null;
      if (epoch === currentEpoch()) {
        try {
          await (await getStorage()).setItem(CLINICS_KEY, fresh);
        } catch (error) {
          writeError = `Could not save an offline copy on this device: ${error instanceof Error ? error.message : String(error)}`;
        }
      }
      if (current()) {
        setState({ clinics, status: 'ready', lastUpdatedAt: fresh.last_updated_at, fromCache: false, error: writeError, loading: false });
      }
    } catch (error) {
      console.warn('Clinic list load failed; showing the saved copy if there is one:', error);
      if (current()) {
        setState({
          clinics: stored?.clinics ?? [],
          status: stored ? 'ready' : 'none',
          lastUpdatedAt: stored?.last_updated_at ?? null,
          fromCache: true,
          error: toUserMessage(error, 'Could not load the clinic list.'),
          loading: false,
        });
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  useEffect(() => onReconnect(() => void reload()), [onReconnect, reload]);

  return { ...state, reload };
}
