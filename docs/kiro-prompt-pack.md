# Tuloy Health — Kiro Prompt Pack

Version 1 • 4 October 2026 • Based on *Tuloy: Three-Team Product and Brand Brief, Version 2* and the existing TULOY Health README

This pack turns the product brief into prompts for Kiro. Part A explains the order. Part B has the three steering files, which Kiro includes in every request. Part C has the spec prompts, one per feature area, to paste into Kiro's Spec mode in order.

---

## Part A — How to use this pack in Kiro

1. **Put the brief in the repo.** Copy `Tuloy_Three_Team_Product_and_Brand_Brief_v1.md` (Version 2) to `docs/product-brief.md`. The steering files link to it.
2. **Create the steering files.** Create `.kiro/steering/product.md`, `tech.md` and `structure.md` from Part B. If Kiro has already generated these files, replace their content and keep anything specific to your code that Kiro detected.
3. **Run the specs in order.** For each prompt in Part C, start a new Spec in Kiro and paste in the prompt. Review `requirements.md` before letting Kiro move on to `design.md`, and review `design.md` before `tasks.md`. Then run the tasks one at a time.
   - Spec 0 is a read-only audit. Run it first. It shows the actual columns and functions in your code, and later specs build on those instead of guessing.
   - Order: **0 Audit → 1 Shared foundation → 2 Offline-first core → 3 Patient → 4 BHW → 5 Admin (RHU) → 6 Demo hardening and deploy.**
4. **Review each spec against three things:**
   - The shared status dictionary (steering `product.md` §6).
   - The offline acceptance tests (Spec 2).
   - The rule that changes are additive: new migrations only, and no renaming of existing tables, columns or routes.

### Where each guideline section lives

| Guideline section | Location |
|---|---|
| High-level overview and context (mission, audience, deployment, constraints) | Steering `product.md` §1–3 |
| Feature matrix by role | Steering `product.md` §4 and Specs 3–5 |
| Database and data schema (entities, fields, foreign keys, hierarchy) | Steering `tech.md` §4 and Specs 0–1 |
| Offline storage and sync engine (per-platform storage, flags, triggers) | Steering `tech.md` §5 and Spec 2 |
| Technical architecture and environment (layout, routing, integrations, UI, state) | Steering `tech.md` §1–3, §6–7 and `structure.md` |
| User stories and acceptance criteria | Specs 1–6 |
| Demo and seed data (accounts, records, map coordinates) | Steering `product.md` §7 and Specs 1 and 6 |

### A note on "EARS"

EARS is a format for **acceptance criteria**: `WHEN <trigger> THE SYSTEM SHALL <response>`. It also has `WHILE`, `IF … THEN` and `WHERE` forms. The "As a [role], I want … so that …" sentence is a **user story**. Kiro's requirements format uses both: a user story for each requirement, followed by numbered EARS acceptance criteria. Every spec prompt below asks for that format.

---

## Part B — Steering files

### B1. `.kiro/steering/product.md`

````markdown
---
inclusion: always
---

# Tuloy Health — Product steering

Full product brief: #[[file:docs/product-brief.md]]
When this file and the brief disagree, the brief wins. Name the conflict instead of choosing silently.

## 1. Mission and core objective

**Help people take the next step in preventive care, and help their care team follow through, even without a stable connection.** Tagline: *Alaga, tuloy-tuloy.*

The core experience is a YAKAP checkup and screening navigator, supported by:
- a personal health record (the clearbook),
- BHW follow-through,
- clinician review.

Tuloy helps patients reach assessment and complete follow-up. It never diagnoses. Collected measurements are not a diagnosis.

**Offline-first is a main feature, not an extra.** The required offline journey:
1. The patient opens the previously loaded app without internet.
2. Cached Patient Home and care information remain accessible.
3. A help request is saved locally.
4. It shows **Saved on this device → Waiting to send**.
5. When connectivity returns, it is delivered **once**.
6. It becomes **Received in demo clinic inbox** and appears in the BHW queue.

## 2. Audience and deployment

| Role in code | Brief name | User | Main question |
|---|---|---|---|
| `admin` | Tuloy RHU: coordinator, plus a restricted **clinician** mode | Rural Health Unit staff | Where is care getting stuck? |
| `bhw` | Tuloy BHW | Barangay Health Workers, often offline in the field | Who needs help today? |
| `patient` | Tuloy Patient | Community members, including low-literacy and low-connectivity users | What should I do next? |

- **Primary deployment:** Expo Web, exported as a static PWA on Vercel, as one link. It is demoed on a phone-width browser and a laptop.
- **Secondary:** Expo Go or a development build on Android.
- **Layouts:** Patient and BHW are mobile-first. RHU is table- and queue-first, with a usable narrow-screen view.
- **Language:** English/Filipino labels, used consistently. Dates are written like "04 Oct 2026".

## 3. Hackathon constraints and non-negotiables

