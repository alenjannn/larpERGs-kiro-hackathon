# Tasks: 01-shared-foundation

Run the tasks in order. After every task that touches `apps/mobile`, run `npm run typecheck` in `apps/mobile` (C17: no lint). Temporary verification files go outside the repository and are deleted afterwards.

## Database

- [x] 1. Write the schema migration `supabase/migrations/20240101000200_shared_foundation.sql`
  - Create the `clinics` table. Add the missing columns to `admins`, `bhws`, `patients` and `records` with `ADD COLUMN IF NOT EXISTS` and no inline constraints. Add `is_seed` to all 9 tables. Mark the `connection_test` system rows as seed rows.
  - Create the `appointments`, `care_plans` and `help_requests` tables. `help_requests.id` has no default.
  - Add the named CHECK and FK constraints with DROP IF EXISTS + ADD. Widen `records_record_type_check`.
  - Add the indexes. Enable RLS and add the "Hackathon demo access" policies. Grant SELECT on `clinics` and SELECT/INSERT/UPDATE on the other three new tables. No DELETE grants.
  - Add `guard_is_seed()` with `tg_10_guard_is_seed` on all 9 tables, and `help_request_before_insert()` with `tg_20_help_request_assign`.
  - Add `reset_demo_data(center_lat, center_lng)` as `security definer` with a fixed `search_path`, the revoke/grant pair and the steps in design Â§2.3. End with `NOTIFY pgrst`.
  - _Requirements: 1, 2, 3, 4.1â€“4.5, 23.6_

- [x] 2. Rewrite `supabase/seed.sql` as `apply_demo_seed(center_lat, center_lng)` plus one call
  - Anchor times to `t0` and `d0`. Upsert with `ON CONFLICT (id) DO UPDATE` on every column, setting `is_seed = true`, parents before children.
  - Seed the data in design Â§2.4: admins (2), BHWs (3), clinics (3), patients (8), records (12), appointments (5), the care plan (1) and help requests (2). Every name ends in "(DEMO)". Every patient location is an offset of at most Â±0.01Â° from the centre and is labelled "approximate DEMO location".
  - Revoke EXECUTE from PUBLIC, `anon` and `authenticated`, skipping the role revokes when those roles don't exist (plain Postgres).
  - _Requirements: 4.4, 4.6, 7, 8.3â€“8.5, 9_

- [x] 3. Generate `setup.sql` and `apply_foundation.sql`
  - Extend `scripts/build-setup-sql.mjs` to also write `supabase/apply_foundation.sql`. It contains the migrations named `>= 20240101000200`, then the seed, with a header saying it is generated and which migrations it assumes are already applied. Normalise line endings to LF.
  - Run `node scripts/build-setup-sql.mjs`.
  - _Requirements: 5.1, 6.1, 6.5_

- [x] 4. Verify the SQL on a temporary Postgres (PGlite in a temp folder outside the repo)
  - Create the `anon` and `authenticated` roles. Run `setup.sql` twice on an empty database.
  - Build a second database from `git show HEAD:` copies of the two original migrations and the old seed. Run `apply_foundation.sql` twice. Assert that the personas were renamed, the row counts didn't change on the second run and no non-seed rows were deleted.
  - Assert the seed rules: 8 patients, Juana's BP readings fall in 3 distinct months, Nestor has 0 records, every name ends in "(DEMO)", every offset is â‰¤ 0.01, and one clinic is 'unknown' with a 2024 `last_verified_at`.
  - As `anon`, check the triggers:
    - A help request for Juana is assigned to Liza, and its `received_at` is the server time.
    - A help request for Ernesto stays 'unassigned'.
    - Inserting the same id again with `ON CONFLICT DO NOTHING` leaves 1 row.
    - `is_seed = true` from a client is stored as false.
    - DELETE is denied.
  - Edit a seed row, add non-seed rows, then call `reset_demo_data(10, 123)`. Assert that the seed rows are restored, the non-seed rows are gone and the patients sit within 0.01Â° of (10, 123). Also assert that a bad centre raises an error and rolls back.
  - Fix any failures, regenerate (task 3), re-run, then delete the temp folder. If PGlite can't run, say so and give the manual SQL Editor steps instead.
  - _Requirements: 3, 4, 5.2â€“5.3, 6.2â€“6.4, 7, 8.3, 9, 23.4_

## Client foundations

