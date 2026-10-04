import { useEffect } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { usePathname } from 'expo-router';
import AppHeader from './AppHeader';
import Icon from './Icon';
import LanguageToggle from './LanguageToggle';
import { DEMO_PERSONAS, ROLE_META, type DemoRole } from '../config/demo';
import { useDemoRole } from '../context/DemoRoleContext';
import { colors, radius, spacing, text, touch } from '../theme';

const ROLES: DemoRole[] = ['admin', 'bhw', 'patient'];

function roleFromPath(pathname: string): DemoRole | null {
  return ROLES.find((r) => pathname === ROLE_META[r].href || pathname.startsWith(`${ROLE_META[r].href}/`)) ?? null;
}

/**
 * Simulated clinician mode (Admin only). `layout="bar"` sits under the phone
 * header; `layout="panel"` sits in the desktop sidebar. Same switch, same state.
 */
export function ClinicianModeControl({ layout = 'bar' }: { layout?: 'bar' | 'panel' }) {
  const pathname = usePathname();
  const { role, clinicianMode, setClinicianMode } = useDemoRole();
  if (roleFromPath(pathname) !== 'admin') return null;
  const clinicianOn = role === 'admin' && clinicianMode;
  const persona = clinicianOn ? DEMO_PERSONAS.clinician : DEMO_PERSONAS.admin;
  const panel = layout === 'panel';

  return (
    <View style={panel ? styles.panel : styles.bar}>
      <View style={styles.switchGroup}>
        <Switch
          value={clinicianOn}
          onValueChange={setClinicianMode}
          accessibilityRole="switch"
          accessibilityLabel="Clinician mode"
          trackColor={{ true: colors.primary, false: colors.borderStrong }}
          thumbColor={colors.surface}
        />
        <Text style={styles.modeLabel}>Clinician mode</Text>
      </View>
      <Text style={styles.persona}>
        {panel ? '' : 'Signed in as '}
        {persona.name}
        {clinicianOn ? ' · clinician' : ' · coordinator'}
      </Text>
      {clinicianOn ? (
        <View style={styles.simulated} accessible accessibilityLabel="Simulated role — no real authentication">
          <Icon name="info" size={13} color={colors.pending} />
          <Text style={styles.simulatedText}>Simulated role — no real authentication</Text>
        </View>
      ) : null}
    </View>
  );
}

/** Language switch for the desktop sidebar (on phones it sits under the header). */
export function LanguageSection() {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Language / Wika</Text>
      <LanguageToggle />
    </View>
  );
}

/**
 * Header for every role layout: route → role sync (persisted), plus on phones
 * the app header and the clinician-mode bar. On desktop the sidebar shows those.
 */
export default function RoleHeader({ chrome = true }: { chrome?: boolean }) {
  const pathname = usePathname();
  const { ready, role, selectRole } = useDemoRole();
  const pathRole = roleFromPath(pathname);

  // The route wins: opening /bhw by URL makes BHW the current role.
  useEffect(() => {
    if (ready && pathRole && pathRole !== role) selectRole(pathRole);
  }, [ready, pathRole, role, selectRole]);

  if (!chrome) return null;
  return (
    <View>
      <AppHeader />
      <View style={styles.languageRow}>
        <LanguageToggle />
      </View>
      <ClinicianModeControl layout="bar" />
    </View>
  );
}

const styles = StyleSheet.create({
  languageRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: spacing.lg,
    rowGap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  panel: {
    gap: spacing.xs,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  switchGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: touch.min },
  panelTitle: text.overline,
  modeLabel: text.label,
  persona: text.muted,
  simulated: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.pendingBg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
  },
  simulatedText: { ...text.caption, color: colors.pending, fontWeight: '700' },
});
