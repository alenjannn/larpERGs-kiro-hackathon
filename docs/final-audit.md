# Tuloy final audit

04 Oct 2026 · read-only audit of `main` at `c147eb6` ("finalfinal") · no code changed

**Compared against:**
- `docs/product-brief.md` (v2)
- `.kiro/steering/product.md`, `tech.md`, `structure.md`

The older steering files (`architecture.md`, `expo.md`, `security.md`) were used only to name conflicts. `docs/audit.md` is the Spec 00 baseline and this file replaces it.

**Paths:** relative to `apps/mobile/` unless they start with `supabase/`, `scripts/`, `.github/` or `docs/`. Line numbers marked ≈ are within ±3 lines.

## How this was checked

**Commands run:**
- `npm run typecheck`: passes.
- `npx expo lint`: **fails** with 18 errors and 5 warnings (TS-1).
- `npx expo export --platform web`, run into a temp folder, then `scripts/build-sw.mjs` on that output. Both succeeded and the temp folder was deleted:
  - 21 static routes; `sw.js` covers 21 routes and 24 assets.
  - The web bundle has no `expo-sqlite` and no `@rnmapbox` code.
  - `service_role` strings appear only in the guard that rejects such keys.
  - The manifest is linked.
- `setup.sql` vs the generator, computed in memory (the file was not rewritten): **out of sync** (SC-1).
- git: HEAD `c147eb6` = `origin/main`; only `docs/demo-script.md` is untracked. `c147eb6` was pushed while this audit ran and contains the same files that were read.

**Read:** all of `app/`, `src/`, `supabase/`, `scripts/`, the CI workflow, `docs/acceptance-results.md` and `docs/demo-script.md`.

**Not verified:**
- Runtime behaviour in a browser or on a device. Acceptance tests 1–6 are judged from code; tests 7–10 rely on `docs/acceptance-results.md`.
- The live Supabase database: applied migrations, default grants, Realtime publication.
- Native and Expo Go builds.
- The Vercel deployment.

**Severity:**
- **Critical:** breaks a product.md §3 non-negotiable outright, or a step of the brief §7.1 journey on the demo path.
- **High:** a required behaviour is missing or wrong on the demo path, or a §7.5 acceptance test is likely to fail under normal conditions.
- **Medium:** a requirement is partly met, or a real risk exists off the main demo path.
- **Low:** polish, naming, or a documented deviation.

## Summary

| Group | Critical | High | Medium | Low |
|---|---|---|---|---|
| 1. Offline journey | 0 | 2 | 6 | 7 |
| 2. Non-negotiables | 2 | 1 | 4 | 2 |
| 3. Status dictionary | 0 | 2 | 2 | 4 |
| 4. Schema | 0 | 1 | 4 | 10 |
| 5a. Patient | 0 | 2 | 2 | 11 |
| 5b. BHW | 0 | 2 | 4 | 9 |
| 5c. RHU | 0 | 1 | 3 | 10 |
| 6. Other tech / structure rules | 0 | 1 | 7 | 8 |
| **Total** | **2** | **12** | **32** | **61** |

Section 6 is outside the five requested groups. It holds the tech.md and structure.md rules that don't fit any of them. Section 7 names steering conflicts.

**Fix first:**
1. **NN-1:** `/` opens a real email/password login with public sign-up instead of the launcher.
2. **NN-2:** "(elevated BP)" in red on BHW screens. Juana's seeded 148/94 reading triggers it.
3. **OJ-1:** auto-send on reconnect is skipped if the app was already online earlier in the same page load.
4. **SC-1:** `setup.sql` lacks migration 0600, so the CI check fails on `main` and the GitHub Pages deploy is blocked.
5. **NN-3:** no in-app role switch. The demo script has the presenter type `/demo` five times.
6. **OJ-2:** a red "Not connected" card on Patient Home while offline.
7. **BH-1, BH-2, SD-1:** attendance and rescheduling are never written to `appointments`, and patient-reported attendance drops off BHW Today.
8. **TS-1:** lint fails. Two of its errors are the root cause of OJ-1 and OJ-5.

---

## 1. Offline journey (brief §7.1, with §7.2–7.6 and tech.md §5)

### Acceptance tests (brief §7.5)

| # | Test | Status | Basis |
|---|---|---|---|
| 1 | Offline reopen shows Home, banner, last-updated | At risk | Code path is complete: SW precache, snapshot `tuloy:v1:patient_snapshot:<id>`, OfflineBanner, LastUpdated. At risk if the tester goes offline before the SW finishes installing (OJ-4). A red card appears on Home (OJ-2). Not run in a browser. |
| 2 | Offline create shows Saved → Waiting | Pass (code), at risk | Passes when `navigator.onLine` is false. With Wi-Fi but no internet, a request in the detection window shows "Not sent yet. Try again." (OJ-3). |
| 3 | Survives refresh with content and created time | Pass (code) | One key per request, `created_on_device_at` set once, `sending` reset to `pending` on load. |
| 4 | Delivered on reconnect without re-entry | **At risk** | Works through the app-start trigger after a reload, a tab visibility change, or Try again; not on a plain reconnect (OJ-1). `docs/demo-script.md` already tells the presenter to tap Try again after ~15 s. |
| 5 | Exactly one inbox row and one BHW item | Pass (code) | PK `id`, `upsert` with `ignoreDuplicates`, read-back. BHW items are the same rows, deduped by id. Depends on the trigger's app path (SC-2). |
| 6 | Repeated Try again or flapping | Pass (code) | Single-flight lock with rerun, plus server dedupe. |
| 7 | Send failure keeps the request with Try again | Pass (verified in Chrome) | The label is "Not sent yet. Try again." (conflict C2). |
| 8 | Refresh keeps measurements, visits, assignments, plans | Pass for online refresh (verified) | Assignments and plans are not stored locally (OJ-7). |
| 9 | Copy has no emergency or response-time claim | Pass (verified) | Urgent-care box, "not an emergency service", 911. |
| 10 | Reset demo data | Pass (verified) | The success notice is never seen (RH-7). |

### Findings