- **Builds on the existing project.** Changes are additive. Do not rename existing tables, columns, routes or services. Schema changes go into new migrations, and `supabase/setup.sql` is regenerated with `node scripts/build-setup-sql.mjs`.
- **Synthetic data only.** All seed data is labeled DEMO DATA. No real names, addresses or phone numbers.
- **No real login.** Roles are chosen in the Demo Quick-Switch Launcher. RLS stays permissive for the hackathon. The clinician mode is labeled "Simulated role — no real authentication".
- **No diagnosis.** No unvalidated risk scores or "healthy" scores. A missing reading is never shown as zero.
- **Clinical authority.** Only clinician mode can release a care plan. Coordinator mode cannot diagnose, prescribe or sign.
- **No emergency claims.** Help requests are not an emergency channel. Always show where to seek urgent care. Never imply live monitoring or a guaranteed response time.
- **No official integration claims.** Selecting a clinic is not YAKAP enrollment. Opening a clinic card does not book an appointment. Unknown availability stays "Unknown".
- **Deferred, never presented as working:**
  - cloud sync of every record type,
  - cross-device conflict resolution,
  - background sending while the app is closed,
  - backup and restore,
  - OCR,
  - ML,
  - SMS,
  - inventory ledger.
- **Status is never color alone.** Every status chip has text and an icon.

## 4. Feature matrix by role (foundation scope)

| Area | Admin (RHU) | BHW | Patient |
|---|---|---|---|
| Home | **Needs Attention**: unassigned help requests, overdue reviews, blocked barriers, inactive BHWs | **Today**: owned work items (help requests, attendance confirmation, follow-ups, barriers) | **Home**: next care step first, then upcoming follow-up, latest dated measurements, review status |
| People | **Assignments**: create BHW accounts; assign and reassign patients and help requests | **My Patients**: list and Mapbox map; assisted/manual registration, which works offline | **Care team**: assigned BHW and clinic contact |
| Records | Field records feed tagged "synced from field" | **Patient Visit**: measurements, contact outcome, barrier and next action in one save, offline | **My Health**: vitals history with dates and units; manual clearbook entry |
| Care pathway | **Clinical Review** (clinician mode only): review results, release care plan | Confirm attendance: patient-reported vs clinic-confirmed | **My YAKAP Checkup** stage tracker; **YAKAP & Clinics** finder; **Care Plan** (released plans only) |
| Offline | Demo clinic inbox (receives help requests once) | **Sync** tab: Sync Now, which already exists | Offline Home and the help-request outbox: auto-send on reconnect, plus Try again |
| Metrics | **Summary**: 4 metrics as "count of total (%)"; zero denominator shows "No cases" | — | — |

## 5. Help requests

- **Reasons:**
  - transport,
  - need another date,
  - lab access,
  - document help,
  - medicine access,
  - other.
- **Required:** a patient reference and a timestamp created on the device.
- **Optional:** a short message.
- A BHW queue item shows the created-on-device time and the received time **separately**.

## 6. Shared status dictionary (use these exact meanings everywhere)

- **Transport:** Saved on this device · Waiting to send · Sending · Received in demo clinic inbox (help requests) or Synced (BHW field records) · Send failed · Needs review (conflict).
- **Encounter:** requested · confirmed · patient-reported attended · clinic-confirmed attended · missed · rescheduled.
- **Clinical:** transcription pending · awaiting clinical review · plan released.
- **Coordination:** unassigned · assigned · acknowledged · blocked · completed.

Never use one generic "complete" flag across these groups.

## 7. Demo scenario and seed personas

**Fixed UUIDs.** All personas use fixed UUIDs so that **Reset demo data** is deterministic.

**Staff:**
- Admin coordinator: *Carmen Reyes (DEMO)*.
- Clinician: *Dr. Ramon Santos (DEMO)*.
- BHWs:
  - *Liza Mendoza (DEMO)*, active.
  - *Joel Bautista (DEMO)*, active.
  - *Ana Villanueva (DEMO)*, inactive 5 days, which tests staff absence.

**Patients.** The primary patient is *Juana Dela Cruz (DEMO)*, assigned to Liza. She has a cached Home, a confirmed follow-up and a released care plan. Seven more patients cover:
- unknown attendance,
- confirmed missed follow-up,
- result awaiting clinical review,
- unresolved transport barrier,
- unassigned patient,
- patient without a smartphone (assisted),
- newly onboarded with no measurements (shows "No readings yet", not zero).

**Combined demo, about 4 minutes:**
1. Admin: Needs Attention.
2. BHW: log a visit offline, then Sync Now.
3. Patient (Juana): go offline, reopen the app, see Home, send a help request ("Saved on this device → Waiting to send"), refresh, reconnect, see "Received in demo clinic inbox".
4. BHW: exactly one new Today item; acknowledge it.
5. Admin: the item shows as assigned and acknowledged; the clinician releases a plan.
6. Patient: sees the new plan.
````

### B2. `.kiro/steering/tech.md`

````markdown
---
inclusion: always
---

# Tuloy Health — Technical steering

## 1. Stack (already set up — do not replace)

- Expo + Expo Router, TypeScript, in `apps/mobile`.
- Supabase (Postgres + RLS) through the **anon/publishable key only** (`src/shared/services/supabase.ts`).
- Mapbox:
  - `@rnmapbox/maps` on native, in a development build.
  - `mapbox-gl` or OSM on web.
  - A mock map in Expo Go.
