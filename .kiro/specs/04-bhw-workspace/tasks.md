# Tasks: 04-bhw-workspace

Run in order. After every task run `npm run typecheck` in `apps/mobile` and fix all errors. There is no lint script. Temp files go under `$env:TEMP` and are deleted afterwards. Do not regenerate `supabase/setup.sql`.

- [x] 1. SQL: acknowledged_at trigger
  - `supabase/migrations/20240101000400_help_request_acknowledged_at.sql` and the same statements in `supabase/apply_spec4.sql` (safe to run twice).
  - _Requirements: B-1.7, B-1.8; design Ã‚Â§5_

- [x] 2. `apiBhw.ts` and the minimal `sync.ts` read-back
  - `fetchOwnedAppointments`, `acknowledgeHelpRequest`, `confirmPatientOnServer`, `confirmRecordOnServer`, `SyncNeedsReviewError`.
  - `sync.ts`: call the confirm functions after each upsert. Write `docs/spec-4-shared-edits.md`.
  - _Requirements: B-1.7Ã¢â‚¬â€œ1.9, B-4.4; design Ã‚Â§1 D2, Ã‚Â§3, Ã‚Â§5_

- [x] 3. BHW vocabulary, types and data
  - `visitOptions.ts`, `fieldQueueStatus.ts`, `bhw.types.ts` (appointments, `syncStatus`, `VisitPayload`, `NewFieldPatient`).
  - `useBHWData`: owned appointments in the fetch and cache (old caches Ã¢â€ â€™ `[]`), `syncStatus` on queue-derived patients and records.
  - _Requirements: B-1.1, B-1.10, B-2.3, B-3.2Ã¢â‚¬â€œ3.3_

- [x] 4. Today model and screen
  - `today.ts` (`buildTodayItems`, `patientMapStatus`).
  - `useAcknowledgeHelpRequest`, `TodayHelpRequests` (+ Acknowledge), `TodayWorkItem`, `TodayQueue`.
  - `BHWDashboardScreen`: Today first; tab title "Today".
  - _Requirements: B-1, L-1, L-2_

- [x] 5. Patient Visit and registration
  - Move `app/bhw/patients.tsx` Ã¢â€ â€™ `app/bhw/patients/index.tsx`, add `_layout.tsx` (Stack) and `visit.tsx`.
  - `VisitForm`, `VisitSummary`, `PatientVisitScreen`.
  - `RecordForm` `types` prop; `BHWPatientsScreen`: Log visit button, sync chips, assisted label.
  - `RegisterPatientForm`: has_smartphone, phone, `created_on_device_at`, saved chips.
  - _Requirements: B-2, B-3_

- [x] 6. Sync center
  - `useOfflineSync`: single-flight, offline guard, `offlineNotice`.
  - `SyncCounts`, `SyncStatus` via `fieldQueueStatusKeys`, `BHWSyncScreen`, `SyncResultNotice` copy.
  - _Requirements: B-4_

- [x] 7. Map
  - `PatientStatusList`, `LabeledMockMap`, `BHWMapScreen` (offline / no token / online).
  - _Requirements: B-5_

- [x] 8. Verification
  - **Results:**
    - Pure logic (`npx tsx`, 13 checks): Today sections and ordering, ownership, attendance vs missed, resolution by later visits, barriers, map status, visit payload (blank → null, glucose rules, "No barrier"), queue states and counts, legacy "reached" label.
    - Live Supabase (REST, same filters as `apiBhw.ts`, as Joel/Nestor): insert auto-assigns; acknowledge updates 1 row; a repeat updates 0 rows and keeps `acknowledged_at`; another BHW's filter updates 0 rows; a visit payload upserted twice by `local_id` gives 1 row that reads back with nulls intact; owned appointments query works. It left 1 help request and 1 record (non-seed, removed by Reset demo data).
    - Headless Chrome on `serve dist`: Today shows the separate sections for Liza; the service worker controls the page; offline, Patient Visit opens and survives a reload, an empty save and half a BP are rejected, a visit saves as "Saved on this device → Waiting to send"; offline Sync Now explains and sends nothing; the offline map shows "Map needs a connection" plus the list; back online, Sync Now reports that the server confirmed each item, and the visit shows in Recent visits. No page errors. (It left 1 Lorna visit record, removed by Reset.)
    - `npm run typecheck` passes; `npm run export:web` exports 17 routes including `/bhw/patients` and `/bhw/patients/visit`; `node --check dist/sw.js` passes; the web bundle has no `expo-sqlite`, `@rnmapbox` or `RNCNetInfo`.
    - Banned wording appears only in code comments that state the rule.
    - **Not verified:** the Acknowledge button in the UI (no `assigned` request exists for Liza without polluting her demo queue; the API path is verified live), `apply_spec4.sql` (not run against the database), native Android, the Mapbox-token path, and screen readers.
  - Temp `npx tsx` checks of the pure logic (design Ã‚Â§9).
  - `npm run typecheck`; `npm run export:web`; grep the web bundle for `expo-sqlite` and `@rnmapbox`; confirm `bhw/patients/visit.html` and `bhw/patients.html` (or `index.html`) are exported.
  - Grep new copy for "non-compliant" and "adherence".
  - `git diff --stat`: only BHW files, `apiBhw.ts`, `sync.ts`, the SQL files and docs changed.
  - List which requirements were not verified live.
  - _Requirements: all_
