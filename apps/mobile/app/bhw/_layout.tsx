import RoleTabsLayout from '../../src/shared/components/RoleTabsLayout';

export default function BHWLayout() {
  return (
    <RoleTabsLayout
      role="bhw"
      tabs={[
        { name: 'index', title: 'Dashboard', icon: '🏠' },
        { name: 'patients', title: 'My Patients', icon: '👥' },
        { name: 'map', title: 'Map', icon: '🗺️' },
        { name: 'sync', title: 'Sync', icon: '🔄' },
      ]}
    />
  );
}
