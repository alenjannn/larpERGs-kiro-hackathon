# Requirements: 02-offline-first-core

## Introduction

This spec implements the brief's §7 required offline journey. It targets Expo Web first (the exported static PWA served from `dist/`), then native parity with SQLite.

1. The patient opens the previously loaded app without internet.
2. Cached Patient Home and care information are shown.
3. A help request is saved locally: **Saved on this device → Waiting to send**.
4. When connectivity returns, it is delivered **once**.
5. It becomes **Received in demo clinic inbox**.
6. It appears once in the BHW Today queue (or in Admin Needs Attention if unassigned).

It builds on Spec 01, which is already in the working tree:
- `help_requests` table with a client-generated id, auto-assignment trigger and server `received_at`
- `status.ts` with `outboxStatusKeys`
- `StatusChip`, `OfflineBanner`, `LastUpdated`, `NextStepCard`
- `ConnectivityContext` with `onReconnect`
- `SyncContext` and the `syncQueues.ts` registry
- `storage.getItem/setItem/removeItem/clearDemoData` (`tuloy:v1:*` keys, `kv_v1` table on native)
- `newId()`
- Reset demo data

**SQL: none.** This spec needs no database change. The Spec 01 schema already provides everything:
- `help_requests` with a client UUID PK and no default
- the BEFORE INSERT trigger, which is safe with `ON CONFLICT DO NOTHING`
- the anon grants: SELECT/INSERT/UPDATE on `help_requests`, `appointments` and `care_plans`, and SELECT on `clinics`, `patients`, `bhws` and `admins`
- the FK `help_requests.patient_id → patients.id`, which allows embedding the patient name

So `supabase/apply_spec2.sql` is **not** created.

### Conflicts found and decisions

| # | Conflict | Decision |
|---|---|---|
| K1 | **Login guard vs "No real login" (product.md §3).** Commit `df7a9bf` added `AuthContext` plus a guard in `RoleTabsLayout` and `app/index.tsx`. The demo personas set an in-memory user only (`setDemoRole`), so **every reload redirects to `/login`**, online or offline. That breaks OC-1, OC-3 and OC-8. | Keep the login screen and the role-mismatch guard. The guard also accepts the **persisted demo persona** from `DemoRoleContext` (`tuloy:v1:demo_role`). Logout clears that persona. ⚠ This changes an access-control check. It grants no access beyond what the "Quick-Access Demo" buttons already give, but **confirm at review**. |
| K2 | The brief and Spec 06 say one link opens the launcher. Today `/` redirects to `/login`, and the launcher is at `/demo`. | No routing change here (Spec 06 owns the entry link). The manual tests use `/demo`. With a persisted persona, `/` goes to that role's workspace (OC-15). |
| K3 | Brief §7.5 test 7 says "Send failed". The dictionary label (brief §8.1 copy, tech.md §5, `status.ts`) is "Not sent yet. Try again." | Use the dictionary label. Test 7 passes on "Not sent yet. Try again." with a **Try again** action. |
| K4 | structure.md puts `sw.js` in `public/`. The service worker needs a generated precache list of the hashed `dist/` files. | A hand-written template, `apps/mobile/scripts/sw-template.js`, is turned into `dist/sw.js` after export by `apps/mobile/scripts/build-sw.mjs`. `public/` holds the manifest and icons. No Workbox dependency. |
| K5 | Audit gap 0.4 suggested a new SQLite table, `outbox_help_requests`. | Store one `tuloy:v1:help_requests:<id>` key per request in the existing `kv_v1` SQLite table (localStorage on web), using one new storage method, `listItems(prefix)`. This is still SQLite on native, and Reset already clears it. |
| K6 | Today (Spec 04) and Needs Attention (Spec 05) are full screens in later specs. | Add a minimal "Today · Help requests" section to the BHW index screen. On the Admin index screen, add a "Needs Attention · Unassigned help requests" section and a read-only "Demo clinic inbox" list. No acknowledge or assign actions in this spec. Routes and tab names are unchanged. |
| K7 | The prompt lists four triggers. A request submitted while online would otherwise wait for one of them. | Add a fifth trigger: **on submit while online**. |
| K8 | Brief §9.1 step 6 says to tap Try again while offline: "the request stays queued and is not lost." | While the device is known to be offline, Try again makes **no** network attempt. It leaves the status unchanged and says the request will send on reconnect. A send failure is simulated online, using DevTools request blocking. |
| K9 | CI deploys `dist/` to GitHub Pages under a sub-path, but the service worker uses root scope `/`. | Vercel (root path) is the target (audit C15). The service worker is not expected to work on the Pages sub-path. No CI change here. |

