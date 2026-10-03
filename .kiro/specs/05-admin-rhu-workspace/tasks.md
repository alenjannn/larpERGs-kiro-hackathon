# Tasks: 05-admin-rhu-workspace

Run in order. After every task run `npm run typecheck` in `apps/mobile` and fix all errors (there is no lint script). Edit only `src/features/admin/**`, `app/admin/**`, the new `src/shared/services/apiAdmin.ts`, this spec folder and `docs/spec-5-shared-edits.md`. **No SQL**: no migration, no `apply_spec5.sql`, no `setup.sql` regeneration.

- [x] 1. Add `src/shared/services/apiAdmin.ts`
  - `fetchAllAppointments`, `fetchCarePlans`, `assignHelpRequest`, `reassignPatient`, `saveCarePlanDraft`, `releaseCarePlan` exactly as design §2.1/§2.3.
  - _Requirements: A-2.2, A-2.3, A-4.3–4.5_

- [x] 2. Add the pure logic and verify it
  - `src/features/admin/needsAttention.ts` (design §3.1) and `summaryMetrics.ts` (§3.2), plus `formatAge`.
  - Temp `npx tsx` script in `$env:TEMP` with seed-shaped data; assert the expected values in design §8; delete it.
  - _Requirements: A-1.1–1.2, A-3.1–3.4_

- [x] 3. Extend the coordinator data and types
  - `useAdminData`: add appointments, raise help-request limit to 200, drop `computeMetrics`. `admin.types.ts`: update `AdminData`, remove `HealthMetrics`.
  - Add `useAssignments(onChanged)` (busy key, error, `assignRequest`, `assignPatient`, offline guard).
  - _Requirements: A-2, A-1.6_

- [x] 4. Add shared admin components
  - `QueueTable`, `AssignSheet`, `FieldRecordsFeed`, rewrite `DemoClinicInbox`.
  - _Requirements: A-1.4–1.5, A-5, A-6_

- [x] 5. Needs Attention screen
  - `NeedsAttentionScreen` (design §5); point `app/admin/index.tsx` at it; delete `AdminDashboardScreen`, `NeedsAttentionHelpRequests`, `HealthMetricsGrid`.
  - _Requirements: A-1, A-5_

- [x] 6. Assignments screen
  - `AssignmentsScreen` with the `bhw` filter; point `app/admin/patient-management.tsx` at it; delete `AdminPatientsScreen` and `PatientList`.
  - _Requirements: A-2_

- [x] 7. Summary screen
  - `MetricCaseList`, `SummaryScreen`, route `app/admin/summary.tsx`.
  - _Requirements: A-3_

- [x] 8. Clinical Review screen
  - `useClinicalReview`, `CarePlanForm`, `ClinicalReviewScreen`, route `app/admin/clinical-review.tsx`.
  - _Requirements: A-4_

- [x] 9. Tabs and shared-edits log
  - `app/admin/_layout.tsx`: Needs Attention, Assignments, BHWs, Summary, Clinical Review.
  - `docs/spec-5-shared-edits.md`.
  - _Requirements: A-6_

- [x] 10. Final checks
  - `npm run typecheck`; `npx expo export --platform web --output-dir <temp>`; grep the new copy for "prevalence", "screening coverage", "NCD control", "risk", "diagnos" (only allowed in "do not" reminders); `git diff --stat` confirms no edits outside the allowed paths.
  - **Results (automated):** typecheck passes; web export succeeds with `/admin/summary` and `/admin/clinical-review` as static routes; the temp logic check matched every expected value in design §8; the copy grep only finds "do not" reminders and code comments; `git status` shows changes only in the allowed paths. **Not verified here:** the live Supabase writes below.
  - Manual (needs Supabase):
    1. Admin → Needs Attention shows Ernesto's request + Ernesto (unassigned), Lito's result (6 days), Ana (inactive 5 days).
    2. Assign Ernesto's request to Joel → it leaves "Unassigned"; inbox shows Assigned · Joel.
    3. Reassign Ernesto (patient) to Liza → confirm note counts; Ernesto leaves the unassigned list.
    4. Summary: follow-up "1 of 3 (33%)", breakdown sums to 3; tap tiles to see cases.
    5. Clinical Review with Clinician mode off → restricted explanation. On → pick Juana, write a plan, Release → Patient Care Plan shows it after an online reload.
    6. Reset demo data restores everything.
