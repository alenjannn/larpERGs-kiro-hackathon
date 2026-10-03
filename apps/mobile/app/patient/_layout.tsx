import RoleTabsLayout from '../../src/shared/components/RoleTabsLayout';

export default function PatientLayout() {
  return (
    <RoleTabsLayout
      role="patient"
      tabs={[
        { name: 'index', title: 'Home', icon: '🏠' },
        { name: 'health', title: 'My Health', icon: '❤️' },
        { name: 'profile', title: 'Profile', icon: '👤' },
      ]}
    />
  );
}