| ID | Sev | Gap or violation | Evidence | Rule |
|---|---|---|---|---|
| OJ-1 | High | **Reconnect does not trigger a send once the app has been online in this page load.** ConnectivityProvider calls the reconnect listeners right after `setIsOnline(true)`, before React re-renders. The outbox reads connectivity through `onlineRef.current`, which SyncProvider assigns during render, so the listener sees `false` and `flush()` returns `'offline'` without sending. Scheduled retries don't help either, because `scheduleRetry` returns early while offline. Delivery still happens through the once-per-load app-start effect, a visibility change, or Try again. Found by reading code; not reproduced. | `src/shared/context/ConnectivityContext.tsx` ≈48-67; `src/shared/context/SyncContext.tsx` 32 (lint `react-hooks/refs`), 66-75; `src/shared/services/outboxCore.ts` `flush()` first line and `scheduleRetry` | brief §7.2 "Sending is attempted when the app is open and connectivity returns"; tech.md §5 triggers |
| OJ-2 | High | **Red error card on Patient Home when offline.** `<ConnectionTest />` renders an uncached fetch that shows "🔴 Not connected" plus a red error Notice. It appears on the exact screen used for test 1 and demo step 3. BHW Today and Needs Attention also carry it, and BHW Today adds an `OfflineTest` panel with a second Sync Now. | `src/features/patient/screens/PatientHomeScreen.tsx` ≈139; `src/shared/components/ConnectionTestPanel.tsx` 45-53; `src/features/bhw/screens/BHWDashboardScreen.tsx` ≈95-96 | brief §8.1 "Offline is a normal, expected state… Do not use red for being offline"; brief §4 Home prioritizes action |
| OJ-3 | Medium | **Web offline detection lags when `navigator.onLine` stays true.** `isOnline` is `navigator.onLine` AND a Supabase probe (8 s timeout, 15 s recheck, only while the tab is visible). With captive Wi-Fi or the SW "Offline" box, a request is sent at once and shows "Not sent yet. Try again." instead of "Saved on this device → Waiting to send". At start-up the state is unknown for up to 8 s, so no banner shows. Delivery remains correct. | `src/shared/services/connectivity.ts` 20-25, `canReach`, `check` | tech.md §3 (`navigator.onLine` plus events); brief §7.5 test 2 |
| OJ-4 | Medium | **No sign that the app is ready to reopen offline.** The SW registers on `load` and precaches 45 files, including the 1.8 MB entry and the 979 KB mapbox-gl chunk. Going offline before install finishes gives the browser error page. Registration needs a secure context, so phone testing over `http://<LAN IP>` gets no SW. | `src/shared/services/serviceWorker.ts`; `scripts/sw-template.js` install | brief §7.5 test 1; tech.md §5 offline app shell |
| OJ-5 | Medium | **Patient data does not refresh on reconnect, and a newly released plan does not arrive by itself.** The reconnect `reload()` has the same stale-ref check as OJ-1. Realtime listens only to `records`, and no migration adds that table to the `supabase_realtime` publication. A new plan shows only on focus, pull-to-refresh or remount. | `src/features/patient/hooks/usePatientSnapshot.ts` 166 (lint `react-hooks/refs`), ≈99-136, ≈223 | tech.md §3 cache-then-network; product.md §7 demo step 6 |
| OJ-6 | Medium | **BHW and RHU data loads are network-first.** All fetches are awaited before the cache is read, and the Supabase client sets no fetch timeout. Hard offline falls back fast, but a slow or flaky link shows a spinner even when a cache exists. | `src/features/bhw/hooks/useBHWData.ts` 42-72; `src/features/admin/hooks/useAdminData.ts` ≈60-86; `src/features/admin/hooks/useClinicalReview.ts` ≈24-43 | tech.md §3 "render from the local cache first" |
| OJ-7 | Medium | **Assignments and care-plan drafts are not stored locally.** They are server-only writes, disabled offline with a notice. Draft text lives only in component state and is lost on refresh. | `src/features/admin/hooks/useAssignments.ts`; `useClinicalReview.ts`; `components/CarePlanForm.tsx` | brief §7.2 "assignments, plans… saved to persistent local storage and survive refresh"; §7.4 RHU row |
| OJ-8 | Medium | **"Clear synced" can remove BHW records from the offline view.** It deletes synced queue rows, and they come back only if the `bhw:<id>` cache was refreshed online after the sync. The Sync screen doesn't reload BHW data after Sync Now, Clear synced has no confirm step, and records are capped at 100. | `src/features/bhw/hooks/useOfflineSync.ts` ≈85-88; `useBHWData.ts` 51; `screens/BHWSyncScreen.tsx` | brief §7.2 records survive refresh |
| OJ-9 | Low | A request can stay at "Sending…" until reload if a local write throws mid-flush. The stale-`sending` reset runs only once per load. | `outboxCore.ts` `init`, `pass` | tech.md §5 single-flight |
| OJ-10 | Low | No lock across browser tabs. A second tab resets the first tab's in-flight item and may resend it; the server dedupes, but the status flickers. | `src/shared/services/outbox.ts` (cross-tab comment) | tech.md §5 single-flight |
| OJ-11 | Low | Legacy web storage paths still fall back silently. `read()` swallows access errors, and `write()` writes to an in-memory Map when `window.localStorage` is missing. The v1 `getItem`/`removeItem`/`listItems` calls aren't individually wrapped, though their errors do surface. | `src/shared/services/storage/StorageWeb.ts` 10-54 | tech.md §5 "wrap every localStorage call… never discard data silently" |
| OJ-12 | Low | BHW records and the RHU caches use legacy keys, not `tuloy:v1:<entity>:<id>`. The records use the single-array key `tuloy_offline_records`, rewritten on every save; a quota error fails the whole write and tabs can overwrite each other. The caches use `tuloy_cache:*`. | `StorageWeb.ts` 4-5, ≈190-200 | tech.md §5 namespaced keys; brief §7.4 one naming convention |
| OJ-13 | Low | Reset clears only the device that runs it. A pending item on another device is re-inserted as a non-seed row after the reset. | `src/shared/hooks/useDemoReset.ts` | brief §7.4 Reset demo data (narrate it in the demo) |
| OJ-14 | Low | `SyncContext.isFlushing` does not cover BHW Sync Now, which `useOfflineSync` tracks separately. | `src/shared/services/syncQueues.ts`; `useOfflineSync.ts` | tech.md §3 SyncContext |
| OJ-15 | Low | Acknowledge needs a connection. It shows an explicit notice and nothing is lost, but it is not queued, and BHWs often work offline. | `src/features/bhw/hooks/useAcknowledgeHelpRequest.ts` | brief §7.4 BHW handoff |

**Confirmed working:**
- The client UUID is created once per form session.
- Each item is persisted and read back before "Saved on this device" shows.
- The insert is `upsert(…, { onConflict: 'id', ignoreDuplicates: true })` with a 5-field payload, followed by a read-back by id.
- An item becomes `synced` only after a matching read-back. A mismatch becomes `conflict`, with no overwrite and no auto-retry.
- The local `_sync_status`, `_attempts`, `_last_error` and `_local_updated_at` fields are never sent.
- There is a single-flight lock, and a stale `sending` item is reset to `pending`.
- Backoff is 2 s, 5 s, 15 s, 60 s, plus a 10 s request timeout.
- Try again works per item and for all items.
- The snapshot falls back to "Connect once to load your information".
- The offline banner copy is exact and navy.
- The offline map shows "Map needs a connection" followed by the patient list.
- The SW is registered only in production; the manifest is "Tuloy" with #0F766E.
- Reset keeps unrelated keys.
- Created-on-device and received times are shown separately.

---

## 2. Non-negotiables (product.md §3)

