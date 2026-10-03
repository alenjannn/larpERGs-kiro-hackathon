# Requirements: 04-bhw-workspace

Extend the existing BHW workspace (My Patients, offline register and visit, Sync Now). Add Today and the combined Patient Visit, and align every status with `status.ts`. Demo persona: Liza Mendoza (DEMO).

## Scope and parallel-branch rules

- Runs in parallel with Specs 03 (Patient) and 05 (Admin) on branch `spec-04-bhw`. Specs 01 and 02 are merged and reused as they are (outbox, snapshot, contexts, `status.ts`, theme, shared components).
- Edits stay in `src/features/bhw/` and `app/bhw/`. New remote queries go in `src/shared/services/apiBhw.ts`. Any shared-file edit is the smallest possible and is listed in `docs/spec-4-shared-edits.md`.
- This spec owns **acknowledging** help requests. Spec 05 owns **assigning** them.
- SQL: one new migration `supabase/migrations/20240101000400_help_request_acknowledged_at.sql` and `supabase/apply_spec4.sql`. `supabase/setup.sql` is not regenerated.
- Stretch goals are skipped (patient QR included).

## Language rule (all requirements)

- L-1 THE SYSTEM SHALL never use the word "non-compliant".
- L-2 THE SYSTEM SHALL NOT present no response, a missed appointment or "could not reach" as evidence of non-adherence or disease.

## B-1 Today queue

**User story:** As a BHW, I want one list of who needs help today so that I can plan my visits.

- B-1.1 THE SYSTEM SHALL list the BHW's owned work items from four sources:
  - received help requests assigned to this BHW (coordination `assigned`, `acknowledged`, `blocked`);
  - appointments owned by this BHW (`owner_bhw_id`) whose scheduled time has passed without confirmed attendance;
  - follow-ups due: owned appointments in the next 7 days, or with no date set yet;
  - open barriers: the BHW's patients whose latest field record has a barrier or the outcome "help needed".
- B-1.2 Each item SHALL show the patient, exactly one next action, and a due date when one applies, written like "04 Oct 2026".
- B-1.3 THE SYSTEM SHALL show "Attendance not yet confirmed" and "Confirmed missed" as separate sections with separate status chips (`encounter.confirmed`/`encounter.requested` vs `encounter.missed`).
- B-1.4 WHEN a later visit for the same patient records "clinic-confirmed attendance" or "rescheduled" THE SYSTEM SHALL remove the attendance or missed item from Today. WHEN it records "patient-reported attendance" THE SYSTEM SHALL keep the item, and its next action SHALL become "Confirm attendance with the clinic".
- B-1.5 WHEN a later field record for the patient has no barrier and an outcome other than "help needed" THE SYSTEM SHALL treat the barrier as resolved.
- B-1.6 Help-request items SHALL show the created-on-device time and the received time on separate lines, and the chips `transport.received_in_inbox` and `coordination.<status>`. One item per request id.
- B-1.7 WHEN the BHW taps **Acknowledge** on an `assigned` help request while online THE SYSTEM SHALL set `coordination_status = 'acknowledged'` and record `acknowledged_at`. The chip SHALL change only after the server confirms the row.
- B-1.8 Acknowledge SHALL be idempotent: repeat taps, or a row already acknowledged, SHALL leave one acknowledged row and SHALL NOT change `acknowledged_at` again.
- B-1.9 IF the device is offline THEN THE SYSTEM SHALL disable Acknowledge and say "Acknowledging needs a connection. Nothing was changed." IF the server rejects the update THEN THE SYSTEM SHALL show the error and keep the previous status.
- B-1.10 WHILE offline THE SYSTEM SHALL render Today from the last cached copy, with `LastUpdated`.
- B-1.11 WHEN no items exist THE SYSTEM SHALL show an empty state per section ("No help requests right now." and "Nothing else needs follow-up today.").

## B-2 Assisted registration offline

**User story:** As a BHW, I want to register a patient without signal so that onboarding isn't blocked.

