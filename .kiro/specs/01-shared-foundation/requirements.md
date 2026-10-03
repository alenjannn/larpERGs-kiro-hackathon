# Requirements: 01-shared-foundation

## Introduction

Spec 1 builds the shared foundation that the Patient, BHW and RHU (admin) workspaces depend on:
- the missing schema, the help-request auto-assign trigger and the `reset_demo_data()` RPC,
- deterministic DEMO seed data,
- design tokens and the shared status dictionary,
- the shared components from tech.md §6, with a gallery at `/dev/components`,
- the `DemoRoleContext`, `ConnectivityContext` and `SyncContext` providers,
- the updated Demo Quick-Switch Launcher with Reset demo data,
- `supabase/apply_foundation.sql` for existing databases.

**Source of truth:** `docs/audit.md` gives the real table, column, file and route names. Precedence: brief > product.md / tech.md / structure.md > architecture.md / expo.md / security.md > README and older docs.

**Changes are additive.** No existing table, column, route, service or migration file is renamed or removed. Existing files are modified only where a requirement says so.

### Conflict decisions applied

| # | Decision |
|---|---|
| C1 | BHW Sync Now keeps its current behavior. Only its success copy changes, to "Sent to demo server". It is not extended to new record types or automatic triggers. |
| C2 | "tests" means the existing `connection_test` table. It is not renamed. |
| C3 | RLS stays **enabled** with permissive hackathon policies, matching the existing migrations. |
| C4 | New migrations use the existing timestamp naming (`20240101000200_<description>.sql`, …), not `NNNN_` names. |
| C8 | Existing column names are kept (`latitude`/`longitude`, `address`, `bhws.status`, `created_at`). Only truly missing columns are added. |
| C9 | `records.source` keeps its meaning ('online' \| 'offline_sync'). A new `records.origin` column holds 'field' \| 'patient' \| 'clinic'. |
| C10 | The `records.record_type` CHECK is widened to the union of the old and new values. Appointments go into the new `appointments` table from now on. Legacy `record_type='appointment'` rows stay. |
| C11 | Reset demo data clears `tuloy:v1:*` **and** the legacy `tuloy_offline_records` and `tuloy_cache:*` keys (and the equivalent native SQLite rows). |
| C12 | The existing BHW queue keeps its `sync_status` values ('pending' \| 'synced' \| 'failed'). They are mapped to dictionary labels in the UI only. |
| C13 | Theme values change to the brief palette. Old token names stay as aliases. |
| C14 | Seed personas are renamed to product.md §7 names on the **same fixed IDs**. |
| C17 | Verification is typecheck only. No lint config is added in this spec. |

### Out of scope (later specs)

- The help-request outbox, read-back, conflict detection and automatic flush triggers (Spec 02).
- The service worker, web manifest and offline reopen (Spec 02).
- Patient snapshot caching, the help-request UI and role screens (Specs 02–05).
- Fixing the silent localStorage fallback in the existing `StorageWeb.write()` (Spec 02). New code added in this spec must not repeat it.

### Glossary

- **Seed row:** a row with `is_seed = true`, created by the seed and restored by Reset demo data.
- **Demo centre:** the single map point that all synthetic patient coordinates are offset from.
- **Legacy local keys:** `tuloy_offline_records` and `tuloy_cache:*` on web; the `local_sync_queue` and `kv_cache` tables in `tuloy_offline.db` on native.

---

## Requirement 1: Additive schema migration

**User story:** As a backend developer, I want the missing columns added without renaming anything so that the existing app and BHW Sync Now keep working.

#### Acceptance criteria

