// Help-request vocabulary and copy shared by Patient, BHW and Admin (Spec 02).
// Wording rules (product.md §3, brief §7.6): a help request is not an emergency
// channel; never imply live monitoring or a guaranteed response time.

import type { HelpReason } from './types/db.types';

export const HELP_REASON_LABELS: Record<HelpReason, { en: string; fil: string }> = {
  transport: { en: 'Transport', fil: 'Transportasyon' }, // FIL: needs native-speaker review
  another_date: { en: 'Need another date', fil: 'Ibang petsa' }, // FIL: needs native-speaker review
  lab_access: { en: 'Lab access', fil: 'Pagpapa-laboratoryo' }, // FIL: needs native-speaker review
  document_help: { en: 'Document help', fil: 'Tulong sa dokumento' }, // FIL: needs native-speaker review
  medicine_access: { en: 'Medicine access', fil: 'Pagkuha ng gamot' }, // FIL: needs native-speaker review
  other: { en: 'Other', fil: 'Iba pa' }, // FIL: needs native-speaker review
};

/** Display order of the reason picker. */
export const HELP_REASON_ORDER: HelpReason[] = ['transport', 'another_date', 'lab_access', 'document_help', 'medicine_access', 'other'];

export function helpReasonLabel(reason: string, lang: 'en' | 'fil' = 'en'): string {
  return HELP_REASON_LABELS[reason as HelpReason]?.[lang] ?? reason;
}

export const URGENT_CARE_EN =
  'This is not an emergency service. Your request goes to the demo clinic inbox. Nobody watches it live, and there is no set response time. If you have chest pain, trouble breathing, heavy bleeding, signs of a stroke or feel very unwell, go to the nearest hospital emergency room or call 911 now.';

// FIL: needs native-speaker review
export const URGENT_CARE_FIL =
  'Hindi ito serbisyong pang-emergency. Mapupunta ang iyong kahilingan sa demo clinic inbox. Walang nagbabantay nito nang live, at walang takdang oras ng pagsagot. Kung may pananakit ng dibdib, hirap sa paghinga, matinding pagdurugo, senyales ng stroke o masama ang pakiramdam, pumunta agad sa pinakamalapit na emergency room ng ospital o tumawag sa 911.';

/** Deferred: background sending (OC-14.1). */
export const DEFERRED_BACKGROUND =
  "Requests send only while Tuloy is open. Sending in the background while the app is closed isn't available yet.";

/** Deferred: backup/restore (OC-14.2). */
export const DEFERRED_BACKUP = "Saved on this device only. Backup and restore aren't available yet.";

/** Deferred: conflict resolution (OC-6.5, OC-14.3). */
export const CONFLICT_EXPLANATION =
  "The demo clinic inbox has a different request with this ID. Nothing was overwritten. Resolving this in the app isn't available yet.";

/** Try again while offline makes no network attempt (K8, OC-6.3). */
export const OFFLINE_RETRY_NOTICE = "You're offline. This request is saved and will send when you reconnect.";

/** Patient Home while offline (OC-14.5). */
export const OFFLINE_HOME_NOTICE = 'Changes from your care team will show after you reconnect.';

/** No snapshot yet (OC-1.3). */
export const NO_SNAPSHOT_TITLE = 'Connect once to load your information';
export const NO_SNAPSHOT_MESSAGE =
  'Open Tuloy while online once. After that, your next step and care plan stay on this device.';

/** Admin inbox caption (brief §7.1: receipt is delivery only). */
export const INBOX_CAPTION = 'Demo clinic inbox · receipt confirms delivery only, not staff action.';
