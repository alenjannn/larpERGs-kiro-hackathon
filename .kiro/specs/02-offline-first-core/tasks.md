# Tasks: 02-offline-first-core

Run the tasks in order.

- After every task, run `npm run typecheck` in `apps/mobile` and fix all errors before starting the next one. There is no lint step (C17).
- Temporary verification files go in a folder under `$env:TEMP`, outside the repo, and are deleted afterwards.
- **No SQL changes.** Do not create `supabase/apply_spec2.sql`. Do not touch the migrations, `seed.sql` or `setup.sql`.
- `sync.ts`, `useOfflineSync.ts` and `syncQueues.ts` stay unchanged. Confirm this with `git diff` in task 12.

## Storage, API and types

- [x] 1. Add `listItems` to storage and make legacy web writes fail visibly
  - `storage.ts`: add `listItems<T>(prefix: LocalV1Key): Promise<{ key: LocalV1Key; value: T }[]>` to `LocalStorage`.
  - `StorageWeb.ts`:
    - `listItems` collects the matching `localStorage` keys first, then parses each one. It skips and logs entries it can't parse.
    - `write()` keeps the memory fallback only when `window.localStorage` is absent. When `setItem` throws, it throws `LocalStorageUnavailableError`.
  - `StorageNative.native.ts`: `listItems` runs `SELECT key, value FROM kv_v1 WHERE substr(key, 1, ?) = ?` (exact prefix, no `LIKE`).
  - `StorageNative.ts` (the web stub): add `listItems = async () => unavailable()`.
  - `loadBHWData`: move `setCache` out of the fetch `try`. A failed cache write logs a warning and sets `cacheError` on the result. Add `cacheError: string | null` to `BHWData`; `BHWDashboardScreen` shows it as a warning Notice.
  - _Requirements: OC-8.4, OC-11.1, OC-16.1; design §3.1, §9_

- [x] 2. Add the API functions and types
  - `db.types.ts`: add `HelpRequestInsert`, `HelpRequestRow` and `HelpRequestWithPatient`.
  - `api.ts`: add these functions (design §5):
    - `insertHelpRequest(row, signal?)`: upsert with `onConflict: 'id', ignoreDuplicates: true`, plus `.abortSignal`.
    - `fetchHelpRequestById(id, signal?)`
    - `fetchHelpRequests({ assignedBhwId?, statuses?, limit? })`: embeds `patient:patients(full_name)` and orders by `received_at desc`.
    - `fetchAppointments(patientId)`
    - `fetchReleasedCarePlan(patientId)`
    - `fetchClinic(id)`
  - The insert payload contains exactly `id`, `patient_id`, `reason`, `message` and `created_on_device_at`.
  - _Requirements: OC-5.2, OC-11.3, OC-7, OC-13; design §5_

## Outbox

- [x] 3. Add the shared copy, the reset epoch and the outbox core
  - `src/shared/helpRequests.ts`:
    - `HELP_REASON_LABELS` (EN/FIL, table OC-12.2).
    - `helpReasonLabel()`.
    - `URGENT_CARE_EN` and `URGENT_CARE_FIL`.
    - `DEFERRED_BACKGROUND`, `DEFERRED_BACKUP`, `CONFLICT_EXPLANATION`, `OFFLINE_RETRY_NOTICE`, `OFFLINE_HOME_NOTICE` and `NO_SNAPSHOT_TITLE`, using the exact requirement strings.
    - Mark every FIL string with `// FIL: needs native-speaker review`.
  - `src/shared/services/resetEpoch.ts`: `currentEpoch()` and `bumpEpoch()`.
  - `src/shared/services/outboxCore.ts`, exactly as design §3.1–3.2. It must import nothing from `react-native` or `expo-*`. It contains:
    - `HELP_REASONS`, `OUTBOX_PREFIX`, `BACKOFF_MS`, `isOutboxItem` and `sameContent`.
    - `createOutbox(deps)` with `init`, `enqueue`, `list`, `counts`, `flush` (single-flight with rerun, restart abort, offline skip, force), `pass`, `scheduleRetry`, `stopForReset`, `subscribe` and `isFlushing`.
    - Error handling: an abort returns the item to `pending`; a network error or timeout ends the pass; a transient error continues the pass; a permanent error sets `_next_attempt_at = null`.
    - An epoch check before every write.
  - _Requirements: OC-2.1, OC-2.4, OC-4.1, OC-5.3–5.4, OC-6.1–6.4, OC-9.1–9.2, OC-11, OC-12.2, OC-14, OC-17.1_

