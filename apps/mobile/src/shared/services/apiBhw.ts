// BHW data access (Spec 04). Kept out of api.ts so parallel specs don't collide.
// Screens and hooks call these; they never query Supabase directly.

import { requireSupabase } from './supabase';
import type { Appointment, HelpRequestRow } from '../types/db.types';

function unwrap<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw result.error;
  return result.data as T;
}

const HELP_COLUMNS =
  'id, patient_id, reason, message, created_on_device_at, received_at, assigned_bhw_id, coordination_status, acknowledged_at';

// --- appointments --------------------------------------------------------------

/** Appointments this BHW owns (owner_bhw_id), earliest first; undated last. */
export async function fetchOwnedAppointments(bhwId: string): Promise<Appointment[]> {
  return (
    unwrap(
      await requireSupabase()
        .from('appointments')
        .select('*')
        .eq('owner_bhw_id', bhwId)
        .order('scheduled_at', { ascending: true, nullsFirst: false })
    ) ?? []
  );
}

// --- help_requests: acknowledge (Spec 04 owns acknowledging; Spec 05 owns assigning) ---

export class HelpRequestChangedError extends Error {
  constructor() {
    super('This request changed on the server. Refresh Today to see its current status.');
    this.name = 'HelpRequestChangedError';
  }
}

/**
 * Idempotent acknowledge. Only an 'assigned' row owned by this BHW moves to
 * 'acknowledged'. If nothing was updated, the row is read back: already
 * acknowledged (or further along) counts as success and is returned unchanged.
 * The server trigger (20240101000400) replaces acknowledged_at with its own time.
 */
export async function acknowledgeHelpRequest(id: string, bhwId: string): Promise<HelpRequestRow> {
  const db = requireSupabase();
  const updated = unwrap(
    await db
      .from('help_requests')
      .update({ coordination_status: 'acknowledged', acknowledged_at: new Date().toISOString() })
      .eq('id', id)
      .eq('assigned_bhw_id', bhwId)
      .eq('coordination_status', 'assigned')
      .select(HELP_COLUMNS)
  ) as HelpRequestRow[] | null;
  if (updated && updated.length > 0) return updated[0];

  const current = unwrap(await db.from('help_requests').select(HELP_COLUMNS).eq('id', id).maybeSingle()) as HelpRequestRow | null;
  if (current && current.assigned_bhw_id === bhwId && current.coordination_status !== 'assigned' && current.coordination_status !== 'unassigned') {
    return current;
  }
  throw new HelpRequestChangedError();
}

// --- Sync Now read-back (B-4.4) --------------------------------------------------

export const NEEDS_REVIEW_PREFIX = 'Needs review:';

/** A read-back did not confirm the item. The message is safe to show as-is. */
export class SyncReadBackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SyncReadBackError';
  }
}

/** The server already holds a different item with the same id. Nothing was overwritten. */
export class SyncNeedsReviewError extends SyncReadBackError {
  constructor(what: string) {
    super(`${NEEDS_REVIEW_PREFIX} the demo server already has a different ${what} with this ID. Nothing was overwritten.`);
    this.name = 'SyncNeedsReviewError';
  }
}

const NOT_CONFIRMED = 'The demo server did not confirm this item yet. It will be sent again on the next Sync Now.';

/** Read back a patient sent by Sync Now. Throws unless the same row is on the server. */
export async function confirmPatientOnServer(patient: { id: string; full_name: string }): Promise<void> {
  const row = unwrap(
    await requireSupabase().from('patients').select('id, full_name').eq('id', patient.id).maybeSingle()
  ) as { id: string; full_name: string } | null;
  if (!row) throw new SyncReadBackError(NOT_CONFIRMED);
  if (row.full_name !== patient.full_name) throw new SyncNeedsReviewError('patient');
}

/** Read back a field record sent by Sync Now (keyed by local_id, like the upsert). */
export async function confirmRecordOnServer(record: {
  local_id: string;
  patient_id: string;
  record_type: string;
  title: string;
}): Promise<void> {
  const row = unwrap(
    await requireSupabase()
      .from('records')
      .select('patient_id, record_type, title')
      .eq('local_id', record.local_id)
      .maybeSingle()
  ) as { patient_id: string; record_type: string; title: string } | null;
  if (!row) throw new SyncReadBackError(NOT_CONFIRMED);
  if (row.patient_id !== record.patient_id || row.record_type !== record.record_type || row.title !== record.title) {
    throw new SyncNeedsReviewError('record');
  }
}
