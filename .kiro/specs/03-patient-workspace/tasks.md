# Tasks: 03-patient-workspace

Run the tasks in order.

- After every task, run `npm run typecheck` in `apps/mobile` and fix all errors before starting the next one. There is no lint step.
- Do not run git commands, and do not create or switch branches.
- **No SQL changes.** Do not create `supabase/apply_spec3.sql`, and do not touch the migrations, `seed.sql` or `setup.sql`.
- Edit only `src/features/patient/**`, `app/patient/**` and the new `src/shared/services/apiPatient.ts`. If a shared file must change, make the smallest edit and list it in `docs/spec-3-shared-edits.md`.
- Temporary verification files go in a folder under `$env:TEMP`, outside the repo, and are deleted afterwards.
- Stretch goals (photo upload, OCR) are skipped.

---

- [x] 1. Pure logic and patient copy
  - Create `src/features/patient/copy.ts` (design §5): EN strings plus `PATIENT_COPY_FIL`, marked "FIL: needs native-speaker review".
  - Create the four files in `src/features/patient/logic/`, exactly as in design §3: `nextStep.ts`, `measurements.ts`, `clearbook.ts` and `yakap.ts`.
    - They use type-only imports from `shared/types/db.types` and `shared/services/outboxCore`. `clearbook.ts` may import `parseYMD` and `parseOptionalNumber` from `shared/utils`, which have no React Native imports.
    - Every time-dependent function takes `now` as a parameter.
    - Define `PatientLabInsert` in `clearbook.ts`, so the logic doesn't depend on `apiPatient.ts`. `apiPatient.ts` imports it as a type.
  - Change `YakapStepLine.tsx` to read its labels from `YAKAP_STAGES`. Keep exporting `YAKAP_STAGE_LABELS`, derived from that list, for existing importers.
  - **A3.** Write a temporary `npx tsx` script with every case in design §7 A3. All must pass. Delete the script afterwards.
  - _Requirements: P-1.7, P-2.1–2.6, P-3.2, P-3.4, P-4.1–4.3, P-6.2, K5, K7; design §3, §5_

- [x] 2. Patient API (`src/shared/services/apiPatient.ts`)
  - Add `reportAttended`, `insertPatientLabEntry`, `fetchRecordById` and `fetchClinics`, as in design §2.
    - `reportAttended` filters on `id`, `patient_id` and `encounter_status IN ('requested','confirmed','rescheduled')`, and returns the row or null.
    - `insertPatientLabEntry` uses `upsert(row, { onConflict: 'id', ignoreDuplicates: true })` and supports an optional `AbortSignal`.
  - Do not edit `api.ts`. No screen imports this file.
  - _Requirements: P-1.3, P-1.4, P-3.6, P-5.1; design §2_

- [x] 3. Hooks
  - `hooks/useReportAttended.ts` (design §4.3):
    - online only,
    - null result → "This appointment was already updated. Pull to refresh.",
    - patch the stored snapshot (epoch-guarded), then reload.
  - `hooks/useClearbookEntries.ts` (design §4.6):
    - store entries at `tuloy:v1:patient_entries:<id>`,
    - save and read back before resolving,
    - make one share attempt with a 10 s timeout, single-flight per id,
    - on load, reset `sending` to `failed` ("Sending was interrupted."),
    - no automatic retry,
    - reload the snapshot after a share.
  - `hooks/useClinics.ts` (design §4.7):
    - cache-then-network from `tuloy:v1:clinics`, shape-checked,
    - reload on focus and on reconnect,
    - return `{ clinics, status, lastUpdatedAt, error, loading, reload }`.
  - _Requirements: P-1.3–1.5, P-3.4–3.7, P-5.6, P-7.1, K3, K4, K9; design §4.3, §4.6, §4.7, §6_

