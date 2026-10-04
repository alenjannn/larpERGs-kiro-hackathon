import { StyleSheet, Text, View } from 'react-native';
import Button from '../../../shared/components/Button';
import { StatusChipRow } from '../../../shared/components/StatusChip';
import { DEFERRED_BACKUP } from '../../../shared/helpRequests';
import { clinicalStatusKey, type StatusKey } from '../../../shared/status';
import type { HealthRecord } from '../../../shared/types/db.types';
import { formatDateDMY } from '../../../shared/utils/date';
import { colors, spacing, text, typography } from '../../../shared/theme';
import { PATIENT_COPY } from '../copy';
import { entryLab, entryValue, LAB_LABELS, type ClearbookEntry } from '../logic/clearbook';
import { GLUCOSE_TEST_LABELS } from '../logic/measurements';

/** "Blood glucose · Fasting", "Serum creatinine", "Total cholesterol". */
export function entryTitle(entry: ClearbookEntry): string {
  if (entry.lab === 'creatinine' || entry.lab === 'cholesterol') return LAB_LABELS[entry.lab];
  return `${LAB_LABELS[entryLab(entry)]} · ${GLUCOSE_TEST_LABELS[entry.glucose_test_type]}`;
}

/** Transport (and, once shared, clinical) chips for one entry (design §4.6). */
export function entryStatusKeys(entry: ClearbookEntry, server?: HealthRecord): StatusKey[] {
  switch (entry._share_status) {
    case 'sending':
      return ['transport.sending'];
    case 'failed':
      return ['transport.saved_on_device', 'transport.send_failed'];
    case 'synced':
      return ['transport.synced', (server && clinicalStatusKey(server)) || 'clinical.awaiting_clinical_review'];
    case 'local':
    default:
      return ['transport.saved_on_device'];
  }
}

export function EntryRow({
  entry,
  server,
  isOnline,
  onShare,
}: {
  entry: ClearbookEntry;
  server?: HealthRecord;
  isOnline: boolean | null;
  onShare?: (id: string) => void;
}) {
  const unshared = entry._share_status === 'local' || entry._share_status === 'failed';
  const { value, unit } = entryValue(entry);
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{entryTitle(entry)}</Text>
      <Text style={styles.value}>
        {value} {unit}
      </Text>
      <Text style={styles.muted}>Test date {formatDateDMY(entry.test_date || entry.measured_at)}</Text>
      <Text style={styles.muted}>{PATIENT_COPY.enteredByYou}</Text>
      <StatusChipRow statuses={entryStatusKeys(entry, server)} />
      {unshared ? <Text style={styles.muted}>{PATIENT_COPY.notShared}</Text> : null}
      {entry._share_status === 'failed' && entry._last_error ? <Text style={styles.muted}>{entry._last_error}</Text> : null}
      {unshared && onShare ? (
        isOnline === false ? (
          <Text style={styles.muted}>{PATIENT_COPY.connectToShare}</Text>
        ) : (
          <Button title={PATIENT_COPY.shareNow} variant="secondary" onPress={() => onShare(entry.id)} style={styles.start} />
        )
      ) : null}
    </View>
  );
}

interface Props {
  entries: ClearbookEntry[];
  /** Server records by id, for the clinical status of shared entries. */
  serverRecords: HealthRecord[];
  isOnline: boolean | null;
  loading: boolean;
  error: string | null;
  onShare: (id: string) => void;
}

/** "Lab results you entered", newest first. */
export default function ClearbookEntryList({ entries, serverRecords, isOnline, loading, error, onShare }: Props) {
  const byId = new Map(serverRecords.map((r) => [r.id, r]));
  return (
    <View style={styles.list}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && entries.length === 0 ? <Text style={styles.muted}>{PATIENT_COPY.noEntries}</Text> : null}
      {entries.map((e) => (
        <EntryRow key={e.id} entry={e} server={byId.get(e.id)} isOnline={isOnline} onShare={onShare} />
      ))}
      <Text style={styles.footnote}>{DEFERRED_BACKUP}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: { gap: spacing.xs, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  title: text.bodyStrong,
  value: { ...text.title, fontSize: typography.title + 2 },
  muted: text.muted,
  error: { ...text.small, color: colors.error },
  footnote: text.caption,
  start: { alignSelf: 'flex-start' },
});
