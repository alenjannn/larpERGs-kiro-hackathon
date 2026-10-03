import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { ROLE_META } from '../config/demo';
import { colors, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';

/** Authenticated role header showing current role & logout action. */
export default function DemoQuickSwitchHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="link" accessibilityLabel="Home" onPress={() => router.navigate(role ? ROLE_META[role].href : '/login')} style={styles.home}>
        <Text style={styles.homeText}>🎯 TULOY Health</Text>
      </Pressable>
      <View style={styles.buttons}>
        {role && (
          <View style={[styles.button, { backgroundColor: ROLE_META[role].color, borderColor: ROLE_META[role].color }]}>
            <Text style={styles.activeText}>
              {ROLE_META[role].emoji} {ROLE_META[role].label} Portal
            </Text>
          </View>
        )}
        {user ? (
          <Pressable onPress={handleLogout} style={[styles.button, styles.logoutBtn]}>
            <Text style={styles.logoutText}>🚪 Logout ({user.email})</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => router.navigate('/login')} style={[styles.button, styles.loginBtn]}>
            <Text style={styles.loginText}>🔑 Login</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#E9EFEC',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  home: { paddingVertical: 6, paddingRight: spacing.sm },
  homeText: { fontSize: 13, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 },
  buttons: { flexDirection: 'row', gap: spacing.xs + 2, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  button: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  logoutBtn: { backgroundColor: colors.dangerBg, borderColor: colors.danger },
  logoutText: { fontSize: 12, color: colors.danger, fontWeight: '700' },
  loginBtn: { backgroundColor: colors.infoBg, borderColor: colors.info },
  loginText: { fontSize: 12, color: colors.info, fontWeight: '700' },
});