- [x] 5. Add the dependency and the env config
  - Run `npx expo install @react-native-community/netinfo` in `apps/mobile`.
  - In `env.ts`, parse `EXPO_PUBLIC_DEMO_MAP_CENTER` into `demoMapCenter` and `demoMapCenterWarning`, with the default centre. Add the variable to `apps/mobile/.env.example`.
  - In `mapbox/config.ts`, add `DEMO_MAP_CENTER` and place `MOCK_FACILITY` at it. Make it the default centre in `MapWeb` and `MapNative`, and show it in the `BHWMapScreen` legend.
  - _Requirements: 8.1, 8.2, 8.6, 8.7, 18.3_

- [x] 6. Update the theme, dates, formatting and types
  - `theme.ts`: set the brief's values. Keep the old token names, making `warning`/`danger` aliases of `pending`/`error`. Add the tints, `offlineBg`/`offlineText`, and the `type` and `touch` tokens.
  - `date.ts`: add `formatDateDMY` and `formatDateTimeDMY`. Leave `formatDate` unchanged.
  - `format.ts`: add `formatCountOfTotal`, `formatMeasurement`, `formatBPValue` and `recordTypeLabel`.
  - `db.types.ts`: add `AnyRecordType`, the new columns as optional fields, and the `Clinic`, `Appointment`, `CarePlan` and `HelpRequest` types. Switch `RecordListItem` to `recordTypeLabel()`.
  - In `demo.ts`, add `DEMO_CLINICIAN_ID` and `DEMO_PERSONAS`.
  - Check the helpers and the contrast ratios with a temporary `tsx` script, then delete it.
  - _Requirements: 7.10, 11, 13.1, 13.4, 14, 22_

- [x] 7. Write the status dictionary and the Icon component
  - `src/shared/status.ts`: the four groups from design Â§3.5, each with EN/FIL labels, an icon and a tone. Every FIL label gets a "needs native-speaker review" comment. Add the `StatusKey` template type, `getStatus`, `legacyQueueStatusKeys`, `outboxStatusKeys` and `queueStatusText`.
  - `src/shared/components/Icon.tsx`: Unicode glyphs, hidden from screen readers.
  - _Requirements: 12.1â€“12.7, 12.9, 15.9_

- [x] 8. Extend storage with namespaced keys and the reset clear
  - Add `getItem`, `setItem`, `removeItem` and `clearDemoData` to `LocalStorage`, and implement them in `StorageWeb`, `StorageNative.native` (new `kv_v1` table; clear in one transaction) and the stub.
  - On web, `setItem` throws when storage is unavailable or full; it doesn't fall back to memory. `clearDemoData` removes only `tuloy:v1:*`, `tuloy_cache:*` and `tuloy_offline_records`.
  - Add `resetDemoData(center)` to `api.ts`.
  - _Requirements: 10.1, 10.5, 10.11, 17.2_

- [x] 9. Add the contexts and mount them
  - `services/connectivity.ts` (web) and `connectivity.native.ts` (NetInfo).
  - `ConnectivityContext`: `isOnline`, a persisted `lastOnlineAt`, `onReconnect` and `resetHistory`.
  - `DemoRoleContext`: persisted to `tuloy:v1:demo_role` and validated on restore. Clinician mode is admin-only. Add `resetRole`.
  - `services/syncQueues.ts`: the queue registry, a single-flight `flushAll` and a counts-only adapter for the legacy BHW queue. `SyncContext` exposes `counts`, `isFlushing`, `flush` and `refreshCounts`, with no automatic triggers.
  - `AppProviders`, mounted in `app/_layout.tsx`.
  - _Requirements: 17, 18, 19_

## Shared UI

- [x] 10. Build the status and data components
  - `StatusChip` and `StatusChipRow`, `MeasurementCard`, `MetricTile`, `LastUpdated`, `EmptyState`.
  - _Requirements: 12.1, 13, 14, 15.1, 15.3, 15.8_

- [x] 11. Build the interaction components
  - `OfflineBanner`: navy, with the exact copy, and hidden while `isOnline` is null.
  - `NextStepCard`.
  - `ConfirmSheet`: closes on Cancel, backdrop, Android back and Escape; moves focus into the sheet when it opens; has a destructive variant and a busy state.
  - _Requirements: 15.1, 15.2, 15.4, 15.7, 15.8_

