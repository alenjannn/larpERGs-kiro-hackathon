import RoleTabsLayout from '../../src/shared/components/RoleTabsLayout';

// Existing route paths are kept (index, patient-management, bhw-management); see Spec 05 K1.
export default function AdminLayout() {
  return (
    <RoleTabsLayout
      role="admin"
      tabs={[
        { name: 'index', title: 'Needs Attention', icon: '⚑' },
        { name: 'patient-management', title: 'Assignments', icon: '👥' },
        { name: 'bhw-management', title: 'BHWs', icon: '🏥' },
        { name: 'summary', title: 'Summary', icon: '📊' },
        { name: 'clinical-review', title: 'Clinical Review', icon: '🩺' },
      ]}
    />
  );
}
