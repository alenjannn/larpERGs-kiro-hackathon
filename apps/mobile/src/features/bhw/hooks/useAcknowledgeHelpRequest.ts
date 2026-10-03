import { useCallback, useRef, useState } from 'react';
import { useConnectivity } from '../../../shared/context/ConnectivityContext';
import { acknowledgeHelpRequest, HelpRequestChangedError } from '../../../shared/services/apiBhw';
import { toUserMessage } from '../../../shared/services/supabase';

export const ACK_OFFLINE_MESSAGE = 'Acknowledging needs a connection. Nothing was changed.';

/**
 * Acknowledge a received help request (B-1.7 – B-1.9). Online only: the chip
 * changes after the server returns the updated row, then `onConfirmed` reloads
 * Today (which also rewrites the offline copy). Double taps on the same id join
 * the request already in flight.
 */
export function useAcknowledgeHelpRequest(bhwId: string, onConfirmed: () => Promise<void> | void) {
  const { isOnline } = useConnectivity();
  const inFlight = useRef(new Map<string, Promise<void>>());
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const acknowledge = useCallback(
    (id: string): Promise<void> => {
      const existing = inFlight.current.get(id);
      if (existing) return existing;
      if (isOnline === false) {
        setErrors((e) => ({ ...e, [id]: ACK_OFFLINE_MESSAGE }));
        return Promise.resolve();
      }
      const run = (async () => {
        setPendingIds((s) => new Set(s).add(id));
        setErrors((e) => {
          const next = { ...e };
          delete next[id];
          return next;
        });
        try {
          await acknowledgeHelpRequest(id, bhwId);
          await onConfirmed();
        } catch (error) {
          console.error('Acknowledge failed:', error);
          const message =
            error instanceof HelpRequestChangedError ? error.message : toUserMessage(error, 'Could not acknowledge. The status was not changed.');
          setErrors((e) => ({ ...e, [id]: message }));
        } finally {
          inFlight.current.delete(id);
          setPendingIds((s) => {
            const next = new Set(s);
            next.delete(id);
            return next;
          });
        }
      })();
      inFlight.current.set(id, run);
      return run;
    },
    [bhwId, isOnline, onConfirmed]
  );

  return { acknowledge, pendingIds, errors, offline: isOnline === false };
}