- [x] 4. Home: next step first
  - `HelpRequestSheet.tsx`: add optional `initialReason` and `initialMessage`, applied when the sheet opens with an empty form. Nothing else changes.
  - New components:
    - `NextStepSection.tsx`: `NextStepCard` with **I already attended** (opens a `ConfirmSheet`; disabled offline, with the K4 text), **I need another date** (or the existing request's status) and the built-in **I need help**.
    - `UpcomingFollowUps.tsx`.
    - `LatestMeasurements.tsx`: four `MeasurementCard`s, "Older reading" and "No readings yet".
    - `ReviewStatusCard.tsx`.
  - Rebuild `PatientHomeScreen.tsx` in the design §4.1 order:
    - use `nextAppointment` from `logic/nextStep.ts`,
    - use `mergeRecords(snapshot.records, entries)` for the measurements,
    - remove the "Latest health updates" card,
    - keep one `HelpRequestSheet`, with a preset state.
  - _Requirements: P-1.1–1.9, P-7.1–7.4; design §4.1–4.3_

- [x] 5. My Health and the clearbook
  - `BPTrendChart.tsx` (design §4.5):
    - built from Views only,
    - a range bar per dated reading, with a circle for systolic and a square for diastolic,
    - value and date labels, a legend, and a text alternative,
    - "Not enough dated readings for a trend yet" when there are fewer than 2.
  - `MeasurementHistory.tsx`.
  - `ClearbookEntrySheet.tsx` (design §4.6):
    - steps go form → confirm → saved,
    - the id is created once per sheet session,
    - Escape, backdrop and Android back close it, and focus moves into it on open,
    - shows the no-interpretation note,
    - on a save error, show the error and keep the form.
  - `ClearbookEntryList.tsx`: the chip table in design §4.6, **Share now** (online only), the `DEFERRED_BACKUP` footer, and the empty state.
  - Rebuild `PatientHealthScreen.tsx` in the design §4.4 order. Remove the `StatTile`s. The clearbook section also renders without a snapshot.
  - _Requirements: P-2.1–2.7, P-3.1–3.9, P-7.1–7.4; design §4.4–4.6_

- [x] 6. YAKAP & Clinics tab
  - `YakapTracker.tsx`: eight rows. Mark the current stage with a border, a "You are here" label and an icon. Earlier rows show "Done" and later rows "Later". Each row has an accessibility label. Show the computed clinic-confirmation label.
  - `ClinicCard.tsx`: expandable. Use the field table in design §4.7: "Unknown" for missing fields, availability always "Unknown", "Not verified" for a missing date. Expanded, show the no-booking note and the PhilHealth link (disabled offline, "Needs a connection"). Mark the patient's own clinic.
  - `screens/PatientYakapScreen.tsx`: the tagline, `SnapshotStatus`, the tracker, the not-enrollment note, **Ask for help getting started** (opens `HelpRequestSheet`), the PhilHealth link, and the clinic list. The list has loading, empty, offline-without-cache and error (with Try again) states.
  - `app/patient/yakap.tsx`: a thin shell.
  - _Requirements: P-4.1–4.6, P-5.1–5.6, P-7; design §4.7_

- [x] 7. Care Plan tab and tabs layout
  - `CarePlanCard.tsx` and `CareTeamContacts.tsx` (design §4.8).
  - `screens/PatientCarePlanScreen.tsx`: the `reviewState` branches. For `pending`, show the pending card, then "Your last released plan" if a plan exists. For `released`, show the plan. For `none`, show the empty state. The care team section follows. There are no edit, release or sign actions.
  - `app/patient/care-plan.tsx`: a thin shell.
  - `app/patient/_layout.tsx`: tabs Home (`index`), My Health (`health`), YAKAP & Clinics (`yakap`), Care Plan (`care-plan`), Profile (`profile`).
  - _Requirements: P-6.1–6.5, K6, K7; design §4.8_

- [x] 8. Verification
  - **A1.** Run `npm run typecheck`. Then grep the new and changed files for `: any\b` and `as any`; there must be no hits.
  - **A2.** Grep the copy in `src/features/patient` and `app/patient` for the design §5 banned list. Review each hit. Only identifiers and negations (e.g. "does not book") may remain.
  - **A4.** Run `npx expo export --platform web` in `apps/mobile`. Check that `dist/patient/yakap.html` and `dist/patient/care-plan.html` exist. The web bundle has no `expo-sqlite` or `@rnmapbox`.
  - Confirm no shared file changed besides the new `apiPatient.ts`. If one did, write `docs/spec-3-shared-edits.md`.
  - Do not run the manual test script below; that's for the user. Update it if any implemented behaviour differs from it.
  - _Requirements: P-7.5–7.6; design §7_

---

## Manual test script (for the user)

Prerequisites:
- `apply_foundation.sql` has been applied.
- Press **Reset demo data**.
- Open `/demo` and choose Juana Dela Cruz (DEMO).
- Online steps can use `npx expo start --web`. Offline steps need `npm run export:web` and then `npx serve dist`, with DevTools → Network → Offline.

| # | Steps | Pass condition |
|---|---|---|
| M1 | Open Home online. | The order is: next step "Follow-up BP check (DEMO)" with the clinic, date and "Confirmed" chip, then upcoming follow-up (if any), latest measurements, review status, then Need help / My requests / care plan / care team. No "healthy" or risk score appears anywhere. |
| M2 | Tap **I already attended**, then confirm. | The chip changes to "Attended (patient-reported)" with "Waiting for the clinic to confirm". The button disappears. It reads differently from "Attended (clinic-confirmed)". Reload: the status persists. |
| M3 | Reset. Go offline, then reload Home. | **I already attended** is disabled and shows "Connect to report that you attended. You can still ask for help." |
| M4 | Tap **I need another date**, keep the prefilled message, Submit (online or offline). Reopen Home. | The sheet opens with "Need another date" selected and "About: Follow-up BP check (DEMO), DD Mon YYYY". After saving, the card shows "You asked for another date on …" with transport chips instead of the button. Exactly one request is in My requests. No new or overdue appointment appears. |
| M5 | Open My Health. | It shows BP 132/84 mmHg, weight 61 kg and height 152 cm, each with a measured date. Glucose shows "No reading". The BP trend shows 3 dated bars with labels. There's no "normal" or "high" wording. |
| M6 | **Add a lab result from my paper**: try Save with fields empty, a future date, and value 0. Then enter Fasting · 110 · mg/dL · a past date, Save, then confirm. | Save stays disabled, or errors show, until the form is valid. The confirm step shows the summary. Saved shows "Saved on this device". Online, the chips go to "Synced" then "Awaiting clinical review". On Care Plan, "Awaiting clinical review" leads, with "Your last released plan" below it. |
| M7 | Offline, add another entry, then reload. Go online and tap **Share now**. | Offline: "Saved on this device · Not shared with your care team yet", and it's still there after the reload. Online after Share now: "Synced". Exactly one row exists in Supabase `records` for that id. |
| M8 | Open YAKAP & Clinics. | It shows the eight stages with "Plan available" marked "You are here" (border + label + icon). It shows the tagline and the not-enrollment note. There's no "free" wording. The clinic-selection row reads "confirmation pending" unless a clinic-confirmed visit exists. |
| M9 | Expand each clinic card. Tap the PhilHealth link. Go offline and reload. | Each card shows services, address, contact, accreditation with source, availability "Unknown", source and last verified; the third clinic shows accreditation "Unknown". The no-booking note is shown. The link opens philhealth.gov.ph/yakap. Offline: the list comes from cache with Last updated, and the link is disabled. |
| M10 | Open Care Plan right after Reset. | The released plan shows with Dr. Ramon Santos (DEMO) and the release date. The care team shows Liza Mendoza (DEMO) with barangay and phone, plus the clinic contact. There are no edit or release buttons. |
| M11 | Offline, visit every Patient tab. Then, in a fresh browser profile offline with no snapshot, open Home. | Every tab renders from the saved copy with Last updated. With no snapshot: "Connect once to load your information". Touch targets are ≥ 44 px and body text is 16 px. |
