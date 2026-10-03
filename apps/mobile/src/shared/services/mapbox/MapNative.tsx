import { StyleSheet, View } from 'react-native';
import { DEFAULT_ZOOM, DEMO_MAP_CENTER, getMapboxToken, MARKER_COLORS, type MapViewProps } from './config';
import MockMap from './MockMap';

type RNMapbox = typeof import('@rnmapbox/maps').default;

// @rnmapbox/maps needs a development build; in Expo Go the native module is
// missing and requiring it throws. Load it lazily so the screen degrades to a
// mock map instead of crashing.
let Mapbox: RNMapbox | null = null;
let loadError: string | null = null;
try {
  Mapbox = require('@rnmapbox/maps').default as RNMapbox;
  const token = getMapboxToken();
  if (token) Mapbox.setAccessToken(token);
} catch (error) {
  loadError = 'Native Mapbox needs a development build (not available in Expo Go).';
  console.warn('Mapbox native module unavailable:', error);
}

export default function MapNative({ markers, center = DEMO_MAP_CENTER, zoom = DEFAULT_ZOOM }: MapViewProps) {
  const token = getMapboxToken();
  if (!Mapbox || !token) {
    return <MockMap markers={markers} reason={loadError ?? 'Missing EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN — showing mock map.'} />;
  }

  return (
    <Mapbox.MapView style={styles.map}>
      <Mapbox.Camera centerCoordinate={[center.longitude, center.latitude]} zoomLevel={zoom} />
      {markers.map((m) => (
        <Mapbox.PointAnnotation key={m.id} id={m.id} coordinate={[m.longitude, m.latitude]} title={m.title} snippet={m.subtitle}>
          <View style={[styles.pin, { backgroundColor: MARKER_COLORS[m.kind] }]} />
        </Mapbox.PointAnnotation>
      ))}
    </Mapbox.MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  pin: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#fff' },
});
