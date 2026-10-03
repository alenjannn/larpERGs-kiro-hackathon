# System Requirements

## Core Goal
Deliver "TULOY Health"—a unified, single-link PWA/Web-ready application demonstrating a complete data pipeline from Admin to BHW to Patient within a 12-hour hackathon timeframe.

## Functional Requirements (EARS Format)
- **WHEN** the application starts up at the root URL (`/`), **THE SYSTEM SHALL** render a Demo Quick-Switch Header allowing instant navigation between Admin, BHW, and Patient roles.
- **WHEN** an Admin registers a new BHW or Patient, **THE SYSTEM SHALL** persist the assignment directly to Supabase.
- **WHEN** a BHW collects patient records while offline, **THE SYSTEM SHALL** store records locally in SQLite (Native) or LocalStorage (Web) with `sync_status = 'pending'`.
- **WHEN** a BHW clicks "Sync Now", **THE SYSTEM SHALL** push all pending local records to Supabase and update local status to `'synced'`.
- **WHEN** a Patient opens their health portal, **THE SYSTEM SHALL** display all synced records created by their assigned BHW.

## Out of Scope
- Production authentication flows (using mock/quick-switch launcher instead).
- AI/Machine Learning models.
- Complex clinical diagnosis tools.
- Real-time continuous GPS tracking.