### Out of scope (later specs)

- Acknowledging or assigning help requests, and the full Today and Needs Attention queues (Specs 04 and 05).
- The YAKAP stage tracker, Care Plan tab, Clinics finder, "I already attended" and "I need another date" (Spec 03). This spec only shows the current YAKAP step line and the released plan summary on Home.
- Cache headers and Vercel deployment checks (Spec 06).
- Deferred everywhere (OC-14): background sending while the app is closed, cloud sync of all records, cross-device conflict resolution, and backup/restore.

### Glossary

- **Snapshot.** The last successful online load of a patient's Home data, stored at `tuloy:v1:patient_snapshot:<patientId>`.
- **Outbox item.** One help request stored locally at `tuloy:v1:help_requests:<id>`, with the local-only fields `_sync_status`, `_attempts`, `_last_error`, `_local_updated_at` and `_next_attempt_at`.
- **Read-back.** A `SELECT … WHERE id = :id` after the upsert. Only a matching row counts as received.
- **Exported build.** The output of `npm run export:web`, served by `npx serve dist` or Vercel. The service worker exists only there.

Each requirement lists what verifies it:
- **M#**: a numbered step of the manual test script in `tasks.md`, which mirrors brief §7.5 tests 1–10.
- **E#**: an extra manual step.
- **A#**: an automated check in `tasks.md`.

---

## Requirements

### OC-1 Open offline after one online use

**User story:** As a patient, I want Tuloy to open without internet after I've used it once, so that I can still see my next care step.

1. WHEN the production web app has been loaded online once AND the device is offline AND the user reloads THE SYSTEM SHALL render the app and Patient Home without a browser error page.
2. WHILE offline THE SYSTEM SHALL show `OfflineBanner` with the exact copy "You're offline. Your saved information is still here. Requests will send when you reconnect." It SHALL also show the snapshot's "Last updated <DD Mon YYYY, h:mm AM/PM>".
3. IF no snapshot exists for the current patient THEN THE SYSTEM SHALL show "Connect once to load your information" instead of Patient Home content.
4. WHILE offline THE SYSTEM SHALL render these from the snapshot:
   - the next step,
   - the current YAKAP step,
   - the released care plan summary,
   - the care team (assigned BHW and clinic contact).

   The Profile and My Health tabs SHALL also render from the snapshot.
5. WHILE online THE SYSTEM SHALL render the snapshot first (if there is one), then replace it with fresh data once loaded (cache-then-network).

*Verified by:* M1, M1b, A4 (the precache covers every route).

### OC-2 Ask for help offline

**User story:** As a patient, I want to ask for help while offline, so that my request is not lost.

1. WHEN the patient submits a help request offline THE SYSTEM SHALL persist it locally, and read it back, before showing any confirmation.
2. WHEN the request is persisted THE SYSTEM SHALL show the heading "Saved on this device", then the chips "Saved on this device" and "Waiting to send".
3. IF persisting fails (storage blocked or full) THEN THE SYSTEM SHALL show "Could not save on this device: <reason>", keep the form contents, and SHALL NOT show "Saved on this device".
4. WHEN Submit is tapped more than once for the same form THE SYSTEM SHALL store exactly one outbox item. The id is created once per form session.

*Verified by:* M2, A2 (core script: duplicate enqueue).

### OC-3 Survives refresh

**User story:** As a patient, I want my request to survive a refresh, so that I don't have to re-enter it.

