# TULOY Health - Environment Configuration Checklist

## Required Credentials Overview

| Variable | Used By | Public/Secret | Required? | Where to Get It |
|----------|---------|---------------|-----------|-----------------|
| EXPO_PUBLIC_SUPABASE_URL | Patient, BHW (mobile) | Public | ✅ YES | Supabase Dashboard |
| EXPO_PUBLIC_SUPABASE_ANON_KEY | Patient, BHW (mobile) | Public | ✅ YES | Supabase Dashboard |
| NEXT_PUBLIC_SUPABASE_URL | Admin (web) | Public | ✅ YES | Supabase Dashboard |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Admin (web) | Public | ✅ YES | Supabase Dashboard |
| EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN | BHW (mobile) | Public | ✅ YES | Mapbox Dashboard |
| MAPBOX_DOWNLOADS_TOKEN | BHW (build time) | Secret | ✅ YES | Mapbox Dashboard |

---

## 1. Supabase Configuration

### What You Need:
- Supabase Project URL
- Supabase Anon/Public Key

### Where to Get It:
1. Go to https://supabase.com/dashboard
2. Create new project (or select existing)
3. Go to **Project Settings** → **API**
4. Copy **Project URL** (looks like: `https://xxxxx.supabase.co`)
5. Copy **anon public** key (starts with `eyJ...`)

### ⚠️ DO NOT USE:
- ❌ **service_role** key (bypasses security)
- ❌ Database password directly

### Where to Put It:

**Patient App:**
```bash
# apps/mobile-patient/.env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...YOUR_KEY_HERE
```

**BHW App:**
```bash
# apps/mobile-bhw/.env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...YOUR_KEY_HERE
```

**Admin App:**
```bash
# apps/admin/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...YOUR_KEY_HERE
```

### Can the app run without it?
❌ **NO** - This is critical for database connectivity (primary demo feature)

---

## 2. Mapbox Configuration

### What You Need:
- Mapbox Public Access Token
- Mapbox Secret Access Token (for downloads)

### Where to Get It:
1. Go to https://account.mapbox.com/
2. Create account or sign in
3. Go to **Access Tokens**
4. Copy default public token (starts with `pk.`)
5. Create new secret token with `DOWNLOADS:READ` scope (starts with `sk.`)

### Where to Put It:

**BHW App:**
```bash
# apps/mobile-bhw/.env
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ...YOUR_PUBLIC_TOKEN
MAPBOX_DOWNLOADS_TOKEN=sk.eyJ...YOUR_SECRET_TOKEN
```

### Can the app run without it?
⚠️ **PARTIAL** - BHW app runs, but Map screen will show error
- Priority: Lower (if time-constrained, can skip Mapbox)
- Workaround: Show mockup instead

---

## 3. Expo Configuration (Optional)

### What You Need (for EAS development builds):
- Expo account

### Where to Get It:
1. Sign up at https://expo.dev/
2. Run `eas login` to authenticate

### When Needed:
Only required if building development build with EAS:
```bash
eas build --profile development --platform android
```

### Can the app run without it?
✅ **YES** - Can develop with Expo Go for most features
- Only needed if building Mapbox development build via EAS

---

## 4. Setup Instructions

### Step 1: Create .env files

**Create these files** (they will be gitignored):
```bash
# Patient App
apps/mobile-patient/.env

# BHW App  
apps/mobile-bhw/.env

# Admin App
apps/admin/.env.local
```

### Step 2: Fill in credentials

Use the checklist above to populate each `.env` file with your credentials.

### Step 3: Verify .env.example

Make sure root `.env.example` documents all variables (with placeholder values):

```bash
# .env.example (ROOT - for documentation)
# Supabase (copy same values to all apps)
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Mapbox (BHW app only)
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ...
MAPBOX_DOWNLOADS_TOKEN=sk.eyJ...
```

### Step 4: Verify .gitignore

Ensure `.gitignore` excludes:
```
.env
.env.*
!.env.example
.env.local
```

### Step 5: Restart development servers

After adding environment variables:
```bash
# Patient App
cd apps/mobile-patient
npx expo start --clear

# BHW App
cd apps/mobile-bhw
npx expo start --clear

# Admin App
cd apps/admin
npm run dev
```

---

## 5. Verification Checklist

After configuration, verify:

- [ ] Supabase project created
- [ ] `connection_test` table exists in Supabase
- [ ] Mapbox account created (if implementing maps)
- [ ] All `.env` files created
- [ ] No `.env` files committed to Git
- [ ] `.env.example` exists with placeholders
- [ ] Patient app launches without "missing env variable" errors
- [ ] BHW app launches without "missing env variable" errors
- [ ] Admin app launches without "missing env variable" errors

---

## 6. Security Verification

- [ ] No `service_role` keys in client apps
- [ ] No real secrets in `.env.example`
- [ ] No credentials in README or docs
- [ ] `.env` files are in `.gitignore`
- [ ] Only `anon`/`public` keys used in mobile/web clients

---

## 7. Troubleshooting

### Error: "Missing EXPO_PUBLIC_SUPABASE_URL"
**Solution:** Create `.env` file in app directory with required variables, then restart dev server with `--clear` flag.

### Error: "Failed to fetch" from Supabase
**Solution:** 
1. Verify Supabase URL is correct (check for typos)
2. Verify anon key is correct
3. Check Supabase project is not paused (free tier auto-pauses after inactivity)
4. Verify RLS policies allow access

### Error: "Invalid Mapbox token"
**Solution:**
1. Verify token starts with `pk.` (public) or `sk.` (secret)
2. Check token has not expired
3. Verify token has correct scopes (secret token needs `DOWNLOADS:READ`)
4. Restart dev server after adding token

### Error: Environment variables undefined
**Solution:**
1. Verify variable name has correct prefix (`EXPO_PUBLIC_` or `NEXT_PUBLIC_`)
2. Restart development server
3. Clear Metro cache: `npx expo start --clear`
