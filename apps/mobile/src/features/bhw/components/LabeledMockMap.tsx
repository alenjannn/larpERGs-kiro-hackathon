import { StyleSheet, Text, View } from 'react-native';
import Icon from '../../../shared/components/Icon';
import type { LatLng } from '../../../shared/services/mapbox';
import { colors, spacing } from '../../../shared/theme';
import type { MapPatientRow } from './PatientStatusList';

/**
 * Schematic map used when no Mapbox token is set (B-5.4). Each pin shows its
 * letter, a status icon and a short text label, so status never relies on
 * colour. Positions are relative, not to scale.
 */
export default function LabeledMockMap({ rows, facility, reason }: { rows: MapPatientRow[]; facility: LatLng; reason: string }) {
  const placed = rows.filter((r) => r.latitude != null && r.longitude != null) as (MapPatientRow & LatLng)[];
  const lats = placed.map((r) => r.latitude).concat(facility.latitude);
  const lngs = placed.map((r) => r.longitude).concat(facility.longitude);
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];
  const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)];
  const spanLat = Math.max(maxLat - minLat, 0.002);
  const spanLng = Math.max(maxLng - minLng, 0.002);
  const pos = (p: LatLng) => ({
    left: `${6 + ((p.longitude - minLng) / spanLng) * 70}%` as const,
    top: `${6 + ((maxLat - p.latitude) / spanLat) * 80}%` as const,
  });

  return (
    <View style={styles.container} accessible accessibilityLabel={`Schematic map with ${placed.length} patients. The list below has each status.`}>
      <View style={styles.grid}>
        <View style={[styles.pinWrap, pos(facility)]}>
          <Text style={[styles.pin, styles.facility]}>+</Text>
          <Text style={styles.label}>RHU (DEMO)</Text>
        </View>
        {placed.map((r) => (
          <View key={r.id} style={[styles.pinWrap, pos(r)]}>
            <Text style={styles.pin}>{r.pin}</Text>
            <View style={styles.labelRow}>
              <Icon name={r.status.icon} size={11} color={colors.text} />
              <Text style={styles.label} numberOfLines={1}>
                {r.status.label}
              </Text>
            </View>
          </View>
        ))}
      </View>
      <Text style={styles.reason}>{reason}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8EFEC' },
  grid: { flex: 1, borderWidth: 1, borderColor: '#C9D6D1', margin: spacing.md, borderRadius: 8, backgroundColor: '#F1F6F3' },
  pinWrap: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '45%' },
  pin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryText,
    backgroundColor: colors.primary,
    overflow: 'hidden',
  },
  facility: { backgroundColor: colors.text },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 4, borderRadius: 4, flexShrink: 1 },
  label: { fontSize: 11, color: colors.text, flexShrink: 1 },
  reason: { fontSize: 12, color: colors.muted, textAlign: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.md },
});
