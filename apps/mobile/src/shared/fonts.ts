// Typeface: Figtree for headings and body (one family keeps the offline
// precache small: ~40 KB per weight, Latin incl. Filipino ñ). Only the
// weights below are bundled. Each weight is its own font file, so the
// shared Text component picks the file from fontWeight (see fontFamilyFor).

import { useSyncExternalStore } from 'react';
import { Platform, type TextStyle } from 'react-native';
import { Figtree_400Regular } from '@expo-google-fonts/figtree/400Regular';
import { Figtree_400Regular_Italic } from '@expo-google-fonts/figtree/400Regular_Italic';
import { Figtree_600SemiBold } from '@expo-google-fonts/figtree/600SemiBold';
import { Figtree_700Bold } from '@expo-google-fonts/figtree/700Bold';
import { Figtree_800ExtraBold } from '@expo-google-fonts/figtree/800ExtraBold';
import Feather from '@expo/vector-icons/Feather';

/** Passed to useFonts() once, in the root layout. */
export const FONT_ASSETS = {
  Figtree_400Regular,
  Figtree_400Regular_Italic,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
  ...Feather.font,
};

// Web falls back to the system stack until the file loads (no invisible text).
const WEB_FALLBACK = ', system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

let ready = Platform.OS === 'web';
const listeners = new Set<() => void>();

/** Called by the root layout when useFonts() resolves. */
export function markFontsReady() {
  if (ready) return;
  ready = true;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Native renders the system font until Figtree is loaded (web always uses the stack with fallbacks). */
export function useFontsReady(): boolean {
  return useSyncExternalStore(subscribe, () => ready, () => true);
}

function weightOf(w: TextStyle['fontWeight']): number {
  if (w === 'bold') return 700;
  if (w === undefined || w === 'normal') return 400;
  const n = Number(w);
  return Number.isFinite(n) ? n : 400;
}

/**
 * The Figtree file for a text style. Returns null when the style sets its own
 * fontFamily (e.g. monospace), so that choice is kept.
 */
export function fontFamilyFor(style: TextStyle): string | null {
  if (style.fontFamily) return null;
  const w = weightOf(style.fontWeight);
  const italic = style.fontStyle === 'italic';
  const file =
    w >= 800 ? 'Figtree_800ExtraBold' : w >= 700 ? 'Figtree_700Bold' : w >= 500 ? 'Figtree_600SemiBold' : italic ? 'Figtree_400Regular_Italic' : 'Figtree_400Regular';
  return Platform.OS === 'web' ? `${file}${WEB_FALLBACK}` : file;
}