- [x] 4. Wire the outbox and verify the core (A2)
  - `src/shared/services/outbox.ts`:
    - Build the singleton with `store` (over `getStorage`, `getItem`/`setItem`/`listItems`), `remote` (the API functions), `classify` (`isNetworkError`, abort/timeout → network, codes `22*`/`23*`/`42*` or `SupabaseConfigError` → permanent, everything else transient), `epoch`, and the real timers.
    - Export `setOutboxOnlineGetter`.
    - `enqueue` from this module calls `flush()` without awaiting it unless offline.
    - On web, emit `'changed'` on `storage` events for outbox keys.
    - `registerQueue({ id: 'help_requests', getCounts, flush })` at module load.
    - Export `outbox` and `notify()`.
  - **A2.** Write a temporary script that runs `outboxCore` with `npx tsx`. It uses an in-memory store and a fake server that enforces a unique `id`, counts inserts and rows, and can be told to fail, hang, return no row, or hold different content. Use fake timers or an injected clock. Assert:
    1. Enqueueing twice with the same id gives 1 item. The first returned status is `pending`.
    2. One flush goes pending → sending → synced, in that order. `received_at` comes from the server.
    3. 5 concurrent flushes, plus 3 forced retries afterwards, give 1 server row.
    4. A restart abort during a hung insert puts the item back to `pending` with `_attempts` unchanged. The next pass gives `synced` and still 1 row.
    5. A reload mid-send (a new instance over the same store with `sending`) → `init` → `pending` → synced, with 1 row.
    6. Four network failures give `failed`, `_attempts` 1…4, `_last_error` set, and `_next_attempt_at` offsets of 2 s, 5 s, 15 s and 60 s. The 5th failure also uses 60 s. A network error stops the pass, so the second item stays `pending`.
    7. A transient error on item 1 still sends item 2.
    8. While `isOnline() === false`, a flush makes 0 network calls and statuses don't change.
    9. A read-back with no row gives `failed`. A read-back with different content gives `conflict`; the local fields are unchanged, there are 0 extra server writes, and the item is not picked up by later flushes or by `force: 'all'`.
    10. A permanent error gives `failed` with `_next_attempt_at` null.
    11. `bumpEpoch` + `stopForReset` mid-flush give no writes after the reset.
    12. A 501-character message is rejected, and a whitespace-only message is stored as null.

    Fix any failures, then delete the temp folder.
  - _Requirements: OC-2, OC-4.4, OC-5, OC-6, OC-11, OC-17; design §3, §12 A2_

- [x] 5. Add the triggers and Reset integration
  - Add `src/shared/services/foreground.ts` (web, `visibilitychange` → visible) and `foreground.native.ts` (`AppState` → 'active'). Each exports `subscribeForeground(cb): () => void`.
  - `SyncContext.tsx` (design §3.5) wires these triggers:
    - `setOutboxOnlineGetter` from a ref of `isOnline`.
    - The first `isOnline === true` calls `flush()`.
    - `onReconnect` calls `flush({ restart: true })`.
    - Foreground while online calls `flush()`.
    - `outbox.subscribe` drives `isFlushing`, and refreshes counts (debounced to 250 ms) on `'changed'`.
  - `useDemoReset.ts`: after the RPC succeeds, call `bumpEpoch()` and `outbox.stopForReset()`, then `clearDemoData()`, then `notify()`.
  - _Requirements: OC-4.1–4.2, OC-16.2, OC-17.1_

## Demo session (K1)

