# Design: 04-bhw-workspace

## 1. Conflicts and decisions (named, not chosen silently)

| # | Conflict | Decision |
|---|---|---|
| D1 | `structure.md` lists the route `bhw/patients/[id]/visit`. The web build is `output: 'static'` on Vercel with `cleanUrls`, and the Spec 02 service worker only precaches exported HTML. A dynamic `[id]` page is not served on Vercel without rewrites, and an offline reload of it falls back to the not-found page. | Use the static route **`/bhw/patients/visit?patientId=<id>`**. It works online, offline and after a reload. `app/bhw/patients.tsx` becomes `app/bhw/patients/index.tsx` with a Stack `_layout.tsx`, so `/bhw/patients` is unchanged and no shared layout file is edited. |
| D2 | B-4.4 needs "Synced only after a server confirmation". `sync.ts` marks an item synced as soon as the upsert returns (Spec 02 left it unchanged). | Smallest edit to `sync.ts`: after each patient/record upsert, call a read-back from `apiBhw.ts`. Missing row → error (item stays `failed`, retried). Different content → `SyncNeedsReviewError` (message starts with `Needs review:`), stored as `failed` with that `last_error`. The Sync tab shows those as **Needs review**. Nothing is overwritten (`ignoreDuplicates` stays). Listed in `docs/spec-4-shared-edits.md`. |
| D3 | `tech.md` lists `records.source` as 'field' \| 'patient' \| 'clinic'. Spec 01 kept `source` as transport ('online' \| 'offline_sync') and added `origin`. | Visit payloads set `origin: 'field'`; `source` is set by the existing `upsertRecordFromOffline`. |
| D4 | The brief says rescheduling updates the appointment row. Updating `appointments` from the field needs a second offline queue type. | Out of scope here. A visit outcome resolves the Today item locally (B-1.4) and is visible to RHU in the record. The appointment row is not changed by this spec. |
| D5 | The seed uses `contact_outcome = 'reached'`. | Labelled "Contacted" (legacy alias). New visits store the B-3.2 keys. |
| D6 | The BHW tab is titled "Dashboard". | Renamed to **Today** (route `/bhw` unchanged). |
| D7 | Acknowledge offline. | Online-only with a clear message (B-1.9). A queued acknowledgement would need a third queue and conflict rules; deferred. |

## 2. Files

```
apps/mobile/
  app/bhw/_layout.tsx                    tab title "Today"
  app/bhw/patients/_layout.tsx           Stack, headerShown false (new)
  app/bhw/patients/index.tsx             moved from app/bhw/patients.tsx (same shell)
  app/bhw/patients/visit.tsx             shell → PatientVisitScreen (new)
  src/features/bhw/
    visitOptions.ts                      outcomes, barriers, labels (EN/FIL), glucose options
    today.ts                             pure buildTodayItems() + patientMapStatus()
    fieldQueueStatus.ts                  queue item → StatusKey[] (needs review aware)
    types/bhw.types.ts                   + appointments, syncStatus, payload types
    hooks/useBHWData.ts                  + appointments in fetch + cache
    hooks/useAcknowledgeHelpRequest.ts   online-only, idempotent
    hooks/useOfflineSync.ts              single-flight, offline guard, needs-review counts
    components/TodayQueue.tsx            sections (attendance / missed / follow-ups / barriers)
    components/TodayWorkItem.tsx
    components/TodayHelpRequests.tsx     + Acknowledge action
    components/RegisterPatientForm.tsx   + has_smartphone, phone, created_on_device_at
    components/RecordForm.tsx            + `types` prop (visit lives on its own screen)
    components/VisitForm.tsx             one-save Patient Visit form
    components/VisitSummary.tsx          outcome / barrier / next action of a record
    components/SyncCounts.tsx            five StatusChip counts
    components/SyncStatus.tsx            uses fieldQueueStatus
    components/PatientStatusList.tsx     map list (icon + text, last-known location)
    components/LabeledMockMap.tsx        mock map with labelled pins (no token)
    screens/BHWDashboardScreen.tsx       Today first
    screens/BHWPatientsScreen.tsx        Log visit button, sync chips
    screens/PatientVisitScreen.tsx       (new)
    screens/BHWSyncScreen.tsx            counts + offline guard
    screens/BHWMapScreen.tsx             offline / no-token / status labels
  src/shared/services/apiBhw.ts          (new) appointments, acknowledge, read-backs
  src/shared/services/sync.ts            D2 minimal edit
supabase/migrations/20240101000400_help_request_acknowledged_at.sql
supabase/apply_spec4.sql
docs/spec-4-shared-edits.md
```

## 3. Data access (`apiBhw.ts`)

```ts
fetchOwnedAppointments(bhwId): Promise<Appointment[]>        // owner_bhw_id = bhwId, scheduled_at asc
acknowledgeHelpRequest(id, bhwId): Promise<HelpRequestRow>   // see §5
confirmPatientOnServer(p: { id; full_name }): Promise<void>  // read-back by id
confirmRecordOnServer(r: { local_id; patient_id; record_type; title }): Promise<void> // read-back by local_id
class SyncNeedsReviewError extends Error                     // message starts "Needs review:"
```

Read-back content check: patients compare `full_name`; records compare `patient_id`, `record_type`, `title`. A missing row throws `Error('The demo server did not confirm this item yet.')`.

## 4. Today model (`today.ts`, pure, no React)

