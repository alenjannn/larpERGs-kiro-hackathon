import type { PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

// Root HTML for the static web export only (runs in Node at build time, never on native).
// Same as Expo's default template, plus the web manifest, theme colour and
// touch icon for the offline app shell (Spec 02, OC-10.9).

// Keyboard focus is always visible (WCAG 2.4.7); mouse clicks do not show it.
// Colours match theme.ts (focus #1F6FD1, bg #F4F7F6).
const GLOBAL_CSS = `
body { background-color: #F4F7F6; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
:focus { outline: none; }
:focus-visible { outline: 3px solid #1F6FD1 !important; outline-offset: 2px; border-radius: 6px; }
input:focus-visible, textarea:focus-visible { outline-offset: 0; }
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
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
