# Tuloy audit: existing project vs steering and brief

Spec 00-audit-alignment · 04 Oct 2026 · read-only (no code changed)

**Scope read:** `apps/mobile` (all of `app/`, `src/`, config), `supabase/migrations/*`, `supabase/seed.sql`, `supabase/setup.sql`, `scripts/build-setup-sql.mjs`, `.github/workflows/ci.yml`, `.kiro/steering/*`, `docs/product-brief.md`, `README.md`, `docs/requirements.md`, `docs/design.md`, `docs/UPDATES.md`, `apps/mobile/AGENTS.md`.

**Checks run:**
- `npm run typecheck`: passes.
- `npx expo export --platform web` to a temp folder (since deleted): succeeds, 13 static routes. It contains no `expo-sqlite` or `@rnmapbox/maps` code, no service worker and no manifest link.
- `setup.sql` vs the generator output: identical apart from line endings (CRLF in the working copy).

**Not verified:** behavior in a real browser or device, the live Supabase database (the audit reads migrations, not the remote schema), and native builds.

**Precedence for conflicts (product.md):** brief > product.md / tech.md / structure.md > architecture.md / expo.md / security.md > README and older docs.

---

## 1. Actual schema

There are two migrations, applied in lexical order:
1. `20240101000000_connection_test.sql`
2. `20240101000100_care_hierarchy.sql`

`setup.sql` is their concatenation plus `seed.sql`. There are no triggers, functions or RPCs, and no `tests` table.

### 1.1 Tables

**`connection_test`**

| Column | Type | Null | Default / constraint |
|---|---|---|---|
| id | uuid PK | no | `gen_random_uuid()` |
| message | text | no | |
| client_type | text | no | CHECK in (`patient`,`bhw`,`admin`,`system`) |
| local_id | text | yes | UNIQUE (offline idempotency key) |
| created_at | timestamptz | no | `now()` |

**`admins`**

| Column | Type | Null | Default / constraint |
|---|---|---|---|
| id | uuid PK | no | `gen_random_uuid()` |
| full_name | text | no | |
| email | text | **no** | UNIQUE |
| office | text | no | `'Rural Health Unit'` |
| created_at | timestamptz | no | `now()` |

**`bhws`**

| Column | Type | Null | Default / constraint |
|---|---|---|---|
| id | uuid PK | no | `gen_random_uuid()` |
| admin_id | uuid | no | FK → `admins.id` ON DELETE RESTRICT; index `bhws_admin_id_idx` |
| full_name | text | no | |
| email | text | yes | UNIQUE |
| phone | text | yes | |
| barangay | text | no | |
| status | text | no | `'active'`, CHECK in (`active`,`inactive`) |
| created_at | timestamptz | no | `now()` |

**`patients`**

| Column | Type | Null | Default / constraint |
|---|---|---|---|
| id | uuid PK | no | `gen_random_uuid()` (offline rows send a device UUID) |
| bhw_id | uuid | yes | FK → `bhws.id` ON DELETE SET NULL; index `patients_bhw_id_idx` |
| full_name | text | no | |
| sex | text | yes | CHECK in (`F`,`M`) |
| birth_date | date | yes | |
| barangay | text | yes | |
| address | text | yes | |
| latitude | double precision | yes | |
| longitude | double precision | yes | |
| local_id | text | yes | UNIQUE |
| created_at | timestamptz | no | `now()` (server time, so for offline rows it is the **sync** time) |

**`records`**

| Column | Type | Null | Default / constraint |
|---|---|---|---|
| id | uuid PK | no | `gen_random_uuid()` (offline rows send a device UUID) |
| patient_id | uuid | no | FK → `patients.id` ON DELETE CASCADE; index `records_patient_id_idx` |
| bhw_id | uuid | yes | FK → `bhws.id` ON DELETE SET NULL; index `records_bhw_id_idx` |
| record_type | text | no | CHECK in (`visit`,`health_update`,`appointment`) |
| title | text | **no** | |
| notes | text | yes | |
| systolic | integer | yes | CHECK 50–260 |
| diastolic | integer | yes | CHECK 30–180 |
| temperature_c | numeric(4,1) | yes | CHECK 30–45 |
| weight_kg | numeric(5,1) | yes | CHECK 1–400 |
| scheduled_at | timestamptz | yes | (appointments) |
| status | text | yes | CHECK in (`scheduled`,`completed`,`missed`) |
| source | text | no | `'online'`, CHECK in (`online`,`offline_sync`) |
| local_id | text | yes | UNIQUE |
| created_at | timestamptz | no | `now()` (server time) |

### 1.2 RLS, policies and grants

RLS is **enabled** on all five tables.

| Table | Policy | Command | Grants to `anon`, `authenticated` |
|---|---|---|---|
| connection_test | "Allow all for hackathon" | ALL, `true`/`true` | SELECT, INSERT (no UPDATE, so `upsert` relies on `ignoreDuplicates`) |
| admins | "Hackathon demo access" | **SELECT only** | SELECT |
| bhws | "Hackathon demo access" | ALL | SELECT, INSERT, UPDATE |
| patients | "Hackathon demo access" | ALL | SELECT, INSERT, UPDATE |
| records | "Hackathon demo access" | ALL | SELECT, INSERT, UPDATE |

No table grants DELETE to the client. `reset_demo_data()` therefore has to be `security definer`.

### 1.3 Triggers / RPC

None. There is no help-request auto-assign trigger, no `reset_demo_data()` and no `updated_at` trigger.

