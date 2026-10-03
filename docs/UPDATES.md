# TULOY Health Planning Documents - Web/PWA Update

## What Changed

The planning documents have been updated to reflect a **CRITICAL architectural shift**: Instead of building three separate apps, we're now building a **SINGLE unified Expo app** with role-based routing that can be exported to web for single-link deployment.

---

## Key Changes

### 1. Architecture Shift: Three Apps → One Unified Expo App

**Before:**
- `apps/mobile-patient/` - Separate Patient mobile app
- `apps/mobile-bhw/` - Separate BHW mobile app  
- `apps/admin/` - Separate Next.js admin app

**After:**
- `apps/tuloy-expo/` - SINGLE Expo app containing all three roles
  - `app/(patient)/` - Patient role routes
  - `app/(bhw)/` - BHW role routes
  - `app/(admin)/` - Admin role routes
  - `app/index.tsx` - Role selection landing screen

**Why:** Enables single-link web deployment where judges can test all roles from one URL

---

### 2. Web/PWA Compatibility as First-Class Requirement

**New Requirement:** All features MUST support `npx expo export --platform web`

**Primary Demo Method:** Web deployment (Vercel/Netlify)  
**Secondary:** Native mobile testing (optional)

**Benefits:**
- ✅ Instant demo without app installation
- ✅ Judges test all roles from browser
- ✅ Single URL deployment
- ✅ Faster iteration during hackathon
- ✅ No dependency on physical devices

---

### 3. Platform-Aware Implementation Patterns

#### Mapbox: Native vs Web
**Problem:** `@rnmapbox/maps` crashes on web (requires native modules)

**Solution:** Platform-aware components
```typescript
// Native implementation (mobile)
import Mapbox from '@rnmapbox/maps';

// Web fallback (iframe or mapbox-gl)
const MapComponent = Platform.OS === 'web'
  ? require('./MapWeb').default
  : require('./MapNative').default;
```

#### SQLite: Native vs Web
**Problem:** `expo-sqlite` doesn't work on web

**Solution:** Abstracted storage layer
```typescript
export interface LocalStorage {
  initDB(): Promise<void>;
  saveRecord(record: any): Promise<void>;
  getPendingRecords(): Promise<any[]>;
  markSynced(id: string): Promise<void>;
}

// Native: SQLite
// Web: localStorage or IndexedDB
export function createStorage(): LocalStorage {
  return Platform.OS === 'web' 
    ? new StorageWeb()  // localStorage
    : new StorageNative();  // expo-sqlite
}
```

---

### 4. Single-Link Navigation

**New Landing Screen:** `app/index.tsx`
```
TULOY Health Demo
┌─────────────────────┐
│ [👤 Demo as Patient]│
│ [🏥 Demo as BHW]    │
│ [⚙️ Demo as Admin]  │
└─────────────────────┘
```

Judges click role → navigate to role-specific interface → all from one URL

---

## Updated Files

### 1. `.kiro/steering/architecture.md` ✅
**Added entire section:** "Web/PWA Compatibility & Single-Link Demo Deployment"

**New rules:**
- All features must support web platform export
- Native Mapbox must never render on web builds
- SQLite must have localStorage fallback
- Unified single-link navigation pattern
- Platform detection patterns
- Web export commands
- Common web pitfalls to avoid

### 2. `docs/design.md` ✅
**Major changes:**
- Updated directory structure (unified Expo app)
- Changed tech stack (single Expo app, not three separate apps)
- Added platform-aware Mapbox configuration examples
- Added storage abstraction layer examples
- Updated build & deployment section (web export focus)
- Updated architecture principles (added web compatibility)

