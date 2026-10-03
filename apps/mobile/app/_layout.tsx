import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AppUpdateBanner from '../src/shared/components/AppUpdateBanner';
import AppProviders from '../src/shared/context/AppProviders';

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="dark" />
      <AppUpdateBanner />
      <Stack screenOptions={{ headerShown: false, title: 'TULOY Health' }} />
    </AppProviders>
  );
}
