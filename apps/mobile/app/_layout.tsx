import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AppProviders from '../src/shared/context/AppProviders';

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, title: 'TULOY Health' }} />
    </AppProviders>
  );
}
