import { StyleSheet, Text, View } from 'react-native';
import Button from '../../../shared/components/Button';
import EmptyState from '../../../shared/components/EmptyState';
import Icon from '../../../shared/components/Icon';
import { colors, spacing, typography } from '../../../shared/theme';
import type { PatientMapStatus } from '../today';

export interface MapPatientRow {
  id: string;
  name: string;
  /** Short label used on the mock map pins ("A", "B", …). */
  pin: string;
  status: PatientMapStatus;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
}

/** Patients with their status (icon + text) and last-known location (B-5.2, B-5.3). */
export default function PatientStatusList({ rows, onLogVisit }: { rows: MapPatientRow[]; onLogVisit: (id: string) => void }) {
  if (rows.length === 0) return <EmptyState title="No patients to show" message="Assigned patients appear here." icon="person" />;
  return (
    <View>
      {rows.map((r) => (
        <View key={r.id} style={styles.row}>
          <Text style={styles.pin} accessibilityElementsHidden importantForAccessibility="no">
            {r.pin}
          </Text>
          <View style={styles.main}>
            <Text style={styles.name}>{r.name}</Text>
            <View style={styles.status} accessible accessibilityLabel={`Status: ${r.status.label}`}>
              <Icon name={r.status.icon} size={14} color={colors.text} />
              <Text style={styles.statusText}>{r.status.label}</Text>
            </View>
            <Text style={styles.meta}>
              {r.latitude != null && r.longitude != null
                ? `Last-known location ${r.latitude.toFixed(4)}°, ${r.longitude.toFixed(4)}° · approximate DEMO location`
                : 'No location saved'}
            </Text>
            {r.address ? <Text style={styles.meta}>{r.address}</Text> : null}
          </View>
          <Button compact variant="secondary" title="Visit" onPress={() => onLogVisit(r.id)} accessibilityLabel={`Log a visit for ${r.name}`} style={styles.btn} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '700',
    color: colors.primaryText,
    backgroundColor: colors.primary,
    overflow: 'hidden',
  },
  main: { flex: 1, gap: 2 },
  name: { fontSize: typography.body, fontWeight: '700', color: colors.text },
  status: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statusText: { fontSize: typography.small, color: colors.text, fontWeight: '600' },
  meta: { fontSize: typography.caption, color: colors.muted },
  btn: { minHeight: 44 },
});