| ID | Sev | Gap or violation | Evidence | Rule |
|---|---|---|---|---|
| NN-1 | **Critical** | **Real login replaces the Demo Quick-Switch Launcher.** With no saved role, `/` redirects to `/login`; the launcher moved to `/demo`. LoginScreen offers email/password Sign In and public "Sign Up as Patient" through `supabase.auth.signInWithPassword` and `signUp`, so anyone with the link can create real Supabase Auth users in the shared project. The copy presents a real product: "Unified Healthcare Platform", "provisioned securely by your Administrator", "Bypass authentication". The landing page has no "Simulated role — no real authentication" label. `extractRole` trusts `user_metadata.role`, which the user sets at sign-up. | `app/index.tsx` 19-21; `src/shared/screens/LoginScreen.tsx` ≈24-62, ≈67, ≈94, ≈114; `src/shared/context/AuthContext.tsx` 19-26, 64-82 | product.md §3 "No real login. Roles are chosen in the Demo Quick-Switch Launcher"; structure.md `app/index.tsx` = launcher |
| NN-2 | **Critical** | **"(elevated BP)" is an unvalidated clinical label.** RecordListItem appends "(elevated BP)" in error red when `isElevatedBP` is true (≥140/90, commented "Stage 2 hypertension threshold"). It shows on BHW Today "Recent field records" and on My Patients. Juana's seeded 148/94 visit triggers it. | `src/shared/components/RecordListItem.tsx` 33-35; `src/shared/utils/format.ts` 18-21 | product.md §3 "No diagnosis. No unvalidated risk scores"; brief §4 |
| NN-3 | High | **No in-app role switch.** RoleTabsLayout's "Strict Authentication / Authorization Guard" redirects to `/login` when there is no role. For a different role it shows "Access Restricted: You are logged in as…", so RoleHeader's route-wins effect never runs. DemoQuickSwitchHeader ignores its `onSwitch` prop and shows only a role pill and Logout. `docs/demo-script.md` has the presenter type `/demo` for every switch. The "logged in / permission" wording implies real authentication. | `src/shared/components/RoleTabsLayout.tsx` ≈35-58; `src/shared/components/DemoQuickSwitchHeader.tsx` 10; `docs/demo-script.md` 86 | product.md §3 roles chosen in the launcher; structure.md "RoleHeader… switches role in one tap" |
| NN-4 | Medium | **Clinical authority is enforced only in the UI.** `releaseCarePlan` and `saveCarePlanDraft` don't check the role. Anon has INSERT/UPDATE on `care_plans`, and drafts are readable with the anon key. Release also marks every awaiting result of that patient `plan_released`, so "review complete" just means "plan released". Real authentication would be needed to fix this, so state it in the demo. | `src/shared/services/apiAdmin.ts` ≈120-178; `supabase/migrations/20240101000200_shared_foundation.sql` ≈239-249 | product.md §3 clinical authority |
| NN-5 | Medium | **Patient-entered lab values reach "Latest measurements" without a source or review label.** `mergeRecords` appends clearbook entries, and the tile context ignores `origin` and `review_status`. Entries are self-marked `transcription_status: 'confirmed'`. `measurements.ts` never filters `transcription_status = 'pending'`; this is latent, since nothing produces it today. | `src/features/patient/logic/clearbook.ts` ≈243-296; `components/LatestMeasurements.tsx` ≈15-22; `logic/measurements.ts` ≈98-150 | brief §4 "pending clinical interpretation must be clearly labeled"; "Unconfirmed… must not enter clinical trend calculations" |
| NN-6 | Medium | **Coordinator devices receive and cache full clinical records.** `fetchRecords` uses `select('*')` (BP, glucose, notes), and the result is written to `tuloy_cache:admin:<id>`. Only the UI hides the values. | `useAdminData.ts` ≈60-86; `src/shared/services/api.ts` `fetchRecords` | brief §6 "broad clinical document access is not the default" |
| NN-7 | Medium | **No patient-approved sharing.** `patients.sharing_consent` is never read or shown. Clearbook entries are shared to `records` automatically on save whenever the device is online. | `src/features/patient/hooks/useClearbookEntries.ts` ≈140-143; `src/shared/types/db.types.ts` 69 | brief §2 patient-approved sharing; brief §9 "visible… sharing states" |
| NN-8 | Low | Some status is shown by colour or weight alone. BHWList ACTIVE/INACTIVE is coloured text with no icon. ChipGroup's selected state has no check mark. Native MockMap pins are plain colours. | `src/features/admin/components/BHWList.tsx` ≈22-27; `src/shared/components/ChipGroup.tsx` 52; `src/shared/services/mapbox/MockMap.tsx` | product.md §3 "Every status chip has text and an icon" |
| NN-9 | Low | Edges of "synthetic only". Seed coordinates are offsets around 14.5995, 120.9842 (central Manila), so pins land on real addresses, though they are labelled "approximate DEMO location". The fake user emails `<role>@demo.tuloy.health` use a domain that may be real; `.test` would be safe. | `supabase/seed.sql` patients block; `AuthContext.tsx` ≈96 | product.md §3 synthetic data only |

**Confirmed working:**
- Urgent-care and "not an emergency, nobody watches it live, no set response time" copy.
- "Latest field records… refreshes when you open" replaces "Live".
- Clinic copy says it is not enrollment and opening a card does not book. Accreditation and availability stay "Unknown".
- Deferred features are labelled as deferred: background sending, backup, full cloud sync. No OCR, ML, SMS or inventory claims.
- The QR holds only `tuloy:patient:<id>`.
- Every seed person, clinic and address is marked "(DEMO)", and emails use `.test`.
- Clinical Review shows a restricted explanation when clinician mode is off, and is labelled "Simulated role — no real authentication" in RoleHeader and on the screen.
- Null measurements show "No reading". The trend has no interpolation.
- The care-plan form warns against diagnosis labels.
- RLS is enabled with permissive policies; there are no `auth.uid()` policies.

---

## 3. Status dictionary (product.md §6, brief §8.1–8.2, tech.md §5)

