import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Card from '../../../shared/components/Card';
import EmptyState from '../../../shared/components/EmptyState';
import LastUpdated from '../../../shared/components/LastUpdated';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import Notice from '../../../shared/components/Notice';
import Screen from '../../../shared/components/Screen';
import { useConnectivity } from '../../../shared/context/ConnectivityContext';
import { getMapboxToken, MapView, MOCK_FACILITY, type MapMarker } from '../../../shared/services/mapbox';
import { colors } from '../../../shared/theme';
import LabeledMockMap from '../components/LabeledMockMap';
import PatientStatusList, { type MapPatientRow } from '../components/PatientStatusList';
import { useBHWData, useCurrentBHWId } from '../hooks/useBHWData';
import { buildTodayItems, patientMapStatus } from '../today';

const GLYPH: Record<string, string> = {
  device: '▯',
  help: '?',
  alert: '⚠',
  clock: '◷',
  blocked: '⊘',
  calendar: '▦',
  check: '✓',
};

function pinLabel(i: number): string {
  return i < 26 ? String.fromCharCode(65 + i) : String(i + 1);
}

/** Map of my patients (B-5). Tiles need a connection; the list always works. */
export default function BHWMapScreen() {
  const router = useRouter();
  const bhwId = useCurrentBHWId();
  const { data, error, loading } = useBHWData();
  const { isOnline } = useConnectivity();
  const token = getMapboxToken();

  const rows = useMemo<MapPatientRow[]>(() => {
    if (!data) return [];
    const owner = data.bhw?.id ?? bhwId;
    const items = buildTodayItems({ bhwId: owner, patients: data.patients, appointments: data.appointments, records: data.records, now: Date.now() });
    return data.patients.map((p, i) => ({
      id: p.id,
      name: p.full_name,
      pin: pinLabel(i),
      status: patientMapStatus(p, items, data.helpRequests),
      latitude: p.latitude,
      longitude: p.longitude,
      address: p.address,
    }));
  }, [data, bhwId]);

  // Stable identity so the web map isn't torn down on unrelated re-renders.
  const markerKey = rows.map((r) => `${r.id}:${r.latitude}:${r.longitude}:${r.status.label}`).join('|');
  const markers = useMemo<MapMarker[]>(
    () => [
      MOCK_FACILITY,
      ...rows
        .filter((r) => r.latitude != null && r.longitude != null)
        .map((r) => ({
          id: r.id,
          title: `${r.pin} · ${r.name}`,
          // Popup text: status as icon + words (B-5.2).
          subtitle: `${GLYPH[r.status.icon] ?? ''} ${r.status.label} · approximate DEMO location`,
          kind: 'patient' as const,
          latitude: r.latitude as number,
          longitude: r.longitude as number,
        })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [markerKey]
  );

  const openVisit = (patientId: string) => router.push({ pathname: '/bhw/patients/visit', params: { patientId } });
  const offline = isOnline === false;

  return (
    <Screen title="Field Map" subtitle="Your patients' households (synthetic DEMO locations)">
      {loading && !data ? <LoadingSpinner /> : null}
      {error ? <Notice tone="error" message={error} /> : null}
      {data?.fromCache ? <LastUpdated at={data.cachedAt} /> : null}

      {offline ? (
        <Card>
          <EmptyState
            title="Map needs a connection"
            message="Map tiles aren't saved for offline use. Your patients and their last-known locations are listed below."
            icon="offline"
          />
        </Card>
      ) : (
        <View style={styles.mapBox}>
          {token ? (
            <MapView markers={markers} />
          ) : (
            <LabeledMockMap rows={rows} facility={MOCK_FACILITY} reason="Mock map: no Mapbox token set. Positions are approximate and not to scale." />
          )}
        </View>
      )}

      <Card title="My patients" subtitle="Status shown with an icon and words. Letters match the map pins.">
        {data ? <PatientStatusList rows={rows} onLogVisit={openVisit} /> : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mapBox: { height: 420, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: '#E8EFEC' },
});
