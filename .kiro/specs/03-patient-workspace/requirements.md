# Requirements: 03-patient-workspace

## Introduction

This spec builds the Tuloy Patient tabs: **Home**, **My Health**, **YAKAP & Clinics** and **Care Plan**. The demo persona is Juana Dela Cruz (DEMO), `c0000000-0000-4000-8000-000000000001`.

It builds on Specs 01 and 02, which are merged on `main`. These are reused unchanged:
- the help-request outbox (`outbox.ts` / `outboxCore.ts`) and `HelpRequestSheet`, `MyRequestsCard`, `useHelpRequests`,
- the patient snapshot (`usePatientSnapshot`, `tuloy:v1:patient_snapshot:<id>`), `SnapshotStatus`,
- `ConnectivityContext`, `status.ts`, `theme.ts`,
- the shared components `NextStepCard`, `MeasurementCard`, `StatusChip`, `ConfirmSheet`, `EmptyState`, `LastUpdated`, `OfflineBanner`.

**Parallel-branch rules.** This spec runs on branch `spec-03-patient`, next to Specs 04 (BHW) and 05 (Admin/RHU).
- Edits are limited to `src/features/patient/**` and `app/patient/**`.
- New remote queries go in a new file, `src/shared/services/apiPatient.ts`. `api.ts`, `storage.ts`, `sync.ts`, `outbox*.ts` and `status.ts` are not changed.
- If a shared file must change, the edit is minimal and listed in `docs/spec-3-shared-edits.md`. None is planned.
- Spec 05 owns care-plan release. This spec only reads `care_plans` with status `released`.
- Stretch goals are skipped, including P-3 photo upload.

**SQL: none.** The Spec 01 schema already has every column this spec needs (`records.glucose_*`, `measured_at`, `origin`, `transcription_status`, `review_status`; `appointments.encounter_status`; `clinics.*`; `care_plans.*`) and the anon grants (INSERT/UPDATE on `records` and `appointments`, SELECT on `clinics`). No migration is added and `supabase/apply_spec3.sql` is **not** created. See K2 for the alternative that would need SQL.

### Conflicts found and decisions

| # | Conflict | Decision |
|---|---|---|
| K1 | **`source 'patient'` (P-3).** In the real schema, `records.source` is the *transport* column (`'online' \| 'offline_sync'`, CHECK constraint). Spec 01 added `records.origin` (`'field' \| 'patient' \| 'clinic'`) for "who produced it". Likewise `transcription_status` accepts `'pending' \| 'confirmed'`, not "confirmed by patient". | Store `origin = 'patient'`, `source = 'online'`, `transcription_status = 'confirmed'`, `review_status = 'awaiting_clinical_review'`. The UI says "Entered by you · confirmed by you". |
| K2 | **Which lab values (P-3).** The schema has structured columns (value + unit + test type) only for glucose. Other labs (lipids, liver) would need new columns. | Manual clearbook entry covers **blood glucose** (test type fasting / random / after a meal; unit mg/dL or mmol/L). Other lab types are not offered. *Alternative, if preferred at review:* a migration `20240101000300_patient_lab_values.sql` adding nullable `lab_test`, `lab_value`, `lab_unit` to `records`, plus `apply_spec3.sql`. |
| K3 | **Does a clearbook entry leave the device?** Brief §7.2: only help requests need an outgoing queue; other records must not be labelled sent or synced unless they are. But "awaiting clinical review" needs the clinician (Spec 05) to see the row. | Every entry is saved on the device first. When online, saving also makes **one** direct insert attempt (client UUID, `upsert … ignoreDuplicates`, read-back). If that fails or the device is offline, the entry stays "Saved on this device · Not shared with your care team yet" with a **Share now** button (online only). No automatic retry and no queue. "Synced" is shown only after the read-back confirms the row. |
| K4 | **"I already attended" offline.** It updates `appointments`, and only help requests have an offline queue. | Online only. While offline the button is disabled and the card says "Connect to report that you attended. You can still ask for help." After a confirmed update the snapshot copy is patched so Home shows the new status offline too. |
| K5 | **"No duplicate overdue item" (P-1).** `help_requests` has no appointment reference. | "I need another date" opens the existing help-request sheet with reason `another_date` and a prefilled message naming the appointment. If this device already has an `another_date` request created after the appointment's `updated_at`, the button shows that request's status instead of creating another. The appointment row is never duplicated or marked overdue by this spec. |
| K6 | **Tabs.** structure.md lists `home \| my-health \| yakap \| care-plan`. Existing routes are `index`, `health`, `profile`, and route paths must not be renamed. | Keep `index` (Home), `health` (My Health) and `profile`. Add `yakap` (YAKAP & Clinics) and `care-plan` (Care Plan). Five tabs; Profile stays last. |
| K7 | **"While a review is pending, show 'Awaiting clinical review' instead of a plan" (P-6)** vs the demo, where Juana has a released plan and Spec 05 releases new ones. | A review is pending when the patient has a record with `review_status = 'awaiting_clinical_review'` created after the latest released plan (or there is no released plan and `yakap_stage = 'results_review_pending'`). Then the Care Plan tab leads with "Awaiting clinical review". A previously released plan stays visible below it, headed "Your last released plan". With no released plan, only the pending state is shown. |
| K8 | **Clinic availability (P-5).** `clinics` has no availability column. | Availability always shows "Unknown". Accreditation `'unknown'` shows "Unknown". Neither is ever inferred. |
| K9 | **Clinic list offline.** The snapshot holds only the patient's own clinic. | The finder caches the clinic list at `tuloy:v1:clinics` with its own last-updated time (cache-then-network). |

