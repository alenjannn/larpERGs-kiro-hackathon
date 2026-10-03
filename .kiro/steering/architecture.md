# Architectural Rules & Steering

## Single Workspace Rule
- `apps/mobile` is the **SINGLE UNIFIED** Expo Web / PWA workspace for all three roles: Admin, BHW, and Patient.
- Do NOT look for, reference, or create a separate `apps/admin` directory.
- All environment variables belong exclusively in `apps/mobile/.env` using the `EXPO_PUBLIC_` prefix.

## Hierarchy & Data Flow
- Data flow follows a strict 3-tier chain: **Admin -> BHWs -> Patients**.
- **Admin**: Manages BHW accounts, assignments, and central stats.
- **BHW**: Conducts visits, records data locally/offline, syncs records to Supabase.
- **Patient**: Views health records and schedules assigned by their BHW.

## Modular Feature Isolation
- UI routes in `apps/mobile/app/` must be minimal shells (`index.tsx` files that only import top-level screen components).
- Role logic must be strictly partitioned in `apps/mobile/src/features/`:
  - `src/features/admin/`
  - `src/features/bhw/`
  - `src/features/patient/`
- Shared services (Supabase, local DB, Mapbox) belong in `src/shared/services/`.

## Web/PWA Cross-Platform Guards
- App must export cleanly via `npx expo export --platform web`.
- **SQLite (`expo-sqlite`)**: Wrapped behind a storage repository interface in `src/shared/services/storage/`. On `Platform.OS === 'web'`, automatically fall back to `localStorage` or `IndexedDB`.
- **Mapbox (`@rnmapbox/maps`)**: Wrapped in `src/shared/services/mapbox/`. On `Platform.OS === 'web'`, render `MapWeb.tsx` or `MockMap.tsx` to prevent native module crashes.