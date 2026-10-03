# Implementation Tasks

- [ ] **Task 1: Environment & Repository Audit**
  - Verify `apps/mobile/.env` contains valid `EXPO_PUBLIC_` keys.
  - Verify `.gitignore` covers all `.env` files.

- [ ] **Task 2: Supabase Schema & Seed Data**
  - Execute `supabase/setup.sql` to build `bhws`, `patients`, and `health_records` tables.
  - Execute `supabase/seed.sql` to insert demo records linking Admin -> BHW -> Patient.

- [ ] **Task 3: Shared Abstraction Services (`src/shared/services/`)**
  - Verify `supabase.ts` initialization.
  - Verify `storage.ts` platform switching (SQLite on Native, `localStorage` on Web).
  - Verify `mapbox.ts` fallback rendering (`MapWeb` / `MockMap` on Web).

- [ ] **Task 4: Admin Feature Workspace (`src/features/admin/`)**
  - Build dashboard to manage BHW assignments and view global health metrics.

- [ ] **Task 5: BHW Feature Workspace (`src/features/bhw/`)**
  - Build offline patient record form, local storage saving, map view, and manual "Sync Now" button.

- [ ] **Task 6: Patient Feature Workspace (`src/features/patient/`)**
  - Build view for patients to review synced medical notes and assigned care team.

- [ ] **Task 7: Demo Quick-Switch Launcher & Build Verification**
  - Wire up `apps/mobile/app/index.tsx` with role switch buttons.
  - Test build with `npx expo export --platform web`.