1. THE SYSTEM SHALL add schema changes only in new files under `supabase/migrations/` named with the existing timestamp scheme, sorting after `20240101000100_care_hierarchy.sql`.
2. THE SYSTEM SHALL NOT modify `20240101000000_connection_test.sql` or `20240101000100_care_hierarchy.sql`.
3. THE SYSTEM SHALL add only missing columns, using `ADD COLUMN IF NOT EXISTS`:
   - `admins`: `admin_role` ('coordinator' \| 'clinician', default 'coordinator'), `municipality`, `is_demo`.
   - `bhws`: `last_active_at`.
   - `patients`: `phone`, `has_smartphone`, `yakap_stage`, `clinic_id` → `clinics.id`, `sharing_consent`, `created_on_device_at`, `updated_at`.
   - `records`: `measured_at`, `glucose_value`, `glucose_unit`, `glucose_test_type`, `height_cm`, `contact_outcome`, `barrier`, `next_action`, `origin`, `transcription_status`, `review_status`, `created_on_device_at`.
4. THE SYSTEM SHALL keep every new measurement column nullable, so that a missing value is stored as null and never as 0.
5. WHEN the `records.record_type` CHECK is replaced THE SYSTEM SHALL allow every existing value ('visit', 'health_update', 'appointment') plus 'vitals', 'lab_result' and 'note'.
6. THE SYSTEM SHALL NOT change the meaning, type or CHECK of `records.source`.
7. WHERE a new column holds a status from the dictionary THE SYSTEM SHALL constrain it with a CHECK listing only dictionary values.
8. WHERE a new column stores a glucose result THE SYSTEM SHALL constrain the unit to 'mg/dL' or 'mmol/L' and the test type to a fixed list.
9. THE SYSTEM SHALL enable RLS on every new table and add a permissive policy named "Hackathon demo access", matching the existing style.
10. THE SYSTEM SHALL grant `anon` and `authenticated` no DELETE privilege on any table.
11. WHEN the migration has run THE SYSTEM SHALL ask PostgREST to reload its schema.

## Requirement 2: New tables

**User story:** As a role-team developer, I want clinics, appointments, care plans and help requests in the database so that later specs can build the care pathway and the demo clinic inbox.

#### Acceptance criteria

1. THE SYSTEM SHALL create `clinics` with name, address, contact, services (text array), `yakap_accreditation` ('listed' \| 'unknown', default 'unknown'), source and `last_verified_at` (date). Clients get SELECT only.
2. THE SYSTEM SHALL create `appointments` with `patient_id`, `clinic_id`, purpose, `scheduled_at`, `encounter_status` (encounter dictionary values, default 'requested'), `owner_bhw_id` and `updated_at`. Clients get SELECT, INSERT and UPDATE.
3. THE SYSTEM SHALL create `care_plans` with `patient_id`, `clinician_admin_id` → `admins.id`, summary, `next_steps`, status ('draft' \| 'released', default 'draft') and `released_at`. Clients get SELECT, INSERT and UPDATE.
4. IF a care plan has status 'released' THEN THE SYSTEM SHALL require `released_at` to be set.
5. THE SYSTEM SHALL create `help_requests` whose `id` primary key has **no server default**, so that the client-generated UUID is the idempotency key.
6. THE SYSTEM SHALL require each help request to have a `patient_id`, a `reason` from: transport, need another date, lab access, document help, medicine access, other, and a `created_on_device_at`. The `message` is optional and short.
7. THE SYSTEM SHALL give each help request `received_at default now()`, `assigned_bhw_id`, `coordination_status` (coordination dictionary values, default 'unassigned') and `acknowledged_at`. Clients get SELECT, INSERT and UPDATE.
8. WHEN a referenced clinic, BHW or admin row is deleted THE SYSTEM SHALL set the referencing column to null. WHEN a patient is deleted THE SYSTEM SHALL delete that patient's appointments, care plans and help requests.

## Requirement 3: Help-request auto-assignment

**User story:** As a BHW, I want a patient's help request to land in my queue automatically so that nobody has to forward it by hand.

#### Acceptance criteria

1. WHEN a help request is inserted for a patient who has a `bhw_id` THE SYSTEM SHALL set `assigned_bhw_id` to that BHW and `coordination_status` to 'assigned'.
2. IF the patient has no `bhw_id` THEN THE SYSTEM SHALL leave the request 'unassigned' with a null `assigned_bhw_id`.
3. IF an insert already provides `assigned_bhw_id` THEN THE SYSTEM SHALL keep the provided values.
4. WHEN a non-seed help request is inserted THE SYSTEM SHALL set `received_at` to the server time, ignoring any client value.
5. WHEN the same help request `id` is inserted again with `ON CONFLICT DO NOTHING` THE SYSTEM SHALL keep exactly one row.