### Out of scope

- Photo upload of the original report (stretch), OCR, ML.
- Editing or deleting clearbook entries; any cross-device sync of them beyond K3.
- Clinic selection, YAKAP enrollment or booking from the app.
- Care-plan authoring or release (Spec 05). BHW and Admin screens (Specs 04, 05).
- Changes to the outbox, snapshot format, status dictionary or shared components.

### Glossary

- **Snapshot.** The Spec 02 offline copy of Patient Home data.
- **Clearbook entry.** A lab value the patient types in from a paper report.
- **Local entry store.** `tuloy:v1:patient_entries:<entryId>`, one key per clearbook entry, in the same `storage.ts` (`kv_v1` on native).
- **Next appointment.** The earliest `appointments` row with a date in the future and status `requested`, `confirmed`, `rescheduled` or `patient_reported_attended`.

Each requirement ends with what verifies it: **M#** = a manual step in `tasks.md`; **A#** = an automated check (typecheck or a Node check script).

---

## Requirements

### P-1 Home, next step first

**User story:** As a patient, I want to see my next care step first, so that I know what to do.

1. THE SYSTEM SHALL order Patient Home as:
   1. `NextStepCard` (or "No next step scheduled yet" with **I need help**),
   2. "Upcoming follow-up": other upcoming appointments,
   3. "Latest measurements": the latest dated BP, glucose, weight and height as `MeasurementCard`s,
   4. "Review status": a clinical `StatusChip` (Awaiting clinical review / Plan released) or "No results waiting for review".

   The existing Spec 02 sections (Need help?, My requests, care team, clinic) follow after these four.
2. THE `NextStepCard` SHALL show the action (appointment purpose), the clinic name, the date if known, a `StatusChip` for the encounter status, and the buttons **I already attended**, **I need another date** and **I need help**. Each button is at least 44 px high and has an accessible label.
3. WHEN **I already attended** is tapped WHILE online THE SYSTEM SHALL show a `ConfirmSheet`. On confirm it SHALL set that appointment's `encounter_status` to `patient_reported_attended` (and `updated_at`), read the row back, and show the chip "Attended (patient-reported)" with the line "Waiting for the clinic to confirm".
4. THE SYSTEM SHALL keep patient-reported attendance visibly distinct from clinic-confirmed: different chip text and icon, and the patient can never set `clinic_confirmed_attended`.
5. IF the device is offline THEN **I already attended** SHALL be disabled with the K4 text. IF the update fails THEN THE SYSTEM SHALL show the error and leave the status unchanged.
6. WHEN **I need another date** is tapped THE SYSTEM SHALL open the help-request sheet with reason "Need another date" preselected and the message "About: <purpose>, <date>" prefilled (editable). Submitting uses the existing outbox, so it works offline.
7. IF a matching `another_date` request already exists on this device (K5) THEN THE SYSTEM SHALL show "You asked for another date on <date, time>" with that request's transport chips instead of creating a new request.
8. THE SYSTEM SHALL NOT create, copy or mark overdue any appointment when another date is requested.
9. THE SYSTEM SHALL NOT show any overall "healthy" score, risk score, or interpretation such as "normal" or "high" anywhere in the Patient workspace.