| ID | Sev | Gap or violation | Evidence | Rule |
|---|---|---|---|---|
| SD-1 | High | **Most encounter and coordination states are display-only.** The app writes only encounter `patient_reported_attended` and coordination `assigned` and `acknowledged`. Nothing writes `confirmed`, `clinic_confirmed_attended`, `missed`, `rescheduled`, `blocked` or `completed`; those exist only in seed rows. So rescheduling can't update the row, and a BHW can't mark a request blocked or completed. | `src/shared/services/apiPatient.ts` 24-27 (only encounter write); `apiBhw.ts`, `apiAdmin.ts` (no other status writes) | product.md §6 dictionary; tech.md §4 appointments "Rescheduling updates the row"; brief §3, §5 |
| SD-2 | High | **RecordListItem bypasses the dictionary.** It renders emoji text "⏳ pending sync" and "📶 synced from field" instead of StatusChip. It shows the raw legacy `record.status ?? 'scheduled'`, where 'completed' is the generic flag the dictionary forbids and 'scheduled' is not an encounter state. Times are relative only. Used on BHW Today and My Patients. | `src/shared/components/RecordListItem.tsx` 28, 40, 46; `src/shared/types/db.types.ts` 79 | product.md §6 "Never use one generic 'complete' flag"; tech.md §5 pending label |
| SD-3 | Medium | **StatusChip throws on an unknown value.** `getStatus` has no fallback. Callers cast DB strings into keys such as `` `coordination.${…}` `` and `` `encounter.${…}` ``. With no error boundary (TS-2), one unexpected DB value blanks the app. | `src/shared/status.ts` `getStatus`; `components/DemoClinicInbox.tsx` ≈34; `screens/AssignmentsScreen.tsx` ≈158; `components/TodayHelpRequests.tsx` ≈56; `components/NextStepSection.tsx` ≈52 | product.md §6 |
| SD-4 | Medium | **EN/FIL pairing is inconsistent.** StatusChip shows only the app language (EN by default); `lang="both"` is used only in the gallery. OfflineBanner, LastUpdated, NextStepCard, MeasurementCard, MetricTile and the HelpRequestItem "Received" label stay English in Filipino mode. HelpRequestSheet hard-codes "Naka-save sa device na ito" as a muted 14px line with a negative top margin, outside `status.ts`; that is the likely reason `acceptance-results.md` records it as "not visible". Reason chips use "EN / FIL" while other places use " · ". | `src/shared/components/StatusChip.tsx` 23-28; `src/features/patient/components/HelpRequestSheet.tsx` ≈128-133, ≈158, `styles.fil` | product.md §2 EN/FIL used consistently; brief §8.1 paired labels; structure.md `status.ts` EN/FIL |
| SD-5 | Low | The copy is shorter than the brief's: "Waiting to send" instead of "Waiting to send — will send when you're online". The Send failed chip has an alert icon but no retry glyph; Try again is a separate button. | `status.ts` (`waiting_to_send`, `send_failed`) | brief §8.1 chip table |
| SD-6 | Low | Status words are hard-coded outside `status.ts`. BHW Dashboard's StatTile shows "Waiting to send" / "saved on this device". SyncStatus shows a lowercase "· synced <date>" and the raw `last_error`, which can include the internal "Needs review:" prefix. SyncCounts accessibility labels use the keys, not the visible labels. `patientMapStatus` has its own vocabulary. ConnectionTestPanel uses 🔴/🟢. | `screens/BHWDashboardScreen.tsx` ≈86; `components/SyncStatus.tsx` 30-32; `components/SyncCounts.tsx` 21; `src/features/bhw/today.ts` `patientMapStatus` | product.md §6 "use these exact meanings everywhere" |
| SD-7 | Low | The RHU inbox shows only the coordination chip, never the transport "Received in demo clinic inbox" chip. | `components/DemoClinicInbox.tsx` ≈34 | brief §8.1 "Use the same chip component… RHU inbox" |
| SD-8 | Low | `clinical.transcription_pending` is never produced, because OCR is deferred and the clearbook self-confirms. The state is defined and shown in the gallery only. | `clearbook.ts` `toInsertRow` | brief §8.2 clinical group (informational) |

**Confirmed working:**
- Four separate groups: transport 7, encounter 6, clinical 3, coordination 5. There is no shared "complete" flag.
- Every entry has EN, FIL, an icon and a tone, and the FIL labels are flagged for review.
- The tech.md §5 transport mapping is followed (`outboxStatusKeys`, `legacyQueueStatusKeys`).
- Colours and icons match brief §8.1.
- "Missed" is amber, not red.
- The same StatusChip is used in the Patient, BHW and RHU views.

---

## 4. Schema (tech.md §4)