1. WHEN the app is refreshed or reopened while offline THE SYSTEM SHALL list the request under "My requests" as "Waiting to send", with its original reason, message and "Created on this device <date, time>".
2. WHEN the app is reloaded THE SYSTEM SHALL restore the demo persona and open the same workspace without redirecting to `/login` (see OC-15).

*Verified by:* M3.

### OC-4 Automatic send on reconnect

**User story:** As a patient, I want my request sent automatically when I'm back online, so that I don't have to remember.

1. WHEN connectivity changes from offline to online WHILE the app is open THE SYSTEM SHALL start a flush within 5 seconds. Any in-flight attempt is aborted and restarted.
2. THE SYSTEM SHALL also start a flush in these cases:
   - on app start, once connectivity is known to be online,
   - when the page or app returns to the foreground while online,
   - on submit while online,
   - on a manual **Try again**.
3. WHEN the server read-back returns a row with the same content THE SYSTEM SHALL show "Received in demo clinic inbox" and the server's received time.
4. THE SYSTEM SHALL NOT show "Received in demo clinic inbox" before the read-back confirms the row. While sending, the item shows "Sending…".

*Verified by:* M4, A2 (status order).

### OC-5 Exactly once

**User story:** As the care team, I want each request exactly once, so that nobody does duplicate work.

1. WHEN a request is flushed any number of times THE SYSTEM SHALL result in exactly one `help_requests` row and exactly one BHW Today item. This includes repeated Try again, double taps, connectivity toggled during sending, and a reload mid-send.
2. THE SYSTEM SHALL send the insert as `upsert(row, { onConflict: 'id', ignoreDuplicates: true })` with the client UUID. It SHALL send no UPDATE for help requests.
3. THE SYSTEM SHALL run at most one flush at a time per tab (single-flight). A flush requested while one is running SHALL cause one more pass after it, not a parallel one.
4. WHEN the app loads THE SYSTEM SHALL reset any item left in 'sending' to 'pending' before the first flush.
5. Lists in BHW Today and the Admin inbox SHALL be keyed and de-duplicated by request id.

*Verified by:* M5, M6, A2.

### OC-6 Failure and conflict

**User story:** As a patient, I want to know when sending failed, so that I can retry.

1. IF a flush attempt fails THEN THE SYSTEM SHALL:
   - keep the request and set `_sync_status = 'failed'`,
   - increment `_attempts` and record `_last_error`,
   - show "Not sent yet. Try again." with a **Try again** action.

   A failure is a network error, a timeout after 10 s, a server error, or a read-back that returns no row.
2. WHILE online THE SYSTEM SHALL retry failed items automatically after 2 s, 5 s, 15 s and 60 s (for the 1st, 2nd, 3rd and later failures), only while the app is open.
3. WHEN Try again is tapped WHILE the device is known to be offline THE SYSTEM SHALL make no network attempt and SHALL show "You're offline. This request is saved and will send when you reconnect." (K8).
4. IF the read-back row has the same id but a different patient, reason, message or created-on-device time THEN THE SYSTEM SHALL:
   - set `_sync_status = 'conflict'` and show "Needs review",
   - leave the local copy unchanged and send no update to the server,
   - not retry the item automatically or offer Try again.
5. A conflict item SHALL explain: "The demo clinic inbox has a different request with this ID. Nothing was overwritten. Resolving this in the app isn't available yet."

*Verified by:* M7, E1, A2.

### OC-7 BHW Today and Admin Needs Attention

**User story:** As a BHW, I want received help requests in my Today queue, so that I can act.

1. WHEN a help request is received for a patient assigned to the current BHW persona THE SYSTEM SHALL show it in the BHW "Today · Help requests" section, with these as separate fields:
   - patient name,
   - reason label,
   - "Created on device <date, time>",
   - "Received <date, time>",
   - the chips "Received in demo clinic inbox" and its coordination status.
