import type { PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

// Root HTML for the static web export only (runs in Node at build time, never on native).
// Same as Expo's default template, plus the web manifest, theme colour and
// touch icon for the offline app shell (Spec 02, OC-10.9).

// Global web rules that cannot be expressed as React Native styles.
// Colours match theme.ts (focus #1F6FD1, bg #F4F6F9, primary #0F766E).
const GLOBAL_CSS = `
body { background-color: #F4F6F9; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; }
/* Each Figtree weight is its own file: never fake bold or italics on top. */
* { font-synthesis: none; }
/* Faster taps (no double-tap zoom delay) and a calm tap highlight. */
a, button, [role="button"], [role="link"], [role="tab"], [role="radio"], [role="switch"], input, textarea {
  touch-action: manipulation;
  -webkit-tap-highlight-color: rgba(15, 118, 110, 0.12);
}
/* Keyboard focus is always visible (WCAG 2.4.7); mouse and touch do not show it. */
:focus:not(:focus-visible) { outline: none; }
:focus-visible { outline: 3px solid #1F6FD1 !important; outline-offset: 2px; border-radius: 6px; }
input:focus-visible, textarea:focus-visible { outline-offset: 0; }
/* Scrolling inside a dialog never scrolls the page behind it. */
[role="dialog"], [role="dialog"] * { overscroll-behavior: contain; }
/* Skip link: hidden until focused with the keyboard. */
a[href="#main-content"] {
  position: absolute !important; left: 12px; top: -64px !important; z-index: 1000;
  padding: 10px 16px; border-radius: 10px; background: #0F766E; color: #FFFFFF;
  font: 600 15px/1.2 Figtree_600SemiBold, system-ui, sans-serif; text-decoration: none;
}
a[href="#main-content"]:focus { top: 12px !important; }
/* Honour reduced motion: no slide/fade animations or smooth scrolling. */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
}
`;
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0F766E" />
        {/* Light theme only: keep form controls and scrollbars light in OS dark mode. */}
        <meta name="color-scheme" content="light" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
