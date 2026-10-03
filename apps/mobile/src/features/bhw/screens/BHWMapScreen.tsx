import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Card from '../../../shared/components/Card';
import Notice from '../../../shared/components/Notice';
import Screen from '../../../shared/components/Screen';
import { MapView, MARKER_COLORS, MOCK_FACILITY, type MapMarker } from '../../../shared/services/mapbox';
import { colors, spacing } from '../../../shared/theme';
import { useBHWData } from '../hooks/useBHWData';

export default function BHWMapScreen() {
  const { data, error } = useBHWData();

  // Stable identity so the web map isn't torn down on unrelated re-renders.
  const markerKey = (data?.patients ?? []).map((p) => `${p.id}:${p.latitude}:${p.longitude}`).join('|');
  const markers = useMemo<MapMarker[]>(() => {
    const patientMarkers: MapMarker[] = (data?.patients ?? [])
      .filter((p) => p.latitude != null && p.longitude != null)
      .map((p) => ({
        id: p.id,
        title: p.full_name,
        subtitle: p.pendingSync ? 'Registered offline (pending sync)' : p.address ?? 'Household (demo)',
        kind: 'patient',
        latitude: p.latitude as number,
        longitude: p.longitude as number,
      }));
    return [MOCK_FACILITY, ...patientMarkers];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markerKey]);

  return (
    <Screen title="Field Map" subtitle="Health facility and your assigned households (DEMO DATA)">
      {error ? <Notice tone="error" message={error} /> : null}
      <View style={styles.mapBox}>
        <MapView markers={markers} />
      </View>
      <Card title="Legend">
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: MARKER_COLORS.facility }]} />
          <Text style={styles.legendText}>
            {MOCK_FACILITY.title} (demo centre {MOCK_FACILITY.latitude.toFixed(4)}°, {MOCK_FACILITY.longitude.toFixed(4)}°)
          </Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: MARKER_COLORS.patient }]} />
          <Text style={styles.legendText}>{markers.length - 1} assigned patient household(s)</Text>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mapBox: { height: 420, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: '#E8EFEC' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 13, color: colors.text, flex: 1 },
});
