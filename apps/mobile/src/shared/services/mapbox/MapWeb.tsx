import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DEFAULT_ZOOM, DEMO_MAP_CENTER, getMapboxToken, MARKER_COLORS, type MapMarker, type MapViewProps } from './config';

// Web-only map. Never imports @rnmapbox/maps.
// - With a pk.* token: interactive mapbox-gl JS map (loaded lazily in the browser,
//   so static pre-rendering in Node never touches `window`).
// - Without a token, or if Mapbox rejects it: OpenStreetMap embed (no key needed).

function ensureMapboxCss(version: string) {
  const id = 'mapbox-gl-css';
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://api.mapbox.com/mapbox-gl-js/v${version}/mapbox-gl.css`;
  document.head.appendChild(link);
}

function osmEmbedUrl(markers: MapMarker[]): string {
  const focus = markers.find((m) => m.kind === 'facility') ?? markers[0] ?? { ...DEMO_MAP_CENTER };
  const lats = markers.map((m) => m.latitude).concat(focus.latitude);
  const lngs = markers.map((m) => m.longitude).concat(focus.longitude);
  const pad = 0.006;
  const bbox = [Math.min(...lngs) - pad, Math.min(...lats) - pad, Math.max(...lngs) + pad, Math.max(...lats) + pad].join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${focus.latitude},${focus.longitude}`;
}

function OsmFallback({ markers, note }: { markers: MapMarker[]; note: string }) {
  return (
    <View style={styles.container}>
      <iframe title="Map (OpenStreetMap)" src={osmEmbedUrl(markers)} style={{ border: 0, width: '100%', height: '100%', flex: 1 }} />
      <View style={styles.label}>
        <Text style={styles.labelText}>{note}</Text>
      </View>
    </View>
  );
}

function MapboxGlMap({ markers, center, zoom, token, onFail }: Required<MapViewProps> & { token: string; onFail: (reason: string) => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let map: import('mapbox-gl').Map | null = null;

    (async () => {
      try {
        const mapboxgl = (await import('mapbox-gl')).default;
        if (cancelled || !containerRef.current) return;
        ensureMapboxCss(mapboxgl.version);
        mapboxgl.accessToken = token;
        map = new mapboxgl.Map({
          container: containerRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [center.longitude, center.latitude],
          zoom,
        });
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.on('error', (event: { error?: { status?: number; message?: string } }) => {
          const status = event.error?.status;
          if (status === 401 || status === 403) onFail('Mapbox rejected the access token — showing OpenStreetMap instead.');
        });
        for (const m of markers) {
          new mapboxgl.Marker({ color: MARKER_COLORS[m.kind] })
            .setLngLat([m.longitude, m.latitude])
            .setPopup(new mapboxgl.Popup({ offset: 24 }).setText(m.subtitle ? `${m.title} — ${m.subtitle}` : m.title))
            .addTo(map);
        }
      } catch (error) {
        console.error('Failed to load mapbox-gl:', error);
        if (!cancelled) onFail('Could not load Mapbox in this browser — showing OpenStreetMap instead.');
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [markers, center, zoom, token, onFail]);

  return (
    <View style={styles.container}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
    </View>
  );
}

export default function MapWeb({ markers, center = DEMO_MAP_CENTER, zoom = DEFAULT_ZOOM }: MapViewProps) {
  const token = getMapboxToken();
  const [failure, setFailure] = useState<string | null>(null);

  if (!token || failure) {
    return (
      <OsmFallback
        markers={markers}
        note={failure ?? '🗺️ Web demo map (OpenStreetMap). Add EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN for Mapbox.'}
      />
    );
  }
  return <MapboxGlMap markers={markers} center={center} zoom={zoom} token={token} onFail={setFailure} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative', minHeight: 320, overflow: 'hidden', borderRadius: 8 },
  label: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    padding: 6,
    borderRadius: 6,
  },
  labelText: { fontSize: 12, textAlign: 'center', color: '#24302C' },
});
