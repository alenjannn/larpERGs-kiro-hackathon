import { Stack } from 'expo-router';

// My Patients tab: list (index) + Patient Visit (/bhw/patients/visit?patientId=…).
// A static route, not [id], so it is exported and precached for offline use (design D1).
export default function BHWPatientsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
