# Design: 00-audit-alignment

## Approach

The audit is a static read of the repository plus two non-destructive checks. The deliverable is one Markdown file, `docs/audit.md`, with one section per requirement (2–11).

| Source | Used for |
|---|---|
| `supabase/migrations/*.sql`, `seed.sql`, `setup.sql`, `scripts/build-setup-sql.mjs` | Schema, RLS, grants, seed, setup drift |
| `apps/mobile/src/shared/services/**` | Storage, sync, api, supabase, mapbox |
| `apps/mobile/app/**`, `src/features/**`, `src/shared/**` | Routes, screens, components, hooks, theme |
| `app.config.ts`, `package.json`, `vercel.json`, `.github/workflows/ci.yml` | Web build, manifest, deploy |
| `.kiro/steering/*.md`, `docs/product-brief.md`, `README.md`, `docs/*.md`, `apps/mobile/AGENTS.md` | Expected state and conflicts |

## Verification checks (no repository writes)

1. `npm run typecheck` in `apps/mobile`, as a baseline.
2. `npx expo export --platform web --output-dir $env:TEMP\tuloy-audit-dist`, then inspect the output for a service worker, a manifest link and native-only modules (`expo-sqlite`, `@rnmapbox/maps`). Delete the folder afterwards.
3. Regenerate `setup.sql` in memory and compare it with the committed file, ignoring line endings.

## Gap ranking

1. **P0 Offline-first core:** brief §7 and §9.2 items 2–4.
2. **P1 Foundation:** brief §9 foundation list (shared identity, schema, personas, role screens).
3. **P2 Safety and copy:** product.md §3 non-negotiables.
4. **P3 Tooling and deploy.**

Each gap names the smallest additive change and the spec (01–06) that should own it.

## Conflict resolution rule

Brief > product.md / tech.md / structure.md > architecture.md / expo.md / security.md > README / older docs. Where the code already works and a document disagrees, prefer the additive option that keeps the existing route, table or service name.
