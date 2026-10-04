import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type { ComponentProps, ReactNode } from 'react';
import type { Tabs } from 'expo-router';
import BrandMark from './BrandMark';
import Button from './Button';
import Icon, { type IconName } from './Icon';
import { useAccount } from '../hooks/useAccount';
import { colors, layout, radius, spacing, text, touch } from '../theme';

/** Props the Tabs navigator passes to a custom tab bar (not exported publicly by expo-router). */
export type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

interface Props extends TabBarProps {
  /** Icon per route name. */
  icons: Record<string, IconName>;
  /** Shown above the account, e.g. the Admin clinician-mode switch. */
  extra?: ReactNode;
}

/**
 * Desktop navigation (≥ layout.sidebar): brand and workspace, the role's
 * sections, then the account and sign out. Tab presses go through the
 * navigator's own events, exactly like the bottom tab bar.
 */
export default function SideNav({ state, descriptors, navigation, icons, extra }: Props) {
  const { meta, signedIn, who, email, signOut } = useAccount();

  return (
    <View style={styles.nav} role="navigation" accessibilityLabel="Main">
      <View style={styles.brand}>
        <BrandMark size={34} />
        <View style={styles.brandText}>
          <Text style={styles.brandName}>Tuloy Health</Text>
          {meta ? <Text style={styles.brandSub}>{meta.workspace}</Text> : null}
        </View>
      </View>

      {meta ? (
        <View
          style={[styles.role, { backgroundColor: meta.tint }]}
          accessible
          accessibilityLabel={`Current workspace: ${meta.label}, ${meta.workspace}`}
        >
          <View style={[styles.roleIcon, { backgroundColor: meta.color }]}>
            <Icon name={meta.icon} size={12} color={colors.primaryText} />
          </View>
          <Text style={[styles.roleText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      ) : null}

      <Text style={styles.section}>Menu</Text>
      <View style={styles.items}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const options = descriptors[route.key].options;
          const label = options.title ?? route.name;
          const accent = meta?.color ?? colors.primary;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              accessibilityRole="link"
              accessibilityState={{ selected: focused }}
              aria-current={focused ? 'page' : undefined}
              accessibilityLabel={label}
              style={(s: PressableStateCallbackType & { hovered?: boolean }) => [
                styles.item,
                s.hovered && !focused && styles.itemHovered,
                focused && { backgroundColor: meta?.tint ?? colors.primaryBg },
              ]}
            >
              {focused ? <View style={[styles.indicator, { backgroundColor: accent }]} /> : null}
              <Icon name={icons[route.name] ?? 'circle'} size={17} color={focused ? accent : colors.muted} style={styles.itemIcon} />
              <Text style={[styles.itemText, focused && { color: accent, fontWeight: '700' }]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.spacer} />
      {extra}

      {signedIn ? (
        <View style={styles.account}>
          <View style={styles.accountRow}>
            <View style={styles.avatar}>
              <Icon name="person" size={14} color={colors.muted} />
            </View>
            <View style={styles.accountText}>
              <Text style={styles.accountLabel}>Signed in as</Text>
              <Text style={styles.accountWho} numberOfLines={2}>
                {who}
              </Text>
            </View>
          </View>
          <Button
            title="Sign out"
            variant="secondary"
            compact
            icon="logout"
            onPress={() => void signOut()}
            accessibilityLabel={`Sign out${email ? ` ${email}` : ' of the demo persona'}`}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    width: layout.sidebarWidth,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.sm, marginBottom: spacing.lg },
  brandText: { flex: 1 },
  brandName: { ...text.title, fontSize: 17 },
  brandSub: text.caption,
  role: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  roleIcon: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  roleText: { fontSize: 14, fontWeight: '700' },
  section: { ...text.overline, paddingHorizontal: spacing.sm + 2, marginBottom: spacing.xs },
  items: { gap: 2 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: touch.min,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  itemHovered: { backgroundColor: colors.mutedBg },
  indicator: { position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderRadius: 2 },
  itemIcon: { width: 20 },
  itemText: { ...text.label, color: colors.text, flex: 1 },
  spacer: { flex: 1 },
  account: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.mutedBg, alignItems: 'center', justifyContent: 'center' },
  accountText: { flex: 1, minWidth: 0 },
  accountLabel: text.caption,
  accountWho: { ...text.small, fontWeight: '600' },
});