- Offline repository `storage.ts`:
  - **SQLite** (`expo-sqlite`) on native, via `.native.ts`.
  - **localStorage** on web.
- `sync.ts`: Sync Now pushes patients → records → tests with idempotent upserts.
- Web export: `npx expo export --platform web` → `dist/`, deployed on Vercel with Root Directory `apps/mobile`.

## 2. Integration rules

- **Data access layers:**
  - Screens never import `supabase` directly.
  - All remote reads and writes go through `src/shared/services/api.ts`.
  - All local reads and writes go through `storage.ts`.
  - All queue flushing goes through `sync.ts`, or a new `outbox.ts` next to it.
- **Platform splits.** Use `.native.ts(x)` files. `expo-sqlite` and `@rnmapbox/maps` must never enter the web bundle.
- **Env vars.** Only `EXPO_PUBLIC_*` variables are read in the client. Never add a service_role key.
- **Mapbox token.** Missing token or development build → show the mock map, never crash.
- **Offline map.** Tiles are not expected offline. Show "Map needs a connection", followed by the patient list with last-known locations.

## 3. Global state rules

- Do not add a new state library unless one is already in the project. Use React context plus hooks.
- **Allowed shared contexts:**
  - `DemoRoleContext`: current role, selected demo persona and clinician-mode flag, persisted to storage.
  - `ConnectivityContext`: `isOnline` and `lastOnlineAt`. Use `NetInfo` on native and `navigator.onLine` plus `online`/`offline` events on web.
  - `SyncContext`: queue counts by status, `flush()`, `isFlushing`.
- Other data stays in feature hooks under `src/features/<role>/hooks`.
- Screens render from the local cache first, then refresh from the network when online (cache-then-network).

## 4. Data schema

Spec 0 confirms the real columns. Reconcile against existing tables and add only what is missing.

**Hierarchy:** `admins` 1─n `bhws` 1─n `patients` 1─n `records` / `appointments` / `help_requests` / `care_plans`.

| Table | Key fields (type) | Foreign keys | Notes |
|---|---|---|---|
| `admins` | `id uuid pk`, `full_name text`, `admin_role text` ('coordinator' \| 'clinician'), `municipality text`, `is_demo bool`, `created_at timestamptz` | — | `admin_role` is additive |
| `bhws` | `id uuid pk`, `admin_id uuid`, `full_name text`, `barangay text`, `phone text`, `is_active bool`, `last_active_at timestamptz`, `created_at` | `admin_id → admins.id` | |
| `patients` | `id uuid pk` (generated on device), `bhw_id uuid null`, `full_name text`, `birth_date date`, `sex text`, `barangay text`, `address_label text`, `lat double`, `lng double`, `phone text null`, `has_smartphone bool`, `yakap_stage text`, `clinic_id uuid null`, `sharing_consent bool`, `created_on_device_at`, `received_at`, `updated_at` | `bhw_id → bhws.id`, `clinic_id → clinics.id` | `bhw_id` null = unassigned |
| `records` | `id uuid pk` (generated on device), `patient_id uuid`, `bhw_id uuid null`, `record_type text` ('visit' \| 'vitals' \| 'lab_result' \| 'note'), `measured_at timestamptz`, `systolic int`, `diastolic int`, `glucose_value numeric`, `glucose_unit text`, `glucose_test_type text`, `weight_kg numeric`, `height_cm numeric`, `contact_outcome text`, `barrier text`, `next_action text`, `notes text`, `source text` ('field' \| 'patient' \| 'clinic'), `transcription_status text`, `review_status text`, `created_on_device_at`, `received_at default now()` | `patient_id → patients.id`, `bhw_id → bhws.id` | All measurement fields nullable: null ≠ 0 |
| `appointments` | `id uuid pk`, `patient_id`, `clinic_id`, `purpose text`, `scheduled_at timestamptz`, `encounter_status text` (dictionary), `owner_bhw_id uuid null`, `updated_at` | → patients, clinics, bhws | Rescheduling updates the row; it does not add an overdue duplicate |
| `care_plans` | `id uuid pk`, `patient_id`, `clinician_admin_id`, `summary text`, `next_steps text`, `status text` ('draft' \| 'released'), `released_at` | → patients, admins | Patients only see `released` |
| `clinics` | `id uuid pk`, `name`, `address`, `contact`, `services text[]`, `yakap_accreditation text` ('listed' \| 'unknown'), `source text`, `last_verified_at date` | — | Unknown stays unknown |
| `help_requests` | `id uuid pk` (**generated on device = idempotency key**), `patient_id`, `reason text`, `message text null`, `created_on_device_at`, `received_at default now()`, `assigned_bhw_id uuid null`, `coordination_status text` default 'unassigned', `acknowledged_at null` | → patients, bhws | This is the **demo clinic inbox** |

**Additional schema rules:**
- **Auto-assignment.** A database trigger on `help_requests` insert sets `assigned_bhw_id` to the patient's `bhw_id` and sets `coordination_status = 'assigned'`. If the patient has no BHW, the request stays 'unassigned' and appears in Needs Attention.
- **Seed flag.** Every table gets `is_seed bool default false`. This makes `reset_demo_data()` possible: a `security definer` RPC that deletes non-seed rows and restores seed rows to their original state.
- **Tests table.** Keep the existing `tests` table and `connection_test` unchanged.