2. THE BHW section SHALL list requests whose `assigned_bhw_id` is the current BHW and whose status is assigned, acknowledged or blocked, newest received first.
3. IF the patient is unassigned THEN THE SYSTEM SHALL show the request in the Admin "Needs Attention · Unassigned help requests" section, with the chip "Unassigned" and its age.
4. THE Admin screen SHALL show a read-only "Demo clinic inbox" list (latest 20) with both timestamps and the coordination chip.
5. WHILE offline THE BHW and Admin sections SHALL show their last cached list with `LastUpdated`.

*Verified by:* M5, M6, M10, E5.

### OC-8 All demo records persist

**User story:** As a demo presenter, I want all demo records to persist, so that a refresh never breaks the demo.

1. WHEN any workspace is refreshed THE SYSTEM SHALL show all locally created records unchanged: queued BHW patients and records, outbox help requests, and the demo persona.
2. THE SYSTEM SHALL keep a persistent local copy of every demo record type it displays:

   | Record type | Local copy |
   |---|---|
   | patients, records | BHW queue and cache |
   | appointments, care plans | patient snapshot |
   | help requests | outbox, plus the BHW and Admin caches |
   | admin view (BHWs, patients, records) | admin cache |

3. THE BHW workspace SHALL keep showing a record saved offline after Sync Now and a reload. Synced queue items that are not yet in the cache are merged in.
4. IF a web write to the legacy keys (`tuloy_offline_records`, `tuloy_cache:*`) fails while browser storage exists THEN THE SYSTEM SHALL surface an error instead of silently keeping the data in memory only.
5. THE SYSTEM SHALL NOT add a send queue for any record type other than help requests. BHW Sync Now (`sync.ts`) stays unchanged.

*Verified by:* M8, M3.

### OC-9 Honest help-request wording

**User story:** As a patient, I want honest help-request wording, so that I know it isn't an emergency line.

1. WHERE the help-request form is shown THE SYSTEM SHALL display this urgent-care guidance above the Submit button: "This is not an emergency service. Your request goes to the demo clinic inbox. Nobody watches it live, and there is no set response time. If you have chest pain, trouble breathing, heavy bleeding, signs of a stroke or feel very unwell, go to the nearest hospital emergency room or call 911 now."
2. THE SYSTEM SHALL show the Filipino version of this guidance, marked "needs native-speaker review" in code.
3. THE SYSTEM SHALL NOT state or imply live monitoring or a guaranteed response time anywhere in the help-request UI, the BHW section or the Admin sections. In the new copy, a grep SHALL find none of "monitor", "24/7", "real-time", "guarantee", "within … hours" or "immediately", and "live" SHALL appear only in "Nobody watches it live".
4. THE Admin card "Live field records" SHALL be renamed "Latest field records" (audit 2.2).

*Verified by:* M9, A6.

### OC-10 Offline app shell (web)

**User story:** As a patient on the web link, I want the app itself to load offline, so that I never see the browser's offline page.

1. WHEN `npm run export:web` runs THE SYSTEM SHALL write `dist/sw.js`. It SHALL contain:
   - a precache list of every file in `dist/` except `sw.js` and `*.map`,
   - a version string derived from the file contents.
2. THE SYSTEM SHALL register `/sw.js` only when all of these hold:
   - `Platform.OS === 'web'`,
   - `process.env.NODE_ENV === 'production'`,
   - `navigator.serviceWorker` exists,
   - the page is a secure context.

   It SHALL NOT register under `expo start`.
