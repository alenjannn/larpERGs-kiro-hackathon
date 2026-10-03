# Requirements: 05-admin-rhu-workspace

## Introduction

Extends the existing Admin dashboard into the brief's RHU workspace (brief §6). Coordinator persona: **Carmen Reyes (DEMO)**. Clinician persona: **Dr. Ramon Santos (DEMO)**, reached via **Demo as Clinician** or the Clinician mode switch, labelled "Simulated role — no real authentication" (already in `RoleHeader`).

Builds on Specs 01 and 02 (merged): `help_requests` + auto-assign trigger, `appointments`, `care_plans`, `status.ts`, `StatusChip`, `MetricTile`, `ConfirmSheet`, `EmptyState`, `LastUpdated`, `ConnectivityContext`, `DemoRoleContext.clinicianMode`, the admin cache (`admin:<id>`).

**SQL: none.** The Spec 01 schema already has every column and grant this spec needs (`help_requests.assigned_bhw_id/coordination_status`, `patients.bhw_id/yakap_stage`, `appointments.owner_bhw_id`, `care_plans.status/released_at`, `records.review_status`; anon SELECT/INSERT/UPDATE). `supabase/apply_spec5.sql` is **not** created and `setup.sql` is not regenerated.

### Parallel-branch rules

- Edit only `src/features/admin/**` and `app/admin/**`.
- New remote queries go in `src/shared/services/apiAdmin.ts`. `api.ts`, `storage.ts`, `sync.ts`, `status.ts` are not edited.
- Any unavoidable shared edit is listed in `docs/spec-5-shared-edits.md`.
- Spec 05 owns **assigning and reassigning**. Spec 04 owns **acknowledging**; this spec never sets `acknowledged`.

### Conflicts and decisions

| # | Conflict | Decision |
|---|---|---|
| K1 | structure.md lists admin tabs `needs-attention \| assignments \| summary \| clinical-review`; product.md/structure.md also say keep existing route paths. | Keep `/admin` (index), `/admin/patient-management`, `/admin/bhw-management`. Index becomes **Needs Attention**; `patient-management` becomes **Assignments**; `bhw-management` stays **BHWs** (create accounts). Add `/admin/summary` and `/admin/clinical-review`. |
| K2 | Seed "blocked" help request (Marites) is 2 days old, so "blocked > 7 days" is empty in the demo. | Keep the 7-day rule. The section shows its empty state plus a count of newer blocked items. |
| K3 | Demo step 5 releases a plan for Juana, who has no result awaiting review. | Clinical Review has a review queue **and** a patient picker, so a plan can be written for any patient. |
| K4 | Existing dashboard shows "Elevated BP patients" (a clinical label in a coordinator view) and BP values with "(elevated BP)". | Removed from the coordinator views. The field-records feed shows type, title, patient, BHW and time only. |
| K5 | Coordination writes while offline (no outbox for them). | Assign/release buttons are disabled offline with "Assigning needs a connection." Queuing coordination writes is deferred. |
| K6 | Reassigning a patient leaves their open tasks with the old owner. | Reassigning a patient also moves that patient's open help requests and open appointments (`requested`/`confirmed`) to the new BHW. The confirm sheet states the counts. |

### Glossary

- **Inactive BHW.** `status = 'inactive'` or `last_active_at` older than 3 days. A BHW with no `last_active_at` and `status = 'active'` is not flagged.
- **Active owner.** An assigned BHW that is not inactive.
- **Open task.** A help request not `completed`, or an appointment with `requested`/`confirmed` status.
- **Result set requiring review.** A record with `review_status` set (`awaiting_clinical_review` or `plan_released`).
- **Period.** 30, 90 or 180 days back from now (default 180).

## Requirements

### A-1 Needs Attention (coordinator home)

As a coordinator, I want to see only exceptions so that I act where care is stuck.

1. THE SYSTEM SHALL list, in this order: unassigned help requests, unassigned patients, results awaiting clinical review for more than 3 days, blocked help requests older than 7 days, and BHWs inactive for more than 3 days.
2. Each item SHALL show its age (e.g. "Waiting 6 days") and exactly one action: **Assign**, **Open Clinical Review**, **Reassign**, or **Reassign patients**.
3. Each section with no items SHALL show an EmptyState, not be hidden.
4. THE SYSTEM SHALL show the latest field records (BHW-origin records), each tagged "Synced from field", without measurement values.
5. Coordinator mode SHALL NOT show result values; it shows the clinical status chip only.
6. WHILE offline THE SYSTEM SHALL show the cached copy with LastUpdated and disable the actions.