*Verified by:* M1, M2, M3, M4, A2 (copy grep).

### P-2 My Health

**User story:** As a patient, I want my vitals history with dates and units, so that I can follow changes.

1. THE SYSTEM SHALL show the latest BP (mmHg), glucose (value, unit and test type), weight (kg) and height (cm) as `MeasurementCard`s, each with its measured date (`measured_at`, falling back to `created_at` labelled "Date recorded").
2. IF there is no reading for a measure THEN its card SHALL show "No reading". IF the patient has no measurements at all THEN THE SYSTEM SHALL show the empty state "No readings yet". A missing value is never 0.
3. IF a reading's date is more than 90 days before today THEN THE SYSTEM SHALL label it "Older reading".
4. THE SYSTEM SHALL show a history list per measure, newest first, each row with value, unit and date.
5. THE SYSTEM SHALL plot a simple BP trend: one point per dated reading with both systolic and diastolic, positioned by date. Readings without a date or with a missing value are left out, never drawn as 0 and never interpolated. Lines join only adjacent plotted points. Each point is labelled with its value and date, and the chart has a text alternative listing the points.
6. IF fewer than two BP readings can be plotted THEN THE SYSTEM SHALL show "Not enough dated readings for a trend yet" instead of the chart.
7. Glucose entries from different units SHALL NOT be plotted or compared together. (No glucose chart in this spec.)

*Verified by:* M5, A3 (trend/age helper checks).

### P-3 Manual clearbook entry

**User story:** As a patient, I want to record a lab value from my paper report, so that my record is complete.

1. THE My Health tab SHALL offer **Add a lab result from my paper** that opens an entry form.
2. THE form SHALL require test type (Fasting / Random / After a meal), value, unit (mg/dL / mmol/L) and test date (YYYY-MM-DD, not in the future). Save is disabled until all are valid. Value must be a positive number within the database range (> 0, ≤ 99999.9).
3. WHEN Save is tapped THE SYSTEM SHALL show a confirm step: "Check this against your paper: <test type> · <value> <unit> · Test date <DD Mon YYYY>", with **Go back** and **Save**.
4. WHEN confirmed THE SYSTEM SHALL persist the entry in the local entry store (read back before confirming) with `record_type 'lab_result'`, `origin 'patient'`, `transcription_status 'confirmed'`, `review_status 'awaiting_clinical_review'`, `measured_at` = test date, a client UUID and `created_on_device_at` (K1). Only then SHALL it show "Saved on this device".
5. IF the local write fails THEN THE SYSTEM SHALL show "Could not save on this device: <reason>" and keep the form.
6. WHILE online, after saving, THE SYSTEM SHALL attempt one remote insert (K3). WHEN the read-back confirms the row THE SYSTEM SHALL show "Synced" and "Awaiting clinical review". Otherwise it SHALL show "Saved on this device" and "Not shared with your care team yet", with **Share now** when online.
7. THE entry SHALL appear in My Health immediately and after a reload, online or offline, merged with snapshot records and de-duplicated by id.
8. THE SYSTEM SHALL NOT display any clinical interpretation of the value (no "normal", "high", colour coding or advice). The form shows: "Tuloy does not interpret results. A clinician will review it."
9. Photo upload is not built (stretch skipped).

*Verified by:* M6, M7, A2.

### P-4 My YAKAP Checkup tracker

**User story:** As a patient, I want to see where I am in the YAKAP pathway, so that I know my next milestone.

