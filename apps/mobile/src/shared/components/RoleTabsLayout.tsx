import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Tabs, useRouter, Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DemoQuickSwitchHeader from './DemoQuickSwitchHeader';
import { ROLE_META, type DemoRole } from '../config/demo';
import { colors, radius, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import Notice from './Notice';
import Button from './Button';

export interface RoleTab {
  /** Route file name inside the role folder (e.g. "index", "health"). */
  name: string;
  title: string;
  icon: string;
}

/** Quick-Switch header + bottom tabs + Strict Authentication Guard. */
export default function RoleTabsLayout({ role, tabs }: { role: DemoRole; tabs: RoleTab[] }) {
  const router = useRouter();
  const { user, role: userRole, loading } = useAuth();

  // 1. Show loading spinner while checking auth session
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // 2. Strict Authentication Guard: If user is NOT logged in, redirect directly to /login
  if (!user || !userRole) {
    return <Redirect href="/login" />;
  }

  // 3. Strict Role Authorization Guard: If logged in as a different role, block access
  if (userRole !== role) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <DemoQuickSwitchHeader />
        <View style={styles.restrictedContainer}>
          <Notice
            tone="warning"
            message={`Access Restricted: You are logged in as "${ROLE_META[userRole].label}". You do not have permission to access the ${ROLE_META[role].label} portal.`}
          />
          <Button
            title={`Go to My Authorized Portal (${ROLE_META[userRole].label})`}
            onPress={() => router.replace(ROLE_META[userRole].href)}
            style={styles.redirectBtn}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <DemoQuickSwitchHeader />
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  restrictedContainer: {
    padding: spacing.lg,
    maxWidth: 450,
    alignSelf: 'center',
    width: '100%',
    marginTop: spacing.xl,
  },
  redirectBtn: { marginTop: spacing.md },
});