## 5. Offline storage and sync engine

**Per-platform storage.** Behind the same `storage.ts` interface:
- SQLite tables on native.
- Namespaced localStorage keys on web, e.g. `tuloy:v1:records:<id>`.
- Every write is persisted before the UI confirms "Saved on this device".
- Wrap every localStorage call in try/catch. On quota or access errors, show a visible error and never discard data silently.

**Local-only sync metadata.** Not sent to Supabase:
- `_sync_status`: `'pending' | 'sending' | 'synced' | 'failed' | 'conflict'`
- `_attempts`
- `_last_error`
- `_local_updated_at`

**Status → UI label:**
- `pending` → "Saved on this device · Waiting to send"
- `sending` → "Sending…"
- `synced` → "Received in demo clinic inbox" for help requests, or "Synced" for BHW records
- `failed` → "Not sent yet. Try again."
- `conflict` → "Needs review"

**Conflict.** A conflict means the server already has the same `id` with different content. Never overwrite either side. Conflict resolution is deferred.

**Exactly-once delivery:**
- The client generates the UUID at creation.
- The server insert uses `upsert(..., { onConflict: 'id', ignoreDuplicates: true })`, followed by a read-back by `id`.
- The status becomes `synced` only after the read-back confirms the row exists.
- If the read-back content differs, the status becomes `conflict`.

**Single-flight.** Only one flush runs at a time per queue, using a module-level lock. Items go `pending → sending`. If the app reloads mid-send, stale `sending` items are reset to `pending`.

**Triggers:**

| Queue | Automatic | Manual |
|---|---|---|
| Help requests (outbox) | On app start when online; on the `offline → online` transition; on app foreground/visibility. Backoff 2s, 5s, 15s, 60s. | **Try again** on each failed item |
| BHW field records (existing) | Optional on reconnect; must not break the existing flow | **Sync Now** on the Sync tab (primary in demo) |

No background sending while the app is closed. This is deferred.

**Read cache.**
- When online, Patient Home data (next step, appointments, latest vitals, released plan, care team) is fetched and written as a snapshot: `tuloy:v1:patient_snapshot:<patientId>`, with `last_updated_at`.
- When offline, the app reads the snapshot.
- If there is no snapshot, show "Connect once to load your information".

**Offline app shell (web).**
- A service worker, registered only in the exported production build, precaches the exported `dist/` assets and route HTML. This lets a previously loaded app reopen offline.
- Use Workbox `generateSW` run after `expo export`, or a hand-written `public/sw.js`.
- The service worker is not active under `expo start`. Offline tests must use `npx serve dist` or the Vercel URL.
- Add a web manifest: name "Tuloy", theme color #0F766E, icons.

## 6. Shared UI

**Location.** Components live in `src/shared/components` (create it if missing).

**Design tokens.** Defined once in `src/shared/theme.ts`:

| Token | Value |
|---|---|
| primary | #0F766E |
| text | #16324F |
| bg | #F8FAFC |
| surface | #FFFFFF |
| muted | #475569 |
| pending | #B45309 |
| error | #B91C1C |
| success | #166534 |

**Typography and touch.** Body text about 16px; touch targets at least 44px. Validate contrast.

**Required components:**
- `StatusChip` (text + icon + token; one variant per dictionary state)
- `OfflineBanner`
- `LastUpdated`
- `NextStepCard`
- `MeasurementCard` (value + unit + measured date; null shows "No reading")
- `MetricTile` ("18 of 30 (60%)" / "No cases")
- `RoleHeader` (role switcher)
- `EmptyState`
- `ConfirmSheet`

**Offline banner copy.** Slate/navy, never red: "You're offline. Your saved information is still here. Requests will send when you reconnect."

## 7. Quality bar

- TypeScript strict; no `any` in new code.
- Run the typecheck and lint after each task.
- Keep `app/` route files as thin shells that import a screen.
- Every new screen has loading, empty, offline and error states.
````

### B3. `.kiro/steering/structure.md`

````markdown
---
inclusion: always
---

# Tuloy Health — Structure steering

```
apps/mobile/
  app/                              route shells only (import a screen, nothing else)
    index.tsx                       Demo Quick-Switch Launcher
    admin/  (tabs) needs-attention | assignments | summary | clinical-review
    bhw/    (tabs) today | patients | patients/[id]/visit | sync
    patient/(tabs) home | my-health | yakap | care-plan   (+ help-request modal)
  src/features/admin|bhw|patient/
    screens/  components/  hooks/  types.ts
  src/shared/
    components/   theme.ts   status.ts (dictionary + labels, EN/FIL)
    context/      DemoRoleContext, ConnectivityContext, SyncContext
    services/     supabase.ts api.ts storage.ts(.native.ts) sync.ts outbox.ts mapbox.ts(.native.ts)
  public/         sw.js (if hand-written), manifest.json, icons
supabase/migrations/   NNNN_<description>.sql   (new files only)
supabase/seed.sql      fixed-UUID DEMO DATA
docs/product-brief.md
```

## Routing rules

