// Shared status dictionary (product.md §6, brief §8.2). One meaning per state,
// split into four groups that are never merged into a generic "complete".
//
// Every status renders as text + icon (StatusChip), never colour alone.
// FIL labels: needs native-speaker review — every Filipino label below is a
// draft and must be confirmed by a native speaker before the demo.

import type { IconName } from './components/Icon';
import type { SyncStatus } from './services/storage';

export type StatusTone = 'muted' | 'pending' | 'primary' | 'success' | 'error';
export type StatusGroup = 'transport' | 'encounter' | 'clinical' | 'coordination';

export interface StatusEntry {
  en: string;
  /** needs native-speaker review */
  fil: string;
  icon: IconName;
  tone: StatusTone;
}

export const STATUS = {
  transport: {
    saved_on_device: { en: 'Saved on this device', fil: 'Naka-save sa device na ito', icon: 'device', tone: 'muted' }, // FIL: needs native-speaker review
    waiting_to_send: { en: 'Waiting to send', fil: 'Naghihintay maipadala', icon: 'clock', tone: 'pending' }, // FIL: needs native-speaker review
    sending: { en: 'Sending…', fil: 'Ipinapadala…', icon: 'arrow-up', tone: 'primary' }, // FIL: needs native-speaker review
    received_in_inbox: { en: 'Received in demo clinic inbox', fil: 'Natanggap sa demo clinic inbox', icon: 'check', tone: 'success' }, // FIL: needs native-speaker review
    synced: { en: 'Synced', fil: 'Na-sync', icon: 'check', tone: 'success' }, // FIL: needs native-speaker review
    send_failed: { en: 'Not sent yet. Try again.', fil: 'Hindi pa naipadala. Subukang muli.', icon: 'alert', tone: 'error' }, // FIL: needs native-speaker review
    needs_review: { en: 'Needs review', fil: 'Kailangang suriin', icon: 'flag', tone: 'pending' }, // FIL: needs native-speaker review
  },
  encounter: {
    requested: { en: 'Requested', fil: 'Hiniling', icon: 'calendar', tone: 'muted' }, // FIL: needs native-speaker review
    confirmed: { en: 'Confirmed', fil: 'Kumpirmado', icon: 'calendar', tone: 'primary' }, // FIL: needs native-speaker review
    patient_reported_attended: { en: 'Attended (patient-reported)', fil: 'Dumalo (ayon sa pasyente)', icon: 'person', tone: 'primary' }, // FIL: needs native-speaker review
    clinic_confirmed_attended: { en: 'Attended (clinic-confirmed)', fil: 'Dumalo (kumpirmado ng klinika)', icon: 'check', tone: 'success' }, // FIL: needs native-speaker review
    // Amber, not red: avoid guilt-inducing emphasis (brief §8).
    missed: { en: 'Missed', fil: 'Hindi nakadalo', icon: 'alert', tone: 'pending' }, // FIL: needs native-speaker review
    rescheduled: { en: 'Rescheduled', fil: 'Inilipat ang petsa', icon: 'repeat', tone: 'muted' }, // FIL: needs native-speaker review
  },
  clinical: {
    transcription_pending: { en: 'Transcription pending', fil: 'Hinihintay ang pag-encode', icon: 'clock', tone: 'pending' }, // FIL: needs native-speaker review
    awaiting_clinical_review: { en: 'Awaiting clinical review', fil: 'Hinihintay ang pagsusuri ng doktor', icon: 'hourglass', tone: 'pending' }, // FIL: needs native-speaker review
    plan_released: { en: 'Plan released', fil: 'Nailabas na ang plano', icon: 'document', tone: 'success' }, // FIL: needs native-speaker review
  },
  coordination: {
    unassigned: { en: 'Unassigned', fil: 'Wala pang nakatalaga', icon: 'circle', tone: 'pending' }, // FIL: needs native-speaker review
    assigned: { en: 'Assigned', fil: 'Nakatalaga', icon: 'person', tone: 'primary' }, // FIL: needs native-speaker review
    acknowledged: { en: 'Acknowledged', fil: 'Natanggap na', icon: 'check', tone: 'primary' }, // FIL: needs native-speaker review
    blocked: { en: 'Blocked', fil: 'May hadlang', icon: 'blocked', tone: 'error' }, // FIL: needs native-speaker review
    completed: { en: 'Completed', fil: 'Tapos na', icon: 'check', tone: 'success' }, // FIL: needs native-speaker review
  },
} as const satisfies Record<StatusGroup, Record<string, StatusEntry>>;

type Dictionary = typeof STATUS;

/** "group.key", e.g. "transport.waiting_to_send". Unknown keys are compile errors. */
export type StatusKey = { [G in keyof Dictionary]: `${G}.${keyof Dictionary[G] & string}` }[keyof Dictionary];

export type TransportStatus = keyof Dictionary['transport'];
export type EncounterStatusKey = keyof Dictionary['encounter'];
export type ClinicalStatus = keyof Dictionary['clinical'];
export type CoordinationStatusKey = keyof Dictionary['coordination'];

export function getStatus(key: StatusKey): StatusEntry {
  const [group, name] = key.split('.') as [StatusGroup, string];
  return (STATUS[group] as Record<string, StatusEntry>)[name];
}

/** Every key in dictionary order (used by the component gallery). */
export const ALL_STATUS_KEYS: StatusKey[] = (Object.keys(STATUS) as StatusGroup[]).flatMap((group) =>
  Object.keys(STATUS[group]).map((name) => `${group}.${name}` as StatusKey)
);

/** Local outbox status (tech.md §5). Kept separate from the legacy BHW queue values. */
export type QueueStatus = 'pending' | 'sending' | 'synced' | 'failed' | 'conflict';

/** Existing BHW queue values ('pending' | 'failed' | 'synced') → dictionary chips. Stored values are unchanged. */
export function legacyQueueStatusKeys(status: SyncStatus): StatusKey[] {
  switch (status) {
    case 'synced':
      return ['transport.synced'];
    case 'failed':
      return ['transport.send_failed'];
    case 'pending':
    default:
      return ['transport.saved_on_device', 'transport.waiting_to_send'];
  }
}

/** Outbox status → chips (Spec 02). Help requests are "Received in demo clinic inbox"; BHW records are "Synced". */
export function outboxStatusKeys(status: QueueStatus, kind: 'help_request' | 'bhw_record'): StatusKey[] {
  switch (status) {
    case 'pending':
      return ['transport.saved_on_device', 'transport.waiting_to_send'];
    case 'sending':
      return ['transport.sending'];
    case 'synced':
      return [kind === 'help_request' ? 'transport.received_in_inbox' : 'transport.synced'];
    case 'failed':
      return ['transport.send_failed'];
    case 'conflict':
      return ['transport.needs_review'];
  }
}

/** Plain-text form, e.g. "Saved on this device · Waiting to send". */
export function queueStatusText(keys: StatusKey[], lang: 'en' | 'fil' = 'en'): string {
  return keys.map((k) => getStatus(k)[lang]).join(' · ');
}

/** Clinical chip for a record: transcription first, then review status. Null when not applicable. */
export function clinicalStatusKey(record: {
  transcription_status?: 'pending' | 'confirmed' | null;
  review_status?: 'awaiting_clinical_review' | 'plan_released' | null;
}): StatusKey | null {
  if (record.transcription_status === 'pending') return 'clinical.transcription_pending';
  if (record.review_status) return `clinical.${record.review_status}`;
  return null;
}
