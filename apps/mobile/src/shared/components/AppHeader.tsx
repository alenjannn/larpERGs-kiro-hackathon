import { Pressable, StyleSheet, Text, View, useWindowDimensions, type PressableStateCallbackType } from 'react-native';
import { useRouter } from 'expo-router';
import BrandMark from './BrandMark';
import Button from './Button';
import Icon from './Icon';
import { useAccount } from '../hooks/useAccount';
import { colors, radius, spacing, text, touch } from '../theme';

/** Top bar (phones and tablets): brand (home link), current workspace, account and sign out. */
export default function AppHeader() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const narrow = width < 600;
  const { meta, signedIn, who, email, signOut } = useAccount();

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={meta ? `Tuloy Health, go to ${meta.label} home` : 'Tuloy Health, go to sign in'}
        onPress={() => router.navigate(meta ? meta.href : '/login')}
        style={(state: PressableStateCallbackType & { hovered?: boolean }) => [styles.brand, state.hovered && styles.brandHovered]}
      >
        <BrandMark size={30} />
        {!narrow ? <Text style={styles.brandText}>Tuloy Health</Text> : null}
      </Pressable>

      {meta ? (
        <View
          style={[styles.role, { backgroundColor: meta.tint }]}
          accessible
          accessibilityLabel={`Current workspace: ${meta.label}, ${meta.workspace}`}
        >
          <Icon name={meta.icon} size={13} color={meta.color} />
          <Text style={[styles.roleText, { color: meta.color }]}>{meta.label}</Text>
          {!narrow ? <Text style={styles.workspace}>{meta.workspace}</Text> : null}
        </View>
      ) : null}

      <View style={styles.spacer} />

      {signedIn ? (
        <View style={styles.account}>
          {!narrow ? (
            <Text style={styles.who} numberOfLines={1}>
              {who}
            </Text>
          ) : null}
          <Button
            title="Sign out"
            variant="ghost"
            compact
            icon="logout"
            onPress={() => void signOut()}
            accessibilityLabel={`Sign out${email ? ` ${email}` : ' of the demo persona'}`}
          />
        </View>
      ) : (
        <Button title="Sign in" variant="secondary" compact onPress={() => router.navigate('/login')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2, minHeight: touch.min, paddingHorizontal: spacing.xs, borderRadius: radius.md },
  brandHovered: { backgroundColor: colors.mutedBg },
  brandText: { ...text.title, fontSize: 17 },
  role: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
  },
  roleText: { fontSize: 13, fontWeight: '700' },
  workspace: { fontSize: 13, color: colors.muted },
  spacer: { flex: 1 },
  account: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 1 },
  who: { ...text.caption, maxWidth: 220 },
});