- **Paths.** Keep the existing route paths. Add new ones under the role prefix (`/admin`, `/bhw`, `/patient`).
- **Role switching.** Every role layout renders `RoleHeader`, which switches role in one tap and persists the choice.
- **Clinician mode.** `clinical-review` renders only when clinician mode is on. Otherwise it shows an explanation that this is a restricted clinician view.

## Naming

- **Files.** Feature files are `PascalCase.tsx` for components and screens, `useCamelCase.ts` for hooks.
- **Migrations.** Named for what they do, e.g. `0005_help_requests.sql`.
````

---

## Part C — Spec prompts (paste each one into a new Kiro Spec)

Each prompt assumes the steering files are in place.

### Spec 0 — Codebase audit and alignment (read-only)

```text
Spec name: 00-audit-alignment

Do not change any code in this spec. Produce docs/audit.md only.

Read the existing project (apps/mobile, supabase/migrations, seed.sql, setup.sql, scripts/) and compare it to the steering files and docs/product-brief.md.

Report:
1. Actual schema: every table, column, type, FK, RLS policy and existing trigger/RPC. Then a table: steering tech.md §4 field → exists / missing / differs (with the real name).
2. storage.ts and storage.native.ts: current API, key naming, how sync status is stored, and the current sync flag values.
3. sync.ts: order, idempotency method, error handling, and whether any automatic trigger exists.
4. Routes and screens that exist per role, compared with structure.md.
5. Existing shared components, theme, state management and contexts.
6. Mapbox setup on web and native, plus the fallback behavior.
7. Whether a service worker or web manifest exists, and whether the exported web build can reopen offline today.
8. Seed data: personas and whether IDs are fixed.
9. A gap list ranked by the brief's priority, where offline-first core = highest, with the smallest additive change for each gap.
10. Conflicts between the README, steering and the brief, each with a recommended resolution.

Requirements format: user stories with EARS acceptance criteria, e.g. "WHEN the audit completes THE SYSTEM SHALL list every gap with a proposed additive change".
```

### Spec 1 — Shared foundation: schema, seed, design system, status dictionary

```text
Spec name: 01-shared-foundation

Using docs/audit.md, build the shared foundation every role depends on. Changes are additive only.

Scope:
A. Migration(s) adding what tech.md §4 lists as missing: admin_role, clinics, appointments, care_plans, help_requests (client-generated id PK), is_seed columns, the help_requests auto-assign trigger, and the reset_demo_data() security-definer RPC. Keep RLS enabled with permissive hackathon policies matching the existing style. Regenerate supabase/setup.sql via scripts/build-setup-sql.mjs.
B. seed.sql with fixed UUIDs and the personas in product.md §7. Every name ends in "(DEMO)".
   - Clinics: 3 synthetic clinics; one with yakap_accreditation 'unknown' and an old last_verified_at.
   - Map coordinates: generate synthetic patient coordinates as small offsets (±0.01°) around a single configurable demo centre (EXPO_PUBLIC_DEMO_MAP_CENTER, default a fictional barangay centre), labelled "approximate DEMO location". Never use real household addresses.
   - Records: at least 3 dated BP readings for Juana across 3 months, one glucose with test type and unit, and one patient with no readings.
C. src/shared/theme.ts tokens and src/shared/status.ts: the four-group status dictionary with EN/FIL labels, icon names and token colours. Mark the FIL labels "needs native-speaker review".
D. Shared components listed in tech.md §6, each with a usage example screen at /dev/components (web only, hidden from the launcher).
E. DemoRoleContext, ConnectivityContext and SyncContext per tech.md §3. Update the launcher to [Demo as Admin] [Demo as Clinician] [Demo as BHW] [Demo as Patient] plus a "Reset demo data" button (calls the RPC and clears local tuloy:v1:* keys after a confirm sheet).

Write requirements as user stories with EARS acceptance criteria. Include at least:
- As a demo presenter, I want to reset demo data so that every run starts identically.
  WHEN Reset demo data is confirmed THE SYSTEM SHALL restore all seed rows, delete non-seed rows and clear local tuloy:v1:* storage.
  WHEN the reset finishes THE SYSTEM SHALL return to the launcher showing "Demo data reset".
- As any user, I want statuses to be unambiguous so that "saved", "received" and "reviewed" are never confused.
  WHERE a status is displayed THE SYSTEM SHALL render text and an icon from status.ts, never colour alone.
- As a patient, I want missing readings to look missing so that I am not misled.
  IF a measurement value is null THEN THE SYSTEM SHALL display "No reading" and SHALL NOT display 0.
- As a metric reader, I want counts with percentages so that small numbers are not misleading.
  WHEN a metric denominator is 0 THE SYSTEM SHALL display "No cases".
  OTHERWISE THE SYSTEM SHALL display "<n> of <d> (<p>%)".
```

### Spec 2 — Offline-first core (main feature)