## Requirement 4: Seed flag and reset RPC

**User story:** As a demo presenter, I want the database to return to the same state on demand so that every run starts identically.

#### Acceptance criteria

1. THE SYSTEM SHALL add `is_seed boolean NOT NULL DEFAULT false` to every table, including `connection_test`.
2. THE SYSTEM SHALL provide `reset_demo_data()` as a `security definer` function with a fixed `search_path`, executable by `anon` and `authenticated`.
3. WHEN `reset_demo_data()` runs THE SYSTEM SHALL delete every row with `is_seed = false` from every table, children before parents, in one transaction.
4. WHEN `reset_demo_data()` runs THE SYSTEM SHALL restore every seed row to its seed values, including rows that were edited or deleted since the last seed.
5. IF any step of the reset fails THEN THE SYSTEM SHALL roll back the whole reset.
6. THE SYSTEM SHALL keep seed timestamps anchored to the time of the seed or reset, so that every run shows the same relative timeline (for example "follow-up in 4 days").

## Requirement 5: Regenerated setup.sql

**User story:** As a new teammate, I want one `setup.sql` that creates the whole backend so that I can set up a fresh project in one paste.

#### Acceptance criteria

1. WHEN the migrations or `seed.sql` change THE SYSTEM SHALL regenerate `supabase/setup.sql` with `node scripts/build-setup-sql.mjs`, without hand edits.
2. WHEN `setup.sql` is run on an empty database THE SYSTEM SHALL create all tables, the trigger, the RPC and the seed without errors.
3. WHEN `setup.sql` is run a second time THE SYSTEM SHALL complete without errors and without duplicating rows.

## Requirement 6: apply_foundation.sql for existing databases

**User story:** As a team member with an existing Supabase project, I want one script that applies only the new changes and seed so that I do not have to rebuild my database.

#### Acceptance criteria

1. THE SYSTEM SHALL provide `supabase/apply_foundation.sql` that contains only the Spec 1 migration(s) and the new seed, and can be pasted into the Supabase SQL Editor.
2. WHEN it is run on a database that already has the two original migrations and the old seed THE SYSTEM SHALL add the new schema and update the existing seed rows (same IDs) to the new personas.
3. WHEN it is run twice THE SYSTEM SHALL complete without errors and leave the same data as after the first run.
4. THE SYSTEM SHALL NOT delete non-seed rows when `apply_foundation.sql` runs. Only Reset demo data deletes them.
5. THE SYSTEM SHALL keep `apply_foundation.sql` in step with the migration and seed sources, generated by a script rather than edited by hand.

## Requirement 7: Seed personas

**User story:** As a demo presenter, I want the personas from product.md §7 with fixed IDs so that the scripted demo always shows the same people.

#### Acceptance criteria

1. THE SYSTEM SHALL seed every person, clinic and organisation with a name that ends in "(DEMO)".
2. THE SYSTEM SHALL keep the existing fixed IDs: `a…01` Carmen Reyes (DEMO) as coordinator, `b…01` Liza Mendoza (DEMO), `b…02` Joel Bautista (DEMO), `b…03` Ana Villanueva (DEMO), `c…01` Juana Dela Cruz (DEMO).
3. THE SYSTEM SHALL add Dr. Ramon Santos (DEMO) as `a…02` with `admin_role = 'clinician'`.
4. THE SYSTEM SHALL seed Liza and Joel as active and Ana as inactive, with Ana's `last_active_at` 5 days before the seed time.
5. THE SYSTEM SHALL seed Juana assigned to Liza, with a confirmed upcoming follow-up appointment and a released care plan from Dr. Ramon Santos (DEMO).
6. THE SYSTEM SHALL seed seven more patients, one per case: unknown attendance, confirmed missed follow-up, result awaiting clinical review, unresolved transport barrier, unassigned (`bhw_id` null), no smartphone (assisted), and newly onboarded with no measurements.
7. THE SYSTEM SHALL seed 3 synthetic clinics. One SHALL have `yakap_accreditation = 'unknown'` and a `last_verified_at` more than a year old.
8. THE SYSTEM SHALL seed at least one help request that stays 'unassigned' (for the unassigned patient) and none for Juana, so that her live demo request is the only new BHW item.
9. THE SYSTEM SHALL use only synthetic phone numbers and `@tuloy.test` emails, and no real names, addresses or phone numbers.
10. THE SYSTEM SHALL keep the persona IDs in `src/shared/config/demo.ts` equal to the seed IDs, adding the clinician ID.

