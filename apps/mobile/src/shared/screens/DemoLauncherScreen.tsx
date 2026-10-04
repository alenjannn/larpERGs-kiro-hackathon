import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View, type PressableStateCallbackType } from 'react-native';
import Text from '../components/Text';
import { useRouter } from 'expo-router';
import AuthLayout, { useWideAuth } from '../components/AuthLayout';
import BrandMark from '../components/BrandMark';
import Button from '../components/Button';
import Card from '../components/Card';
import ConfirmSheet from '../components/ConfirmSheet';
import Icon from '../components/Icon';
import Notice from '../components/Notice';
import SectionHeader from '../components/SectionHeader';
import { env } from '../config/env';
import { DEMO_PERSONAS, ROLE_META, type DemoPersonaKey, type DemoRole } from '../config/demo';
import { useAuth } from '../context/AuthContext';
import { useDemoRole } from '../context/DemoRoleContext';
import { useDemoReset } from '../hooks/useDemoReset';
import { colors, radius, shadow, spacing, text } from '../theme';

const ROLE_CARDS: { key: DemoPersonaKey; title: string; blurb: string; persona: string }[] = [
  {
    key: 'admin',
    title: 'Demo as Admin',
    blurb: 'RHU coordinator: creates and manages BHW accounts, assigns patients and follows up on stuck care.',
    persona: `${DEMO_PERSONAS.admin.name} · coordinator`,
  },
  {
    key: 'clinician',
    title: 'Demo as Clinician',
    blurb: 'Restricted clinician mode of the RHU workspace: reviews results and releases care plans.',
    persona: `${DEMO_PERSONAS.clinician.name} · clinician`,
  },
  {
    key: 'bhw',
    title: 'Demo as BHW',
    blurb: 'Receives patient assignments, logs field visits offline, then taps “Sync Now” to send them to the demo server.',
    persona: `${DEMO_PERSONAS.bhw.name} · Brgy. Demo San Isidro`,
  },
  {
    key: 'patient',
    title: 'Demo as Patient',
    blurb: 'Sees health updates, visit vitals and appointments created by their assigned BHW.',
    persona: DEMO_PERSONAS.patient.name,
  },
];

const RESET_MESSAGE =
  'This deletes everything created during demos on the server, restores the original DEMO DATA, and clears saved data on this device (offline queue, cache and role choice). Continue?';

