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
