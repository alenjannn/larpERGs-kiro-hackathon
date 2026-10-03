// Platform-aware map service.
//   Native: @rnmapbox/maps           -> mapbox/MapNative.tsx (via MapView.native.tsx)
//   Web:    mapbox-gl JS / OSM embed -> mapbox/MapWeb.tsx    (via MapView.tsx)
//
// @rnmapbox/maps is only imported from `.native.tsx` files, so it never enters
// the web bundle and cannot crash `expo export --platform web`.

export * from './mapbox/config';
export { default as MapView } from './mapbox/MapView';
