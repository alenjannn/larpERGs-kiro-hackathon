import RoleTabsLayout from '../../src/shared/components/RoleTabsLayout';

export default function PatientLayout() {
  return (
    <RoleTabsLayout
      role="patient"
      tabs={[
        { name: 'index', title: 'Home', icon: 'home' },
        { name: 'health', title: 'My Health', icon: 'heart' },
        { name: 'yakap', title: 'YAKAP & Clinics', shortTitle: 'YAKAP', icon: 'clinic' },
        { name: 'care-plan', title: 'Care Plan', icon: 'document' },
        { name: 'profile', title: 'Profile', icon: 'person' },
      ]}
    />
  );
}
