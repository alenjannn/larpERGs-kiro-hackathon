import { useCallback, useState } from 'react';
import { useConnectivity } from '../../../shared/context/ConnectivityContext';
import { assignHelpRequest, reassignPatient } from '../../../shared/services/apiAdmin';
import { toUserMessage } from '../../../shared/services/supabase';

export const OFFLINE_ASSIGN_NOTICE = 'Assigning needs a connection. Your saved information is still shown.';

/**
 * Coordinator assignment actions (Spec 05 owns assigning/reassigning; Spec 04 owns acknowledging).
 * Writes are not queued offline: the actions are disabled instead (K5).
 */
export function useAssignments(onChanged: () => void) {
  const { isOnline } = useConnectivity();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const offline = isOnline === false;

  const run = useCallback(
    async (key: string, action: () => Promise<string>, failMessage: string): Promise<boolean> => {
      if (offline) {
        setError(OFFLINE_ASSIGN_NOTICE);
        return false;
      }
      setBusy(key);
      setError(null);
      setNotice(null);
      try {
        setNotice(await action());
        onChanged();
        return true;
      } catch (e) {
        console.error(failMessage, e);
        setError(toUserMessage(e, failMessage));
        return false;
      } finally {
        setBusy(null);
      }
    },
    [offline, onChanged]
  );

  const assignRequest = useCallback(
    (requestId: string, bhwId: string, bhwName: string) =>
      run(
        requestId,
        async () => {
          await assignHelpRequest(requestId, bhwId);
          return `Help request assigned to ${bhwName}.`;
        },
        'Could not assign the help request.'
      ),
    [run]
  );

  const assignPatient = useCallback(
    (patientId: string, bhwId: string, bhwName: string) =>
      run(
        patientId,
        async () => {
          const moved = await reassignPatient(patientId, bhwId);
          const extras = [
            moved.movedRequests ? `${moved.movedRequests} open help request${moved.movedRequests === 1 ? '' : 's'}` : null,
            moved.movedAppointments ? `${moved.movedAppointments} open appointment${moved.movedAppointments === 1 ? '' : 's'}` : null,
          ].filter(Boolean);
          return `Patient assigned to ${bhwName}${extras.length ? `, with ${extras.join(' and ')}` : ''}.`;
        },
        'Could not assign the patient.'
      ),
    [run]
  );

  const clearMessages = useCallback(() => {
    setError(null);
    setNotice(null);
  }, []);

  return { busy, error, notice, offline, assignRequest, assignPatient, clearMessages };
}
