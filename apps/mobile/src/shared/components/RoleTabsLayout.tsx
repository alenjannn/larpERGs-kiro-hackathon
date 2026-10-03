import { StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import RoleHeader from './RoleHeader';
import { ROLE_META, type DemoRole } from '../config/demo';
import { colors } from '../theme';

export interface RoleTab {
  /** Route file name inside the role folder (e.g. "index", "health"). */
  name: string;
  title: string;
  icon: string;
}

/** Quick-Switch header + bottom tabs; role `_layout.tsx` shells only pass config. */
export default function RoleTabsLayout({ role, tabs }: { role: DemoRole; tabs: RoleTab[] }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <RoleHeader />
      <View style={styles.body}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: ROLE_META[role].color,
            tabBarInactiveTintColor: colors.muted,
            tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
          }}
        >
          {tabs.map((tab) => (
            <Tabs.Screen
              key={tab.name}
              name={tab.name}
              options={{
                title: tab.title,
                tabBarIcon: ({ focused }) => <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>{tab.icon}</Text>,
              }}
            />
          ))}
        </Tabs>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#E9EFEC' },
  body: { flex: 1 },
});