- [x] 6. Make the guard accept the saved persona and clear it on Logout
  - Add `src/shared/hooks/useEffectiveRole.ts` (design §8).
  - `RoleTabsLayout.tsx` and `app/index.tsx`: use `{ loading, role }` from the hook. Redirect to `/login` only when `role` is null. Keep the Access Restricted branch, comparing the effective role with the route role.
  - `RoleTabsLayout.tsx`: render `<OfflineBanner />` directly under `<RoleHeader />`.
  - `DemoQuickSwitchHeader.tsx`: show the badge for the effective role. Show Logout when `user || isDemoPersona`, labelled "Logout (demo persona)" for a persona. Logout runs `signOut()`, then `resetRole()`, then `router.replace('/login')`.
  - `AuthContext.tsx`: `getSession()` rejection sets loading to false.
  - Add a comment next to the guard with the security note from design §8.
  - _Requirements: OC-15, OC-3.2, OC-1.2_

## Patient

- [x] 7. Add the patient snapshot
  - Add `src/features/patient/hooks/usePatientSnapshot.ts` (design §4). It contains:
    - `PatientSnapshot`, `isSnapshot` and `fetchPatientSnapshot` (all-or-nothing).
    - `useCurrentPatientId`.
    - `usePatientSnapshot`: cache-then-network, a shared in-flight `Map`, an epoch check before writing, a write-failure notice, reload on focus and on reconnect.
  - Rewrite `usePatientData` and `useHealthRecords` to derive from the snapshot, keeping their `AsyncData` return shapes. `PatientProfileScreen` and `PatientHealthScreen` add `LastUpdated`, plus the "Connect once to load your information" empty state when the status is `none`.
  - _Requirements: OC-1.3–1.5, OC-13, OC-8.2_

- [x] 8. Build the help-request UI and the new Home
  - `src/shared/components/HelpRequestItem.tsx`, used by all three roles. Props:
    - the request data and `patientName?`,
    - the chips array,
    - `createdLabel` ("Created on this device" for the patient, "Created on device" for staff),
    - `receivedAt?`,
    - an optional action and an optional note.
  - `features/patient/hooks/useHelpRequests.ts`: returns `items`, `loading`, `error`, `retry`, `retryAll` and `offlineNotice` (K8).
  - `HelpRequestSheet.tsx` (design §7.2):
    - The draft id is created on open.
    - It has reason chips, the 500-character message with a counter, and the urgent-care box (EN + FIL) above the buttons.
    - Submit is disabled without a reason or while saving.
    - The saved state shows live chips, the offline note and Done. The error state keeps the form.
    - It closes with Escape, the backdrop or back. On web, focus moves into the sheet.
  - `MyRequestsCard.tsx` (design §7.3): per-item Try again, the conflict text, a list-level Try again, the deferred notes and the "No requests yet" empty state.
  - `YakapStepLine.tsx` and `CarePlanSummaryCard.tsx`.
  - `PatientHomeScreen.tsx`: the layout in design §7.1. Every `NextStepCard` and the "Need help?" card open the same sheet. The legacy `AppointmentList` shows only when `appointments` is empty.
  - All buttons are at least 44 px and have an accessibility label. Status is never shown by colour alone.
  - _Requirements: OC-1.2–1.4, OC-2, OC-3.1, OC-6.1, OC-6.3, OC-6.5, OC-9.1–9.2, OC-12, OC-14.1–14.3, OC-14.5_

## BHW and Admin

- [x] 9. Add the BHW Today help requests and keep synced records
  - `useBHWData`:
    - Use the persona's BHW id.
    - Add help requests (assigned, acknowledged, blocked) to the fetch and the cache, defaulting to `[]` for old caches.
    - Merge from `getAllRecords()` so synced queue items that aren't in the cache stay visible, with `pendingSync = sync_status !== 'synced'`.
  - `TodayHelpRequests.tsx`:
    - De-duplicated by id and keyed by id.
    - Shows the patient, the reason, "Created on device …" and "Received …" on separate lines, and the chips `transport.received_in_inbox` and `coordination.<status>`.
    - Empty state: "No help requests right now."
    - Shows `LastUpdated` when the data is from the cache.
  - Render it first on `BHWDashboardScreen`.
  - _Requirements: OC-5.5, OC-7.1–7.2, OC-7.5, OC-8.1–8.3_

