import { useSyncExternalStore, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandMark from './BrandMark';
import Icon from './Icon';
import { TAGLINE } from './OfflineBanner';
import { ROLE_META, type DemoRole } from '../config/demo';
import { colors, layout, radius, spacing, text } from '../theme';

const ROLES: DemoRole[] = ['admin', 'bhw', 'patient'];

/**
 * True when the sign-in screens show the side brand panel. False until after
 * mount: these routes are pre-rendered without a window size, and the first
 * client render must match that HTML or hydration fails.
 */
export function useWideAuth(): boolean {
  const { width } = useWindowDimensions();
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return hydrated && width >= layout.sidebar;
}

const noopSubscribe = () => () => undefined;

/**
 * Shell for the signed-out screens (Login, demo launcher). Wide screens get a
 * brand panel beside the content; phones get the content alone (each screen
 * shows its own compact brand header).
 */
export default function AuthLayout({ children, maxWidth = 440 }: { children: ReactNode; maxWidth?: number }) {
  const wide = useWideAuth();
  const content = (
    <ScrollView contentContainerStyle={[styles.content, wide && styles.contentWide]} keyboardShouldPersistTaps="handled">
      <View style={[styles.inner, { maxWidth }]}>{children}</View>
    </ScrollView>
  );

  if (!wide) return <SafeAreaView style={styles.safe}>{content}</SafeAreaView>;

  return (
    <SafeAreaView style={[styles.safe, styles.row]}>
      <View style={styles.panel}>
        <View style={styles.panelBrand}>
          <BrandMark size={40} inverse />
          <Text style={styles.panelName}>Tuloy Health</Text>
        </View>
        <View style={styles.panelBody}>
          <Text style={styles.panelTitle}>Unified Healthcare Platform</Text>
          <Text style={styles.panelTagline}>{TAGLINE}</Text>
          <View style={styles.roles}>
            {ROLES.map((r) => (
              <View key={r} style={styles.roleRow}>
                <View style={styles.roleIcon}>
                  <Icon name={ROLE_META[r].icon} size={14} color={colors.primaryText} />
                </View>
                <View>
                  <Text style={styles.roleName}>{ROLE_META[r].label}</Text>
                  <Text style={styles.roleWorkspace}>{ROLE_META[r].workspace}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
        <Text style={styles.panelFoot}>DEMO DATA only. Do not enter real patient information.</Text>
      </View>
      <View style={styles.main}>{content}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row' },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg, paddingVertical: spacing.xxl },
  contentWide: { padding: spacing.xxl * 1.5 },
  inner: { width: '100%', alignSelf: 'center', gap: spacing.lg },
  main: { flex: 1 },
  panel: {
    width: '38%',
    maxWidth: 520,
    minWidth: 360,
    backgroundColor: colors.primary,
    padding: spacing.xxl * 1.5,
    justifyContent: 'space-between',
  },
  panelBrand: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  panelName: { ...text.title, color: colors.primaryText, fontSize: 20 },
  panelBody: { gap: spacing.lg },
  panelTitle: { ...text.display, color: colors.primaryText, fontSize: 34, lineHeight: 40 },
  panelTagline: { ...text.body, color: '#E3F4F1', fontStyle: 'italic', fontSize: 18 },
  roles: { gap: spacing.md, marginTop: spacing.lg },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  roleIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleName: { ...text.label, color: colors.primaryText },
  roleWorkspace: { ...text.caption, color: '#E3F4F1' },
  panelFoot: { ...text.caption, color: '#E3F4F1' },
});
