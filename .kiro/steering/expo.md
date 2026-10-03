# Expo Development Steering Rules

## Dependency Management

### Always use `npx expo install` for Expo-managed packages
**Rule:** When installing packages in Expo projects, use `npx expo install <package>` instead of `npm install` or `yarn add` to ensure version compatibility with the installed Expo SDK.

**Expo-managed packages include:**
- expo-*
- @expo/*
- React Native core packages (react-native, react, etc.)
- Popular React Native libraries (e.g., @react-navigation/*, @react-native-async-storage/*, etc.)

**❌ WRONG:**
```bash
cd apps/mobile-bhw
npm install expo-sqlite  # ❌ May install incompatible version
```

**✅ CORRECT:**
```bash
cd apps/mobile-bhw
npx expo install expo-sqlite  # ✅ Installs SDK-compatible version
```

### Check compatibility before installing
**Rule:** Before adding a new native module to an Expo project, verify it's compatible with Expo and the installed SDK version.

**Check compatibility:**
1. Search package on https://reactnative.directory/
2. Look for "Expo Go" or "Expo" compatibility badge
3. Check if it requires custom native code
4. If requires custom native code → requires development build (not Expo Go)

## Development Builds vs Expo Go

### Expo Go limitations
**Rule:** Expo Go only supports packages included in the Expo SDK. Packages requiring custom native code (like Mapbox) require development builds.

**Expo Go works with:**
- ✅ All `expo-*` packages
- ✅ Many popular libraries (expo-sqlite, expo-location, etc.)
- ✅ JavaScript-only packages

**Requires development build:**
- ❌ @rnmapbox/maps (custom native code)
- ❌ react-native-ble-manager
- ❌ Custom native modules
- ❌ Firebase with custom native setup

### Use EAS development builds for hackathon
**Rule:** When custom native code is needed (Mapbox), use EAS cloud builds instead of local native builds to save time.

**Local build approach (requires Android Studio/Xcode):**
```bash
npx expo prebuild
npx expo run:android  # Requires Android Studio
npx expo run:ios      # Requires Xcode (Mac only)
```

**EAS cloud build approach (recommended for hackathon):**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Build development build
eas build --profile development --platform android

# Install on device and run
npx expo start --dev-client
```

**For hackathon:** If time is critical and Mapbox integration is blocked, skip it and demonstrate via mockup/screenshot instead.

## Configuration

### Use app.config.ts for dynamic configuration
**Rule:** Use `app.config.ts` (TypeScript) instead of `app.json` to access environment variables and dynamic configuration.

**Example:**
```typescript
// app.config.ts
export default {
  expo: {
    name: "TULOY BHW",
    slug: "tuloy-bhw",
    version: "1.0.0",
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    },
    plugins: [
      [
        '@rnmapbox/maps',
        {
          RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOADS_TOKEN,
        }
      ]
    ]
  }
};
```

### Environment variables must use EXPO_PUBLIC_ prefix
**Rule:** Environment variables accessed in Expo app code MUST use `EXPO_PUBLIC_` prefix to be bundled into the app.

**❌ WRONG:**
```bash
# .env
SUPABASE_URL=https://project.supabase.co  # ❌ Won't be available in app
```

**✅ CORRECT:**
```bash
# .env
EXPO_PUBLIC_SUPABASE_URL=https://project.supabase.co  # ✅ Available in app
```

**Access in code:**
```typescript
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
```

## SDK Version Management

### Check current Expo SDK version
**Rule:** Before creating new Expo app or upgrading dependencies, check which Expo SDK version you're using.

**Check SDK version:**
```bash
npx expo --version  # Check CLI version
```

```json
// package.json - check "expo" dependency version
{
  "dependencies": {
    "expo": "~51.0.0"  // SDK 51
  }
}
```

### Compatible React Native versions
**Rule:** Each Expo SDK version corresponds to a specific React Native version. Do not manually upgrade React Native in Expo projects.

**Example SDK/RN compatibility:**
- Expo SDK 51 → React Native 0.74
- Expo SDK 50 → React Native 0.73
- Expo SDK 49 → React Native 0.72

**Let Expo manage React Native version:**
```bash
npx expo install react-native  # ✅ Installs compatible version
npm install react-native@latest  # ❌ May break Expo compatibility
```

## Development Workflow

### Start development server
**Rule:** Use `npx expo start` to launch the development server, not `npm start` or `yarn start`.

**Correct command:**
```bash
cd apps/mobile-bhw
npx expo start
```

**Options:**
- `npx expo start` - Opens Expo DevTools
- `npx expo start --android` - Opens on Android emulator/device
- `npx expo start --ios` - Opens on iOS simulator (Mac only)
- `npx expo start --web` - Opens web version (if configured)
- `npx expo start --dev-client` - For development builds
- `npx expo start --clear` - Clear Metro bundler cache

### Clear cache when debugging weird issues
**Rule:** If you encounter unexplained errors, cache issues, or "old code" behavior, clear caches before debugging further.

**Clear all caches:**
```bash
npx expo start --clear  # Clear Metro bundler cache
rm -rf node_modules     # Clear dependencies
npm install             # Reinstall dependencies
```

## Platform-Specific Code

### Use Platform module for conditional code
**Rule:** When code needs to differ between iOS and Android, use React Native's Platform module.

**Example:**
```typescript
import { Platform } from 'react-native';

const headerHeight = Platform.select({
  ios: 44,
  android: 56,
  default: 50,
});

if (Platform.OS === 'android') {
  // Android-specific code
}
```

### File extensions for platform-specific files
**Rule:** Use `.ios.tsx` and `.android.tsx` extensions for platform-specific implementations.

**Example:**
```
src/components/
  MapComponent.tsx          # Shared code
  MapComponent.ios.tsx      # iOS-specific implementation
  MapComponent.android.tsx  # Android-specific implementation
```

Expo automatically picks the correct file based on platform.

## Troubleshooting

### Common issues and solutions

**Issue: "Module not found" after installing package**
```bash
# Solution: Clear cache and restart
npx expo start --clear
```

**Issue: "Unable to resolve module" errors**
```bash
# Solution: Verify package installation
npx expo install <package>
rm -rf node_modules
npm install
```

**Issue: "This app is in development mode" on physical device**
```bash
# Solution: Make sure device and dev machine are on same network
# Or use tunneling:
npx expo start --tunnel
```

**Issue: Mapbox not working in Expo Go**
```
Solution: Mapbox requires development build
Options:
1. Use EAS build: eas build --profile development --platform android
2. Use local build: npx expo prebuild && npx expo run:android
3. For hackathon demo: show mockup/screenshot instead
```

**Issue: Environment variables not loading**
```typescript
// Solution: Check prefix and restart
// .env file must have EXPO_PUBLIC_ prefix
EXPO_PUBLIC_SUPABASE_URL=https://...

// Restart Expo dev server after changing .env
npx expo start --clear
```

## Hackathon Time-Savers

### Fastest Expo setup
```bash
# Create new Expo app
npx create-expo-app@latest my-app --template tabs

# Install all dependencies at once
cd my-app
npx expo install @supabase/supabase-js react-native-url-polyfill expo-sqlite react-native-paper

# Start immediately
npx expo start
```

### Skip native builds if time-constrained
**Rule:** If Mapbox integration is taking too long due to development build requirements, proceed with the rest of the demo and show Mapbox via:
1. Screenshot from Mapbox documentation
2. Mockup of map interface
3. Verbal explanation of integration plan

**Remember:** For hackathon, proving database connectivity + offline sync is more critical than map rendering.

### Use Expo DevTools effectively
- Press `r` → reload app
- Press `m` → toggle menu
- Press `j` → open debugger
- Press `i` → run on iOS simulator
- Press `a` → run on Android emulator