### 1.4 tech.md §4 field → actual

Legend: ✅ exists · ❌ missing · ≠ differs (real name or semantics given)

**admins**

| Field | Status | Real column / note |
|---|---|---|
| id uuid pk | ✅ | |
| full_name | ✅ | |
| admin_role ('coordinator'\|'clinician') | ❌ | |
| municipality | ❌ | closest is `office` (text, default 'Rural Health Unit') |
| is_demo | ❌ | |
| created_at | ✅ | |
| (extra) | | `email` is **NOT NULL UNIQUE**, so a clinician seed row needs an email |

**bhws**

| Field | Status | Real column / note |
|---|---|---|
| id | ✅ | |
| admin_id → admins | ✅ | NOT NULL, ON DELETE RESTRICT |
| full_name | ✅ | |
| barangay | ✅ | NOT NULL |
| phone | ✅ | |
| is_active bool | ≠ | `status text` ('active'\|'inactive') |
| last_active_at | ❌ | the app derives "last activity" from the latest record's `created_at` |
| created_at | ✅ | |
| (extra) | | `email` UNIQUE nullable |

**patients**

| Field | Status | Real column / note |
|---|---|---|
| id (device-generated) | ✅ | BHW offline registration already sends a device UUID |
| bhw_id null → bhws | ✅ | ON DELETE SET NULL |
| full_name, birth_date, sex, barangay | ✅ | `sex` CHECK F/M |
| address_label | ≠ | `address` |
| lat / lng | ≠ | `latitude` / `longitude` |
| phone | ❌ | |
| has_smartphone | ❌ | |
| yakap_stage | ❌ | |
| clinic_id → clinics | ❌ | the `clinics` table is missing |
| sharing_consent | ❌ | |
| created_on_device_at | ❌ | not sent by sync; `created_at` is server time |
| received_at | ≠ | `created_at` effectively acts as received time |
| updated_at | ❌ | |
| (extra) | | `local_id` UNIQUE |

**records**

| Field | Status | Real column / note |
|---|---|---|
| id (device-generated) | ✅ | |
| patient_id → patients | ✅ | ON DELETE CASCADE |
| bhw_id null → bhws | ✅ | |
| record_type ('visit'\|'vitals'\|'lab_result'\|'note') | ≠ | same column; CHECK allows only `visit`,`health_update`,`appointment` |
| measured_at | ❌ | |
| systolic, diastolic | ✅ | with range CHECKs |
| glucose_value / glucose_unit / glucose_test_type | ❌ | |
| weight_kg | ✅ | numeric(5,1) |
| height_cm | ❌ | |
| contact_outcome / barrier / next_action | ❌ | |
| notes | ✅ | |
| source ('field'\|'patient'\|'clinic') | ≠ | **same name, different meaning**: `source` is ('online'\|'offline_sync'), a transport origin |
| transcription_status / review_status | ❌ | |
| created_on_device_at | ❌ | |
| received_at default now() | ≠ | `created_at default now()` |
| (extra) | | `title` NOT NULL, `temperature_c`, `scheduled_at`, `status` (scheduled/completed/missed), `local_id` |

**Other tables and rules**

| Item | Status | Note |
|---|---|---|
| `appointments` | ❌ | appointments today are `records` rows with `record_type='appointment'` plus `scheduled_at`/`status` |
| `care_plans` | ❌ | |
| `clinics` | ❌ | |
| `help_requests` | ❌ | |
| `is_seed` on every table | ❌ | |
| auto-assign trigger on `help_requests` | ❌ | |
| `reset_demo_data()` RPC | ❌ | |
| "Keep existing `tests` table" | ≠ | no `tests` table exists; the only test table is `connection_test` (the sync entity `connection_test` is what README calls "tests") |

---

## 2. Local storage (`storage.ts`, `StorageWeb.ts`, `StorageNative.native.ts`)

The steering's `storage.native.ts` does not exist under that name. The split is:
- `src/shared/services/storage.ts`: interface and factory.
- `storage/StorageWeb.ts`: localStorage.
- `storage/StorageNative.native.ts`: expo-sqlite.
- `storage/StorageNative.ts`: a web stub that throws.

The web bundle check confirmed that expo-sqlite is not included.

### API (`LocalStorage`)

| Method | Behavior |
|---|---|
| `initDB()` | Web: seeds the queue key with `[]`. Native: opens `tuloy_offline.db` (WAL) and creates tables. |
| `saveRecord({id, entity, message, payload})` | Inserts with status `pending`. Duplicate ids are ignored (web: `some()` check; native: `INSERT OR IGNORE`). |
| `getPendingRecords()` | Returns every item with `sync_status != 'synced'` (so **pending and failed**), oldest first. |
| `getAllRecords()` | Returns all items, newest first. |
| `markSynced(id)` | Sets `synced`, sets `synced_at`, clears `last_error`. |
| `markFailed(id, error)` | Sets `failed` and `last_error`. |
| `clearSynced()` | Deletes synced items. |
| `getCache<T>(key)` / `setCache<T>(key, value)` | JSON key/value cache. |

`getStorage()` returns a memoized, initialized singleton and retries init on failure. The `SyncEntity` values are `'patient' | 'record' | 'connection_test'`.

### Key naming

| Platform | Queue | Cache |
|---|---|---|
| Web | one key `tuloy_offline_records`, holding a JSON **array** of all items | `tuloy_cache:<key>`; the only key in use is `tuloy_cache:bhw:<bhwId>` |
| Native | SQLite `tuloy_offline.db` → table `local_sync_queue` (`local_id` PK, `entity`, `message`, `payload` JSON text, `sync_status` default `'pending'`, `created_at`, `synced_at`, `last_error`) | table `kv_cache` (`key` PK, `value`), same keys as web |

