import { StyleSheet, View } from 'react-native';
import Text from '../../components/Text';
import { MARKER_COLORS, type MapMarker } from './config';

/** Offline-safe stand-in when no real map can render (Expo Go, missing token). */
export default function MockMap({ markers, reason }: { markers: MapMarker[]; reason: string }) {
  const lats = markers.map((m) => m.latitude);
  const lngs = markers.map((m) => m.longitude);
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];
  const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)];
  const spanLat = Math.max(maxLat - minLat, 0.002);
  const spanLng = Math.max(maxLng - minLng, 0.002);

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {markers.map((m) => (
          <View
            key={m.id}
            style={[
              styles.pin,
              {
                left: `${8 + ((m.longitude - minLng) / spanLng) * 84}%`,
                top: `${8 + ((maxLat - m.latitude) / spanLat) * 84}%`,
                backgroundColor: MARKER_COLORS[m.kind],
              },
            ]}
          />
        ))}
      </View>
      <Text style={styles.reason}>{reason}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8EFEC' },
  grid: { flex: 1, borderWidth: 1, borderColor: '#C9D6D1', margin: 12, borderRadius: 8, backgroundColor: '#F1F6F3' },
  pin: { position: 'absolute', width: 16, height: 16, marginLeft: -8, marginTop: -8, borderRadius: 8, borderWidth: 2, borderColor: '#fff' },
  reason: { fontSize: 13, color: '#475569', textAlign: 'center', paddingHorizontal: 12, paddingBottom: 12 },
});
