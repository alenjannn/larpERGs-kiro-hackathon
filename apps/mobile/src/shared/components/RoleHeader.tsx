import { useEffect } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { usePathname } from 'expo-router';
import DemoQuickSwitchHeader from './DemoQuickSwitchHeader';
import Icon from './Icon';
import { DEMO_PERSONAS, ROLE_META, type DemoRole } from '../config/demo';
import { useDemoRole } from '../context/DemoRoleContext';
import { colors, spacing, typography } from '../theme';

const ROLES: DemoRole[] = ['admin', 'bhw', 'patient'];

function roleFromPath(pathname: string): DemoRole | null {
  return ROLES.find((r) => pathname === ROLE_META[r].href || pathname.startsWith(`${ROLE_META[r].href}/`)) ?? null;
}

/** Role switcher for every role layout: one-tap switch, persisted, plus the simulated clinician mode on Admin. */
export default function RoleHeader() {
  const pathname = usePathname();
  const { ready, role, clinicianMode, selectRole, setClinicianMode } = useDemoRole();
  const pathRole = roleFromPath(pathname);

  // The route wins: opening /bhw by URL makes BHW the current role.
  useEffect(() => {
    if (ready && pathRole && pathRole !== role) selectRole(pathRole);
  }, [ready, pathRole, role, selectRole]);

  const showClinician = pathRole === 'admin';
  const clinicianOn = showClinician && role === 'admin' && clinicianMode;
  const persona = clinicianOn ? DEMO_PERSONAS.clinician : DEMO_PERSONAS.admin;

  return (
    <View>
      <DemoQuickSwitchHeader onSwitch={(r) => selectRole(r)} />
      {showClinician ? (
        <View style={styles.modeRow}>
          <View style={styles.switchGroup}>
            <Switch
              value={clinicianOn}
              onValueChange={setClinicianMode}
              accessibilityRole="switch"
              accessibilityLabel="Clinician mode"
              trackColor={{ true: colors.primary, false: colors.border }}
            />
            <Text style={styles.modeLabel}>Clinician mode</Text>
          </View>
          <Text style={styles.persona}>
            {persona.name}
            {clinicianOn ? ' · clinician' : ' · coordinator'}
          </Text>
          {clinicianOn ? (
            <View style={styles.simulated} accessible accessibilityLabel="Simulated role — no real authentication">
              <Icon name="info" size={14} color={colors.pending} />
              <Text style={styles.simulatedText}>Simulated role — no real authentication</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  switchGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 },
  modeLabel: { fontSize: typography.small, color: colors.text, fontWeight: '600' },
  persona: { fontSize: typography.small, color: colors.muted },
  simulated: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.pendingBg,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  simulatedText: { fontSize: typography.caption, color: colors.pending, fontWeight: '700' },
});
