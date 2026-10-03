# Spec 5 (Admin RHU workspace): shared edits

**Edits to existing shared files: none.** `api.ts`, `storage.ts`, `sync.ts`, `outbox.ts`, `status.ts`, `theme.ts`, `db.types.ts`, every `src/shared/components/*` and every context are unchanged.

**New shared file (allowed by the parallel-branch rules):**

- `apps/mobile/src/shared/services/apiAdmin.ts`: `fetchAllAppointments`, `fetchCarePlans`, `assignHelpRequest`, `reassignPatient`, `saveCarePlanDraft`, `releaseCarePlan`, and the `OPEN_COORDINATION` / `OPEN_ENCOUNTER` lists.

**SQL: none.** No migration, no `supabase/apply_spec5.sql`, `setup.sql` not regenerated.

## Notes for merging with Specs 3 and 4

- Spec 5 writes `help_requests.assigned_bhw_id`, sets `coordination_status = 'assigned'` and clears `acknowledged_at` on assign/reassign. It never sets `acknowledged` (Spec 4 owns that). A reassigned request needs the new owner to acknowledge it again.
- Reassigning a patient also moves their open help requests (`unassigned`/`assigned`/`acknowledged`/`blocked`) and open appointments (`requested`/`confirmed`) to the new BHW.
- Releasing a care plan writes `care_plans` (status `released`, `released_at`), sets the patient's `records.review_status` from `awaiting_clinical_review` to `plan_released`, and moves `patients.yakap_stage` from `results_review_pending` to `plan_available`. The patient Care Plan (Spec 3) reads the latest released plan, as `fetchReleasedCarePlan` already does.
- Admin routes keep their paths: `/admin` is now Needs Attention, `/admin/patient-management` is Assignments (accepts `?bhw=<id>`), `/admin/bhw-management` is unchanged. New: `/admin/summary`, `/admin/clinical-review`.
- Removed admin-only files: `AdminDashboardScreen`, `AdminPatientsScreen`, `PatientList`, `HealthMetricsGrid`, `NeedsAttentionHelpRequests`. Nothing outside `src/features/admin` imported them.
