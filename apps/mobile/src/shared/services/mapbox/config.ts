import { env } from '../../config/env';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface MapMarker extends LatLng {
  id: string;
  title: string;
  subtitle?: string;
  kind: 'facility' | 'patient';
}

export interface MapViewProps {
  markers: MapMarker[];
  center?: LatLng;
  zoom?: number;
}

export const METRO_MANILA_CENTER: LatLng = { latitude: 14.5995, longitude: 120.9842 };
export const DEFAULT_ZOOM = 13;

/** Single configurable demo centre (EXPO_PUBLIC_DEMO_MAP_CENTER). */
export const DEMO_MAP_CENTER: LatLng = env.demoMapCenter;

export const MOCK_FACILITY: MapMarker = {
  id: 'facility-1',
  title: 'Demo Rural Health Unit',
  subtitle: 'Test health facility (DEMO DATA)',
  kind: 'facility',
  latitude: DEMO_MAP_CENTER.latitude,
  longitude: DEMO_MAP_CENTER.longitude,
};

export const MARKER_COLORS: Record<MapMarker['kind'], string> = {
  facility: '#D64545',
  patient: '#1D69C7',
};

/** Public Mapbox token (pk.*) or null when not configured. */
export function getMapboxToken(): string | null {
  return env.hasMapboxToken ? env.mapboxToken : null;
}