## Requirement 8: Synthetic map coordinates

**User story:** As a BHW-team developer, I want patient map points generated around one configurable centre so that the map works anywhere without exposing real households.

#### Acceptance criteria

1. THE SYSTEM SHALL read the demo centre from `EXPO_PUBLIC_DEMO_MAP_CENTER` as "lat,lng".
2. IF `EXPO_PUBLIC_DEMO_MAP_CENTER` is missing or invalid THEN THE SYSTEM SHALL use a default fictional barangay centre and SHALL NOT crash.
3. THE SYSTEM SHALL place every seeded patient at a fixed offset of at most ±0.01° latitude and longitude from the demo centre.
4. WHEN Reset demo data runs THE SYSTEM SHALL place seeded patients around the demo centre configured in the app that called the reset.
5. THE SYSTEM SHALL label every seeded patient location "approximate DEMO location" and SHALL NOT use real household addresses.
6. THE SYSTEM SHALL use the demo centre as the default map centre and the demo facility position.
7. THE SYSTEM SHALL document `EXPO_PUBLIC_DEMO_MAP_CENTER` in `apps/mobile/.env.example`.

## Requirement 9: Seed records

**User story:** As a patient-team developer, I want realistic dated readings so that My Health can show trends, units and missing data honestly.

#### Acceptance criteria

1. THE SYSTEM SHALL seed at least 3 blood-pressure readings for Juana, each with a `measured_at` in a different calendar month across about 3 months.
2. THE SYSTEM SHALL seed at least one glucose result with `glucose_value`, `glucose_unit` and `glucose_test_type` all set, and `review_status = 'awaiting_clinical_review'`.
3. THE SYSTEM SHALL seed one patient with no records at all.
4. THE SYSTEM SHALL leave unmeasured fields null in every seeded record and never use 0 as a placeholder.
5. THE SYSTEM SHALL set `origin` on every seeded record and `title`, which is NOT NULL, on every seeded record.

## Requirement 10: Reset demo data

**User story:** As a demo presenter, I want to reset demo data so that every run starts identically.

#### Acceptance criteria

1. WHEN Reset demo data is confirmed THE SYSTEM SHALL restore all seed rows, delete non-seed rows and clear local tuloy:v1:* storage.
2. WHEN the reset finishes THE SYSTEM SHALL return to the launcher showing "Demo data reset".
3. WHEN the presenter taps "Reset demo data" THE SYSTEM SHALL open a `ConfirmSheet` that explains what will be deleted, with Cancel and a destructive confirm action, before doing anything.
4. IF the presenter cancels THEN THE SYSTEM SHALL change nothing.
5. WHEN Reset demo data is confirmed THE SYSTEM SHALL also clear the legacy local keys (`tuloy_offline_records`, `tuloy_cache:*`) on web and the equivalent `local_sync_queue` and `kv_cache` rows on native.
6. THE SYSTEM SHALL clear local storage only after the RPC succeeds.
7. IF the RPC fails or Supabase is not configured THEN THE SYSTEM SHALL show the error, keep all local data, and SHALL NOT show "Demo data reset".
8. IF clearing local storage fails after the RPC succeeded THEN THE SYSTEM SHALL show a visible error that names what was not cleared.
9. WHILE the reset is running THE SYSTEM SHALL disable the button and show progress.
10. WHEN the reset finishes THE SYSTEM SHALL reset the in-memory role, connectivity history and queue counts to their initial values.
11. THE SYSTEM SHALL clear only keys with these prefixes and SHALL NOT clear other localStorage keys on the same origin.