### Sync status storage and values

- The status is a field on each queue item: `sync_status` (not `_sync_status`).
- The values are **`'pending' | 'synced' | 'failed'`**.
- There is no `sending` or `conflict` status, and no `_attempts` or `_local_updated_at`.
- `created_at` is the device time the item was saved.

The UI (`SyncStatus.tsx`) shows the text badges PENDING / FAILED / SYNCED. They have text but no icon, and the wording does not match the dictionary.

### Issues found

- **Silent data loss on web.** `write()` catches quota and access errors and falls back to an in-memory `Map` with no visible error. Data written there is lost on refresh. This violates tech.md §5.
- The web queue is one JSON array that is rewritten on every change, so a write fails as a whole when quota is exceeded. Reads are synchronous; this is fine at demo scale.
- `getCache` swallows JSON parse errors and returns `null`.

---

## 3. Sync engine (`sync.ts`)

| Aspect | Current behavior |
|---|---|
| Entry point | `syncPendingRecords()`, called only from `useOfflineSync().syncNow()` |
| Order | Pending + failed items sorted by entity (`patient` 0 → `record` 1 → `connection_test` 2), then by `created_at` |
| Idempotency | `patients`: `upsert(..., { onConflict: 'id', ignoreDuplicates: true })` (also sends `local_id`). `records`: `upsert({...record, source: 'offline_sync'}, { onConflict: 'local_id', ignoreDuplicates: true })`; the payload also carries `id` = `local_id`. `connection_test`: `upsert` with `onConflict: 'local_id'`, `ignoreDuplicates: true`. |
| Confirmation | Marks `synced` as soon as the upsert returns without error. There is **no read-back by id**, so a same-id row with different content is silently treated as synced (no conflict detection). |
| Error handling | Supabase not configured: returns `error` and touches nothing. Network or missing-schema error: **stops the run** and leaves the current and remaining items as they were. Any other error (data or RLS): `markFailed(item, message)` and continue; failed items are retried on the next Sync Now. A patient that fails with a data error does not block its records, which will then fail on the FK. |
| Concurrency | No module-level lock. Each `useOfflineSync()` instance has its own `syncing` flag. The Dashboard (`OfflineTest`) and the Sync tab each have a Sync Now button, so two flushes can overlap. Duplicates are still prevented by the upsert keys. |
| Stale `sending` | N/A: there is no `sending` state. |
| Automatic triggers | **None.** No app-start, reconnect, AppState or visibility trigger. Only the manual Sync Now. |
| Result | `{ total, synced, failed, remaining, error }`, shown by `SyncResultNotice` |

---

## 4. Routes and screens vs structure.md

All route files are thin shells that import one screen, which complies with the routing rule. The root `_layout.tsx` is a headerless `Stack`. Each role `_layout.tsx` uses `RoleTabsLayout`, which renders `DemoQuickSwitchHeader` plus bottom tabs.

| Route | Tab label | Screen |
|---|---|---|
| `/` | — | `DemoLauncherScreen` (Admin / BHW / Patient cards, Supabase and Mapbox config notices) |
| `/admin` | Dashboard | `AdminDashboardScreen`: metrics grid, BHW activity, "Live field records", connection test |
| `/admin/bhw-management` | BHWs | `AdminBHWScreen`: create BHW, activate/deactivate |
| `/admin/patient-management` | Patients | `AdminPatientsScreen`: all patients, assign/reassign BHW |
| `/bhw` | Dashboard | `BHWDashboardScreen`: assignment card, stats, offline test + Sync Now, recent records, connection test |
| `/bhw/patients` | My Patients | `BHWPatientsScreen`: register patient offline; expand a patient to log a visit / update / appointment offline |
| `/bhw/map` | Map | `BHWMapScreen`: facility + patient markers |
| `/bhw/sync` | Sync | `BHWSyncScreen`: counts, Sync Now, queue list, clear synced |
| `/patient` | Home | `PatientHomeScreen`: upcoming appointments, latest updates, connection test |
| `/patient/health` | My Health | `PatientHealthScreen`: latest BP, visits, updates, past appointments |
| `/patient/profile` | Profile | `PatientProfileScreen`: demographics, care-team chain |

### structure.md target → existing

| structure.md | Existing | Status |
|---|---|---|
| `index.tsx` launcher | `/` | ✅ (no Clinician card, no Reset demo data) |
| admin `needs-attention` | `/admin` (Dashboard) | ❌ content differs; path free to repurpose |
| admin `assignments` | `/admin/bhw-management` + `/admin/patient-management` | ≈ partial (create BHW, assign patients; no help-request assignment) |
| admin `summary` | metrics grid on `/admin` | ≠ raw counts, not "n of d (p%)" |
| admin `clinical-review` (clinician mode only) | — | ❌ |
| bhw `today` | `/bhw` (Dashboard) | ❌ content differs |
| bhw `patients` | `/bhw/patients` | ✅ |
| bhw `patients/[id]/visit` | inline `RecordForm` in `/bhw/patients` | ❌ no route; no contact outcome, barrier or next action |
| bhw `sync` | `/bhw/sync` | ✅ |
| bhw map (not in structure.md; brief: "list and Mapbox map") | `/bhw/map` | extra; keep |
| patient `home` | `/patient` | ≈ no next-step card, no offline cache |
| patient `my-health` | `/patient/health` | ≈ read-only; no glucose, height or manual entry |
| patient `yakap` | — | ❌ |
| patient `care-plan` | — | ❌ |
| patient help-request modal | — | ❌ |
| patient profile (not in structure.md; brief "Care team") | `/patient/profile` | extra; keep (it hosts `CareTeamCard`) |
| `src/features/<role>/types.ts` | `types/<role>.types.ts` | ≠ keep existing |
| `src/shared/status.ts` | — | ❌ |
| `src/shared/context/*` | — | ❌ |
| `services/outbox.ts` | — | ❌ |
| `services/storage.ts(.native.ts)`, `mapbox.ts(.native.ts)` | split in `storage/` and `mapbox/` subfolders | ≠ keep existing (matches architecture.md) |
| `public/` (sw.js, manifest.json, icons) | — | ❌ |
| `/dev/components` (Spec 1) | — | ❌ |