```text
Spec name: 02-offline-first-core

This is Tuloy's main feature. Implement the brief's §7 required offline journey on Expo Web (exported PWA) first, then confirm native parity with SQLite.

Scope:
1. Offline app shell: web manifest, plus a service worker that precaches the exported dist/ (registered only in production web builds), with an "update available — reload" prompt when a new version is deployed.
2. Patient read cache: patient_snapshot written on every successful online load; Patient Home, YAKAP step, care plan and care team read from the snapshot when offline, with LastUpdated and OfflineBanner.
3. Help-request outbox (src/shared/services/outbox.ts):
   - Client UUID, persisted before confirmation.
   - Statuses pending/sending/synced/failed/conflict.
   - Single-flight flush, backoff 2s/5s/15s/60s, reset of stale 'sending' items on load.
   - Upsert with ignoreDuplicates plus read-back by id before marking synced.
   - Triggers: app start, offline→online, visibility/foreground, manual Try again.
4. Help-request UI: "I need help" on Home and on every NextStepCard; reason picker (transport, need another date, lab access, document help, medicine access, other) and optional message; urgent-care guidance text; "My requests" list with StatusChip and created-on-device time.
5. Inbox and queue: help_requests is the demo clinic inbox; the BHW Today queue and Admin Needs Attention read from it.
6. Persistence: confirm every demo record type (patients, records, appointments, help requests, care plans) is written to persistent local storage and survives refresh on web and app restart on native. Do not add send queues for other record types beyond the existing BHW Sync Now.
7. Deferred, and must be stated in UI copy where relevant: background sending while closed, cloud sync of all records, cross-device conflict resolution, backup/restore.

User stories with EARS acceptance criteria. Use these and make each one testable:

OC-1 As a patient, I want Tuloy to open without internet after I've used it once so that I can still see my next care step.
- WHEN the production web app has been loaded online once AND the device is offline AND the user reloads THE SYSTEM SHALL render the app and Patient Home without a browser error page.
- WHILE offline THE SYSTEM SHALL show OfflineBanner and the snapshot's "Last updated <date, time>".
- IF no snapshot exists THEN THE SYSTEM SHALL show "Connect once to load your information".

OC-2 As a patient, I want to ask for help while offline so that my request is not lost.
- WHEN the patient submits a help request offline THE SYSTEM SHALL persist it locally before showing confirmation.
- WHEN the request is persisted THE SYSTEM SHALL show "Saved on this device" and then the chip "Waiting to send".

OC-3 As a patient, I want my request to survive a refresh so that I don't have to re-enter it.
- WHEN the app is refreshed or reopened while offline THE SYSTEM SHALL list the request as "Waiting to send" with its original reason, message and created time.

OC-4 As a patient, I want my request to be sent automatically when I'm back online so that I don't have to remember.
- WHEN connectivity changes from offline to online WHILE the app is open THE SYSTEM SHALL start a flush within 5 seconds.
- WHEN the server read-back confirms the row THE SYSTEM SHALL show "Received in demo clinic inbox".
- THE SYSTEM SHALL NOT show "Received" before the read-back confirms the row.

OC-5 As the care team, I want each request exactly once so that nobody does duplicate work.
- WHEN a request is flushed any number of times (repeated Try again, double tap, connectivity toggled during sending, reload mid-send) THE SYSTEM SHALL result in exactly one help_requests row and exactly one BHW Today item.

OC-6 As a patient, I want to know when sending failed so that I can retry.
- IF a flush attempt fails THEN THE SYSTEM SHALL keep the request, show "Not sent yet. Try again." with a Try again action, and record _last_error.
- IF the server holds the same id with different content THEN THE SYSTEM SHALL mark it "Needs review" and SHALL NOT overwrite either copy.

OC-7 As a BHW, I want received help requests in my Today queue so that I can act.
- WHEN a help request is received for a patient assigned to me THE SYSTEM SHALL show it in Today with patient, reason, created-on-device time and received time as separate fields.
- IF the patient is unassigned THEN THE SYSTEM SHALL show the request in Admin Needs Attention as "unassigned".

OC-8 As a demo presenter, I want all demo records to persist so that a refresh never breaks the demo.
- WHEN any workspace is refreshed THE SYSTEM SHALL show all locally created records unchanged.

OC-9 As a patient, I want honest help-request wording so that I know it isn't an emergency line.
- WHERE the help-request form is shown THE SYSTEM SHALL display urgent-care guidance.
- THE SYSTEM SHALL NOT state or imply live monitoring or a guaranteed response time.

Design.md must include a sequence diagram of save → pending → sending → read-back → synced, and the failure and conflict branches.

Tasks.md must end with a manual test script that reproduces brief §7.5 tests 1–10 on `npx serve dist`, using Chrome DevTools Offline. Note that the service worker is not active under `expo start`.
```

### Spec 3 — Patient workspace

