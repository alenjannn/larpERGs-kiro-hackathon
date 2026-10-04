import RoleTabsLayout from '../../src/shared/components/RoleTabsLayout';

export default function BHWLayout() {
  return (
    <RoleTabsLayout
      role="bhw"
      tabs={[
        { name: 'index', title: 'Today', icon: 'home' },
        { name: 'patients', title: 'My Patients', shortTitle: 'Patients', icon: 'list' },
        { name: 'map', title: 'Map', icon: 'map' },
        { name: 'sync', title: 'Sync', icon: 'repeat' },
      ]}
    />
  );
}