3. WHEN the service worker installs THE SYSTEM SHALL precache every listed URL. Route HTML is stored under its clean URL, and redirected responses are stored as plain responses. IF any URL fails THEN the install SHALL fail and the previous version stays active.
4. WHEN an offline navigation targets an exported route THE SYSTEM SHALL serve that route's cached HTML. Clean URLs, trailing slashes and `.html` forms all match. Unknown paths get the cached not-found page, or `/` if there is none.
5. THE service worker SHALL ignore non-GET and cross-origin requests (Supabase, map tiles). It SHALL serve same-origin precached files cache-first.
6. WHEN a new version has installed while an older one controls the page THE SYSTEM SHALL show "A new version of Tuloy is available." with a **Reload** button. It SHALL NOT reload by itself.
7. WHEN Reload is tapped THE SYSTEM SHALL activate the waiting version and reload the page once. Old `tuloy-shell-*` caches are deleted on activation.
8. WHEN the page becomes visible THE SYSTEM SHALL check for a new version.
9. THE SYSTEM SHALL serve `/manifest.json`, linked from every exported HTML page together with `<meta name="theme-color" content="#0F766E">`. The manifest SHALL contain:
   - `name` and `short_name` "Tuloy",
   - `theme_color` "#0F766E" and `background_color` "#F8FAFC",
   - `start_url` "/" and `display` "standalone",
   - PNG icons at 192×192 and 512×512.

*Verified by:* M1, E2, E3, A3, A4.

### OC-11 Outbox mechanics (`src/shared/services/outbox.ts`)

**User story:** As the team, we want one outbox mechanism, so that delivery is predictable and testable.

1. THE outbox SHALL store each item at `tuloy:v1:help_requests:<id>` with these fields:
   - `id` (UUID v4 from `newId()`),
   - `patient_id` and `reason`,
   - `message` (trimmed, empty becomes null, at most 500 characters),
   - `created_on_device_at` (ISO),
   - `received_at` (null until synced),
   - `_sync_status`, `_attempts`, `_last_error`, `_local_updated_at` and `_next_attempt_at`.
2. `_sync_status` SHALL be one of pending, sending, synced, failed or conflict. The allowed transitions are:
   - pending → sending
   - failed → sending
   - sending → synced, failed or conflict
   - sending → pending (only on the load-time reset, or when an attempt is aborted to restart it on reconnect or Reset; `_attempts` is unchanged)

   Conflict and synced are terminal in this spec.
3. THE row sent to the server SHALL contain only `id`, `patient_id`, `reason`, `message` and `created_on_device_at`. `received_at`, the assignment and the `_*` fields are never sent.
4. THE outbox SHALL process eligible items (pending or failed) oldest first. A network error SHALL end the pass and leave the remaining items unchanged.
5. THE outbox SHALL register a `help_requests` adapter (counts and flush) with `syncQueues.ts`, so that `SyncContext.counts` includes it.
6. THE outbox logic SHALL be a dependency-injected core (`outboxCore.ts`) with no React Native imports, so that it can be checked in Node.

*Verified by:* A2.

### OC-12 Help-request UI

**User story:** As a patient, I want a simple way to ask for help and see what happened to my requests.

1. THE SYSTEM SHALL offer **I need help** in a "Need help?" card on Patient Home and on every `NextStepCard`. Both open the same help-request sheet.
2. THE sheet SHALL offer these reasons as single-select chips with EN/FIL labels. FIL labels are marked for native-speaker review.

   | Value | EN | FIL |
   |---|---|---|
   | `transport` | Transport | Transportasyon |
   | `another_date` | Need another date | Ibang petsa |
   | `lab_access` | Lab access | Pagpapa-laboratoryo |
   | `document_help` | Document help | Tulong sa dokumento |
   | `medicine_access` | Medicine access | Pagkuha ng gamot |
   | `other` | Other | Iba pa |

3. THE sheet SHALL also have:
   - an optional message field (500-character limit, visible counter),
   - the urgent-care guidance (OC-9),
   - a Submit button.
4. Submit SHALL be disabled until a reason is chosen, and while saving.
5. THE sheet SHALL close on Cancel, backdrop tap, Escape (web) or Android back. On web, it SHALL move focus into the sheet when it opens.
6. THE "My requests" list on Home SHALL show every outbox item for the current patient, newest first. Each item SHALL show:
   - the reason label,
   - the message, if any,
   - "Created on this device <date, time>",
   - `StatusChipRow(outboxStatusKeys(status, 'help_request'))`,
   - "Received <date, time>" when synced,
   - Try again when failed,
   - the conflict explanation when in conflict.