- [x] 10. Add Admin Needs Attention, the demo clinic inbox, the cache and the rename
  - `useAdminData`:
    - Add `fetchHelpRequests({ limit: 50 })`.
    - On success, cache under `admin:<id>` with `cachedAt`. On failure, fall back to the cache with `fromCache`, `cachedAt` and `fetchError`. Extend `AdminData` to carry these.
  - `NeedsAttentionHelpRequests.tsx`: shows unassigned requests with the "Unassigned" chip and "Waiting <age>".
  - `DemoClinicInbox.tsx`: the latest 20, with both timestamps, the coordination chip and the receipt-only caption.
  - `AdminDashboardScreen`: show both sections first, plus the cached-data notice with `LastUpdated`. Rename "Live field records" to "Latest field records".
  - _Requirements: OC-7.3–7.5, OC-8.2, OC-9.4_

## Offline app shell (web)

- [x] 11. Add the manifest, icons, `+html.tsx`, the service worker build, registration and the update banner
  - Before you change anything, export once to a temp folder and save `dist/index.html`'s `<head>` for comparison.
  - `public/manifest.json` (design §2.4).
  - `public/icons/icon-192.png` and `icon-512.png`: resize `assets/icon.png` with a temporary script (System.Drawing in PowerShell is fine), commit the PNGs, then delete the script.
  - `app/+html.tsx`: Expo's default root HTML (`ScrollViewStyleReset`) plus the manifest link, the `theme-color` meta and `apple-touch-icon`.
  - `scripts/sw-template.js` and `scripts/build-sw.mjs`: exactly design §2.1–2.2. Install fails on any non-OK response. Route HTML is re-wrapped and stored under its clean-URL key. Same-origin GET only. Old `tuloy-shell-*` caches are deleted on activation. `SKIP_WAITING` is triggered by a message only.
  - `package.json`: set `export:web` to `expo export --platform web && node scripts/build-sw.mjs`. `vercel.json`: set `buildCommand` to `npm run export:web`.
  - `src/shared/services/serviceWorker.ts` and `serviceWorker.native.ts` (a no-op), as in design §2.3.
  - `src/shared/components/AppUpdateBanner.tsx`, rendered in `app/_layout.tsx` inside `AppProviders`.
  - **A3.** Run `npm run export:web`, then check:
    - `node --check dist/sw.js` passes.
    - Every `dist/**/*.html` is in `routes`.
    - Neither list contains `sw.js` or a `.map` file.
    - `manifest.json` and both icons are in `assets`.
    - Running `build-sw.mjs` again gives the same version.
    - The `<head>` of `index.html` differs from the saved copy only by the three added tags.
    - Every exported HTML file contains `rel="manifest"`.

    Delete `dist/`, since it is gitignored. Check `apps/mobile/.gitignore`.
  - _Requirements: OC-10, OC-16.3; design §2_

## Verification

- [x] 12. Run the final checks
  - **Results (automated):**
    - typecheck passes; the web bundle has no `expo-sqlite`, `@rnmapbox` or `RNCNetInfo`; the Android export bundles.
    - A2: 13/13 outbox core checks pass. A3: sw.js has 16 routes (every exported HTML) and 24 assets, a stable version, and only the three new head tags.
    - A4 (headless Chrome on `serve dist`): the service worker controls the page, and an offline reload renders `/patient` with the offline banner and "Connect once…" (no browser error page, no `/login`). The offline request shows "Saved on this device → Waiting to send", survives a reload as one outbox key, and offline Try again shows the offline notice.
    - **Not verified:** the live Supabase steps. The connected database returned "Database tables are missing", so `supabase/apply_foundation.sql` hasn't been applied. On reconnect the request correctly showed "Not sent yet. Try again." Also not verified: native on a device (E4) and screen readers.
    - A6: the new copy has no banned wording; "live" appears only in "Nobody watches it live".
  - `npm run typecheck`.
  - `npm run export:web` (A3 again).
  - Grep the web bundle in `dist/_expo` for `expo-sqlite`, `@rnmapbox` and `RNCNetInfo`, and confirm none are found. Run `npx expo export --platform android --output-dir <temp>` and confirm it succeeds (A5).
  - **A4.** Use headless Chrome (Playwright via `npx` in a temp folder) against `npx serve dist`:
    1. Open `/demo` and pick Patient.
    2. Wait until `navigator.serviceWorker.controller` is set.
    3. Go offline and reload `/patient`.
    4. Assert the offline banner text appears and the page is not a browser error page.
    5. Submit a help request offline and assert "Saved on this device" and "Waiting to send".
    6. Reload while still offline and assert the request is still listed.

    If Supabase isn't reachable in this environment, or Playwright can't run, say so clearly. The manual script covers these steps.
  - **A6.** Grep `helpRequests.ts` and the new components for: monitor, 24/7, real-time, guarantee, immediately, `within .* hours`, and `live` (only allowed inside "Nobody watches it live").
  - `git diff --stat`: confirm there are no changes to `sync.ts`, `useOfflineSync.ts`, `syncQueues.ts`, `supabase/**` or `.github/**`, and that `supabase/apply_spec2.sql` doesn't exist.
  - Check every requirement in `requirements.md` and list any that weren't verified automatically. Expect at least these: the live Supabase steps, native on a device (OC-16 / E4), and screen readers.
  - Delete all temp folders.
  - _Requirements: all_

