# Tasks: 00-audit-alignment

- [x] 1. Read the steering files, the product brief, the README and the older docs
  - _Requirements: 11_
- [x] 2. Audit schema, RLS, grants, triggers and RPCs; diff against tech.md §4; check setup.sql drift
  - _Requirements: 2_
- [x] 3. Audit storage.ts, StorageWeb.ts, StorageNative(.native).ts and sync.ts
  - _Requirements: 3, 4_
- [x] 4. Audit routes, screens, shared components, theme, hooks and state
  - _Requirements: 5, 6_
- [x] 5. Audit the Mapbox native/web/mock paths and the offline map behavior
  - _Requirements: 7_
- [x] 6. Export the web build to a temp folder; check for a service worker, a manifest and native modules; delete the temp folder
  - _Requirements: 1, 8_
- [x] 7. Audit seed personas and IDs against product.md §7
  - _Requirements: 9_
- [x] 8. Write docs/audit.md with the ranked gap list and conflicts
  - _Requirements: 1, 10, 11_
