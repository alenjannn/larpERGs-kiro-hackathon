/* global self, caches, fetch, Response, URL */
// Tuloy offline app shell (Spec 02, OC-10). Hand-written template:
// scripts/build-sw.mjs replaces `self.__PRECACHE__` with the list of files in
// dist/ and writes dist/sw.js after `expo export --platform web`.
//
// - Precaches every exported file (route HTML + hashed JS + assets).
// - Route HTML is stored under its clean URL (/patient, /patient/health), and
//   redirected responses are re-wrapped, because serve/Vercel cleanUrls
//   redirect /x.html → /x and a redirected response can't answer a navigation.
// - Cache-first for this version's files: HTML and JS of one build stay together.
//   A new version waits until the user taps Reload (SKIP_WAITING message).
// - Never touches non-GET or cross-origin requests (Supabase, map tiles).
'use strict';

const MANIFEST = self.__PRECACHE__;
const CACHE_PREFIX = 'tuloy-shell-';
const CACHE = CACHE_PREFIX + MANIFEST.version;
const ROUTES = new Map(MANIFEST.routes.map((r) => [r.url, r.file]));
const ASSETS = new Set(MANIFEST.assets.map((a) => a.url));

/** Same rule as build-sw.mjs: /x.html, /x/, /x/index → /x ; / stays /. */
function routeKey(pathname) {
  let p = pathname;
  try {
    p = decodeURIComponent(pathname);
  } catch (e) {
    // keep the raw path
  }
  p = p.replace(/\.html$/, '').replace(/\/index$/, '');
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p || '/';
}

async function precache() {
  const cache = await caches.open(CACHE);
  for (const asset of MANIFEST.assets) {
    const res = await fetch(asset.url, { cache: 'reload' });
    if (!res.ok) throw new Error(`Precache failed (${res.status}) for ${asset.url}`);
    await cache.put(asset.url, res);
  }
  for (const route of MANIFEST.routes) {
    const res = await fetch(route.file, { cache: 'reload', redirect: 'follow' });
    if (!res.ok) throw new Error(`Precache failed (${res.status}) for ${route.file}`);
    const body = await res.blob();
    await cache.put(
      encodeURI(route.url),
      new Response(body, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    );
  }
}

async function cachedRoute(key) {
  const cache = await caches.open(CACHE);
  return cache.match(encodeURI(key));
}

self.addEventListener('install', (event) => {
  // Any failure rejects the install; the previous version stays active (OC-10.3).
  event.waitUntil(precache());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n.startsWith(CACHE_PREFIX) && n !== CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    const key = routeKey(url.pathname);
    if (ROUTES.has(key)) {
      event.respondWith(cachedRoute(key).then((hit) => hit || fetch(req)));
    } else {
      // Unknown page: network when online; offline, the not-found page (or Home).
      event.respondWith(
        fetch(req).catch(async () => {
          const fallback = (MANIFEST.notFound && (await cachedRoute(MANIFEST.notFound))) || (await cachedRoute('/'));
          return fallback || Response.error();
        })
      );
    }
    return;
  }

  if (ASSETS.has(url.pathname)) {
    event.respondWith(
      caches
        .open(CACHE)
        .then((cache) => cache.match(url.pathname))
        .then((hit) => hit || fetch(req))
    );
  }
  // Anything else: browser default (network).
});
