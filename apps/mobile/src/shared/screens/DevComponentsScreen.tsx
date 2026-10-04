import { useEffect, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import ConfirmSheet from '../components/ConfirmSheet';
import Disclosure from '../components/Disclosure';
import EmptyState from '../components/EmptyState';
import Icon, { ICON_NAMES } from '../components/Icon';
import LastUpdated from '../components/LastUpdated';
import MeasurementCard from '../components/MeasurementCard';
import MetricTile from '../components/MetricTile';
import NextStepCard from '../components/NextStepCard';
import Notice from '../components/Notice';
import OfflineBanner from '../components/OfflineBanner';
import RoleHeader from '../components/RoleHeader';
import Screen from '../components/Screen';
import SectionHeader from '../components/SectionHeader';
import TextField from '../components/TextField';
import StatusChip, { StatusChipRow } from '../components/StatusChip';
import { ALL_STATUS_KEYS, legacyQueueStatusKeys, queueStatusText, STATUS, type StatusGroup, type StatusKey } from '../status';
import { formatBPValue } from '../utils/format';
import { colors, spacing, typography } from '../theme';

/** Hidden usage gallery for the shared components (web only, not linked anywhere). */
export default function DevComponentsScreen() {
  if (Platform.OS !== 'web') {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState title="The component gallery is available on web only" message="Open /dev/components in a browser." />
      </SafeAreaView>
    );
  }
  return <ClientOnlyGallery />;
}

/**
 * The examples use "now"-relative dates formatted in local time, which differ
 * between the static pre-render and the browser. Render after mount so
 * hydration never sees mismatched text.
 */
function ClientOnlyGallery() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.label}>Loading component gallery…</Text>
      </SafeAreaView>
    );
  }
  return <Gallery />;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

