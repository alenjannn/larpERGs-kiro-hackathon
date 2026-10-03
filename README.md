# TULOY Health

One Expo app, three connected roles, one link:

```
Admin (RHU)  ──manages──▶  BHWs (Barangay Health Workers)  ──care for──▶  Patients
   creates BHW accounts,       collect records in the field          see visits, health
   assigns patients,           OFFLINE, then "Sync Now"              updates and appointments
   monitors activity           to Supabase                           from their BHW
```

## Quick start

```bash
# 1. Backend: Supabase Dashboard → SQL Editor → paste supabase/setup.sql → Run
#    (creates connection_test, admins → bhws → patients → records, RLS, demo seed)

# 2. App env
cd apps/mobile
cp .env.example .env        # fill EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY
npm install

# 3. Run
npx expo start --web        # browser
npx expo start              # Expo Go (map falls back to a mock; SQLite works)
```

The root page is the **Demo Quick-Switch Launcher** (`[Demo as Admin]`, `[Demo as BHW]`,
`[Demo as Patient]`); a header inside every role switches roles in one tap.

## Demo script (≈3 min)

1. **Admin** → dashboard shows BHW activity, health metrics and live field records.
2. **BHW** → DevTools “Offline” (or airplane mode) → *My Patients* → log a visit / register a patient →
   saved on-device as *pending*.
3. Back online → **Sync** tab → **Sync Now** → items flip to *synced*.
4. **Admin** → the new record appears (tagged “synced from field”); reassign patients on *Patients*.
5. **Patient** → Juana sees the visit, vitals and appointments her BHW created.

## Web export & deploy (single link)

```bash
cd apps/mobile
npx expo export --platform web   # → dist/ (static, one HTML file per route)
npx serve dist                    # local check
```

Vercel: set the project **Root Directory** to `apps/mobile` (uses `vercel.json`) and add the
`EXPO_PUBLIC_*` variables in Project Settings → Environment Variables. Add the deployed URL in
Supabase → Authentication → URL Configuration if you later enable auth.

## Layout

```
apps/mobile/
  app/                         route shells only (import a screen, nothing else)
  src/features/admin|bhw|patient/   role workspaces: screens, components, hooks, types
  src/shared/services/
    supabase.ts                anon-key client (refuses service_role keys)
    api.ts                     all table queries/mutations
    storage.ts                 offline repository: SQLite (native) / localStorage (web)
    sync.ts                    Sync Now: patients → records → tests, idempotent upserts
    mapbox.ts                  map: @rnmapbox/maps (native) / mapbox-gl or OSM (web)
supabase/migrations/, seed.sql, setup.sql (generated: node scripts/build-setup-sql.mjs)
```

Platform splits use `.native.ts(x)` files so `expo-sqlite` and `@rnmapbox/maps` never enter the
web bundle. Native Mapbox needs a development build (`eas build --profile development`) and
`MAPBOX_DOWNLOADS_TOKEN`; without it the app shows a mock map instead of crashing.

## Security notes

- Clients only use the anon/publishable key. `.env` files are git-ignored.
- RLS is enabled on every table; policies are **permissive for the hackathon** (no login).
  Before real use, replace them with `auth.uid()`-based policies.
- All seed data is synthetic and labeled DEMO DATA.
