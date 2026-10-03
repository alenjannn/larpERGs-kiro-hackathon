import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Notice from '../components/Notice';
import { env } from '../config/env';
import { ROLE_META, type DemoRole } from '../config/demo';
import { colors, radius, spacing } from '../theme';

const ROLE_CARDS: { role: DemoRole; title: string; blurb: string; persona: string }[] = [
  {
    role: 'admin',
    title: 'Demo as Admin',
    blurb: 'Creates and manages BHW accounts, assigns patients, monitors field activity and health metrics.',
    persona: 'Demo Admin (RHU Nurse)',
  },
  {
    role: 'bhw',
    title: 'Demo as BHW',
    blurb: 'Receives patient assignments, logs field visits offline, then taps “Sync Now” to upload to Supabase.',
    persona: 'Demo BHW Maria · Brgy. Demo San Isidro',
  },
  {
    role: 'patient',
    title: 'Demo as Patient',
    blurb: 'Sees health updates, visit vitals and appointments created by their assigned BHW.',
    persona: 'Demo Patient Juana',
  },
];

/** Root landing page: one link, three roles. */
export default function DemoLauncherScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          <Text style={styles.title} accessibilityRole="header">
            TULOY Health
          </Text>
          <Text style={styles.subtitle}>Hackathon demo · pick a role, then switch any time with the header</Text>

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
            const meta = ROLE_META[card.role];
            return (
              <Pressable
                key={card.role}
                accessibilityRole="button"
                onPress={() => router.navigate(meta.href)}
                style={({ pressed }) => [styles.roleCard, { borderLeftColor: meta.color }, pressed && styles.pressed]}
              >
                <Text style={[styles.roleTitle, { color: meta.color }]}>
                  {meta.emoji} {card.title}
                </Text>
                <Text style={styles.roleBlurb}>{card.blurb}</Text>
                <Text style={styles.persona}>Persona: {card.persona} (DEMO DATA)</Text>
              </Pressable>
            );
          })}

          {env.supabaseConfigError ? (
            <Notice tone="warning" message={env.supabaseConfigError} />
          ) : (
            <Notice tone="success" message="Supabase configured (anon key)." />
          )}
          {!env.hasMapboxToken ? (
            <Notice tone="info" message="No Mapbox token: the BHW map uses an OpenStreetMap fallback." />
          ) : null}

          <Text style={styles.note}>
            {Platform.OS === 'web' ? '🌐 Web demo · offline queue stored in this browser' : '📱 Native · offline queue stored in SQLite'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, flexGrow: 1, justifyContent: 'center' },
  inner: { width: '100%', maxWidth: 560, alignSelf: 'center', gap: spacing.md },
  title: { fontSize: 34, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: -spacing.xs },
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
  roleBlurb: { fontSize: 14, color: colors.text, lineHeight: 20 },
  persona: { fontSize: 12, color: colors.muted },
  note: { fontSize: 12, color: colors.muted, textAlign: 'center' },
});
