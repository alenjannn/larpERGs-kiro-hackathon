---
inclusion: always
---

# Tuloy Health — Structure steering

```
apps/mobile/
  app/                              route shells only (import a screen, nothing else)
    index.tsx                       Demo Quick-Switch Launcher
    admin/  (tabs) needs-attention | assignments | summary | clinical-review
    bhw/    (tabs) today | patients | patients/[id]/visit | sync
    patient/(tabs) home | my-health | yakap | care-plan   (+ help-request modal)
  src/features/admin|bhw|patient/
    screens/  components/  hooks/  types.ts
  src/shared/
    components/   theme.ts   status.ts (dictionary + labels, EN/FIL)
    context/      DemoRoleContext, ConnectivityContext, SyncContext
    services/     supabase.ts api.ts storage.ts(.native.ts) sync.ts outbox.ts mapbox.ts(.native.ts)
  public/         sw.js (if hand-written), manifest.json, icons
supabase/migrations/   NNNN_<description>.sql   (new files only)
supabase/seed.sql      fixed-UUID DEMO DATA
docs/product-brief.md
```

## Routing rules

- **Paths.** Keep the existing route paths. Add new ones under the role prefix (`/admin`, `/bhw`, `/patient`).
- **Role switching.** Every role layout renders `RoleHeader`, which switches role in one tap and persists the choice.
- **Clinician mode.** `clinical-review` renders only when clinician mode is on. Otherwise it shows an explanation that this is a restricted clinician view.

## Naming

- **Files.** Feature files are `PascalCase.tsx` for components and screens, `useCamelCase.ts` for hooks.
- **Migrations.** Named for what they do, e.g. `0005_help_requests.sql`.