```text
Spec name: 03-patient-workspace

Build Tuloy Patient tabs: Home, My Health, YAKAP & Clinics, Care Plan. Reuse the outbox and snapshot from Spec 02. Demo persona: Juana Dela Cruz (DEMO).

Requirements as user stories with EARS acceptance criteria. Cover at least:

P-1 Home, next step first.
As a patient, I want to see my next care step first so that I know what to do.
- THE SYSTEM SHALL order Home as: NextStepCard, upcoming follow-up, latest dated measurements, review status.
- NextStepCard SHALL show the action, the clinic or responsible person, the date if known, a StatusChip, and the buttons "I already attended", "I need another date" and "I need help".
- WHEN "I already attended" is tapped THE SYSTEM SHALL set encounter status "patient-reported attended", visibly distinct from "clinic-confirmed attended".
- WHEN "I need another date" is tapped THE SYSTEM SHALL create a help request with reason "need another date" and SHALL NOT create a duplicate overdue item.
- THE SYSTEM SHALL NOT show any overall "healthy" score.

P-2 My Health.
As a patient, I want my vitals history with dates and units so that I can follow changes.
- THE SYSTEM SHALL show BP, glucose (with test type and unit), weight and height as MeasurementCards with measured_at.
- IF a reading is older than 90 days THEN THE SYSTEM SHALL label it "Older reading".
- THE SYSTEM SHALL plot a simple BP trend with dated points only, with no interpolated or zero values.

P-3 Manual clearbook entry.
As a patient, I want to record a lab value from my paper report so that my record is complete.
- WHEN entering a value THE SYSTEM SHALL require test type, value, unit and test date, and SHALL show a confirm step before saving.
- WHEN saved THE SYSTEM SHALL store it with source 'patient', transcription_status 'confirmed by patient' and review_status 'awaiting clinical review'.
- THE SYSTEM SHALL NOT display a clinical interpretation.
- Photo upload is a stretch: if built, keep the original image out of localStorage (use IndexedDB or Supabase Storage) and handle quota errors.

P-4 My YAKAP Checkup tracker.
As a patient, I want to see where I am in the YAKAP pathway so that I know my next milestone.
- THE SYSTEM SHALL show the brief §3 stages with the current stage highlighted.
- THE SYSTEM SHALL label clinic selection "confirmation pending" until clinic-confirmed.
- THE SYSTEM SHALL use the copy "Get help accessing YAKAP benefits and completing your next care step" and SHALL NOT promise free services.

P-5 Clinic finder.
As a patient, I want clinic details I can trust so that I go to the right place.
- Each clinic card SHALL show services, address, contact, accreditation source, source and last-verified date.
- IF availability is unknown THEN THE SYSTEM SHALL display "Unknown".
- WHEN a card is opened THE SYSTEM SHALL NOT imply that an appointment was booked.
- Each card SHALL link to the official PhilHealth YAKAP page.

P-6 Care Plan and care team.
As a patient, I want my released plan and my care team's contacts so that I can follow through.
- THE SYSTEM SHALL show only care_plans with status 'released', with the clinician name and release date.
- WHILE a review is pending THE SYSTEM SHALL show "Awaiting clinical review" instead of a plan.
- THE SYSTEM SHALL show the assigned BHW name and contact (DEMO).

All Patient screens SHALL work offline from the snapshot and SHALL meet the mobile-first, 16px and 44px touch-target rules.
```

### Spec 4 — BHW workspace

```text
Spec name: 04-bhw-workspace

Extend the existing BHW workspace (My Patients, offline register and visit, Sync Now). Add Today and the combined Patient Visit, and align every status with status.ts. Do not break the existing Sync Now flow. Demo persona: Liza Mendoza (DEMO).

Requirements as user stories with EARS acceptance criteria. Cover at least:

B-1 Today queue.
As a BHW, I want one list of who needs help today so that I can plan my visits.
- THE SYSTEM SHALL list owned work items from: received help requests, appointments needing attendance confirmation, follow-ups due or overdue, and open barriers. Each item SHALL show one next action and a due date when one applies.
- THE SYSTEM SHALL separate "attendance not yet confirmed" from "confirmed missed".
- WHEN a help request is acknowledged THE SYSTEM SHALL set coordination_status 'acknowledged' and record acknowledged_at.

B-2 Assisted registration offline.
As a BHW, I want to register a patient without signal so that onboarding isn't blocked.
- WHEN registering offline THE SYSTEM SHALL save with a client UUID and show "Saved on this device · Waiting to send".
- THE SYSTEM SHALL support patients without smartphones (has_smartphone = false).
- Patient QR is a stretch. If built, the QR SHALL contain only a patient reference, never health data.

B-3 Patient Visit (one save).
As a BHW, I want to record measurements, outcome, barrier and next action together so that I don't enter data twice.
- THE SYSTEM SHALL offer contact outcomes: contacted, could not reach, patient-reported attendance, clinic-confirmed attendance, rescheduled, help needed.
- THE SYSTEM SHALL offer barriers: transport, unavailable appointment, laboratory access, document help, medicine access.
- WHEN saved THE SYSTEM SHALL write one local record with the BHW sync flags.
- IF a value is left blank THEN THE SYSTEM SHALL store null.

B-4 Sync center (existing).
As a BHW, I want to see what is still on my phone so that I know what hasn't reached the RHU.
- THE SYSTEM SHALL show counts per status (Waiting to send, Sending, Synced, Send failed, Needs review), using StatusChip.
- WHEN Sync Now is tapped while offline THE SYSTEM SHALL explain that a connection is needed and keep all items.
- WHEN Sync Now succeeds THE SYSTEM SHALL flip items to "Synced" only after a server confirmation, and SHALL be idempotent on repeat taps.

B-5 Map of my patients.
As a BHW, I want to see my patients on a map so that I can plan a route.
- THE SYSTEM SHALL plot assigned patients from synthetic coordinates, with markers whose status is shown by icon and text label, not colour alone.
- IF the Mapbox token is missing or the device is offline THEN THE SYSTEM SHALL show the mock map or "Map needs a connection" plus the list, without crashing.

Language rule: never use "non-compliant". "No response" is not evidence of non-adherence.
```