7. WHILE any item is pending or failed, THE list SHALL show a list-level **Try again**. WHEN there are no items, it SHALL show the empty state "No requests yet".
8. All controls SHALL be at least 44 px high, have accessible labels, and never convey status by colour alone.

*Verified by:* M2, M3, M7, M9.

### OC-13 Patient snapshot

**User story:** As a patient, I want my last-loaded information kept on the device, so that it is there next time I'm offline.

1. WHEN all Home data for the patient loads successfully online THE SYSTEM SHALL write the snapshot `{ v: 1, patient_id, last_updated_at, patient, bhw, admin, clinic, clinician, appointments, care_plan, records }`. This happens on every successful online load.
2. IF any part of the online load fails THEN THE SYSTEM SHALL keep the previous snapshot unchanged and show it with "Showing saved information. <reason>".
3. `care_plan` SHALL be the latest care plan with status 'released' only.
4. THE current patient SHALL be the demo persona's `personaId` when the role is patient, otherwise `DEMO_PATIENT_ID`.

*Verified by:* M1, M1b, M10.

### OC-14 Deferred capabilities stated in UI

**User story:** As a presenter, I want the UI to say what isn't built, so that nothing deferred looks like it works.

1. THE "My requests" list and the offline help-request confirmation SHALL state: "Requests send only while Tuloy is open. Sending in the background while the app is closed isn't available yet."
2. THE "My requests" list SHALL state: "Saved on this device only. Backup and restore aren't available yet."
3. THE conflict explanation SHALL state that resolving the conflict in the app isn't available yet (OC-6.5).
4. THE existing BHW Sync footnote (full cloud sync is deferred) SHALL remain.
5. WHILE offline, Patient Home SHALL state: "Changes from your care team will show after you reconnect."
6. THE SYSTEM SHALL NOT label snapshot data, or any record type other than help requests and BHW Sync Now items, as sent, synced or received.

*Verified by:* M9.

### OC-15 Demo session survives reload (K1)

**User story:** As a presenter, I want the chosen demo persona to survive a reload, so that offline reloads land on the workspace instead of the login page.

1. WHEN a demo persona was chosen (`tuloy:v1:demo_role` is set) AND the page is reloaded, online or offline, THE SYSTEM SHALL open that role's workspace without redirecting to `/login`.
2. WHEN `/` is opened with a persisted persona THE SYSTEM SHALL redirect to that role's workspace.
3. WHEN Logout is tapped THE SYSTEM SHALL sign out, clear the persisted persona and go to `/login`.
4. IF the auth session check rejects THEN THE SYSTEM SHALL end its loading state, so there is no endless spinner.
5. THE existing "Access Restricted" behaviour, for a role that doesn't match the route, SHALL stay.

*Verified by:* M1, M3, E5.

### OC-16 Native parity

**User story:** As a BHW or patient on Android, I want the same offline behaviour as on the web.

1. THE outbox, snapshot and caches SHALL use the same `storage.ts` interface. On native they are stored in the SQLite `kv_v1` table, and `listItems` matches the prefix exactly (no `LIKE` wildcards).
2. On native, the foreground trigger SHALL use `AppState` → 'active', and connectivity SHALL use NetInfo (Spec 01).
3. Service-worker code and `+html.tsx` SHALL NOT affect native. The native registration module is a no-op.
4. `npx expo export --platform android` SHALL bundle without errors. The web bundle SHALL contain no `expo-sqlite`, `@rnmapbox` or NetInfo native code.

*Verified by:* A5, E4 (on a device; not automatable here).

### OC-17 Reset demo data integration

**User story:** As a presenter, I want Reset to give a clean start for the offline journey.

1. WHEN Reset demo data succeeds THE SYSTEM SHALL:
   - remove all outbox items and snapshots on this device (the existing `clearDemoData`),
   - cancel the outbox retry timer,
   - discard writes from any flush that started before the reset.
2. AFTER Reset THE SYSTEM SHALL show:
   - "No requests yet" in My requests,
   - only the two seed help requests in the Admin inbox,
   - no Juana item in BHW Today.

*Verified by:* M10.