1. THE YAKAP & Clinics tab SHALL show the eight brief §3 stages in order, each with its patient action. The current stage (`patients.yakap_stage`) is highlighted by a border, a "You are here" label and an icon, not colour alone. Earlier stages show "Done" text; later ones show "Later".
2. IF `yakap_stage` is null THEN THE SYSTEM SHALL show "Not started yet" and highlight no stage.
3. THE clinic-selection milestone SHALL read "Clinic selected · confirmation pending" until the patient has an appointment at that clinic with `encounter_status = 'clinic_confirmed_attended'`. Then it reads "Clinic confirmed".
4. THE SYSTEM SHALL show the copy "Get help accessing YAKAP benefits and completing your next care step".
5. THE SYSTEM SHALL state that in-app clinic selection is not YAKAP enrollment, and SHALL NOT promise free services (no "free", "libre", "walang bayad", "guaranteed" in Patient copy).
6. THE tracker SHALL offer **Ask for help getting started** (opens the help-request sheet) and a link to the official PhilHealth YAKAP page.

*Verified by:* M8, A2.

### P-5 Clinic finder

**User story:** As a patient, I want clinic details I can trust, so that I go to the right place.

1. THE YAKAP & Clinics tab SHALL list clinics. Each card SHALL show name, services, address, contact, accreditation (with its source), availability, source and "Last verified <DD Mon YYYY>".
2. IF a field is missing or `yakap_accreditation = 'unknown'` THEN THE SYSTEM SHALL show "Unknown". Availability is always "Unknown" (K8). A missing last-verified date shows "Not verified".
3. WHEN a card is opened (expanded) THE SYSTEM SHALL show "Opening this card does not book an appointment. Ask your health worker or call the clinic." and SHALL NOT show any booked, reserved or scheduled state.
4. Each card SHALL have a link "Official PhilHealth YAKAP page" to `https://www.philhealth.gov.ph/yakap/`, opened in the browser. Offline, the link says it needs a connection.
5. THE patient's own clinic (if any) SHALL be marked "Your clinic (confirmation pending)" or "Your clinic" per P-4.3.
6. THE list SHALL load cache-then-network from `tuloy:v1:clinics` with `LastUpdated`, and show loading, empty ("No clinics listed yet"), offline-without-cache ("Connect once to load the clinic list") and error states.

*Verified by:* M8, M9.

### P-6 Care Plan and care team

**User story:** As a patient, I want my released plan and my care team's contacts, so that I can follow through.

1. THE Care Plan tab SHALL show only a `care_plans` row with status `released` (from the snapshot), with summary, next steps, the clinician's name and "Released <DD Mon YYYY>", and the chip "Plan released".
2. WHILE a review is pending (K7) THE SYSTEM SHALL lead with an "Awaiting clinical review" card. IF there is no released plan THEN that card is shown instead of a plan.
3. IF there is no released plan and no pending review THEN THE SYSTEM SHALL show "No care plan yet. Your clinician releases it after your checkup."
4. THE tab SHALL show the care team: the assigned BHW's name, barangay and phone (DEMO), and the clinic's name and contact. A missing value is "Unknown"; no BHW shows "No health worker assigned yet".
5. THE SYSTEM SHALL NOT show drafts, and SHALL NOT offer any action to edit, release or sign a plan.

*Verified by:* M10.

### P-7 Offline, states and accessibility (all Patient screens)

**User story:** As a patient with a weak connection, I want every Patient screen to work from what was last loaded.

1. Home, My Health, YAKAP & Clinics, Care Plan and Profile SHALL render from the snapshot (and the clinic cache) while offline, with `LastUpdated`. Without a snapshot they show "Connect once to load your information".
2. Every new screen SHALL have loading, empty, offline and error states.
3. Body text SHALL be at least 16 px; all touch targets at least 44 × 44 px; status is never colour alone.
4. Dates SHALL use `formatDateDMY` / `formatDateTimeDMY` ("04 Oct 2026").
5. Route files in `app/patient/` SHALL only import and render a screen.
6. All new code SHALL pass `npm run typecheck` with no `any`. The web export (`npx expo export --platform web`) SHALL succeed.
7. Every user-facing string added has an English form; key labels (tab titles, section headings, buttons) also have a Filipino form marked "FIL: needs native-speaker review".

*Verified by:* M11, A1, A4.