/** Root landing page: one link, four demo personas, plus Reset demo data. */
export default function DemoLauncherScreen() {
  const router = useRouter();
  const { selectRole } = useDemoRole();
  const { setDemoRole } = useAuth();
  const reset = useDemoReset();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const wide = useWideAuth();

  const openRole = (key: DemoPersonaKey) => {
    const persona = DEMO_PERSONAS[key];
    selectRole(persona.role, { personaId: persona.id, clinicianMode: persona.clinicianMode });
    setDemoRole(persona.role);
    reset.clear();
    router.navigate(ROLE_META[persona.role].href);
  };

  const confirmReset = async () => {
    await reset.run();
    setConfirmOpen(false);
  };

  return (
    <AuthLayout maxWidth={640}>
        <View style={styles.inner}>
          <View style={styles.brand}>
            {!wide ? <BrandMark size={52} /> : null}
            <Text style={styles.title} accessibilityRole="header" aria-level={1}>
              Tuloy Health demo
            </Text>
            <Text style={styles.subtitle}>Pick a persona to open its workspace. Sign out from the header to come back here.</Text>
            <View style={styles.simulated} accessible accessibilityLabel="Simulated role — no real authentication">
              <Icon name="info" size={14} color={colors.pending} />
              <Text style={styles.simulatedText}>Simulated role — no real authentication</Text>
            </View>
          </View>

          <View style={styles.chain} accessible accessibilityLabel="Chain of command: Admin, then BHW, then Patient">
            {(['admin', 'bhw', 'patient'] as DemoRole[]).map((role, i) => (
              <View key={role} style={styles.chainItem}>
                <View style={[styles.chainPill, { backgroundColor: ROLE_META[role].tint, borderColor: ROLE_META[role].color }]}>
                  <Icon name={ROLE_META[role].icon} size={13} color={ROLE_META[role].color} />
                  <Text style={[styles.chainText, { color: ROLE_META[role].color }]}>{ROLE_META[role].label}</Text>
                </View>
                {i < 2 ? <Icon name="chevron-right" size={18} color={colors.muted} /> : null}
              </View>
            ))}
          </View>

          <SectionHeader title="Choose a persona" />
          {ROLE_CARDS.map((card) => {
            const meta = ROLE_META[DEMO_PERSONAS[card.key].role];
            return (
              <Pressable
                key={card.key}
                accessibilityRole="button"
                accessibilityLabel={`${card.title}. Persona: ${card.persona}`}
                onPress={() => openRole(card.key)}
                style={(state: PressableStateCallbackType & { hovered?: boolean }) => [
                  styles.roleCard,
                  state.hovered && { borderColor: meta.color, ...shadow.raised },
                  state.pressed && styles.pressed,
                ]}
              >
                <View style={[styles.roleIcon, { backgroundColor: meta.tint }]}>
                  <Icon name={card.key === 'clinician' ? 'medical' : meta.icon} size={20} color={meta.color} />
                </View>
                <View style={styles.roleText}>
                  <Text style={styles.roleTitle}>{card.title}</Text>
                  <Text style={styles.roleBlurb}>{card.blurb}</Text>
                  <Text style={styles.persona}>Persona: {card.persona} (DEMO DATA)</Text>
                </View>
                <Icon name="chevron-right" size={22} color={colors.muted} />
              </Pressable>
            );
          })}

          <SectionHeader title="Demo data" />
          <Card>
            <Text style={styles.body}>
              Start over: removes everything created during demos, restores the original DEMO DATA and clears this device.
            </Text>
            {reset.status === 'done' ? <Notice tone="success" message="Demo data reset" /> : null}
            {reset.status === 'error' && reset.error ? <Notice tone="error" message={reset.error} /> : null}
            <Button
              title="Reset demo data"
              variant="danger"
              onPress={() => {
                reset.clear();
                setConfirmOpen(true);
              }}
              loading={reset.running}
              style={styles.resetBtn}
            />
          </Card>

          <SectionHeader title="Environment" />
          <View style={styles.env}>
            {env.supabaseConfigError ? (
              <Notice tone="warning" message={env.supabaseConfigError} />
            ) : (
              <Notice tone="success" message="Supabase configured (anon key)." />
            )}
            {!env.hasMapboxToken ? (
              <Notice tone="info" message="No Mapbox token: the BHW map uses an OpenStreetMap fallback." />
            ) : null}
            {env.demoMapCenterWarning ? <Notice tone="info" message={env.demoMapCenterWarning} /> : null}
            <Text style={styles.note}>
              {Platform.OS === 'web' ? 'Web demo · offline queue stored in this browser' : 'Native · offline queue stored in SQLite'}
            </Text>
          </View>
        </View>

      <ConfirmSheet
        visible={confirmOpen}
        title="Reset demo data?"
        message={RESET_MESSAGE}
        confirmLabel="Reset demo data"
        destructive
        busy={reset.running}
        onConfirm={confirmReset}
        onCancel={() => setConfirmOpen(false)}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  inner: { gap: spacing.md },
  brand: { alignItems: 'center', gap: spacing.sm },
  title: { ...text.display, textAlign: 'center' },
  subtitle: { ...text.body, color: colors.muted, textAlign: 'center', maxWidth: 480 },
  simulated: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.pendingBg,
    borderWidth: 1,
    borderColor: colors.pending,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  simulatedText: { ...text.caption, color: colors.pending, fontWeight: '700' },
  chain: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  chainItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  chainPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  chainText: { fontWeight: '700', fontSize: 14 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg + 2,
    ...shadow.card,
  },
  pressed: { opacity: 0.85 },
  roleIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  roleText: { flex: 1, gap: 2 },
  roleTitle: text.title,
  roleBlurb: text.small,
  persona: text.caption,
  body: text.body,
  resetBtn: { alignSelf: 'flex-start' },
  env: { gap: spacing.sm },
  note: { ...text.caption, textAlign: 'center' },
});
