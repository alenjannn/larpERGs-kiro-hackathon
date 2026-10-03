import RoleTabsLayout from '../../src/shared/components/RoleTabsLayout';

export default function PatientLayout() {
  return (
    <RoleTabsLayout
      role="patient"
      tabs={[
        { name: 'index', title: 'Home', icon: '🏠' },
        { name: 'health', title: 'My Health', icon: '❤️' },
        { name: 'yakap', title: 'YAKAP & Clinics', icon: '🧭' },
        { name: 'care-plan', title: 'Care Plan', icon: '📋' },
        { name: 'profile', title: 'Profile', icon: '👤' },
      ]}
    />
  );
}
