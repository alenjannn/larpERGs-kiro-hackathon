# Tuloy: Kiro run order

Everything is already in place: the steering files are in `.kiro/steering/`, the brief is at `docs/product-brief.md`, and the full pack is archived at `docs/kiro-prompt-pack.md`. Your job is to open each file below, copy all of it, and paste it into Kiro.

## One-time setup (in Kiro, not files)

| Step | What to do |
|---|---|
| 1 | Open this repo folder in Kiro. |
| 2 | In the chat panel, switch the mode from **Supervised** to **Autopilot**. |
| 3 | Optional: add `EXPO_PUBLIC_DEMO_MAP_CENTER=<lat>,<lng>` to `apps/mobile/.env` for the demo map area. If you skip it, Kiro picks a placeholder. |

## The routine for every spec

| When | Paste this file |
|---|---|
| Start: Specs sidebar → **+** (or type `/spec`) | the spec file from the table below |
| `requirements.md` appears | `routine/1-after-requirements.txt` |
| `design.md` appears | `routine/2-after-design.txt` |
| `tasks.md` appears | `routine/3-after-tasks.txt` |
| Kiro stops partway | `routine/4-if-kiro-stops.txt` |

## The specs, in order

| # | Paste to start the spec | After the tasks finish, you do |
|---|---|---|
| 1 | `spec-00-audit.txt` | Nothing (it only writes `docs/audit.md`). |
| 2 | `spec-01-shared-foundation.txt` | Supabase Dashboard → SQL Editor → paste `supabase/apply_foundation.sql` → Run. |
| 3 | `spec-02-offline-first-core.txt` | If `supabase/apply_spec2.sql` exists, run it in the SQL Editor. |
| 4 | `spec-03-patient.txt` | If `supabase/apply_spec3.sql` exists, run it. |
| 5 | `spec-04-bhw.txt` | If `supabase/apply_spec4.sql` exists, run it. |
| 6 | `spec-05-admin-rhu.txt` | If `supabase/apply_spec5.sql` exists, run it. |
| 7 | `spec-06-demo-deploy.txt` | If `supabase/apply_spec6.sql` exists, run it. Then deploy (below). |

Teams working in parallel on Specs 3 to 5: one git branch per team, merge in order 3 → 4 → 5.

## Deploy (after Spec 6)

| Step | What to do |
|---|---|
| 1 | In `apps/mobile`, run `npx expo export --platform web`. |
| 2 | Vercel: set **Root Directory** to `apps/mobile`. |
| 3 | Vercel → Project Settings → Environment Variables: add every `EXPO_PUBLIC_*` variable from `apps/mobile/.env`. |

## Cleanup pass (after the prototype is finished)

Paste these in normal Kiro **chat** (not as specs), one at a time, in order.

| # | Paste | Notes |
|---|---|---|
| 1 | `cleanup/1-final-audit.txt` | Writes `docs/final-audit.md`. |
| 2 | `cleanup/2-fix-audit.txt` | |
| 3 | `cleanup/3a-acceptance-checklist.txt` | Then run the checklist yourself in Chrome on `npx serve dist` with DevTools set to Offline. |
| 3b | `cleanup/3b-acceptance-test-failed-TEMPLATE.txt` | Once per failed test. Replace `#N` and `<what you saw>` first. |
| 4 | `cleanup/4-copy-safety-review.txt` | |
| 5 | `cleanup/5-code-cleanup.txt` | |
| 6 | `cleanup/6-readme-demo.txt` | |

## Reminders

* Offline testing only works on the exported build (`npx serve dist` or the Vercel link), not `expo start`, because the service worker only runs there.
* The Reset demo data button lets anyone with the link wipe and reseed the database. Fine for synthetic hackathon data; don't reuse this Supabase project for anything real.