### 3. `docs/requirements.md` ✅
**Updated sections:**
- Problem statement (emphasizes web export)
- User roles (clarified they're roles in ONE app, not separate apps)
- R3: SQLite with web fallback
- R4: Mapbox with web fallback
- **NEW R6:** Single-link web deployment requirement
- Success criteria (single URL deployment)
- Constraints (web export as primary demo method)

### 4. `docs/tasks.md` ✅
**Complete rewrite:**
- Task 1: Initialize SINGLE Expo app (not three apps)
- Task 3: Role selection landing screen
- Task 4-5-7: Patient, Admin, BHW roles in same app
- Task 6: Platform-aware storage abstraction
- Task 8: Platform-aware Mapbox
- **NEW Task 9:** Web export & deployment (CRITICAL)
- Task 10: Integration testing with web focus

**Time estimates adjusted:** Still ~1.5 hours, but prioritizes web deployment

### 5. `docs/environment-checklist.md` ✅
**No changes needed** - Same credentials required, just used in one app instead of three

---

## New Steering Rules Added

### Platform Detection Pattern
```typescript
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  // Web-compatible implementation
} else {
  // Native implementation
}
```

### Conditional Imports (Avoid Native Module Crashes)
```typescript
// ❌ WRONG - Crashes on web
import Mapbox from '@rnmapbox/maps';

// ✅ CORRECT - Platform-aware
const Mapbox = Platform.OS !== 'web' 
  ? require('@rnmapbox/maps').default 
  : null;
```

### Web Export Configuration
```typescript
// app.config.ts
export default {
  expo: {
    web: {
      bundler: 'metro',
      output: 'static'
    },
    plugins: Platform.select({
      native: [['@rnmapbox/maps', { /* config */ }]],
      web: []  // No native plugins on web
    }) || []
  }
};
```

---

## Impact on Implementation

### What Stays the Same
✅ Supabase setup (same backend)  
✅ Database schema (same connection_test table)  
✅ Environment variables (same credentials)  
✅ Authentication foundation  
✅ RLS policies  
✅ Security rules  

### What Changes
🔄 **Single Expo app** instead of three separate apps  
🔄 **Role-based routing** instead of separate builds  
🔄 **Platform checks** for native modules  
🔄 **Storage abstraction** (SQLite + localStorage)  
🔄 **Map components** (native + web fallback)  
🔄 **Web export** as primary demo method  
🔄 **Single URL deployment** for judges  

---

## Demo Flow Changes

### Old Approach
```
1. Build Patient mobile app → install on device
2. Build BHW mobile app → install on device (dev build for Mapbox)
3. Build Admin Next.js app → deploy separately
4. Demo: Show three separate apps/URLs
```

### New Approach
```
1. Build single Expo app with role-based routing
2. Export to web: npx expo export --platform web
3. Deploy to Vercel: One URL
4. Demo: Share URL → judges click role buttons → test all features
```

**Result:** Faster setup, easier demo, no app installation, works everywhere

---

## Testing Checklist (Updated)

### Web Testing (PRIMARY)
- [ ] `npx expo export --platform web` succeeds
- [ ] All three roles accessible from deployed URL
- [ ] Role selection screen works
- [ ] Patient role: Supabase connection works
- [ ] BHW role: Offline sync works (localStorage)
- [ ] BHW role: Map renders (iframe fallback)
- [ ] Admin role: Shows records from all roles
- [ ] No native module crashes
- [ ] Mobile responsive design

### Native Testing (OPTIONAL)
- [ ] `npx expo start` launches
- [ ] Native Mapbox works on mobile
- [ ] Native SQLite works on mobile
- [ ] Development build can be created if needed

---

## Deployment Commands

### Web Export & Deploy
```bash
# Export
cd apps/tuloy-expo
npx expo export --platform web

# Test locally
npx serve web-build

# Deploy to Vercel
cd web-build
vercel --prod

# Result
https://tuloy-health.vercel.app
```

### Native Build (Optional)
```bash
# For testing Mapbox on mobile
eas build --profile development --platform android
```

---

## Time Savings

**Old approach:** 
- 3 separate apps × 15-20 min each = 45-60 min setup
- 3 separate deployments = 15-20 min
- Total: ~75-80 minutes just for setup

**New approach:**
- 1 Expo app = 10 min setup
- 1 web export + deploy = 10 min
- Total: ~20 minutes setup
- **Savings: ~55 minutes** that can be spent on features/polish

---

## Critical Success Factors

### For Hackathon Demo to Succeed:
1. ✅ Web export must work without errors
2. ✅ All three roles accessible from one URL
3. ✅ Platform checks prevent native module crashes
4. ✅ Offline sync works on web (localStorage)
5. ✅ Map shows something on web (even if just iframe)
6. ✅ Supabase connection works (CORS configured)
7. ✅ Demo script tested end-to-end

### If Web Export Fails:
**Fallback:** Use Expo Go for mobile demo + manual role switching
- Still viable, just less impressive
- Judges need to install Expo Go
- Can't show web compatibility proof

---

## Next Steps

1. **Review updated planning documents**
   - `docs/requirements.md` - Understand new requirements
   - `docs/design.md` - Study unified architecture
   - `docs/tasks.md` - Follow revised task sequence
   - `.kiro/steering/architecture.md` - Read web compatibility rules

2. **Verify understanding of key concepts**
   - Platform.OS checks
   - Storage abstraction pattern
   - Conditional imports
   - Web export process

3. **Gather credentials** (same as before)
   - Supabase URL + anon key
   - Mapbox access tokens

4. **Ready to execute?**
   - Switch to execution mode
   - Follow Task 1 in updated `docs/tasks.md`
   - Focus on web export as primary demo method

---

## Questions to Consider

Before starting implementation:

1. **Do you understand why we switched to a unified app?**
   - Single-link deployment for judges
   - Faster demo, no app installation
   - Proves cross-platform capability

2. **Are you comfortable with platform checks?**
   - `Platform.OS === 'web'` vs native
   - Conditional imports
   - Abstraction layers

3. **What's your fallback if web export fails?**
   - Mobile-only demo
   - Role switching via navigation
   - Still demonstrates all features

4. **What's your time management strategy?**
   - Prioritize web export working
   - Offline sync secondary
   - Mapbox lowest priority

---

## Summary

**BIGGEST CHANGE:** Three separate apps → One unified Expo app with web export

**WHY:** Enable single-link deployment where judges can test all three roles from browser

**KEY PATTERNS:**
- Platform checks (`Platform.OS`)
- Storage abstraction (SQLite native / localStorage web)
- Component variants (MapNative / MapWeb)
- Conditional imports (native modules)

**PRIMARY DEMO METHOD:** Web deployment to Vercel/Netlify

**SUCCESS METRIC:** Judges can test all three roles from one URL in browser without installing anything
