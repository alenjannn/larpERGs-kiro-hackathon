# Design Specification

## System Architecture & Directory Tree

```text
larpERGs-kiro-hackathon/
├── .kiro/steering/           # System steering rules
├── docs/                     # Project documentation
├── supabase/
│   ├── setup.sql             # Full DB initialization script
│   └── seed.sql              # Test data (Admin -> BHW -> Patient)
└── apps/
    └── mobile/               # Unified Expo App (Mobile & Web PWA)
        ├── .env              # Local keys (EXPO_PUBLIC_*)
        ├── app/              # Lightweight Expo Router shells
        │   ├── index.tsx     # Demo Quick-Switch Launcher
        │   ├── admin/        # Admin routes
        │   ├── bhw/          # BHW routes
        │   └── patient/      # Patient routes
        └── src/
            ├── features/     # Isolated feature workspaces
            │   ├── admin/
            │   ├── bhw/
            │   └── patient/
            └── shared/       # Cross-role services (DB, Maps, UI)
```

## Database Schema (Supabase)

### Table: `bhws`

* `id` (uuid, primary key)
* `name` (text)
* `assigned_region` (text)
* `created_at` (timestamp)

### Table: `patients`

* `id` (uuid, primary key)
* `bhw_id` (uuid, foreign key -> `bhws.id`)
* `full_name` (text)
* `address` (text)
* `created_at` (timestamp)

### Table: `health_records`

* `id` (uuid, primary key)
* `patient_id` (uuid, foreign key -> `patients.id`)
* `bhw_id` (uuid, foreign key -> `bhws.id`)
* `vitals` (jsonb)
* `notes` (text)
* `sync_status` (text)
* `created_at` (timestamp)

## Offline Storage Schema (SQLite Native / Web LocalStorage)

* Table: `local_health_records` (`local_id`, `patient_id`, `bhw_id`, `vitals`, `notes`, `sync_status`, `created_at`)
