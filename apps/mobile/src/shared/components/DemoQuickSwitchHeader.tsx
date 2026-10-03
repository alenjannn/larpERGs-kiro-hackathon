import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { ROLE_META, type DemoRole } from '../config/demo';
import { colors, spacing } from '../theme';

const ROLES: DemoRole[] = ['admin', 'bhw', 'patient'];

/** Persistent role switcher shown at the top of every role layout. */
export default function DemoQuickSwitchHeader() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="link" accessibilityLabel="Back to demo launcher" onPress={() => router.navigate('/')} style={styles.home}>
        <Text style={styles.homeText}>🎯 TULOY</Text>
      </Pressable>
      <View style={styles.buttons}>
        {ROLES.map((role) => {
          const meta = ROLE_META[role];
          const active = pathname === meta.href || pathname.startsWith(`${meta.href}/`);
          return (
            <Pressable
              key={role}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => router.navigate(meta.href)}
              style={[styles.button, active && { backgroundColor: meta.color, borderColor: meta.color }]}
            >
              <Text style={[styles.buttonText, active && styles.activeText]}>
                {meta.emoji} {meta.label}
              </Text>
            </Pressable>
          );
        })}
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
  buttons: { flexDirection: 'row', gap: spacing.xs + 2, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' },
  button: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  activeText: { color: '#fff' },
});