function Code({ children }: { children: string }) {
  return <Text style={styles.code}>{children}</Text>;
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString();

function Gallery() {
  const nowIso = new Date().toISOString();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetBusy, setSheetBusy] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.safe}>
      <Screen title="Component gallery" subtitle="Shared components from tech.md §6 with usage examples (DEMO, web only)">
        <Section title="Button — primary, secondary, danger, ghost">
          <Code>{'<Button title="…" variant="primary|secondary|danger|ghost" icon="plus" compact />'}</Code>
          <View style={styles.wrap}>
            <Button title="Primary" icon="plus" onPress={() => setLastAction('Button: primary')} />
            <Button title="Secondary" variant="secondary" onPress={() => setLastAction('Button: secondary')} />
            <Button title="Danger" variant="danger" onPress={() => setLastAction('Button: danger')} />
            <Button title="Ghost link" variant="ghost" trailingIcon="chevron-right" onPress={() => setLastAction('Button: ghost')} />
            <Button title="Compact" compact variant="secondary" onPress={() => setLastAction('Button: compact')} />
            <Button title="Disabled" disabled onPress={() => undefined} />
          </View>
        </Section>

        <Section title="Notice — info, success, warning, error">
          <Notice tone="info" message="Showing saved information." />
          <Notice tone="success" title="Saved" message="Synced 3 records. The demo server confirmed each one." />
          <Notice tone="warning" message="Synced 2 of 3. 1 still saved on this device." />
          <Notice tone="error" message="Could not load the RHU workspace." />
        </Section>

        <Section title="TextField — hint and error">
          <View style={styles.wrap}>
            <TextField label="Birth date (optional)" hint="YYYY-MM-DD" placeholder="1980-01-31" />
            <TextField label="Email address" value="not-an-email" error="Email looks invalid." onChangeText={() => undefined} />
          </View>
        </Section>

        <Section title="SectionHeader and Disclosure">
          <SectionHeader title="Your care" subtitle="Groups the cards below it" />
          <Disclosure icon="tools" title="Developer tools" subtitle="Collapsed by default">
            <Text style={styles.label}>Secondary tools live here.</Text>
          </Disclosure>
        </Section>

        <Section title="StatusChip — every status in the dictionary">
          <Code>{"<StatusChip status=\"transport.waiting_to_send\" lang=\"en\" />"}</Code>
          <Notice tone="info" message="FIL labels: needs native-speaker review." />
          {(Object.keys(STATUS) as StatusGroup[]).map((group) => (
            <View key={group} style={styles.group}>
              <Text style={styles.groupTitle}>{group}</Text>
              {ALL_STATUS_KEYS.filter((k) => k.startsWith(`${group}.`)).map((key: StatusKey) => (
                <View key={key} style={styles.statusRow}>
                  <StatusChip status={key} lang="en" />
                  <StatusChip status={key} lang="fil" size="sm" />
                  <Text style={styles.keyText}>{key}</Text>
                </View>
              ))}
            </View>
          ))}
          <Text style={styles.label}>StatusChipRow for a pending BHW queue item ({queueStatusText(legacyQueueStatusKeys('pending'))}):</Text>
          <StatusChipRow statuses={legacyQueueStatusKeys('pending')} />
        </Section>

        <Section title="OfflineBanner">
          <Code>{'<OfflineBanner />  // renders only while offline'}</Code>
          <OfflineBanner preview showTagline />
          <Text style={styles.label}>Live (hidden unless DevTools → Offline):</Text>
          <OfflineBanner />
        </Section>

        <Section title="LastUpdated">
          <Code>{'<LastUpdated at={snapshot.last_updated_at} />'}</Code>
          <LastUpdated at={nowIso} />
          <LastUpdated at={null} />
        </Section>

        <Section title="NextStepCard">
          <Code>{'<NextStepCard action="…" responsible="…" date={iso} status="encounter.confirmed" onHelp={…} />'}</Code>
          <NextStepCard
            action="Go to your follow-up BP check"
            responsible="Demo Rural Health Unit Clinic (DEMO)"
            date={inDays(4)}
            status="encounter.confirmed"
            onHelp={() => setLastAction('NextStepCard: I need help')}
          />
          <NextStepCard
            action="Ask your BHW to help you pick a clinic"
            responsible="Liza Mendoza (DEMO)"
            date={null}
            status="coordination.assigned"
            onHelp={() => setLastAction('NextStepCard (no date): I need help')}
          />
        </Section>

        <Section title="MeasurementCard — null shows “No reading”, never 0">
          <Code>{'<MeasurementCard label="Blood pressure" value={formatBPValue(s, d)} unit="mmHg" measuredAt={iso} />'}</Code>
          <View style={styles.wrap}>
            <MeasurementCard label="Blood pressure" value={formatBPValue(132, 84)} unit="mmHg" measuredAt={daysAgo(12)} />
            <MeasurementCard label="Blood sugar" value={126} unit="mg/dL" context="Fasting" measuredAt={daysAgo(7)} />
            <MeasurementCard label="Weight" value={null} unit="kg" measuredAt={null} />
            <MeasurementCard label="BP (missing diastolic)" value={formatBPValue(132, null)} unit="mmHg" measuredAt={daysAgo(3)} />
            <MeasurementCard label="Height" value={152} unit="cm" measuredAt={null} />
          </View>
        </Section>

        <Section title="MetricTile — “n of d (p%)”, zero denominator → “No cases”">
          <Code>{'<MetricTile label="…" numerator={18} denominator={30} />'}</Code>
          <View style={styles.wrap}>
            <MetricTile label="Help requests acknowledged" numerator={18} denominator={30} />
            <MetricTile label="Follow-ups confirmed" numerator={0} denominator={0} hint="Zero denominator" />
            <MetricTile label="Invalid input" numerator={4} denominator={3} hint="Numerator > denominator" />
          </View>
        </Section>

        <Section title="EmptyState">
          <Code>{'<EmptyState title="No readings yet" message="…" />'}</Code>
          <EmptyState
            title="No readings yet"
            message="Measurements appear here after your BHW or clinic records them."
            action={{ label: 'Example action', onPress: () => setLastAction('EmptyState action') }}
          />
        </Section>

        <Section title="ConfirmSheet">
          <Code>{'<ConfirmSheet visible title="…" message="…" confirmLabel="…" destructive onConfirm={…} onCancel={…} />'}</Code>
          <Button title="Open confirm sheet" variant="danger" onPress={() => setSheetOpen(true)} />
          <ConfirmSheet
            visible={sheetOpen}
            title="Delete example?"
            message="This is a gallery example. Confirm shows the busy state for one second. Cancel, the backdrop and Escape close it."
            confirmLabel="Delete example"
            destructive
            busy={sheetBusy}
            onCancel={() => {
              setSheetOpen(false);
              setLastAction('ConfirmSheet: cancelled');
            }}
            onConfirm={() => {
              setSheetBusy(true);
              setTimeout(() => {
                setSheetBusy(false);
                setSheetOpen(false);
                setLastAction('ConfirmSheet: confirmed');
              }, 1000);
            }}
          />
        </Section>

        <Section title="RoleHeader">
          <Code>{'<RoleHeader />  // rendered by RoleTabsLayout in every role layout'}</Code>
          <RoleHeader />
        </Section>

        <Section title="Icon (Unicode glyphs, decorative)">
          <View style={styles.wrap}>
            {ICON_NAMES.map((name) => (
              <View key={name} style={styles.iconCell}>
                <Icon name={name} size={20} color={colors.text} />
                <Text style={styles.keyText}>{name}</Text>
              </View>
            ))}
          </View>
        </Section>

        {lastAction ? <Notice tone="info" message={`Last action: ${lastAction}`} /> : null}
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  section: { gap: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  sectionTitle: { fontSize: typography.title, fontWeight: '700', color: colors.text },
  group: { gap: spacing.xs },
  groupTitle: { fontSize: typography.small, fontWeight: '800', color: colors.muted, textTransform: 'uppercase' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  keyText: { fontSize: 12, color: colors.muted, fontFamily: Platform.select({ web: 'monospace', default: undefined }) },
  label: { fontSize: typography.small, color: colors.text },
  code: { fontSize: 12, color: colors.muted, fontFamily: Platform.select({ web: 'monospace', default: undefined }) },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  iconCell: { alignItems: 'center', width: 80, gap: 2 },
});
