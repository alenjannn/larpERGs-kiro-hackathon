# Spec 04 (BHW workspace): shared-file edits

Spec 04 ran in parallel with Specs 03 and 05. Everything else it changed lives in `src/features/bhw/`, `app/bhw/`, or new files.

The three specs shared one working folder, and another session switched its branch while Spec 04 was in progress. To keep Spec 04's uncommitted work off the other branches, it was built in a separate git worktree, `../larpERGs-spec04`, on branch `spec-04-bhw`. That worktree's `apps/mobile/node_modules` is a junction to the main checkout's `node_modules`.

## Edited shared files

| File | Change | Why |
|---|---|---|
| `apps/mobile/src/shared/services/sync.ts` | 1. Imports `confirmPatientOnServer`, `confirmRecordOnServer` and `SyncReadBackError` from `./apiBhw`. 2. In `pushItem`, the patient and record cases call the matching confirm function right after the existing upsert. 3. In the catch, a `SyncReadBackError` is stored with its own message instead of being wrapped by `toUserMessage`. | B-4.4: an item becomes "Synced" only after the server row is read back. A row with the same id but different content is stored as `failed` with a `Needs review:` message, and nothing is overwritten. The upsert calls, the ordering, the network-error handling and `connection_test` are unchanged. |

## New shared files (no merge conflict expected)

- `apps/mobile/src/shared/services/apiBhw.ts`: owned appointments, acknowledge help request, Sync Now read-backs.

## Moved route file

- `apps/mobile/app/bhw/patients.tsx` → `apps/mobile/app/bhw/patients/index.tsx` (plus `_layout.tsx` and `visit.tsx`). The URL `/bhw/patients` is unchanged. BHW-only.

## SQL

- `supabase/migrations/20240101000400_help_request_acknowledged_at.sql` and `supabase/apply_spec4.sql`: one BEFORE UPDATE trigger on `help_requests` (`tg_30_help_request_acknowledged_at`). It only acts when a row moves into `acknowledged`, so it does not interfere with Spec 05 assigning requests.
- `supabase/setup.sql` was **not** regenerated. After merging, run `node scripts/build-setup-sql.mjs` once.

## Not edited

`api.ts`, `storage.ts`, `status.ts`, `outbox.ts`, `outboxCore.ts`, `syncQueues.ts`, contexts, theme and shared components.