- B-2.1 WHEN a patient is registered (online or offline) THE SYSTEM SHALL save it locally with a client-generated UUID before confirming, and SHALL show "Saved on this device · Waiting to send".
- B-2.2 THE SYSTEM SHALL let the BHW record "Has a smartphone?" as Yes, No (assisted) or Not asked (`has_smartphone` true / false / null).
- B-2.3 The patient list SHALL show the sync status of locally registered patients with `StatusChip`s from `status.ts`, and assisted patients with an "Assisted (no smartphone)" label.
- B-2.4 Patient QR is a stretch goal and is not built.

## B-3 Patient Visit (one save)

**User story:** As a BHW, I want to record measurements, outcome, barrier and next action together so that I don't enter data twice.

- B-3.1 THE SYSTEM SHALL provide a Patient Visit screen at `/bhw/patients/visit?patientId=<id>`, opened from each patient in My Patients.
- B-3.2 Contact outcomes SHALL be: contacted, could not reach, patient-reported attendance, clinic-confirmed attendance, rescheduled, help needed.
- B-3.3 Barriers SHALL be: transport, unavailable appointment, laboratory access, document help, medicine access, plus "No barrier".
- B-3.4 Measurements SHALL be blood pressure (systolic and diastolic together), glucose (value with unit and test type), weight, height and temperature, each with its unit.
- B-3.5 WHEN saved THE SYSTEM SHALL write exactly one local record (`record_type = 'visit'`) in the existing BHW queue with its sync flags, including `contact_outcome`, `barrier`, `next_action`, `measured_at` (only if a measurement was entered) and `created_on_device_at`.
- B-3.6 IF a value is left blank THEN THE SYSTEM SHALL store null, never 0.
- B-3.7 IF nothing at all is entered THEN THE SYSTEM SHALL NOT save, and SHALL say what to enter.
- B-3.8 IF a value is out of range, or glucose has no unit or test type, THEN THE SYSTEM SHALL explain and keep the form.
- B-3.9 The screen SHALL work offline (from the cached patient list), and SHALL show "Patient not found on this device" when the id is unknown.

## B-4 Sync center (existing)

**User story:** As a BHW, I want to see what is still on my phone so that I know what hasn't reached the RHU.

- B-4.1 THE SYSTEM SHALL show counts for Waiting to send, Sending, Synced, Send failed and Needs review, each as a `StatusChip` with its count.
- B-4.2 Each queue row SHALL show its status chips from `status.ts`.
- B-4.3 WHEN Sync Now is tapped while offline THE SYSTEM SHALL say a connection is needed, send nothing, and keep every item.
- B-4.4 WHEN Sync Now runs THE SYSTEM SHALL mark an item "Synced" only after reading the row back from the server. IF the server row with the same id has different content THEN the item SHALL show "Needs review", and nothing SHALL be overwritten.
- B-4.5 Sync Now SHALL be single-flight and idempotent: repeat taps during a run join that run, and a repeat run never creates duplicate rows.
- B-4.6 The existing Sync Now flow, queue storage and "Clear synced" SHALL keep working.

## B-5 Map of my patients

**User story:** As a BHW, I want to see my patients on a map so that I can plan a route.

- B-5.1 THE SYSTEM SHALL plot the BHW's patients from their synthetic coordinates, labelled "approximate DEMO location".
- B-5.2 Each patient's status SHALL be shown with an icon and a text label (in the marker text and in the list), never colour alone.
- B-5.3 IF the device is offline THEN THE SYSTEM SHALL show "Map needs a connection" followed by the patient list with last-known locations, without crashing.
- B-5.4 IF the Mapbox token is missing THEN THE SYSTEM SHALL show a labelled mock map plus the list, without crashing.

## Non-functional

- N-1 TypeScript strict, no `any`; `npm run typecheck` passes after each task. There is no lint script in this project.
- N-2 Every new screen has loading, empty, offline and error states.
- N-3 Touch targets are at least 44 px and every button has an accessibility label.
- N-4 `expo-sqlite` and `@rnmapbox/maps` stay out of the web bundle; `npm run export:web` succeeds.