## Requirement 11: Design tokens

**User story:** As a UI developer, I want one set of tokens so that all three workspaces look like one product.

#### Acceptance criteria

1. THE SYSTEM SHALL define these values in `src/shared/theme.ts`: primary #0F766E, text #16324F, bg #F8FAFC, surface #FFFFFF, muted #475569, pending #B45309, error #B91C1C, success #166534.
2. THE SYSTEM SHALL keep every existing token name. `warning` SHALL alias `pending` and `danger` SHALL alias `error`.
3. THE SYSTEM SHALL define typography tokens with body text of about 16px and a minimum touch target of 44px.
4. THE SYSTEM SHALL keep tint backgrounds so that each status colour meets WCAG AA contrast (4.5:1) for chip text on its background. Contrast is checked by calculation; full accessibility validation needs manual testing.

## Requirement 12: Status dictionary

**User story:** As any user, I want statuses to be unambiguous so that "saved", "received" and "reviewed" are never confused.

#### Acceptance criteria

1. WHERE a status is displayed THE SYSTEM SHALL render text and an icon from status.ts, never colour alone.
2. THE SYSTEM SHALL define four separate groups in `src/shared/status.ts`:
   - Transport: saved on this device, waiting to send, sending, received in demo clinic inbox, synced (BHW field records), send failed, needs review (conflict).
   - Encounter: requested, confirmed, patient-reported attended, clinic-confirmed attended, missed, rescheduled.
   - Clinical: transcription pending, awaiting clinical review, plan released.
   - Coordination: unassigned, assigned, acknowledged, blocked, completed.
3. THE SYSTEM SHALL give every status an English label, a Filipino label, an icon name and a colour token.
4. THE SYSTEM SHALL mark every Filipino label "needs native-speaker review" in code.
5. THE SYSTEM SHALL NOT define a generic "complete" status shared across groups.
6. THE SYSTEM SHALL use these transport labels: pending → "Saved on this device · Waiting to send", sending → "Sending…", synced → "Received in demo clinic inbox" (help requests) or "Synced" (BHW records), failed → "Not sent yet. Try again.", conflict → "Needs review".
7. THE SYSTEM SHALL map the existing BHW queue values ('pending', 'failed', 'synced') to dictionary entries without changing the stored values.
8. WHEN the BHW Sync tab lists queue items THE SYSTEM SHALL show each item's status with `StatusChip` instead of the current text-only badge.
9. THE SYSTEM SHALL type status keys so that an unknown key is a compile error.

## Requirement 13: Missing readings

**User story:** As a patient, I want missing readings to look missing so that I am not misled.

#### Acceptance criteria

1. IF a measurement value is null THEN THE SYSTEM SHALL display "No reading" and SHALL NOT display 0.
2. WHEN a measurement is present THE SYSTEM SHALL show the value, its unit and its measured date as "04 Oct 2026".
3. IF a measurement has no `measured_at` THEN THE SYSTEM SHALL show "Date not recorded".
4. IF a blood-pressure reading is missing either the systolic or the diastolic value THEN THE SYSTEM SHALL display "No reading".
5. WHERE a patient has no measurements at all THE SYSTEM SHALL show an `EmptyState` with "No readings yet".

## Requirement 14: Metric counts

**User story:** As a metric reader, I want counts with percentages so that small numbers are not misleading.

#### Acceptance criteria

1. WHEN a metric denominator is 0 THE SYSTEM SHALL display "No cases".
2. OTHERWISE THE SYSTEM SHALL display "<n> of <d> (<p>%)".
3. THE SYSTEM SHALL round the percentage to a whole number.
4. IF the numerator or denominator is negative, not an integer, or the numerator exceeds the denominator THEN THE SYSTEM SHALL display "Not available" instead of a number.

## Requirement 15: Other shared components