---

## 5. Shared components, theme, state

**Components (`src/shared/components`):**

| Component | Purpose |
|---|---|
| `Button` | primary, secondary, danger; `minHeight` 44 (compact is 32) |
| `Card` | |
| `ChipGroup` | single-select picker |
| `ConnectionTestPanel` | |
| `DemoBadge` | "DEMO DATA" |
| `DemoQuickSwitchHeader` | URL-based role switch, not persisted |
| `LoadingSpinner` | |
| `Notice` | tones error, warning, success, info, each with an emoji icon |
| `RecordListItem` | |
| `RoleTabsLayout` | |
| `Screen` | scroll + pull-to-refresh |
| `StatTile` | |
| `TextField` | |

**Shared screen:** `DemoLauncherScreen`.

**Hooks:**
- `useAsyncData`: load + reload on focus, `toUserMessage` errors.
- `useOnlineStatus`: web `navigator.onLine` + events; **returns `null` on native**.

**Utils:**
- `date.ts`: `formatDate` uses the locale default (e.g. "Oct 4, 2026"), **not** "04 Oct 2026". Also `formatDateTime`, `timeAgo`, `isWithinDays`, `parseYMD`.
- `format.ts`: `ageFromBirthDate`, `formatBP`, `isElevatedBP` (≥140/90), `RECORD_TYPE_LABEL`, `parseOptionalNumber`.
- `id.ts`: `newId()` via `expo-crypto`, with a `Math.random` v4 fallback.

**Config:**
- `env.ts`: reads only `EXPO_PUBLIC_*` variables. It refuses `service_role` / `sb_secret_` keys and accepts `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` or `EXPO_PUBLIC_MAPBOX_TOKEN`; a token must start with `pk.`.
- `demo.ts`: fixed persona IDs and `ROLE_META` colors.

**Theme (`theme.ts`) vs tech.md §6 / brief §8:**

| Token | tech.md | Current |
|---|---|---|
| primary | #0F766E | `primary` #0E7C66 ≠ |
| text | #16324F | `text` #1B2622 ≠ |
| bg | #F8FAFC | `bg` #F4F7F6 ≠ |
| surface | #FFFFFF | `surface` #FFFFFF ✅ |
| muted | #475569 | `muted` #5C6B66 ≠ |
| pending | #B45309 | `warning` #9A6700 ≠ (name and value) |
| error | #B91C1C | `danger` #B42318 ≠ (name and value) |
| success | #166534 | `success` #1A7F37 ≠ |

`theme.ts` also has `border`, `primaryText`, `*Bg` tints, `info`, `spacing` and `radius`. Some components hard-code colors: `ROLE_META` colors, `#E9EFEC` header background, map pin colors. Body text is mostly 13–15px rather than about 16px.

**State management:**
- No state library.
- No React contexts (`createContext` is not used anywhere).
- The role is implied by the URL; there is no persona selection and no clinician flag.
- Data is loaded per screen through feature hooks:

| Hook | Data | Local cache |
|---|---|---|
| `useAdminData` | admin data | none |
| `useBHWManagement` | BHW management actions | none |
| `useBHWData` | BHW data | cache-then-merge with the queue |
| `useOfflineSync` | sync queue | — |
| `usePatientData` | patient profile | **none** |
| `useHealthRecords` | patient records | **none** |

Only BHW data is cached locally. Patient and Admin screens show "Cannot reach the server" and no content when offline.

---

## 6. Mapbox and fallbacks

`services/mapbox.ts` re-exports `mapbox/config.ts` and `MapView`. Metro resolves `MapView.native.tsx` (→ `MapNative`) on iOS/Android and `MapView.tsx` (→ `MapWeb`) on web.

| Platform | Condition | Renders |
|---|---|---|
| Native | dev build, valid `pk.` token | `@rnmapbox/maps` `MapView` + `Camera` + `PointAnnotation` pins |
| Native | Expo Go (module `require` throws) | `MockMap`: "Native Mapbox needs a development build…" |
| Native | no or invalid token | `MockMap`: "Missing EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN — showing mock map." |
| Web | valid `pk.` token | `mapbox-gl` loaded lazily (separate 979 KB chunk), CSS from `api.mapbox.com`, `streets-v12` |
| Web | no token | **OpenStreetMap iframe embed**, not the mock map |
| Web | 401/403 from Mapbox, or the chunk fails to load | OSM iframe with an explanatory note |