- [x] 12. Add `RoleHeader` and wire it into the role layouts
  - Add the optional `onSwitch` prop to `DemoQuickSwitchHeader`.
  - `RoleHeader`: persists the role, syncs from the route (the route's role wins), and shows the clinician-mode switch with "Simulated role â€” no real authentication".
  - Make `RoleTabsLayout` render `RoleHeader`.
  - _Requirements: 15.5, 15.6, 15.10, 17.5, 17.6_

- [x] 13. Build the component gallery at `/dev/components`
  - `app/dev/components.tsx` as a thin route shell. `DevComponentsScreen` shows every component and every status (EN and FIL), a null `MeasurementCard`, a 0/0 `MetricTile`, a forced-visible offline banner and a working `ConfirmSheet`. On native it shows a "web only" message.
  - No links to it anywhere.
  - _Requirements: 16_

## Launcher, reset and Sync copy

- [x] 14. Update the launcher and add Reset demo data
  - `useDemoReset`: call the RPC, then clear local storage, then reset the role, connectivity history and counts. Handle the error branches in design Â§3.4.
  - `DemoLauncherScreen`:
    - Cards in order: Admin, Clinician, BHW, Patient, with the product.md personas. Each card calls `selectRole` before navigating.
    - The "Simulated role â€” no real authentication" label.
    - "Reset demo data" opens the `ConfirmSheet`, then shows progress and a "Demo data reset" or error notice.
    - Show the demo-centre warning when the env value is invalid.
  - _Requirements: 10, 20_

- [x] 15. Update the BHW Sync copy and status chips (no logic changes)
  - `SyncResultNotice`: "Sent to demo server Â· N record(s)." and the other messages in design Â§3.9.
  - `BHWSyncScreen`: new subtitle, plus a footnote that full cloud sync is deferred.
  - `SyncStatus`: replace the text badges with `StatusChipRow` using `legacyQueueStatusKeys`. The synced chip stays "Synced".
  - Confirm with `git diff` that `sync.ts` and `useOfflineSync.ts` are unchanged.
  - _Requirements: 12.7, 12.8, 21_

## Verification

- [x] 16. Run the final checks
  - `npm run typecheck`.
  - `npx expo export --platform web --output-dir <temp>`. Grep for `expo-sqlite`, `@rnmapbox` and `RNCNetInfo`; expect none. Confirm `dev/components.html` exists. Delete the temp folder.
  - Re-run the task 4 SQL checks against the final generated files.
  - Check every requirement in `requirements.md` and list any that weren't verified (native NetInfo and SQLite on a device, screen readers).
  - _Requirements: 23_

- [ ] 17. Manual browser check (presenter), using `npx expo start --web` or `npx serve dist`
  - Automated already (headless Chrome against the static export): steps 1–4, step 5.1, steps 6 and 8, step 9, and step 7 with the RPC mocked. **Still to do by hand** after applying `supabase/apply_foundation.sql`: step 5.2 (live Sync Now copy) and step 7 against the real database.
  1. **Launcher.** It shows 4 cards in order with the DEMO personas, plus the "Simulated role" label.
  2. **Clinician card.** It opens `/admin` with clinician mode on and the label in the header. After a reload, the role and clinician mode are restored.
  3. **Role switch.** Switch to BHW in the header, then open `/patient` by URL. The header highlights Patient.
  4. **Offline banner.** Turn DevTools Offline on: the navy banner appears with the exact copy (check on `/dev/components` and on any screen that renders it). Turn it off: the banner hides.
  5. **BHW Sync.**
     1. While offline, save an offline test record. Its chips read "Saved on this device â†’ Waiting to send".
     2. Go back online and tap Sync Now. The notice reads "Sent to demo server Â· 1 record." and the chip reads "Synced".
  6. **Reset, cancel.** Tap Reset demo data, then Cancel. Nothing changes.
  7. **Reset, success.** Tap Reset demo data, then confirm. "Demo data reset" appears. The Sync queue is empty, Juana's data is restored, and the record from step 5 is gone from the Admin feed. In DevTools â†’ Application, no `tuloy_*` keys remain and other keys are untouched.
  8. **Reset, error.** Go offline and confirm Reset. An error appears, the local queue is untouched, and "Demo data reset" is not shown.
  9. **Gallery.** On `/dev/components`, every status shows an icon and text. A null measurement shows "No reading" and a 0/0 metric shows "No cases".
  - _Requirements: 10, 12, 13, 14, 15, 16, 17, 18, 20, 21_