**User story:** As a role-team developer, I want the shared components from tech.md §6 so that every workspace uses the same behavior and copy.

#### Acceptance criteria

1. THE SYSTEM SHALL provide `StatusChip`, `OfflineBanner`, `LastUpdated`, `NextStepCard`, `MeasurementCard`, `MetricTile`, `RoleHeader`, `EmptyState` and `ConfirmSheet` in `src/shared/components`.
2. WHILE the device is offline THE SYSTEM SHALL show `OfflineBanner` as a slim, non-blocking slate or navy banner with a no-connection icon and the text "You're offline. Your saved information is still here. Requests will send when you reconnect." It SHALL NOT use red.
3. WHERE cached content is shown THE SYSTEM SHALL let `LastUpdated` render "Last updated 04 Oct 2026, 9:15 AM".
4. THE SYSTEM SHALL let `NextStepCard` show the action, the responsible clinic or person, the date if known, a `StatusChip` and an "I need help" button.
5. WHEN `RoleHeader` switches role THE SYSTEM SHALL navigate in one tap and persist the choice through `DemoRoleContext`.
6. WHILE clinician mode is on THE SYSTEM SHALL show "Simulated role — no real authentication" in `RoleHeader`.
7. THE SYSTEM SHALL let `ConfirmSheet` be dismissed with Cancel, the back action and the Escape key on web, and SHALL move focus into the sheet when it opens.
8. THE SYSTEM SHALL give every interactive element in these components an accessibility role and label, and a touch target of at least 44px.
9. THE SYSTEM SHALL render icons without adding a new icon dependency.
10. THE SYSTEM SHALL render `RoleHeader` in every role layout, in place of the current `DemoQuickSwitchHeader`, which stays available.

## Requirement 16: Component gallery

**User story:** As a UI developer, I want a usage example for every shared component so that teams can copy correct usage.

#### Acceptance criteria

1. THE SYSTEM SHALL provide `/dev/components`, showing every component from Requirement 15 with at least one usage example, and every status in the dictionary.
2. THE SYSTEM SHALL show `MeasurementCard` with a null value and `MetricTile` with a zero denominator.
3. WHEN `/dev/components` is opened on native THE SYSTEM SHALL show "The component gallery is available on web only" instead of the gallery.
4. THE SYSTEM SHALL NOT link to `/dev/components` from the launcher or any role screen.
5. THE SYSTEM SHALL keep `app/dev/components.tsx` a thin route shell that imports a screen.

## Requirement 17: DemoRoleContext

**User story:** As a demo presenter, I want the chosen role, persona and clinician mode remembered so that a reload does not lose my place.

#### Acceptance criteria

1. THE SYSTEM SHALL provide the current role, the selected persona ID and a clinician-mode flag through `DemoRoleContext`.
2. WHEN the role, persona or clinician mode changes THE SYSTEM SHALL persist it under a `tuloy:v1:` key through `storage.ts`.
3. WHEN the app starts THE SYSTEM SHALL restore the persisted choice.
4. IF the persisted value is missing or invalid THEN THE SYSTEM SHALL start with no role selected and SHALL NOT crash.
5. WHEN the current route belongs to a different role than the stored role THE SYSTEM SHALL treat the route's role as current.
6. THE SYSTEM SHALL turn clinician mode on only for the admin role.

## Requirement 18: ConnectivityContext

**User story:** As any user, I want the app to know when I am offline so that it can say so calmly.

#### Acceptance criteria

1. THE SYSTEM SHALL provide `isOnline` and `lastOnlineAt` through `ConnectivityContext`.
2. WHERE the platform is web THE SYSTEM SHALL use `navigator.onLine` and the `online`/`offline` events.
3. WHERE the platform is native THE SYSTEM SHALL use NetInfo, kept out of the web bundle.
4. WHEN the state changes from offline to online THE SYSTEM SHALL update `lastOnlineAt` and notify subscribers of the transition.
5. WHILE connectivity is not yet known THE SYSTEM SHALL report `isOnline` as null and SHALL NOT show the offline banner.
6. THE SYSTEM SHALL keep the existing `useOnlineStatus` hook working.

