import { useCallback, useState } from 'react';
import { DEMO_ADMIN_ID } from '../../../shared/config/demo';
import { assignPatientToBHW, createBHW, setBHWStatus } from '../../../shared/services/api';
import { toUserMessage } from '../../../shared/services/supabase';
import type { BHW } from '../../../shared/types/db.types';

export interface NewBHWForm {
  full_name: string;
  barangay: string;
  email: string;
  phone: string;
}

/** Admin actions on the chain of command: create BHWs, (de)activate them, assign patients. */
export function useBHWManagement(onChanged: () => void, adminId: string = DEMO_ADMIN_ID) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (key: string, action: () => Promise<unknown>, failMessage: string): Promise<boolean> => {
      setBusy(key);
      setError(null);
      try {
        await action();
        onChanged();
        return true;
      } catch (e) {
        console.error(failMessage, e);
        setError(
          /duplicate key|bhws_email_key/i.test(String((e as { message?: string })?.message))
            ? 'A BHW with that email already exists.'
            : toUserMessage(e, failMessage)
        );
        return false;
      } finally {
        setBusy(null);
      }
    },
    [onChanged]
  );

  const addBHW = useCallback(
    (form: NewBHWForm) =>
      run(
        'create',
        () =>
          createBHW({
            admin_id: adminId,
            full_name: form.full_name.trim(),
            barangay: form.barangay.trim(),
            email: form.email.trim() || null,
            phone: form.phone.trim() || null,
          }),
        'Could not create the BHW account.'
      ),
    [run, adminId]
  );

  const toggleStatus = useCallback(
    (bhw: BHW) => run(bhw.id, () => setBHWStatus(bhw.id, bhw.status === 'active' ? 'inactive' : 'active'), 'Could not update BHW status.'),
    [run]
  );

  const assignPatient = useCallback(
    (patientId: string, bhwId: string) => run(patientId, () => assignPatientToBHW(patientId, bhwId), 'Could not reassign the patient.'),
    [run]
  );

  return { busy, error, addBHW, toggleStatus, assignPatient };
}