### A-2 Assignments and BHW management

As a coordinator, I want to create BHW accounts and assign work so that every task has an owner.

1. WHEN a coordinator creates a BHW THE SYSTEM SHALL save it with `admin_id` = the coordinator's id (existing behaviour, kept).
2. WHEN a help request is assigned or reassigned THE SYSTEM SHALL set `assigned_bhw_id` and `coordination_status = 'assigned'`, clearing `acknowledged_at` so the new owner acknowledges it (Spec 04). This also applies to `blocked` requests: the new owner starts fresh. Completed requests SHALL NOT be reassignable.
3. WHEN a patient is assigned or reassigned THE SYSTEM SHALL set `patients.bhw_id`, and move the patient's open help requests and open appointments to the new BHW (K6).
4. After a successful assignment the item SHALL disappear from the unassigned lists after the reload that follows.
5. Only active, non-inactive BHWs SHALL be offered as owners.
6. THE SYSTEM SHALL NOT display a ranking of BHWs (no sorting or comparison by performance).
7. Assignments SHALL accept a `bhw` route param that filters to one BHW's patients and tasks (used by "Reassign patients").

### A-3 Summary metrics

As a coordinator, I want honest operational metrics so that I can see follow-through.

1. THE SYSTEM SHALL show four MetricTiles: first-checkup completion, confirmed follow-up attendance, clinical review completion, and task ownership coverage, each as "N of D (P%)" or "No cases".
2. Each tile SHALL show its period, cohort and an "unknown" count.
   - First-checkup: cohort = patients onboarded in the period; numerator = a `clinic_confirmed_attended` appointment or a YAKAP stage after assessment; unknown = past-due appointment without clinic confirmation, or patient-reported only.
   - Follow-up: denominator = appointments due in the period (scheduled ≤ now); numerator = `clinic_confirmed_attended`; breakdown completed / confirmed missed / rescheduled / unknown.
   - Clinical review: denominator = result sets requiring review received in the period; numerator = `plan_released`; unknown = lab results with no review status (not counted).
   - Ownership: denominator = open tasks now; numerator = tasks with an active owner; unknown = owner id not found among BHWs.
3. WHEN a metric is selected THE SYSTEM SHALL list its underlying cases.
4. The follow-up breakdown SHALL sum to the denominator; each appointment is counted once by id.
5. THE SYSTEM SHALL NOT label anything as prevalence, population screening coverage or NCD control, and SHALL show a note that these are operational counts for tracked people only.
6. The cohort rule SHALL be visible: "No patients are marked transferred out or excluded in this demo."

### A-4 Clinical Review (clinician mode only)

As a clinician, I want a restricted review queue so that I can release care plans.

1. WHILE clinician mode is off THE SYSTEM SHALL show an explanation that this is a restricted clinician view, load no clinical data, and show no release action.
2. WHILE clinician mode is on THE SYSTEM SHALL show results awaiting clinical review (value + unit + measured date via MeasurementCard, transcription and clinical chips, received age) and a patient picker.
3. WHEN a clinician saves a draft THE SYSTEM SHALL store `care_plans.status = 'draft'`; drafts are never shown to patients.
4. WHEN a clinician releases a plan (after ConfirmSheet) THE SYSTEM SHALL set `status = 'released'` and `released_at`, set the patient's `awaiting_clinical_review` records to `plan_released`, and move `yakap_stage` from `results_review_pending` to `plan_available`. The plan SHALL appear on the patient's Care Plan after their next online load.
5. Release SHALL be safe to retry (client-generated plan id).
6. THE SYSTEM SHALL NOT display risk probabilities or diagnosis labels, and the form SHALL remind the clinician not to enter them.

### A-5 Demo clinic inbox view

As a coordinator, I want to see incoming help requests so that I can confirm delivery and ownership.

1. THE SYSTEM SHALL list help_requests with created-on-device time, received time, owner and coordination status.
2. WHEN the same request is flushed repeatedly THE SYSTEM SHALL still show a single row (dedupe by id; server PK).

### A-6 Layout and states

1. Lists SHALL render as tables at ≥ 768 px wide and as stacked cards below.
2. Every new screen SHALL have loading, empty, offline and error states.
3. Touch targets ≥ 44 px; status is never colour alone.