```ts
type TodayKind = 'attendance_unconfirmed' | 'missed' | 'follow_up' | 'barrier';
interface TodayItem {
  key: string; kind: TodayKind; patientId: string; patientName: string;
  title: string; nextAction: string; dueAt: string | null; dueLabel: string | null;
  statuses: StatusKey[]; note: string | null;
}
buildTodayItems({ bhwId, patients, appointments, records, now }): TodayItem[]
```

Rules (`now` injected for tests):

- Appointment, owned, status `requested`/`confirmed`/`rescheduled`, `scheduled_at < now` → `attendance_unconfirmed`. Next action "Confirm attendance". Due = scheduled_at, label "Was due 01 Oct 2026". Chip `encounter.<status>`.
- Appointment `missed` → `missed`. Next action "Contact the patient to arrange a new date". Chip `encounter.missed`. Note: "A missed visit is not a sign the patient doesn't care. Ask what got in the way."
- Appointment `requested`/`confirmed`/`rescheduled` with `scheduled_at` in `[now, now + 7 days]` → `follow_up`. Next action "Remind the patient" (`confirmed`) or "Help confirm the appointment" (`requested`). Due label "Due 08 Oct 2026".
- Appointment with no `scheduled_at` and status `requested` → `follow_up`, "Help set an appointment date", no due date.
- Attended statuses → no item.
- Resolution (B-1.4): a record for the patient with timestamp `> scheduled_at` (or `> updated_at` for missed) and outcome `clinic_confirmed_attended` or `rescheduled` removes the item. `patient_reported_attended` keeps it with next action "Confirm attendance with the clinic" and note "Patient-reported attendance recorded <date>".
- Barrier (B-1.5): per patient of this BHW, latest record by `measured_at ?? created_on_device_at ?? created_at`. If it has a `barrier` or outcome `help_needed` → `barrier` item, title "Barrier: <label>" (or "Help needed"), next action = record `next_action` or "Help with <barrier label>". No due date.
- Ordering: overdue first by due date, then dated, then undated, then by patient name.

`patientMapStatus(patient, items, helpRequests)` returns `{ icon, label }` in priority order: local unsent ("Saved on this device · Waiting to send"), open help request, missed, attendance not confirmed, barrier, follow-up due, else "No open items".

## 5. Acknowledge

Client (`acknowledgeHelpRequest`):

1. `update help_requests set coordination_status='acknowledged', acknowledged_at=<client now> where id=? and assigned_bhw_id=? and coordination_status='assigned'` with `.select(HELP_COLUMNS)`.
2. If no row updated, read back by id. Already `acknowledged` (or later) → success, unchanged (idempotent). Missing, or assigned to someone else → error "This request changed. Refresh Today."
3. Hook `useAcknowledgeHelpRequest`: per-id in-flight set (double taps join), offline guard (B-1.9), then `reload()` of BHW data so the cache is rewritten.

Server (migration `20240101000400`): BEFORE UPDATE trigger `tg_30_help_request_acknowledged_at` sets `acknowledged_at := now()` when a client (`anon`/`authenticated`) moves the row into `acknowledged` from another status. So the stored time is the server's. Without the migration the client time is stored, so the app works either way. Re-runnable (`CREATE OR REPLACE`, `DROP TRIGGER IF EXISTS`).

## 6. Patient Visit

- `VisitForm` state: strings for each number; `outcome: ContactOutcome | null`; `barrier: Barrier | 'none' | null`; `nextAction`, `notes`.
- Validation: BP both or neither, 50–260 / 30–180; temperature 30–45 °C; weight 1–400 kg; height 30–250 cm (DB check); glucose 20–600 mg/dL or 1.1–33.3 mmol/L with unit and test type required (DB check `records_glucose_complete_check`). At least one field filled.
- Payload (`VisitPayload`, local type in `bhw.types.ts`): `id, patient_id, bhw_id, record_type 'visit', title 'Patient visit', notes, systolic, diastolic, temperature_c, weight_kg, height_cm, glucose_value, glucose_unit, glucose_test_type, contact_outcome, barrier, next_action, measured_at, created_on_device_at, origin 'field'`. Every key is a real `records` column; blanks are `null`.
- Saved via the existing `useOfflineSync().saveOffline({ entity: 'record' })`. The screen then shows chips `transport.saved_on_device → transport.waiting_to_send` and "Back to My Patients" / "Log another visit".

## 7. Sync center

- `fieldQueueStatusKeys(item, syncing)`: `synced` → `transport.synced`; `failed` with `last_error` starting `Needs review:` → `transport.needs_review`; `failed` → `transport.send_failed`; `pending` → `transport.sending` while a run is active, otherwise `saved_on_device → waiting_to_send`.
- Counts: same mapping, five `StatusChip`s with numbers (B-4.1).
- `useOfflineSync.syncNow`: if `isOnline === false` → set `offlineNotice` ("Sync Now needs a connection. All N items are still saved on this device.") and return. A module-level `inFlight` promise makes it single-flight.

## 8. Map

- Offline (`isOnline === false`): no `MapView`; `EmptyState`-style "Map needs a connection" then `PatientStatusList`.
- No token: `LabeledMockMap` (pins with icon + short text) + list.
- Token and online: shared `MapView`; marker `subtitle` = "<icon> <status label> · approximate DEMO location", which mapbox-gl and native popups show as text. List below always.

## 9. Testing

- Temporary `npx tsx` script (outside the repo) for `buildTodayItems`, `patientMapStatus`, `fieldQueueStatusKeys` and the visit payload builder (blank → null, glucose rules). Deleted afterwards.
- `npm run typecheck`, `npm run export:web`, bundle grep for `expo-sqlite` / `@rnmapbox`.
- Live Supabase checks only if the database is reachable; otherwise listed as not verified.
