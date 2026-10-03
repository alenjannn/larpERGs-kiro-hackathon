import type { ExpoConfig } from 'expo/config';

// NOTE: app config runs in Node, so `Platform` from react-native is not available
// here. The @rnmapbox/maps config plugin only touches native (ios/android)
// projects and is a no-op for `expo export --platform web`, so it is safe to
// always register it. The secret downloads token is read at build time only and
// is never bundled into the app (it has no EXPO_PUBLIC_ prefix).
const config: ExpoConfig = {
  name: 'TULOY Health',
  slug: 'tuloy-health',
  version: '1.0.0',
  scheme: 'tuloy-health',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: { supportsTablet: true, bundleIdentifier: 'com.tuloy.health' },
  android: {
    package: 'com.tuloy.health',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png',
    name: 'TULOY Health',
    shortName: 'TULOY',
    themeColor: '#0E7C66',
    backgroundColor: '#F4F7F6',
  },
  plugins: [
    'expo-router',
    'expo-sqlite',
    ['@rnmapbox/maps', { RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOADS_TOKEN }],
  ],
  experiments: { typedRoutes: false },
};

export default config;