| ID | Sev | Gap or violation | Evidence | Rule |
|---|---|---|---|---|
| SC-1 | High | **`setup.sql` and `apply_foundation.sql` lack migration 0600** (creatinine/cholesterol columns). CI's "Verify Supabase SQL Setup concatenation" step regenerates and diffs `setup.sql`, so CI fails on `main`, and the GitHub Pages deploy job (which needs it) does not run. A project built fresh from `setup.sql` has no `creatinine_*` or `cholesterol_*` columns, so creatinine and cholesterol shares from the clearbook fail with an unknown-column error. | `supabase/setup.sql` (sections end at 0400); `supabase/migrations/20240101000600_records_creatinine_cholesterol.sql`; `.github/workflows/ci.yml` verify step; `apiPatient.ts` `insertPatientLabEntry` | product.md §3 "`supabase/setup.sql` is regenerated with `node scripts/build-setup-sql.mjs`" |
| SC-2 | Medium | **The auto-assign trigger can be overridden by the client.** It derives the owner only when the inserted `assigned_bhw_id` is NULL, and promotes the status only from 'unassigned'. Anon has INSERT on all columns, so a direct API call can set another BHW, 'completed', or 'assigned' with no owner, plus any `acknowledged_at`. The app's own insert sends 5 fields, so the app path is correct. | `shared_foundation.sql` `help_request_before_insert` ≈294-319, grants ≈246-249 | tech.md §4 auto-assignment |
| SC-3 | Medium | **`reset_demo_data()` is executable by anon.** Anyone holding the public key can wipe the non-seed rows during judging. The migration comment acknowledges this. | `shared_foundation.sql` ≈371 | tech.md §4 security-definer RPC (risk) |
| SC-4 | Medium | **Grants, not verifiable here.** The migrations GRANT but never REVOKE. Supabase default privileges usually give anon ALL on new public tables, and with `FOR ALL USING (true)` policies anon could then DELETE from bhws, patients, records, appointments, care_plans and help_requests. The comment "No DELETE grant" may not hold. To check, query `information_schema.role_table_grants`. | `20240101000100_care_hierarchy.sql` 106-109; `shared_foundation.sql` ≈246-249 | security.md / tech.md §2 anon-only access |
| SC-5 | Medium | **Realtime publication, not verifiable here.** No migration runs `ALTER PUBLICATION supabase_realtime ADD TABLE public.records`. On a fresh project the patient Realtime listener is silently inert. | grep over `supabase/` | tech.md §3 (OJ-5) |
| SC-6 | Low | `patients.received_at` and `records.received_at` are missing; `created_at DEFAULT now()` plays that role. Other tech.md names were kept as the existing columns: `bhws.status` instead of `is_active`; `address`, `latitude`, `longitude` instead of `address_label`, `lat`, `lng`. `records.source` stays the transport field, and the new `origin` holds field/patient/clinic. | `care_hierarchy.sql` 31, 46-50, 70-72; `shared_foundation.sql` ≈55-57 | tech.md §4 (conflict C5) |
| SC-7 | Low | BHW records are not on the id-keyed exactly-once path. `records.id` has a default, the upsert keys on `local_id`, and the read-back compares only patient_id, record_type and title (patients: full_name only). Different measurements under the same key would still be marked Synced. | `api.ts` `upsertRecordFromOffline`; `apiBhw.ts` `confirmRecordOnServer`, `confirmPatientOnServer` | tech.md §5 exactly-once and conflict |
| SC-8 | Low | Reset doesn't restore the 0600 lab columns on seed records, because the `ON CONFLICT` list predates them. Harmless today. | `supabase/seed.sql` ≈198-209 | tech.md §4 reset restores seed rows |
| SC-9 | Low | `apply_demo_seed()` exists only in `seed.sql`. A migrations-only deploy makes reset raise "Seed not loaded". | `shared_foundation.sql` ≈345-347 | tech.md §4 |
| SC-10 | Low | No `tests` table exists. `connection_test` was changed: it gained `is_seed` and the guard trigger, and reset deletes its non-seed rows. | `shared_foundation.sql` ≈106, ≈117, ≈355 | tech.md §4 "Keep the existing tests table and connection_test unchanged" (conflict C4) |
| SC-11 | Low | No `updated_at` triggers; `updated_at` relies on clients (`assignPatientToBHW` doesn't set it). The legacy record `d…03` duplicates appointment `f…01`, which is intentional. | `api.ts` ≈86-88; `seed.sql` legacy appointment record | tech.md §4 appointments |
| SC-12 | Low | Seed timestamps are relative to `now()`. Without a reset, Juana's +4-day follow-up becomes past, and Joel and Liza turn "inactive" by `last_active_at` (RH-2). | `seed.sql` 23-24 | product.md §7 deterministic reset |
| SC-13 | Low | The security-definer functions use `SET search_path = public` with no `pg_temp`. | `shared_foundation.sql` ≈334 | Postgres guidance for SECURITY DEFINER |
| SC-14 | Low | `contact_outcome` and `barrier` have no CHECK. The seed uses the legacy 'reached', which the app maps. | `seed.sql` records; `src/features/bhw/visitOptions.ts` ≈51-54 | product.md §5 vocabularies |
| SC-15 | Low | Migration names use 14-digit timestamps, not `NNNN_<description>.sql`. The hand-kept `apply_spec4.sql` and `apply_spec6_labs.sql` sit outside the generator (their contents match 0400 and 0600). The `apply_foundation.sql` header says "ONLY the Spec 01 changes" but it includes every migration from 0200 on. | `supabase/migrations/`; `scripts/build-setup-sql.mjs` 36-45 | structure.md naming (conflict C10) |

**Confirmed working:**
- All tech.md §4 tables and columns exist, under the existing names where they differ.
- CHECK constraints cover the dictionary values.
- Measurements are nullable with `> 0` and range checks, and glucose requires both a unit and a test type.
- `help_requests.id` has no default, so the client must generate it. All six reasons are present.
- `is_seed` is on every table, with a client guard trigger.
- Reset deletes children before parents and restores every seed row through upserts.
- On the app path, the trigger assigns Juana's request to Liza, and Ernesto (no BHW) stays unassigned.
- Fixed UUIDs are used, and `demo.ts` matches `seed.sql`.
- All product.md §7 personas and the 8 patient cases are present and expressed in data: Pedro has unknown attendance, Rosa missed, Lito is awaiting review, Marites has a transport barrier, Ernesto is unassigned, Lorna has no smartphone, and Nestor has no readings.

---

## 5. Per-role features

### 5a. Patient

| ID | Sev | Gap or violation | Evidence | Rule |
|---|---|---|---|---|
| PT-1 | High | **Past appointments vanish from Home.** `upcoming()` drops anything before today. A past confirmed appointment with unknown attendance, a missed one and a patient-reported one all disappear, and Home says "No next step scheduled yet". "I already attended" is offered only *before* the visit. Juana is the only selectable patient persona, so Pedro's unknown-attendance case can't be opened on the patient side. | `src/features/patient/logic/nextStep.ts` 17-36; `src/shared/config/demo.ts` personas | brief §3 next-step card ("I already attended"); brief §5 unknown vs missed; brief §9.2 #6 |
| PT-2 | High | **The clearbook has no document capture or upload.** That makes "retain the original" and "document-only storage" impossible, and there is no picker dependency. The stage copy "Add your paper report" implies an upload. | `components/ClearbookEntrySheet.tsx`; `package.json`; `logic/yakap.ts` ≈55 | brief §4 clearbook steps 1 and 4, "document-only storage remain available"; brief §3 "Upload original report"; product.md §4 |
| PT-3 | Medium | The YAKAP tracker is strictly linear. Every earlier stage reads "Done", including "Tests requested" for a patient who needed no tests. | `components/YakapTracker.tsx` ≈25 | brief §3 "The path branches" |
| PT-4 | Medium | There is no "choose / save this clinic" action; the card only expands. Stage 2 ("Clinic selected") has no patient action. | `components/ClinicCard.tsx` ≈68-80; `screens/PatientYakapScreen.tsx` | brief §3 stage table |
| PT-5 | Low | Developer-facing content on Home: "Patient profile not found. Run supabase/apply_foundation.sql…", and an "Add Test Record" button (see OJ-2). | `PatientHomeScreen.tsx` ≈70-72, ≈139 | brief §4 Home prioritizes action |
| PT-6 | Low | `requested` appointments show as "Appointment <date>"; the chip does say "Requested". | `src/shared/components/NextStepCard.tsx` ≈27-31; `components/UpcomingFollowUps.tsx` | brief §3 "Use due dates from confirmed appointments" |
| PT-7 | Low | The next-step "responsible person" is often blank. It shows a clinic only when the appointment's clinic is the patient's clinic, and `owner_bhw_id` is never used as a fallback. | `PatientHomeScreen.tsx` `clinicFor` | brief §3 card shows clinic or responsible person |
| PT-8 | Low | The clinic card lacks "available assistance". | `ClinicCard.tsx` ≈86-93 | brief §3 Care Finder fields |
| PT-9 | Low | The clearbook confirm step doesn't show the patient. | `ClearbookEntrySheet.tsx` ≈30-35 | brief §4 step 3 |
| PT-10 | Low | Profile issues: the care team lacks the clinic contact; the pull-to-refresh spinner never shows (`refreshing` is always false); there is no empty state when `patient` is null. | `screens/PatientProfileScreen.tsx` ≈29; `components/CareTeamCard.tsx` | product.md §4 care team; tech.md §7 states |
| PT-11 | Low | The YakapStepLine on Home ignores the computed "Clinic confirmed" label, so it can contradict the YAKAP tab. | `components/YakapStepLine.tsx`; `logic/yakap.ts` `stageLabel` | brief §3 |
| PT-12 | Low | Clearbook labelling: the "saved on this device only" footnote shows under entries that were already shared; the form's "Save" actually opens the confirm step; a failed share offers "Share now" rather than "Try again". | `components/ClearbookEntryList.tsx` ≈85; `ClearbookEntrySheet.tsx` ≈222-231 | brief §7.3 clear confirmation |
| PT-13 | Low | An "I need another date" request has no appointment reference; it is matched by time only. | `nextStep.ts` `findAnotherDateRequest` | brief §3 rescheduling |
| PT-14 | Low | Missing empty states and details: UpcomingFollowUps renders nothing when empty; the unknown-history "I need help" has no preset reason and no "arrange a checkup" option; My Health history doesn't show each reading's source. | `UpcomingFollowUps.tsx` ≈11; `PatientHomeScreen.tsx` ≈87-90; `components/MeasurementHistory.tsx` | tech.md §7; brief §3, §8 |
| PT-15 | Low | Route names differ from structure.md: `/patient/health` instead of `my-health`, an extra `/patient/profile`, and the help request is a sheet, not a modal route. They are kept because product.md §3 forbids renames. | `app/patient/` | structure.md (conflict C6) |

**Confirmed working:**
- Home order: next step, follow-up, dated measurements, review status. There is no score.
- Cache-then-network snapshot with LastUpdated.
- Each screen has loading, empty, offline and error states (Profile's empty state is weak, PT-10).
- Patient-reported attendance can't overwrite clinic-confirmed or missed, and the patient sees "Your clinic will still confirm it".
- "I need another date" creates an offline-capable help request and no duplicate appointment.
- Glucose keeps its unit and test type, and readings over 90 days are marked "Older reading".
- The care plan shows released plans only and is readable offline.
- "My YAKAP Checkup" shows all 8 stages, and "You are here" is not shown by colour alone.

### 5b. BHW

| ID | Sev | Gap or violation | Evidence | Rule |
|---|---|---|---|---|
| BH-1 | High | **Confirm attendance and reschedule never update `appointments`.** The outcome is written only to `records.contact_outcome`, and `apiBhw.ts` has no appointments write. Today hides the item client-side when any later record resolves it, matched per patient rather than per appointment. RHU metrics, Needs Attention and the patient tracker never see the confirmation, and "Rescheduled" records no new date. | `components/VisitForm.tsx` ≈76-83; `src/features/bhw/visitPayload.ts` ≈78-100; `today.ts` ≈65-115; `src/shared/services/apiBhw.ts` | product.md §4 "Confirm attendance: patient-reported vs clinic-confirmed"; tech.md §4 "Rescheduling updates the row" |
| BH-2 | High | **Patient-reported attendance removes the item from Today.** `OPEN_STATUSES` excludes `patient_reported_attended`, which then falls through to `continue; // attended`. The BHW is never prompted to get clinic confirmation. | `src/features/bhw/today.ts` ≈65, ≈108 | brief §5; product.md §6 keeps patient-reported and clinic-confirmed separate |
| BH-3 | Medium | There is no escalate/blocked action and no complete action. Acknowledged requests stay in Today indefinitely. | `today.ts` `helpRequestNextAction`; `useBHWData.ts` `TODAY_STATUSES` | brief §5 "Escalate a persistent operational blockage"; product.md §6 coordination |
| BH-4 | Medium | There is no "result follow-up" work item. Records are fetched by this BHW's `bhw_id`, so clinic or lab results logged under another `bhw_id` are invisible. | `today.ts` `TodayKind`; `api.ts` `fetchRecords` | brief §5 Today list |
| BH-5 | Medium | Today refreshes only on focus. There is no visible Refresh button, and pull-to-refresh on web is uncertain. The demo script says "pull down to refresh". | `src/shared/hooks/useAsyncData.ts` ≈50-54; `docs/demo-script.md` 82 | product.md §7 demo step 4 |
| BH-6 | Medium | Not verified: the Expo Go mock fallback relies on `require('@rnmapbox/maps')` throwing. If the JS loads but the native view is missing and a token is set, rendering could crash. There is no execution-environment check. | `src/shared/services/mapbox/MapNative.tsx` 10-25 | tech.md §2 "show the mock map, never crash" |
| BH-7 | Low | The Visit and Map screens don't render `fetchError`. A failed online fetch with no cache shows "Patient not found on this device" or "No patients to show" without saying why. | `screens/PatientVisitScreen.tsx` ≈80-95; `screens/BHWMapScreen.tsx` ≈78-108 | tech.md §7 error state |
| BH-8 | Low | Today items don't name their owner (it is implied, since this is the BHW's own list). | `components/TodayWorkItem.tsx` | brief §5 "Every work item has an owner" |
| BH-9 | Low | The VisitSummary date has no label, and `measured_at` is always the save time, so a visit can't be backdated. | `components/VisitSummary.tsx` ≈35; `visitPayload.ts` ≈97 | brief §8 label the kind of time |
| BH-10 | Low | The QR note doesn't say that the QR is not consent. There is no scanner (a stretch goal). | `components/PatientQrSheet.tsx` ≈16 | brief §5 QR rules |
| BH-11 | Low | Ana's inactive status isn't shown on AssignmentCard. | `components/AssignmentCard.tsx` | brief §6 staff absence |
| BH-12 | Low | Needs-review items keep Sync Now enabled and are re-sent on every run, which is harmless. The single-flight lock lives in the hook, not in `sync.ts`. | `useOfflineSync.ts` ≈11-38 | tech.md §5 single-flight |
| BH-13 | Low | Route names: Today is `/bhw`, and the visit is `/bhw/patients/visit?patientId=` instead of `patients/[id]/visit` (the documented static-route choice, so it gets precached). The map is its own tab. | `app/bhw/patients/_layout.tsx` 3-4 | structure.md (conflict C6) |
| BH-14 | Low | Today carries dev panels: OfflineTest with a second Sync Now, and ConnectionTest (see OJ-2). | `BHWDashboardScreen.tsx` ≈95-96 | brief §5 "Who needs help today?" |
| BH-15 | Low | Cached Today is stale after an RHU reassignment made while the BHW is offline. This is inherent to working offline; say it in the demo. | `useBHWData.ts` | brief §7.3 |

**Confirmed working:**
- Today is scoped to the BHW.
- Help requests show the patient, the reason, separate "Created on device" and "Received" lines, and one next action. They are deduped by id twice.
- Acknowledge is separate from "Received" and is idempotent.
- "Attendance not yet confirmed" and "Confirmed missed" are separate sections.
- A Visit saves measurements, outcome, barrier and next action together offline; blanks are stored as null.
- All 6 outcomes and 5 barriers are available, and medicine access needs no stock claim.
- Assisted registration works offline.
- Sync Now order is patients → records → tests, with idempotent upserts and read-back.
- The offline map follows tech.md §2.

### 5c. RHU (coordinator and clinician mode)

| ID | Sev | Gap or violation | Evidence | Rule |
|---|---|---|---|---|
| RH-1 | High | **The seeded transport barrier is invisible on Needs Attention.** Blocked requests count only after 7 days, and Marites's seeded request is 2 days old. The card therefore reads "No blocked barriers older than 7 days.", with a one-line count that is excluded from the total. Visit-level `records.barrier` values are never read. This hits demo step 1. | `src/features/admin/needsAttention.ts` 8, ≈111-114; `screens/NeedsAttentionScreen.tsx` ≈184-194; `seed.sql` help request `80…01` | product.md §4 "blocked barriers"; product.md §7 "unresolved transport barrier"; brief §6 counts and aging |
| RH-2 | Medium | BHW inactivity drifts. `last_active_at` is written only by the seed. About 2–3 days after a reset, Joel and Liza become "inactive" and drop out of the assign-owner list and the ownership numerator. The roster's "last activity" uses records instead, so the two signals can disagree. | `needsAttention.ts` 18-22; `useAdminData.ts` `computeActivity` | brief §6 staff absence |
| RH-3 | Medium | Selecting a metric doesn't lead to an action. There is a case list with "Next:" text, but no link to Assignments, Clinical Review or AssignSheet. | `screens/SummaryScreen.tsx` ≈60-80; `components/MetricCaseList.tsx` | brief §6 "Action after selecting it" |
| RH-4 | Medium | The BHWs screen lacks the shared states: no AdminDataStates, no LastUpdated or offline notice, and an error without retry. Create and Deactivate stay enabled offline and fail with a server error. | `screens/AdminBHWScreen.tsx` ≈16-31; `hooks/useBHWManagement.ts` | tech.md §7 loading, empty, offline, error |
| RH-5 | Low | The metric definitions are approximations: (1) "confirmed first checkup" is any `clinic_confirmed_attended`, or a later YAKAP stage; (2) the denominator is every appointment in the period, not only follow-ups; (3) it counts single records, not result sets. `COHORT_RULE` is a hard-coded sentence. | `src/features/admin/summaryMetrics.ts` ≈60-170 | brief §6 metric table |
| RH-6 | Low | Clinician framing: "Demo as Clinician" lands on Needs Attention, whose subtitle always says "RHU coordinator". The clinician can also run coordinator assign actions. | `NeedsAttentionScreen.tsx` ≈42 | brief §2 separate permission-based experiences |
| RH-7 | Low | Reset exists only on `/demo`. After it succeeds, `router.replace('/')` lands on `/login`, so the success notice is never seen. The demo script notes "The app leaves `/demo` when it finishes". | `src/shared/hooks/useDemoReset.ts` ≈62; `docs/demo-script.md` 23 | brief §7.4 visible Reset demo data |
| RH-8 | Low | Reassigning clears 'blocked' and 'acknowledged', so a blocked barrier leaves the Blocked queue without being resolved. `reassignPatient` is three separate, non-atomic writes. | `apiAdmin.ts` `assignHelpRequest`, `reassignPatient` | product.md §6 coordination meanings |
| RH-9 | Low | Needs Attention is not exceptions-only. It also shows the inbox, the field feed, a roster with per-BHW counts side by side (labelled "Not a ranking") and the dev ConnectionTest panel. | `NeedsAttentionScreen.tsx` ≈227-238; `components/BHWList.tsx` ≈28-31 | brief §6 "Start with Needs Attention"; no BHW ranking |
| RH-10 | Low | An extra "BHWs" tab sits between Assignments and Summary, and Create BHW lives there instead of on Assignments. The route names differ from structure.md. | `app/admin/_layout.tsx` ≈9-15 | product.md §4; structure.md (conflict C6) |
| RH-11 | Low | BHW status is text-only, and Deactivate has no ConfirmSheet and no offer to move the BHW's work. | `BHWList.tsx` | product.md §3 chips; tech.md §6 ConfirmSheet |
| RH-12 | Low | Lists are truncated silently: the inbox shows the latest 20 of up to 200, and metrics use up to 500 records and 200 requests. Nothing says "showing X of Y". | `DemoClinicInbox.tsx` ≈24; `useAdminData.ts` | brief §6 source freshness and unknowns |
| RH-13 | Low | The Clinical Review queue includes transcription-pending records, but Needs Attention excludes them. | `screens/ClinicalReviewScreen.tsx` ≈29-36; `needsAttention.ts` ≈104-107 | brief §4 |
| RH-14 | Low | Ana has no seeded patients or requests, so her "Reassign patients" button opens an empty list. | `seed.sql` | product.md §7 staff-absence case |

**Confirmed working:**
- Needs Attention shows unassigned requests, unassigned patients, reviews overdue past 3 days and inactive BHWs (Ana), with aging and one action each.
- Assignments covers patients and open help requests, and offline actions are disabled with a reason.
- The demo clinic inbox shows one row per id, separate created and received columns, the owner and the coordination chip.
- The field feed is tagged "Synced from field" and shows no values.
- Clinical Review is gated by clinician mode. Release goes through a ConfirmSheet with a client-generated plan id.
- DemoRoleContext persists the role, persona and clinician flag, and clinician mode resets when the role changes.
- Summary shows "18 of 30 (60%)" or "No cases", with period, cohort, unknowns and freshness. The follow-up breakdown reconciles to its total.
- QueueTable stacks into cards below 768 px.

---

## 6. Other tech.md / structure.md rules

| ID | Sev | Gap or violation | Evidence | Rule |
|---|---|---|---|---|
| TS-1 | High | **Lint fails (18 errors, 5 warnings), and CI doesn't run lint.**<br>- `react-hooks/refs`: SyncContext 32 (the root of OJ-1), usePatientSnapshot 166 (OJ-5), HelpRequestSheet 80, ClearbookEntrySheet 77, useClinics 39.<br>- `react-hooks/set-state-in-effect`: AssignSheet 38, CarePlanForm 48 and 55, HelpRequestSheet 85, useHelpRequests 32 and 43, AuthContext 36, DevComponentsScreen 40.<br>- `react-hooks/purity`: ClinicalReviewScreen 91, BHWDashboardScreen 37, BHWMapScreen 43.<br>- `react-hooks/use-memo`: useAsyncData 24.<br>- `react/no-unescaped-entities`: CarePlanForm 151.<br>- Warnings: unused `pathname` and `radius`, two `require()` imports, `exhaustive-deps` in HelpRequestSheet 87. | `npx expo lint`; `.github/workflows/ci.yml` | tech.md §7 "Run the typecheck and lint after each task" |
| TS-2 | Medium | There is no error boundary anywhere, and `app/_layout.tsx` exports none. Any render throw (SD-3, or the earlier Realtime `.on()` crash) white-screens the PWA, offline included. | grep `ErrorBoundary`; `app/_layout.tsx` | tech.md §7 error states |
| TS-3 | Medium | `AuthContext` is a 4th shared context, and it calls `supabase.auth` directly (see NN-1). | `src/shared/context/AuthContext.tsx` 3, 40-91; `AppProviders.tsx` 10 | tech.md §3 allowed contexts; tech.md §2 data layers |
| TS-4 | Medium | The deploy target doesn't match. tech.md says Vercel; CI deploys to GitHub Pages and falls back to placeholder env values. The SW and manifest use absolute `/` paths, which break under a `/<repo>/` project-site subpath; whether a custom domain is set was not verified. | `.github/workflows/ci.yml`; `vercel.json`; `public/manifest.json` | tech.md §1 deploy |
| TS-5 | Medium | A feature hook opens a Realtime channel on the Supabase client directly, bypassing `api.ts`. | `usePatientSnapshot.ts` 17, ≈99-136 | tech.md §2 "All remote reads… through api.ts" |
| TS-6 | Medium | **Contrast and text size**, computed from hex values, not measured:<br>- The Notice info tone, #1F6FD1 on #E8F1FC, is 4.33:1 at 13px, which fails AA. The TextField placeholder is 2.63:1.<br>- Body and safety text is below 16px: urgent-care text 14, OfflineBanner 14, ChipGroup reason chips 13, Notice 13, Button 15, tab labels 12. | `components/Notice.tsx` 22; `src/shared/theme.ts` info tokens; `components/TextField.tsx` 13; `ChipGroup.tsx` 38, 52; `HelpRequestSheet.tsx` urgent styles | tech.md §6 "Body text about 16px… Validate contrast" |
| TS-7 | Medium | Touch targets are below 44px. Button `compact` is 32 high (Clear synced, Activate/Deactivate, Reload, Add Test Record). The DemoQuickSwitchHeader links are about 28. TextField is 42. | `components/Button.tsx` 54; `DemoQuickSwitchHeader.tsx` styles; `TextField.tsx` 34 | tech.md §6 touch targets ≥ 44px |
| TS-8 | Medium | The legacy `formatDate` and `formatDateTime` are locale-dependent ("Oct 4, 2026"), and `formatDateTime` drops the year. They are still used on Profile, AppointmentList, RecordListItem and ConnectionTestPanel. | `src/shared/utils/date.ts` 1-14; `PatientProfileScreen.tsx` 36, 39; `components/AppointmentList.tsx` 16 | product.md §2 / brief §8 "04 Oct 2026" |
| TS-9 | Low | `api.ts` is not the single remote layer:<br>- `apiAdmin`, `apiBhw` and `apiPatient` are imported directly.<br>- `connectivity.ts` sends its own REST probe.<br>- `syncQueues.ts` is a third flushing module.<br>- AssignmentsScreen imports service constants.<br>- HelpRequestSheet calls `outbox` directly. | `src/shared/services/*`; `AssignmentsScreen.tsx` 14; `HelpRequestSheet.tsx` 20 | tech.md §2 data access layers |
| TS-10 | Low | `app/index.tsx` contains logic (role resolution, a spinner, styles), so it is not a thin shell. | `app/index.tsx` | tech.md §7 / structure.md route shells |
| TS-11 | Low | Hard-coded colours outside theme.ts:<br>- the shell background `#E9EFEC`;<br>- the `ROLE_META` colours;<br>- the map palettes;<br>- a backdrop `rgba` duplicated 5 times;<br>- `app.config.ts` web `themeColor` `#0E7C66` and `backgroundColor` `#F4F7F6`. | `DemoQuickSwitchHeader.tsx` ≈59; `RoleTabsLayout.tsx` ≈90; `config/demo.ts` 22-24; `app.config.ts` 31-32 | tech.md §6 tokens defined once |
| TS-12 | Low | `/dev/components` and `/_sitemap` ship in the production export. The gallery renders a working Logout. | export route list | brief §9 polish |
| TS-13 | Low | The folder structure deviates from structure.md:<br>- `types/<role>.types.ts` instead of `types.ts`, plus `logic/` folders and root-level feature files;<br>- extra `shared/` folders: config, hooks, screens, types, utils;<br>- extra service files;<br>- `useOwnerAssignFlow.tsx` is a `.tsx` hook;<br>- `MapNative.tsx` is not a `.native` file (safe today);<br>- `useOnlineStatus.ts` is dead code. | `src/features/*`; `src/shared/*` | structure.md layout and naming |
| TS-14 | Low | `apps/mobile/.gitignore` doesn't list `.env`. The root `.gitignore` covers it and the file is not tracked, so this breaks the rule in letter only. | `apps/mobile/.gitignore` 33-34; root `.gitignore` 69-71 | security.md "at both root and workspace levels" |
| TS-15 | Low | Env name drift: `apps/mobile/.env.example` and CI use `EXPO_PUBLIC_MAPBOX_TOKEN`, while the root example and the error text use `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`. `env.ts` accepts both. The root example keeps a `NEXT_PUBLIC_*` block. | `.env.example` files; `src/shared/config/env.ts` 7-10 | tech.md §2 env vars; architecture.md single workspace |
| TS-16 | Low | Open caret ranges on `@rnmapbox/maps`, `@supabase/supabase-js`, `mapbox-gl`, `react-native-web` and others. The lockfile plus `npm ci` mitigates this. | `package.json` | dependency pinning guidance |

**Confirmed working:**
- Screens never import `supabase`.
- `localStorage` appears only in StorageWeb, and `expo-sqlite` only in `StorageNative.native.ts`.
- NetInfo is used only in `connectivity.native.ts`.
- Only `EXPO_PUBLIC_*` variables are read, and a `service_role` or `sb_secret_` key is refused.
- No state library has been added.
- TypeScript is strict, with no `any`.
- `app.config.ts` is used, not `app.json`.
- 19 of 22 route files are thin shells.

---

## 7. Steering conflicts (named, not resolved)

product.md asks for conflicts to be named. Where the brief and product.md disagree, the brief wins. product, tech and structure win over architecture, expo and security.

| # | Conflict | What the code does |
|---|---|---|
| C1 | Brief §7.2 says "Do not label [other records] as sent or synchronized" and defers cloud sync. tech.md §5 and product.md §4 keep BHW Sync Now with "Synced". | Follows tech.md and adds a "Full cloud sync is deferred" footnote. Clearbook "Share now" also sends patient lab entries and labels them Synced. By precedence the brief wins, so this needs an explicit decision. |
| C2 | product.md §6 names the state "Send failed". tech.md §5 and brief §8.1 give the copy "Not sent yet. Try again." | Uses the copy. Consistent with brief §8.1, which lists both as status name and copy. |
| C3 | security.md says "RLS is DISABLED". product.md says "RLS stays permissive". | RLS is enabled with `USING (true)` policies. Anon access works either way. |
| C4 | tech.md §4 says "Keep `tests` and `connection_test` unchanged" and also "Every table gets `is_seed`". | `connection_test` gained `is_seed` and a trigger. No `tests` table exists. |
| C5 | tech.md §4 column names vs product.md §3 "do not rename". | The existing names are kept (`status`, `address`, `latitude`/`longitude`, `source`, `created_at`), and `origin` was added. |
| C6 | structure.md route names vs product.md §3 "keep the existing route paths". | Existing paths are kept, and new ones were added under them. |
| C7 | structure.md wants flat `storage.native.ts` and `mapbox.native.ts`. architecture.md wants `storage/` and `mapbox/` subfolders. | Uses subfolders behind `storage.ts` and `mapbox.ts` facades. |
| C8 | tech.md §1 says Vercel. | CI deploys to GitHub Pages, and `vercel.json` also exists (TS-4). |
| C9 | `apps/mobile/AGENTS.md` says routes live in `src/app/`. structure.md says `app/`. | Uses `app/`. |
| C10 | structure.md wants `NNNN_<description>.sql`. | Uses Supabase CLI 14-digit timestamps. |
