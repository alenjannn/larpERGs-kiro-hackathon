import RoleTabsLayout from '../../src/shared/components/RoleTabsLayout';

// Existing route paths are kept (index, patient-management, bhw-management); see Spec 05 K1.
export default function AdminLayout() {
  return (
    <RoleTabsLayout
      role="admin"
      tabs={[
        { name: 'index', title: 'Needs Attention', shortTitle: 'Attention', icon: 'flag' },
        { name: 'patient-management', title: 'Assignments', shortTitle: 'Assign', icon: 'swap' },
        { name: 'bhw-management', title: 'BHWs', icon: 'person' },
        { name: 'summary', title: 'Summary', icon: 'chart' },
        { name: 'clinical-review', title: 'Clinical Review', shortTitle: 'Review', icon: 'medical' },
      ]}
    />
  );
}