## Requirement 19: SyncContext

**User story:** As a role-team developer, I want one place to read queue counts and trigger a flush so that later specs plug the help-request outbox in without new state plumbing.

#### Acceptance criteria

1. THE SYSTEM SHALL provide queue counts by status ('pending', 'sending', 'synced', 'failed', 'conflict'), `flush()` and `isFlushing` through `SyncContext`.
2. THE SYSTEM SHALL let a queue register with `SyncContext` and report its counts and its flush function.
3. WHILE a flush is running THE SYSTEM SHALL return the same in-progress flush to any new `flush()` call (single-flight).
4. THE SYSTEM SHALL include the existing BHW queue in the counts read-only, and SHALL NOT send BHW records from `SyncContext.flush()`.
5. THE SYSTEM SHALL add no automatic flush triggers in this spec.

## Requirement 20: Launcher

**User story:** As a demo presenter, I want one launcher with every role and a reset so that I can run the 4-minute demo from one page.

#### Acceptance criteria

1. THE SYSTEM SHALL show, in this order, [Demo as Admin] [Demo as Clinician] [Demo as BHW] [Demo as Patient] and a "Reset demo data" button.
2. WHEN "Demo as Clinician" is chosen THE SYSTEM SHALL set the admin role, persona Dr. Ramon Santos (DEMO) and clinician mode on, then open `/admin`.
3. WHEN "Demo as Admin" is chosen THE SYSTEM SHALL set persona Carmen Reyes (DEMO) with clinician mode off.
4. THE SYSTEM SHALL show the product.md §7 persona names on the role cards.
5. THE SYSTEM SHALL label the launcher "Simulated role — no real authentication".
6. THE SYSTEM SHALL keep the existing Supabase and Mapbox configuration notices.

## Requirement 21: BHW Sync Now copy

**User story:** As a demo presenter, I want BHW Sync Now to describe what it really does so that the demo does not overclaim cloud sync.

#### Acceptance criteria

1. WHEN Sync Now succeeds THE SYSTEM SHALL show "Sent to demo server" with the number of records sent.
2. THE SYSTEM SHALL NOT change what Sync Now sends, its order, its idempotency keys or its error handling.
3. THE SYSTEM SHALL NOT describe Sync Now as uploading to Supabase or as synchronizing, and SHALL note that full cloud sync is deferred.

## Requirement 22: Dates

**User story:** As any user, I want unambiguous dates so that "04/10" is never misread.

#### Acceptance criteria

1. THE SYSTEM SHALL provide `formatDateDMY` producing "04 Oct 2026" and a date-time form producing "04 Oct 2026, 9:15 AM", independent of device locale.
2. IF a date is null or invalid THEN THE SYSTEM SHALL return a placeholder ("—") and SHALL NOT throw.
3. THE SYSTEM SHALL use these formats in every component added by this spec, and SHALL leave the existing `formatDate` unchanged.

## Requirement 23: Quality bar

**User story:** As the team lead, I want the foundation to meet the steering quality bar so that later specs build on solid ground.

#### Acceptance criteria

1. WHEN a task is finished THE SYSTEM SHALL pass `npm run typecheck` with no `any` in new code.
2. THE SYSTEM SHALL keep `expo-sqlite`, `@rnmapbox/maps` and NetInfo's native module out of the web export, checked with `npx expo export --platform web` into a temporary folder that is deleted afterwards.
3. THE SYSTEM SHALL use React context and hooks only, and SHALL NOT add a state library.
4. THE SYSTEM SHALL verify the SQL by running `setup.sql` twice on an empty Postgres and `apply_foundation.sql` twice on a database built from the original migrations and seed, using a temporary local Postgres outside the repository.
5. THE SYSTEM SHALL read the Supabase anon key only and SHALL NOT add a service-role key.
6. THE SYSTEM SHALL state in the spec that `reset_demo_data()` can be called by anyone with the anon key, which is acceptable only for the hackathon demo.
