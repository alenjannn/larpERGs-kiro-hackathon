import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import AppUpdateBanner from '../src/shared/components/AppUpdateBanner';
import AppProviders from '../src/shared/context/AppProviders';
import { FONT_ASSETS, markFontsReady } from '../src/shared/fonts';

// Any render error below shows a recovery screen instead of a blank page.
export { default as ErrorBoundary } from '../src/shared/screens/ErrorScreen';

export default function RootLayout() {
  // Fonts load in the background; text uses the system font until they are ready.
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);
  useEffect(() => {
    if (fontsLoaded) markFontsReady();
    if (fontError) console.warn('App fonts could not load; using the system font:', fontError);
  }, [fontsLoaded, fontError]);

  return (
    <AppProviders>
      <StatusBar style="dark" />
      <AppUpdateBanner />
      <Stack screenOptions={{ headerShown: false, title: 'Tuloy Health' }} />
    </AppProviders>
  );
}