### Spec 5 — Admin (RHU) workspace: coordinator and clinician

```text
Spec name: 05-admin-rhu-workspace

Extend the existing Admin dashboard into the brief's RHU workspace. Coordinator persona: Carmen Reyes (DEMO). Clinician persona: Dr. Ramon Santos (DEMO), reached via [Demo as Clinician], labelled "Simulated role — no real authentication".

Requirements as user stories with EARS acceptance criteria. Cover at least:

A-1 Needs Attention (coordinator home).
As a coordinator, I want to see only exceptions so that I act where care is stuck.
- THE SYSTEM SHALL list: unassigned help requests and patients, results awaiting review longer than 3 days, blocked barriers older than 7 days, and BHWs inactive more than 3 days. Each item SHALL show its age and one action.
- THE SYSTEM SHALL show the existing live field-records feed tagged "synced from field".

A-2 Assignments and BHW management.
As a coordinator, I want to create BHW accounts and assign work so that every task has an owner.
- WHEN a coordinator creates a BHW THE SYSTEM SHALL save it with admin_id.
- WHEN a patient or help request is assigned or reassigned THE SYSTEM SHALL update its owner and remove it from the unassigned list.
- THE SYSTEM SHALL NOT display a public ranking of BHWs.

A-3 Summary metrics.
As a coordinator, I want honest operational metrics so that I can see follow-through.
- THE SYSTEM SHALL show four metrics as defined in brief §6: first-checkup completion, confirmed follow-up attendance, clinical review completion and task ownership coverage. Each SHALL show its period, its cohort and an "unknown" count, using MetricTile.
- WHEN a metric is selected THE SYSTEM SHALL list the underlying cases.
- The follow-up breakdown (unknown, confirmed missed, rescheduled, completed) SHALL sum to the denominator.
- THE SYSTEM SHALL NOT label anything as prevalence, population screening coverage or NCD control.

A-4 Clinical Review (clinician mode only).
As a clinician, I want a restricted review queue so that I can release care plans.
- WHILE clinician mode is off THE SYSTEM SHALL hide clinical documents and the release action.
- WHEN a clinician releases a plan THE SYSTEM SHALL set status 'released' and released_at, and the plan SHALL appear on the patient's Care Plan after their next online load.
- THE SYSTEM SHALL NOT display unvalidated risk probabilities or diagnosis labels.

A-5 Demo clinic inbox view.
As a coordinator, I want to see incoming help requests so that I can confirm delivery and ownership.
- THE SYSTEM SHALL list help_requests with created-on-device time, received time and coordination status.
- WHEN the same request is flushed repeatedly THE SYSTEM SHALL still show a single row.

Layout: tables and queues first, with a usable narrow-screen card view.
```

### Spec 6 — Demo hardening and deployment

```text
Spec name: 06-demo-hardening-deploy

Make the single Vercel link demo-ready.

Scope:
- Verify the vercel.json and expo export flow with the service worker.
- Add cache headers so the service worker and HTML aren't cached stale.
- Document the env vars.
- Update the README "Demo script" to the combined ~4-minute script in product.md §7, adding the brief's §9.1 offline steps.
- Add a "DEMO DATA" footer on every role.
- Add a pre-demo checklist at docs/demo-checklist.md: reset data; load each role once online; confirm the service worker is installed; test DevTools Offline; then go back online.
- Run a final pass of every Spec 02 acceptance test and record the results in docs/acceptance-results.md as pass/fail, with notes.

Requirements as user stories with EARS acceptance criteria, including:
- As a judge, I want one link that opens the launcher so that I can try any role.
  WHEN the Vercel URL is opened THE SYSTEM SHALL show the Demo Quick-Switch Launcher.
- As a presenter, I want the offline journey to work on the deployed link so that the demo matches the brief.
  WHEN the deployed app has loaded once AND DevTools is set Offline AND the page is reloaded THE SYSTEM SHALL render Patient Home from cache.

Definition of complete (brief §9.2). All of these must hold:
1. The end-to-end scenario runs with synthetic records.
2. All demo records persist across refresh.
3. All offline acceptance tests pass.
4. Each help request appears once in both the inbox and the BHW queue.
5. Every status uses the shared dictionary and offline branding.
6. The demo includes one offline help request with a retry and one unknown-attendance case.
7. No deferred capability is presented as working.
```

---

## Part D — Short follow-up prompts for Kiro chat (vibe mode)

- **Reconcile:** "Compare `docs/audit.md` gap #N with the steering files and propose the smallest additive change. Don't edit yet."
- **Guardrail check:** "Review the current diff against product.md §3 non-negotiables and the status dictionary. List violations only."
- **Offline regression:** "Re-run the Spec 02 manual test script against `npx serve dist` and update `docs/acceptance-results.md`."
- **Copy review:** "List every user-facing string that mentions sending, receiving, reviewing or emergencies, and check each against the status dictionary and the no-emergency rule."
