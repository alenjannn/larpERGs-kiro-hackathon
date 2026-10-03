import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { DEMO_PERSONAS, type DemoRole } from '../config/demo';
import { getStorage } from '../services/storage';

const ROLE_KEY = 'tuloy:v1:demo_role';
const ROLES: readonly DemoRole[] = ['admin', 'bhw', 'patient'];

export interface DemoRoleState {
  /** False until the persisted choice has been read. */
  ready: boolean;
  role: DemoRole | null;
  personaId: string | null;
  /** Simulated clinician mode (admin role only). No real authentication. */
  clinicianMode: boolean;
}

export interface DemoRoleValue extends DemoRoleState {
  selectRole(role: DemoRole, options?: { personaId?: string; clinicianMode?: boolean }): void;
  setClinicianMode(on: boolean): void;
  /** Back to the initial state and forget the persisted choice (Reset demo data). */
  resetRole(): void;
}

interface Persisted {
  v: 1;
  role: DemoRole;
  personaId: string;
  clinicianMode: boolean;
}

const INITIAL: DemoRoleState = { ready: false, role: null, personaId: null, clinicianMode: false };

function isPersisted(value: unknown): value is Persisted {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.v === 1 &&
    typeof v.role === 'string' &&
    (ROLES as readonly string[]).includes(v.role) &&
    typeof v.personaId === 'string' &&
    typeof v.clinicianMode === 'boolean'
  );
}

/** Default persona for a role (clinician when admin + clinician mode). */
export function defaultPersonaId(role: DemoRole, clinicianMode: boolean): string {
  if (role === 'admin') return clinicianMode ? DEMO_PERSONAS.clinician.id : DEMO_PERSONAS.admin.id;
  return role === 'bhw' ? DEMO_PERSONAS.bhw.id : DEMO_PERSONAS.patient.id;
}

const DemoRoleContext = createContext<DemoRoleValue | null>(null);

export function DemoRoleProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoRoleState>(INITIAL);
  // Set once the user picks something, so a slow restore never overwrites a newer choice.
  const touched = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getStorage()
      .then((s) => s.getItem<unknown>(ROLE_KEY))
      .then((saved) => {
        if (cancelled || touched.current) return;
        if (isPersisted(saved)) {
          setState({
            ready: true,
            role: saved.role,
            personaId: saved.personaId,
            clinicianMode: saved.role === 'admin' && saved.clinicianMode,
          });
        } else {
          setState((s) => ({ ...s, ready: true }));
        }
      })
      .catch((error) => {
        console.warn('Could not restore demo role:', error);
        if (!cancelled) setState((s) => ({ ...s, ready: true }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const commit = useCallback((next: Omit<DemoRoleState, 'ready'>) => {
    touched.current = true;
    setState({ ...next, ready: true });
    if (!next.role || !next.personaId) return;
    const persisted: Persisted = { v: 1, role: next.role, personaId: next.personaId, clinicianMode: next.clinicianMode };
    // A failed write never blocks the switch; the choice stays in memory.
    getStorage()
      .then((s) => s.setItem(ROLE_KEY, persisted))
      .catch((error) => console.warn('Could not persist demo role:', error));
  }, []);

  const selectRole = useCallback<DemoRoleValue['selectRole']>(
    (role, options) => {
      const clinicianMode = role === 'admin' && (options?.clinicianMode ?? false);
      commit({ role, clinicianMode, personaId: options?.personaId ?? defaultPersonaId(role, clinicianMode) });
    },
    [commit]
  );

  const setClinicianMode = useCallback(
    (on: boolean) => {
      if (state.role !== 'admin') return;
      commit({ role: 'admin', clinicianMode: on, personaId: defaultPersonaId('admin', on) });
    },
    [commit, state.role]
  );

  const resetRole = useCallback(() => {
    touched.current = true;
    setState({ ...INITIAL, ready: true });
    getStorage()
      .then((s) => s.removeItem(ROLE_KEY))
      .catch((error) => console.warn('Could not clear demo role:', error));
  }, []);

  const value = useMemo(() => ({ ...state, selectRole, setClinicianMode, resetRole }), [state, selectRole, setClinicianMode, resetRole]);
  return <DemoRoleContext.Provider value={value}>{children}</DemoRoleContext.Provider>;
}

export function useDemoRole(): DemoRoleValue {
  const value = useContext(DemoRoleContext);
  if (!value) throw new Error('useDemoRole must be used inside <DemoRoleProvider>.');
  return value;
}
