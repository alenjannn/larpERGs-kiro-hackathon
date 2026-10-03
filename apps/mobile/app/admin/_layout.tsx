import RoleTabsLayout from '../../src/shared/components/RoleTabsLayout';

export default function AdminLayout() {
  return (
    <RoleTabsLayout
      role="admin"
      tabs={[
        { name: 'index', title: 'Dashboard', icon: '📊' },
        { name: 'bhw-management', title: 'BHWs', icon: '🏥' },
        { name: 'patient-management', title: 'Patients', icon: '👥' },
      ]}
    />
  );
}