- [ ] 13. Manual test script (presenter), on `npx serve dist` with Chrome DevTools Offline
  - **The service worker is not active under `expo start`** (it registers only in a production build, and `sw.js` exists only in `dist/`). Every offline step must use the exported build: `npx serve dist` locally, or the Vercel URL.

  **Setup**
  1. `supabase/apply_foundation.sql` has been run in the Supabase SQL Editor (Spec 01). There is no Spec 02 SQL.
  2. `apps/mobile/.env` has `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
  3. In `apps/mobile`: run `npm run export:web`, then `npx serve dist`. Open `http://localhost:3000/demo` in Chrome. `localhost` counts as a secure context, so the service worker can register.
  4. Open DevTools → Application → Service workers. After the first load, `sw.js` is "activated and is running".
  5. Use a phone-width viewport for the Patient and BHW views.

  **Brief §7.5 tests**

  | # | Steps | Pass condition |
  |---|---|---|
  | M1 (test 1) | Online, tap **Reset demo data** and confirm. Pick **Demo as Patient** (Juana). Wait for Home to show the next step, care plan and "Last updated …". Then: DevTools → Network → **Offline**, and reload (Ctrl+R). Also reload `/patient/health` and `/patient/profile`. | No browser error page. The navy banner reads "You're offline. Your saved information is still here. Requests will send when you reconnect." Home shows the next step ("Follow-up BP check (DEMO)"), "My YAKAP Checkup: Plan available", the released care plan, the care team, "Last updated <DD Mon YYYY, h:mm AM/PM>" and "Changes from your care team will show after you reconnect." The other tabs render from the snapshot. |
  | M1b (no snapshot) | Online, Reset demo data. **Do not** open Patient. Go Offline, open `/demo`, then pick Patient. | "Connect once to load your information" is shown. The "Need help?" card still works. |
  | M2 (test 2) | Offline, on Home, tap **I need help**. Check the urgent-care text, then pick **Transport**, type "Need a ride to the RHU (DEMO)" and Submit. | The sheet shows "Saved on this device", then the chips "Saved on this device" and "Waiting to send", plus the background-sending note. Tap Done: My requests lists it with "Created on this device <time>". A second **I need help** from the NextStepCard opens the same sheet. |
  | M3 (test 3) | Still offline, reload. Then close the tab, open `http://localhost:3000/patient` in a new tab and stay offline. | Still on Patient Home (no `/login`). The request still says "Waiting to send", with the same reason, message and created time. DevTools → Application → Local storage shows one `tuloy:v1:help_requests:<id>` key. |
  | M4 (test 4) | With the app open, set Network back to **No throttling** (online). | Within 5 s the chip goes "Sending…" then "Received in demo clinic inbox", with "Received <time>". No re-entry is needed. |
  | M5 (test 5) | Switch to **BHW** (Liza), then to **Admin**. Optionally run `select count(*) from help_requests where patient_id = 'c0000000-0000-4000-8000-000000000001';` in the SQL Editor. | BHW "Today · Help requests" shows **exactly one** Juana item: Transport, "Created on device …" and "Received …" as separate lines, and the chips "Received in demo clinic inbox" and "Assigned". The Admin "Demo clinic inbox" shows it once as Assigned. The SQL count is 1. |
  | M6 (test 6) | Back on Patient, create a second request while **online**. As soon as it says "Sending…", toggle Offline and Online 3 times quickly, tap **Try again** several times, and reload once mid-send. | It ends as "Received in demo clinic inbox". BHW Today has exactly 2 Juana items in total, and the SQL count is 2. While offline, Try again shows "You're offline. This request is saved and will send when you reconnect." and nothing is lost. |
  | M7 (test 7) | Online, open DevTools → Network → right-click → **Block request URL** and add the pattern `*/rest/v1/help_requests*`. Create a third request. Then remove the block and tap **Try again**. | While blocked, the chip reads "Not sent yet. Try again." with a **Try again** button and the error text, and the request stays listed after a reload. (K3: this is the brief's "Send failed".) Automatic retries happen after about 2 s, 5 s and 15 s and still fail. After unblocking and Try again: "Received in demo clinic inbox", and the SQL count is 3. |
  | M8 (test 8) | As BHW: go offline, register a patient and log a visit (My Patients). Reload: both are still listed as "Saved on this device · Waiting to send". Go online and tap **Sync Now** on the Sync tab. Reload the BHW, Admin and Patient workspaces, once online and once offline. | All locally created records are unchanged after every reload: the BHW patient and visit (still listed after Sync Now and the reload, with the chip "Synced"), Patient's My requests, and the Admin inbox (offline, from cache with "Last updated …"). The BHW Sync footnote still says that full cloud sync is deferred. |
  | M9 (test 9) | Read the help-request sheet, My requests, BHW Today and the Admin sections. | The urgent-care guidance is shown (EN and FIL), naming the emergency room and 911. Nothing says or implies live monitoring or a response time. "Requests send only while Tuloy is open…" and "Saved on this device only. Backup and restore aren't available yet." are shown. The Admin card reads "Latest field records". |
  | M10 (test 10) | Open `/demo` and tap **Reset demo data**, then confirm. Open Patient, BHW and Admin. | "Demo data reset". Patient My requests shows "No requests yet". BHW Today has no Juana item. The Admin inbox shows only the 2 seed requests (Marites blocked, Ernesto unassigned). Ernesto's request is under "Needs Attention · Unassigned help requests". DevTools Local storage has no `tuloy:v1:help_requests:*` keys. |

  **Extra checks**

  | # | Steps | Pass condition |
  |---|---|---|
  | E1 (conflict) | Offline, create a request. Copy its id from the `tuloy:v1:help_requests:<id>` key. In the SQL Editor run `insert into help_requests (id, patient_id, reason, created_on_device_at) values ('<id>', 'c0000000-0000-4000-8000-000000000001', 'other', now());`. Go online. | The chip reads "Needs review", with "…Nothing was overwritten. Resolving this in the app isn't available yet." There is no Try again. The server row is still reason 'other', and the local item still has the original reason. Run Reset afterwards. |
  | E2 (update prompt) | With the app open from `npx serve dist`, change one visible string, run `npm run export:web` again (the server keeps serving `dist`), then switch tabs away and back. | "A new version of Tuloy is available." with **Reload** appears. Nothing reloads by itself. Reload shows the new string, and Application → Cache storage holds only one `tuloy-shell-*` cache. |
  | E3 (dev server) | Run `npx expo start --web` and open it. | Application → Service workers lists none for that origin, and there is no update banner. |
  | E4 (native, Android with Expo Go or a dev build) | Patient: load online, enable airplane mode, force-close and reopen, then submit a help request. Reopen again. Disable airplane mode. | Home comes from the snapshot, with "Last updated". The request persists across the restart as "Waiting to send", then becomes "Received in demo clinic inbox" after reconnecting with the app open. (SQLite `kv_v1`.) |
  | E5 (session) | Pick Patient and reload: you stay on Patient. Open `/bhw` by URL. Tap Logout. Reload. | `/bhw` shows Access Restricted for the Patient persona. After Logout, the app goes to `/login`, and a reload stays on `/login`. |

  - _Requirements: OC-1 to OC-17; brief §7.5 tests 1–10_
