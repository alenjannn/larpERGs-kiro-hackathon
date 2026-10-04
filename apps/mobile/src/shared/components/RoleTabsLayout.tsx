import { StyleSheet, Text, View, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Tabs, useRouter, Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from './AppHeader';
import Button from './Button';
import Icon, { type IconName } from './Icon';
import OfflineBanner from './OfflineBanner';
import RoleHeader, { ClinicianModeControl, LanguageSection } from './RoleHeader';
import SideNav from './SideNav';
import { ROLE_META, type DemoRole } from '../config/demo';
import { colors, layout, spacing, text } from '../theme';
import { useEffectiveRole } from '../hooks/useEffectiveRole';

export interface RoleTab {
  /** Route file name inside the role folder (e.g. "index", "health"). */
  name: string;
  title: string;
  /** Label for the phone bottom bar when the title is too long to fit. */
  shortTitle?: string;
  icon: IconName;
}

/** App header + role navigation (bottom tabs on phones, sidebar on wide screens) + strict authentication guard. */
export default function RoleTabsLayout({ role, tabs }: { role: DemoRole; tabs: RoleTab[] }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const sidebar = width >= layout.sidebar;
  // Guard: auth role, or the saved demo persona (K1). See the security note in useEffectiveRole.
  const { role: userRole, loading } = useEffectiveRole();

  // 1. Loading while the session is checked.
  if (loading) {
    return (
      <View style={styles.center} accessibilityRole="progressbar" accessibilityLabel="Loading">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // 2. Not signed in: go to /login.
  if (!userRole) {
    return <Redirect href="/login" />;
  }

  // 3. Signed in as a different role: block access. (No RoleHeader here: its route sync would switch the role.)
  if (userRole !== role) {
    const mine = ROLE_META[userRole];
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppHeader />
        <View style={styles.restricted}>
          <View style={styles.restrictedIcon}>
            <Icon name="blocked" size={28} color={colors.pending} />
          </View>
          <Text style={styles.restrictedTitle} accessibilityRole="header">
            You can&apos;t open the {ROLE_META[role].label} workspace
          </Text>
          <Text style={styles.restrictedBody}>
            You are signed in as {mine.label}. Each role only sees its own workspace.
          </Text>
          <Button title={`Go to the ${mine.label} workspace`} onPress={() => router.replace(mine.href)} style={styles.restrictedBtn} />
        </View>
      </SafeAreaView>
    );
  }

  const accent = ROLE_META[role].color;
  const icons = Object.fromEntries(tabs.map((t) => [t.name, t.icon])) as Record<string, IconName>;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <RoleHeader chrome={!sidebar} />
      <OfflineBanner />
      <View style={styles.body}>
        <Tabs
          tabBar={
            sidebar
              ? (props) => (
                  <SideNav {...props} icons={icons} extra={
                      <>
                        <LanguageSection />
                        {role === 'admin' ? <ClinicianModeControl layout="panel" /> : null}
                      </>
                    } />
                )
              : undefined
          }
          screenOptions={{
            headerShown: false,
            tabBarPosition: sidebar ? 'left' : 'bottom',
            tabBarActiveTintColor: accent,
            tabBarInactiveTintColor: colors.muted,
            tabBarLabelStyle: styles.bottomLabel,
            tabBarStyle: styles.bottomBar,
            sceneStyle: { backgroundColor: colors.bg },
          }}
        >
          {tabs.map((tab) => (
            <Tabs.Screen
              key={tab.name}
              name={tab.name}
              options={{
                title: tab.title,
                tabBarLabel: tab.shortTitle ?? tab.title,
                tabBarAccessibilityLabel: tab.title,
                tabBarIcon: ({ color }) => <Icon name={tab.icon} size={20} color={String(color)} />,
              }}
            />
          ))}
        </Tabs>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  body: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  bottomBar: { backgroundColor: colors.surface, borderTopColor: colors.border, minHeight: 64, paddingTop: spacing.xs },
  bottomLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  restricted: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
    marginTop: spacing.xxl,
  },
  restrictedIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.pendingBg, alignItems: 'center', justifyContent: 'center' },
  restrictedTitle: { ...text.title, textAlign: 'center' },
  restrictedBody: { ...text.body, color: colors.muted, textAlign: 'center' },
  restrictedBtn: { alignSelf: 'stretch' },
});
