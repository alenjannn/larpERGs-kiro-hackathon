# Requirements: 00-audit-alignment

## Introduction

Spec 0 is a read-only audit. It compares the existing Tuloy project (`apps/mobile`, `supabase/migrations`, `supabase/seed.sql`, `supabase/setup.sql`, `scripts/`) against the steering files (`.kiro/steering/*.md`) and `docs/product-brief.md`. The only output is `docs/audit.md`. Later specs (01–06) use it as their source of truth for real table, column, file and route names.

Precedence used when sources disagree (from product.md): brief > product.md / tech.md / structure.md > architecture.md / expo.md / security.md > README and older docs. Conflicts are named, never resolved silently.

## Requirement 1: No code changes

**User story:** As the team lead, I want the audit to be read-only so that it cannot break the working demo.

#### Acceptance criteria

1. WHEN the audit runs THE SYSTEM SHALL create or modify only `docs/audit.md` and the spec files under `.kiro/specs/00-audit-alignment/`.
2. IF a build or export is needed to verify a claim THEN THE SYSTEM SHALL write its output outside the repository and delete it afterwards.

## Requirement 2: Actual schema

**User story:** As a backend developer, I want the real schema documented so that new migrations only add what is missing.

#### Acceptance criteria

1. WHEN the audit completes THE SYSTEM SHALL list every table with each column's type, nullability, default, CHECK constraint, FK and ON DELETE rule.
2. WHEN the audit completes THE SYSTEM SHALL list every RLS policy, grant, index, trigger and RPC, and state explicitly when none exist.
3. WHEN the audit completes THE SYSTEM SHALL include a table mapping every tech.md §4 field to exists / missing / differs, giving the real column name where it differs.
4. THE SYSTEM SHALL state whether `supabase/setup.sql` matches the output of `scripts/build-setup-sql.mjs`.

## Requirement 3: Local storage

**User story:** As the outbox developer, I want the current storage API documented so that new queues reuse it without breaking BHW Sync Now.

#### Acceptance criteria

1. WHEN the audit completes THE SYSTEM SHALL document the `LocalStorage` interface, both implementations, the web key names and the native database and table names.
2. WHEN the audit completes THE SYSTEM SHALL document how sync status is stored and list the current status values.
3. IF an implementation can lose data without a visible error THEN THE SYSTEM SHALL flag it as a gap.

## Requirement 4: Sync engine

**User story:** As the outbox developer, I want to know how `sync.ts` behaves so that I can match or extend it safely.

#### Acceptance criteria

1. WHEN the audit completes THE SYSTEM SHALL document push order, the idempotency key per entity, error handling and concurrency control.
2. THE SYSTEM SHALL state whether any automatic sync trigger exists.
3. THE SYSTEM SHALL compare the behavior with tech.md §5 (read-back, conflict, single-flight, stale `sending`).

## Requirement 5: Routes and screens

**User story:** As a role-team developer, I want existing routes compared with structure.md so that I add routes without renaming any.

#### Acceptance criteria

1. WHEN the audit completes THE SYSTEM SHALL list every route file, its tab label and the screen it renders, per role.
2. WHEN the audit completes THE SYSTEM SHALL map each structure.md route to an existing route or mark it missing.

## Requirement 6: Shared UI and state

**User story:** As a UI developer, I want the current shared components, theme and state documented so that the foundation spec extends them.

#### Acceptance criteria

1. WHEN the audit completes THE SYSTEM SHALL list every shared component, hook and util.
2. WHEN the audit completes THE SYSTEM SHALL compare `theme.ts` token values with tech.md §6 and the brief §8.
3. THE SYSTEM SHALL state which state library and React contexts exist.

## Requirement 7: Maps

**User story:** As a BHW-team developer, I want the Mapbox setup and fallbacks documented so that the offline map behavior is planned correctly.

#### Acceptance criteria

1. WHEN the audit completes THE SYSTEM SHALL document the native and web map paths, token handling and every fallback branch.
2. THE SYSTEM SHALL state what the map shows while offline.

## Requirement 8: Offline app shell

**User story:** As a demo presenter, I want to know whether the exported web build reopens offline today so that Spec 2 targets the real gap.

#### Acceptance criteria

1. WHEN the audit completes THE SYSTEM SHALL state whether a service worker, web manifest or `public/` folder exists.
2. WHEN the audit completes THE SYSTEM SHALL state whether the exported web build can reopen offline, and what was and was not verified.

## Requirement 9: Seed data

**User story:** As a demo presenter, I want the seed personas and IDs documented so that Reset demo data can be deterministic.

#### Acceptance criteria

1. WHEN the audit completes THE SYSTEM SHALL list every seeded persona with its fixed UUID.
2. THE SYSTEM SHALL compare the personas with product.md §7 and state whether timestamps are fixed.

## Requirement 10: Ranked gap list

**User story:** As the team lead, I want a ranked gap list so that the offline-first core is built first.

#### Acceptance criteria

1. WHEN the audit completes THE SYSTEM SHALL list every gap with a proposed additive change.
2. THE SYSTEM SHALL rank gaps by the brief's priority, with the offline-first core (brief §7) highest.
3. WHERE a proposed change modifies existing code rather than adding to it THE SYSTEM SHALL say so.

## Requirement 11: Conflicts

**User story:** As the team lead, I want conflicts between the README, steering and brief named so that nobody chooses silently.

#### Acceptance criteria

1. WHEN the audit completes THE SYSTEM SHALL list every conflict between the README, steering files, brief, older docs and the code, with its sources.
2. THE SYSTEM SHALL give a recommended resolution for each conflict, following the documented precedence.