**Other details:**
- Default center is Metro Manila 14.5995, 120.9842, from the hard-coded `MOCK_FACILITY`.
- `EXPO_PUBLIC_DEMO_MAP_CENTER` is not read anywhere yet.
- Offline-registered patients get random coordinates within about ±0.006° of the facility.
- `app.config.ts` registers the `@rnmapbox/maps` plugin with `MAPBOX_DOWNLOADS_TOKEN` (build-time only, not bundled).

**Offline behavior:** there is no offline detection in the map.
- Web: the OSM iframe or the Mapbox tiles fail. The result is a broken frame or a blank map, and if the mapbox-gl chunk was never loaded, a fallback to an iframe that also fails.
- Native Mapbox shows empty tiles.
- There is no "Map needs a connection" message.
- The map screen has no patient list; only the legend count.

---

## 7. Service worker, manifest and offline reopen

| Item | Present? |
|---|---|
| `apps/mobile/public/` | No |
| `sw.js` / Workbox / any `serviceWorker.register` | No (bundle scanned; the only matches are React DOM preload strings) |
| Web manifest (`manifest.json` / `<link rel="manifest">`) | No. `app.config.ts` `web.name/shortName/themeColor` (#0E7C66) are **not** emitted by the Metro static export. |
| `app/+html.tsx` (root HTML hook for registration and manifest link) | No |
| Export | `output: 'static'`: one HTML per route (`index.html`, `bhw.html`, `patient/health.html`, …) + `_expo/static/js/web/entry-*.js` (1.5 MB) + lazy `mapbox-gl-*.js` |
| Deploy config | `vercel.json`: `npx expo export --platform web`, `dist`, `cleanUrls: true`. CI deploys `dist` to **GitHub Pages** instead. |

**Can the exported build reopen offline today? No.** With no service worker, an offline reload or reopen requests the HTML document from the network, and the browser shows its own offline error page. This was determined from the build output; it was not reproduced in a browser.

What does work offline is limited to an already-open tab:
- Client-side tab navigation.
- BHW screens rendering from `tuloy_cache:bhw:*` and the queue.
- Saving BHW records offline.

---

## 8. Seed data

All IDs are **fixed**, and `seed.sql` uses `ON CONFLICT (id) DO NOTHING`. Re-running it does **not** restore modified seed rows, and nothing removes non-seed rows. Record timestamps are **relative** (`NOW() - INTERVAL …`), so they shift on every fresh seed.

| Persona | ID | Notes |
|---|---|---|
| Demo Admin (RHU Nurse) | `a0000000-0000-4000-8000-000000000001` | launcher "Demo as Admin" |
| Demo BHW Maria | `b0000000-0000-4000-8000-000000000001` | active, Brgy. Demo San Isidro; "Demo as BHW" |
| Demo BHW Jose | `b0000000-…-000000000002` | active |
| Demo BHW Ana | `b0000000-…-000000000003` | `status='inactive'` (no "inactive 5 days" possible: no `last_active_at`) |
| Demo Patient Juana | `c0000000-…-000000000001` | BHW Maria; "Demo as Patient" |
| Demo Patient Pedro, Rosa | `c…002`, `c…003` | BHW Maria |
| Demo Patient Lito, Carmen | `c…004`, `c…005` | BHW Jose |
| 7 records | `d0000000-…-000000000001` … `007` | Juana: 1 visit (BP 142/90), 1 health update, 1 appointment (+4 days, scheduled). Others: visits and updates; Rosa prenatal appointment. |

The phones are `0900-000-000x`, the emails use `@tuloy.test` and the addresses are "Purok N (demo)", so the data is synthetic. Names carry "Demo" as a prefix, not the "(DEMO)" suffix.

**vs product.md §7:**
- Admin coordinator is Carmen Reyes (DEMO) ≠ "Demo Admin (RHU Nurse)".
- Clinician Dr. Ramon Santos (DEMO) is ❌ missing.
- BHWs Liza Mendoza / Joel Bautista / Ana Villanueva ≠ Maria / Jose / Ana.
- The brief asks for 8 patients (Juana + 7 cases); there are 5. Missing cases: unknown attendance, confirmed missed, awaiting review, transport barrier, **unassigned** (every seed patient is assigned), no smartphone, and no measurements.
- Juana has no released care plan or confirmed follow-up in the brief's sense.
- There are no clinics.
- The fixed IDs are in `demo.ts` and `seed.sql` only.

---

## 9. Gap list (ranked)

Ranking:
- **P0:** offline-first core (brief §7, §9.2 items 2–4).
- **P1:** foundation (brief §9).
- **P2:** safety and copy (product.md §3).
- **P3:** tooling and deploy.

"Modifies" marks a change that edits existing code rather than only adding to it.

### P0 Offline-first core

| # | Gap | Smallest additive change | Spec |
|---|---|---|---|
| 0.1 | The app cannot reopen offline (no SW, no manifest) | Add `public/manifest.json` (name "Tuloy", theme #0F766E, icons from `assets/`). Add `public/sw.js` (cache-first for `/_expo/static/*`, network-first with cache fallback for navigations, mapped to the clean URLs `/patient` → `patient.html`). Add `scripts/build-sw.mjs`, run after export, to inject the precache list of `dist/` files. Add `app/+html.tsx` to add the manifest link and register the SW only when `process.env.NODE_ENV === 'production'`. Chain it in `export:web` and the `vercel.json` buildCommand (modifies 2 config lines). | 02 |
| 0.2 | No demo clinic inbox | New migration: `help_requests` table (client UUID PK, `patient_id` FK, `reason` CHECK, `message`, `created_on_device_at`, `received_at default now()`, `assigned_bhw_id`, `coordination_status default 'unassigned'`, `acknowledged_at`, `is_seed`), permissive policy, SELECT/INSERT/UPDATE grants | 01 |
| 0.3 | No auto-assignment | `BEFORE INSERT` trigger on `help_requests`: copy `patients.bhw_id` into `assigned_bhw_id` and set `'assigned'` when present | 01 |
| 0.4 | No help-request outbox | New `services/outbox.ts` with its own keys `tuloy:v1:help_requests:<id>` (web) and a new SQLite table `outbox_help_requests` (native). Statuses `pending/sending/synced/failed/conflict`, `_attempts`, `_last_error`, `_local_updated_at`. Add methods to `LocalStorage` (additive: web, native and stub) instead of reusing the `local_sync_queue` shape. | 02 |
| 0.5 | No read-back or conflict detection | In `outbox.ts`: `upsert(..., { onConflict: 'id', ignoreDuplicates: true })`, then `select().eq('id')`. Mark `synced` only when the row exists; mark `conflict` when content differs. Add `api.ts` functions `insertHelpRequest` and `fetchHelpRequest`. | 02 |
| 0.6 | No single-flight lock; no stale-`sending` reset | Module-level `let flushing: Promise \| null` in `outbox.ts`. On `initDB`/start, reset `sending` → `pending`. Optionally wrap `syncPendingRecords` with the same lock (small modification). | 02 |
| 0.7 | No automatic triggers or native connectivity | `ConnectivityContext`: web events (reuse `useOnlineStatus` logic); native `@react-native-community/netinfo` via `npx expo install` (new dependency; works in Expo Go). `SyncContext` calls `outbox.flush()` on start, on offline → online, and on `AppState` active / `visibilitychange`, with backoff 2/5/15/60 s. | 01 (contexts), 02 (wiring) |
| 0.8 | Patient Home is blank offline | In `usePatientData`/`useHealthRecords` (modifies): on success `setCache('patient_snapshot:<id>', {…, last_updated_at})`; on failure read it. Use a `tuloy:v1:` prefix for new keys. If there is no snapshot: "Connect once to load your information". | 02 / 03 |
| 0.9 | Silent localStorage loss | `StorageWeb.write()` (modifies): rethrow or record the quota/access error so callers show a visible error. Keep the memory fallback only for SSR (`typeof window === 'undefined'`). | 02 |
| 0.10 | Not all demo records persist locally | Admin data has no local cache. BHW records disappear from the offline view after Sync Now if the cache predates the sync, and are removed by "Clear synced". Add cache-then-network in `useAdminData`. In `useBHWData`, also merge `synced` queue items not yet in the cache (modifies: read `getAllRecords()`). | 02 / 04 / 05 |
| 0.11 | Transport statuses don't match the dictionary | Add `status.ts` + `StatusChip` (text + icon). Map existing `pending/failed/synced` to "Saved on this device · Waiting to send" / "Not sent yet. Try again." / "Synced" in `SyncStatus.tsx` (modifies copy only). | 01 |
| 0.12 | No Reset demo data | Migration: `is_seed bool default false` on all tables, set true for seed rows. `reset_demo_data()` `security definer`: delete `is_seed=false`, re-upsert seed values (`ON CONFLICT DO UPDATE`). Launcher button + confirm sheet that clears `tuloy:v1:*` **and** the legacy `tuloy_offline_records` / `tuloy_cache:*` keys. | 01 |
| 0.13 | Map offline behavior | In `BHWMapScreen` (modifies): when `isOnline === false`, render "Map needs a connection" plus the patient list with last-known coordinates instead of `MapView` | 04 |
| 0.14 | No help-request UI | "I need help" on Home, reason picker, urgent-care text, "My requests" with `StatusChip` | 02 / 03 |
| 0.15 | No BHW/RHU view of received requests | BHW Today list from `help_requests` where `assigned_bhw_id`, showing created-on-device and received times separately, with Acknowledge. Admin Needs Attention for `unassigned`. | 04 / 05 |

### P1 Foundation

| # | Gap | Smallest additive change | Spec |
|---|---|---|---|
| 1.1 | Schema fields missing (§1.4) | One new migration with `ADD COLUMN IF NOT EXISTS` only, using **existing names where they differ** (keep `latitude/longitude`, `address`, `status`). Add `admins.admin_role/municipality/is_demo`; `bhws.last_active_at`; patients `phone, has_smartphone, yakap_stage, clinic_id, sharing_consent, created_on_device_at, updated_at`; records `measured_at, glucose_*, height_cm, contact_outcome, barrier, next_action, transcription_status, review_status, created_on_device_at`, and **`origin`** for field/patient/clinic (do not overload `source`). Widen the `records_record_type_check` CHECK to the union of old and new values (drop + recreate the constraint, existing values still valid). | 01 |
| 1.2 | Tables missing | New tables `clinics`, `appointments`, `care_plans` with permissive policies matching the existing style. Leave existing `record_type='appointment'` rows in place and read both during transition. | 01 |
| 1.3 | Personas differ or missing | Update seed names on the **same fixed IDs** (a…01 → Carmen Reyes (DEMO), b…01 → Liza Mendoza (DEMO), b…02 → Joel Bautista (DEMO), b…03 → Ana Villanueva (DEMO)). Add a…02 Dr. Ramon Santos (DEMO) (needs an email), patients c…006–c…008, and clinics. Use absolute or anchored timestamps for determinism. `apply_foundation.sql` must use `ON CONFLICT DO UPDATE` so existing databases pick up the renames. | 01 |
| 1.4 | Theme tokens differ | Change the `theme.ts` values to the brief's palette. Add `pending` and `error` aliases (keep `warning`/`danger` so nothing breaks). | 01 |
| 1.5 | Required shared components missing | Add `StatusChip, OfflineBanner, LastUpdated, NextStepCard, MeasurementCard, MetricTile, RoleHeader, EmptyState, ConfirmSheet`. `RoleHeader` wraps `DemoQuickSwitchHeader` and adds persistence and clinician mode. | 01 |
| 1.6 | No contexts | Add `src/shared/context/` with `DemoRoleContext` (persisted via `setCache`), `ConnectivityContext` and `SyncContext`, mounted in `app/_layout.tsx` (modifies the root layout to wrap providers) | 01 |
| 1.7 | Date format | Add `formatDateDMY()` producing "04 Oct 2026" and use it in new UI. Optionally switch `formatDate` (modifies). | 01 |
| 1.8 | EN/FIL labels | `status.ts` with paired labels, marked for native-speaker review | 01 |
| 1.9 | Patient screens | New routes `/patient/yakap`, `/patient/care-plan`, help modal. Home gets a `NextStepCard`; My Health gets glucose/height and manual clearbook entry (saved locally). | 03 |
| 1.10 | BHW screens | Repurpose the `/bhw` index screen as Today (keep the path; move Dashboard content down or into a hidden route). Add `/bhw/patients/[id]/visit` with outcome, barrier and next action in one save. Add attendance confirmation (patient-reported vs clinic-confirmed). | 04 |
| 1.11 | Admin screens | `/admin` index → Needs Attention (unassigned help requests, overdue reviews, barriers, inactive BHWs). Keep `bhw-management`/`patient-management` as Assignments. Add `/admin/summary` with 4 `MetricTile`s ("n of d (p%)", zero denominator → "No cases") and `/admin/clinical-review`, gated by clinician mode. | 05 |
| 1.12 | Launcher | Add a "Demo as Clinician" card and Reset demo data. Label "Simulated role — no real authentication". | 01 |

### P2 Safety and copy

| # | Gap | Smallest change | Spec |
|---|---|---|---|
| 2.1 | "Elevated BP patients" metric and the red "(elevated BP)" tag are an unvalidated risk label | Remove from the RHU summary, or relabel neutrally ("Readings ≥140/90 awaiting clinician review") without red, routed to Clinical Review (modifies `HealthMetricsGrid`, `RecordListItem`) | 05 |
| 2.2 | "Live field records" implies live monitoring | Rename to "Latest field records" (modifies copy) | 05 |
| 2.3 | Status shown by color only in places (`BHWList` ACTIVE/INACTIVE colored text; sync badges have no icon) | Use `StatusChip` | 01 / 04 / 05 |
| 2.4 | No urgent-care guidance anywhere | Add to the help-request form and Patient Home | 02 |
| 2.5 | Sync copy says "Upload … to Supabase" / "SYNCED", while the brief defers cloud sync | See conflict C1. Relabel to "Sent to demo server" plus a footnote that full cloud sync is deferred. | 04 |
| 2.6 | Body text mostly 13–15px | Raise to about 16px in new components; leave existing ones unless touched | 01 |

### P3 Tooling and deploy

| # | Gap | Smallest change | Spec |
|---|---|---|---|
| 3.1 | No linter, but tech.md says to run lint after each task | Either run typecheck only, or add `npx expo lint` (installs eslint config: dependency change, needs approval) | 01 |
| 3.2 | CI deploys to GitHub Pages; steering says Vercel | Keep the CI build check and drop or disable the Pages deploy job. If Pages is kept, set `experiments.baseUrl` and the SW scope for the `/<repo>/` subpath. | 06 |
| 3.3 | Migration naming (see C4) | Name new files `20240101000200_<description>.sql` etc. | 01 |
| 3.4 | `EXPO_PUBLIC_DEMO_MAP_CENTER` unused | Read it in `env.ts`, default to the current center; use it in `config.ts` and the seed offsets | 01 |

---

## 10. Conflicts and recommended resolutions

| # | Conflict | Sources | Recommendation |
|---|---|---|---|
| C1 | **Cloud sync of BHW records.** The brief §7.2 defers cloud sync of records ("Do not label them as sent or synchronized"). product.md §4 and tech.md §5 keep the existing BHW **Sync Now** with a "Synced" label. The README demo depends on it. | brief vs product.md / tech.md / README | The brief wins on claims, but the feature is existing and additive rules forbid removal. **Keep Sync Now** as the existing demo upload, do not extend it to other record types, and change its copy to "Sent to demo server" (not "synchronized"). State that cross-device sync is deferred. Confirm with the team. |
| C2 | **`tests` table.** tech.md says "Keep the existing `tests` table". No such table exists. README/tech.md "patients → records → tests" refers to the `connection_test` entity. | tech.md vs migrations | Treat "tests" as `connection_test`; correct the wording in tech.md. |
| C3 | **RLS.** security.md says RLS is **DISABLED**. The migrations, README and product.md use RLS **enabled** with permissive policies. | security.md vs code / product.md | Keep enabled + permissive (the newer files win). Update security.md. |
| C4 | **Migration naming.** structure.md says `NNNN_<description>.sql` (e.g. `0005_help_requests.sql`). The existing files are `20240101000000_*`. `build-setup-sql.mjs` sorts lexically, so `0005_…` would sort **before** the base tables and break `setup.sql`. | structure.md vs code | Keep the timestamp scheme for new migrations (`20240101000200_foundation.sql`, …). |
| C5 | **Route names.** structure.md lists `needs-attention / assignments / summary / clinical-review`, `today / patients/[id]/visit`, `home / my-health / yakap / care-plan`. The existing paths are `/admin`, `/admin/bhw-management`, `/admin/patient-management`, `/bhw`, `/bhw/map`, `/patient/health`, `/patient/profile`. structure.md also says "Keep the existing route paths". | structure.md internal + code | Keep all existing files. Map index routes to the new home screens (Needs Attention / Today / Home), keep `health` as My Health, and add only the missing routes (`summary`, `clinical-review`, `patients/[id]/visit`, `yakap`, `care-plan`, help modal). Assignments = the existing management tabs. |
| C6 | **Storage and map file layout.** structure.md says `storage.ts(.native.ts)` / `mapbox.ts(.native.ts)`. The code and architecture.md use `storage/StorageNative.native.ts` and `mapbox/MapView.native.tsx`. | structure.md vs architecture.md / code | Keep the existing layout; it already keeps native modules out of the web bundle (verified). |
| C7 | **Feature types file.** structure.md says `types.ts`; the code has `types/<role>.types.ts`. | structure.md vs code | Keep existing. |
| C8 | **Field names.** tech.md §4 uses `lat/lng`, `address_label`, `is_active`, `received_at`. The real columns are `latitude/longitude`, `address`, `status`, `created_at`. | tech.md vs schema | Do not rename. Use the real names in new code; add only truly missing columns (§1.4). |
| C9 | **`records.source` semantics.** tech.md says 'field'\|'patient'\|'clinic'; the existing column means 'online'\|'offline_sync'. | tech.md vs schema | Do not overload. Add a new column `origin` for field/patient/clinic. |
| C10 | **`record_type` values.** tech.md says visit/vitals/lab_result/note; existing visit/health_update/appointment. | tech.md vs schema | Widen the CHECK to the union. Move appointments to the new `appointments` table going forward. |
| C11 | **Local key naming.** tech.md says `tuloy:v1:<type>:<id>`; existing `tuloy_offline_records` and `tuloy_cache:*`. Spec 01's reset clears only `tuloy:v1:*`. | tech.md vs code | New data uses `tuloy:v1:*`. Leave the legacy keys working, but **Reset must also clear the legacy keys**, or the old BHW queue survives a reset. |
| C12 | **Sync metadata names.** tech.md says `_sync_status` (5 values), `_attempts`, …; existing `sync_status` (3 values), `synced_at`, `last_error`. | tech.md vs code | Apply tech.md to the new outbox only. Leave the BHW queue fields as is, and map them to dictionary labels in UI. |
| C13 | **Theme values.** The brief/tech.md palette differs from `theme.ts`; app.config `themeColor` is #0E7C66 and the name is "TULOY Health" vs manifest "Tuloy". | brief vs code | Brief wins: update the values and keep the old token names as aliases. Manifest name "Tuloy". Leave `app.config` `name`/`slug` unchanged (changing the slug affects native builds). |
| C14 | **Seed personas.** README and launcher say "Demo Admin (RHU Nurse)", "Demo BHW Maria", "Demo Patient Juana". product.md §7 names Carmen Reyes, Liza Mendoza, etc. | README / code vs product.md | product.md wins. Rename on the same fixed IDs and update the README and launcher copy in Spec 06. |
| C15 | **Deploy target.** README, tech.md and START-HERE say Vercel; ci.yml deploys to GitHub Pages (subpath hosting is not configured). | ci.yml vs docs | Vercel is primary. Keep CI as a build check and disable the Pages job (see 3.2). |
| C16 | **Routes folder.** `apps/mobile/AGENTS.md` says routes live in `src/app/`; they are in `app/`. | AGENTS.md vs code / structure.md | Keep `app/`. Note in AGENTS.md (doc fix only). |
| C17 | **Lint.** tech.md §7 and AGENTS.md say to run lint; no lint script or config exists. | tech.md vs package.json | Typecheck only until the team approves adding `expo lint`. |
| C18 | **Offline map.** tech.md says "missing token → mock map" and "offline → 'Map needs a connection' + list". On web the code uses an OSM iframe for a missing token, and has no offline state. | tech.md vs code | Keep OSM online (better than a mock on web). Add the offline message and list (gap 0.13). |
| C19 | **Patient role scope.** architecture.md says the patient only "views records… assigned by their BHW". The brief adds manual clearbook entry, help requests and care plans. | architecture.md vs brief | Brief wins. |
| C20 | **Older planning docs.** `docs/requirements.md`, `docs/design.md` and `docs/UPDATES.md` describe `health_records` (jsonb vitals), `bhws.name/assigned_region`, `apps/tuloy-expo`, `app/(patient)` groups, `web-build/`. None of this matches the code. The root `.env.example` still lists `NEXT_PUBLIC_*` for a Next.js admin, which architecture.md forbids. | older docs vs code / steering | Treat them as historical. Do not implement from them. Optionally add a "superseded by product-brief.md / audit.md" note at the top (doc-only). |
| C21 | **Mapbox env var name.** Root `.env.example` uses `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`; `apps/mobile/.env.example` and CI use `EXPO_PUBLIC_MAPBOX_TOKEN`. | env templates | Both are accepted by `env.ts`. Document `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` as canonical; no code change needed. |
