// Client-safe environment configuration.
// Only EXPO_PUBLIC_* variables are bundled. They must be referenced literally
// (process.env.EXPO_PUBLIC_X) so Expo can inline them at build time.

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();
const mapboxToken = (
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ||
  process.env.EXPO_PUBLIC_MAPBOX_TOKEN ||
  ''
).trim();

function decodeJwtRole(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 3 || typeof atob !== 'function') return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { role?: unknown };
    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

/** Why Supabase cannot be used, or null when the config is usable. */
function getSupabaseConfigError(): string | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and ' +
      'EXPO_PUBLIC_SUPABASE_ANON_KEY to apps/mobile/.env (Supabase dashboard → ' +
      'Project Settings → API), then restart with `npx expo start --clear`.'
    );
  }
  if (!/^https:\/\/.+/.test(supabaseUrl)) {
    return 'EXPO_PUBLIC_SUPABASE_URL must be an https:// URL (e.g. https://YOUR_PROJECT.supabase.co).';
  }
  // Security guard: a service-role / secret key bypasses RLS and must never ship to a client.
  if (supabaseAnonKey.startsWith('sb_secret_') || decodeJwtRole(supabaseAnonKey) === 'service_role') {
    return (
      'EXPO_PUBLIC_SUPABASE_ANON_KEY contains a service_role/secret key. Refusing to use it. ' +
      'Replace it with the anon (public) key and rotate the leaked secret key in Supabase.'
    );
  }
  return null;
}

const demoMapCenterRaw = (process.env.EXPO_PUBLIC_DEMO_MAP_CENTER ?? '').trim();

export interface DemoMapCenter {
  latitude: number;
  longitude: number;
}

/**
 * Default demo centre: the existing demo facility point, labelled with the
 * fictional "Brgy. Demo San Isidro". Synthetic patients are offset from it.
 */
export const DEFAULT_DEMO_CENTER: DemoMapCenter = { latitude: 14.5995, longitude: 120.9842 };

/** Parses "lat,lng". Bounds match the SQL check in reset_demo_data(). */
export function parseDemoMapCenter(raw: string): DemoMapCenter | null {
  const parts = raw.split(',').map((p) => p.trim());
  if (parts.length !== 2 || parts.some((p) => p === '')) return null;
  const [latitude, longitude] = parts.map(Number);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 89 || Math.abs(longitude) > 179) return null;
  return { latitude, longitude };
}

const parsedDemoMapCenter = demoMapCenterRaw ? parseDemoMapCenter(demoMapCenterRaw) : null;

export const env = {
  supabaseUrl,
  supabaseAnonKey,
  mapboxToken,
  supabaseConfigError: getSupabaseConfigError(),
  hasMapboxToken: mapboxToken.startsWith('pk.'),
  demoMapCenter: parsedDemoMapCenter ?? DEFAULT_DEMO_CENTER,
  demoMapCenterWarning:
    demoMapCenterRaw && !parsedDemoMapCenter
      ? `EXPO_PUBLIC_DEMO_MAP_CENTER "${demoMapCenterRaw}" is not a valid "lat,lng". Using the default demo centre.`
      : null,
};
