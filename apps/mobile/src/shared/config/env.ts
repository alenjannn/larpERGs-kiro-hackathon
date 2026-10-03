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

export const env = {
  supabaseUrl,
  supabaseAnonKey,
  mapboxToken,
  supabaseConfigError: getSupabaseConfigError(),
  hasMapboxToken: mapboxToken.startsWith('pk.'),
};
