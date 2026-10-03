import type { PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

// Root HTML for the static web export only (runs in Node at build time, never on native).
// Same as Expo's default template, plus the web manifest, theme colour and
// touch icon for the offline app shell (Spec 02, OC-10.9).
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
      </head>
      <body>{children}</body>
    </html>
  );
}
