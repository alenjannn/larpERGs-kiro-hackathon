import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import ConfirmSheet from '../components/ConfirmSheet';
import Icon from '../components/Icon';
import Notice from '../components/Notice';
import { env } from '../config/env';
import { DEMO_PERSONAS, ROLE_META, type DemoPersonaKey, type DemoRole } from '../config/demo';
import { useDemoRole } from '../context/DemoRoleContext';
import { useDemoReset } from '../hooks/useDemoReset';
import { colors, radius, spacing } from '../theme';

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
  const reset = useDemoReset();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const openRole = (key: DemoPersonaKey) => {
    const persona = DEMO_PERSONAS[key];
    selectRole(persona.role, { personaId: persona.id, clinicianMode: persona.clinicianMode });
    reset.clear();
    router.navigate(ROLE_META[persona.role].href);
  };

  const confirmReset = async () => {
    await reset.run();
    setConfirmOpen(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          <Text style={styles.title} accessibilityRole="header">
            TULOY Health
          </Text>
          <Text style={styles.subtitle}>Hackathon demo · pick a role, then switch any time with the header</Text>
          <View style={styles.simulated} accessible accessibilityLabel="Simulated role — no real authentication">
            <Icon name="info" size={14} color={colors.pending} />
            <Text style={styles.simulatedText}>Simulated role — no real authentication</Text>
          </View>

          <View style={styles.chain} accessibilityLabel="Chain of command: Admin, then BHW, then Patient">
            {(['admin', 'bhw', 'patient'] as DemoRole[]).map((role, i) => (
              <View key={role} style={styles.chainItem}>
                <View style={[styles.chainPill, { backgroundColor: ROLE_META[role].color }]}>
                  <Text style={styles.chainText}>
                    {ROLE_META[role].emoji} {ROLE_META[role].label}
                  </Text>
                </View>
                {i < 2 ? <Text style={styles.arrow}>→</Text> : null}
              </View>
            ))}
          </View>

          {ROLE_CARDS.map((card) => {
            const meta = ROLE_META[DEMO_PERSONAS[card.key].role];
            return (
              <Pressable
                key={card.key}
                accessibilityRole="button"
                accessibilityLabel={`${card.title}. Persona: ${card.persona}`}
                onPress={() => openRole(card.key)}
                style={({ pressed }) => [styles.roleCard, { borderLeftColor: meta.color }, pressed && styles.pressed]}
              >
                <Text style={[styles.roleTitle, { color: meta.color }]}>
                  {card.key === 'clinician' ? '🩺' : meta.emoji} {card.title}
                </Text>
                <Text style={styles.roleBlurb}>{card.blurb}</Text>
                <Text style={styles.persona}>Persona: {card.persona} (DEMO DATA)</Text>
              </Pressable>
            );
          })}

          <Button
            title="Reset demo data"
            variant="danger"
            onPress={() => {
              reset.clear();
              setConfirmOpen(true);
            }}
            loading={reset.running}
          />
          {reset.status === 'done' ? <Notice tone="success" message="Demo data reset" /> : null}
          {reset.status === 'error' && reset.error ? <Notice tone="error" message={reset.error} /> : null}

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
            {Platform.OS === 'web' ? '🌐 Web demo · offline queue stored in this browser' : '📱 Native · offline queue stored in SQLite'}
          </Text>
        </View>
      </ScrollView>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, flexGrow: 1, justifyContent: 'center' },
  inner: { width: '100%', maxWidth: 560, alignSelf: 'center', gap: spacing.md },
  title: { fontSize: 34, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: -spacing.xs },
  simulated: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.xs,
    backgroundColor: colors.pendingBg,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  simulatedText: { fontSize: 13, color: colors.pending, fontWeight: '700' },
  chain: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs, marginVertical: spacing.sm },
  chainItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  chainPill: { borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: 6 },
  chainText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  arrow: { fontSize: 18, color: colors.muted },
  roleCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 6,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  pressed: { opacity: 0.85 },
  roleTitle: { fontSize: 19, fontWeight: '800' },
  roleBlurb: { fontSize: 15, color: colors.text, lineHeight: 21 },
  persona: { fontSize: 13, color: colors.muted },
  note: { fontSize: 12, color: colors.muted, textAlign: 'center' },
});
