import { Platform } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';

// React Native needs a spec-compliant URL implementation; browsers already have one.
if (Platform.OS !== 'web') {
  require('react-native-url-polyfill/auto');
}

export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseConfigError';
  }
}

/**
 * Shared Supabase client (anon key only — RLS is the security boundary).
 * Null when env vars are missing/invalid; the app still boots so the launcher,
 * offline queue and map keep working, and screens show a clear config message.
 */
export const supabase: SupabaseClient | null = env.supabaseConfigError
  ? null
  : createClient(env.supabaseUrl, env.supabaseAnonKey, {
      // No login flow in the demo: don't persist or refresh auth sessions.
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

export const isSupabaseConfigured = supabase !== null;

/** Returns the client or throws a SupabaseConfigError with setup instructions. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new SupabaseConfigError(env.supabaseConfigError ?? 'Supabase is not configured.');
  }
  return supabase;
}

function rawMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error && 'message' in error) return String((error as { message: unknown }).message);
  return '';
}

/** True when the request never reached Supabase (offline, DNS, CORS, timeout). */
export function isNetworkError(error: unknown): boolean {
  return /failed to fetch|network request failed|networkerror|load failed|fetch failed/i.test(rawMessage(error));
}

/** True when the backend schema hasn't been created yet (migrations not run). */
export function isSchemaMissingError(error: unknown): boolean {
  return /PGRST205|could not find the table|relation .* does not exist/i.test(
    `${(error as { code?: string })?.code ?? ''} ${rawMessage(error)}`
  );
}

/** Converts any thrown value into a message that is safe to show users. */
export function toUserMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof SupabaseConfigError) return error.message;
  const message = rawMessage(error);
  if (isNetworkError(error)) {
    return 'Cannot reach the server. Check your internet connection and try again.';
  }
  if (isSchemaMissingError(error)) {
    return 'Database tables are missing. Run supabase/setup.sql in the Supabase SQL Editor.';
  }
  if (/row-level security|permission denied/i.test(message)) {
    return 'The database refused this action (row-level security). Re-run the migrations.';
  }
  return message ? `${fallback} (${message})` : fallback;
}
