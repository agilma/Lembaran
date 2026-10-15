const CACHE_PREFIX = 'lembaran-cache-';
const CACHE_VERSION = 'v2';
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
];

const SENSITIVE_PATHS = [
  '/riwayat',
  '/kalender',
  '/login',
  '/reset-password',
  '/auth',
  '/api',
];

function isSensitivePath(pathname) {
  return SENSITIVE_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Pre-cache error during SW installation:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // 2. Bypass public SW caching for sensitive, API, auth, or Supabase endpoints
  const isSupabase =
    url.hostname.includes('supabase.co') ||
    url.pathname.includes('/auth/v1') ||
    url.pathname.includes('/rest/v1');

  const isNextServerAction = request.headers.has('Next-Action');
  const isSensitive = isSensitivePath(url.pathname);

  if (isSupabase || isNextServerAction || isSensitive) {
    return;
  }

  // 3. Navigation requests: Network-Only with generic offline HTML fallback.
  // HTML responses are never stored in Cache Storage to prevent caching user session HTML.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>Lembaran - Offline</title></head><body><p>Anda sedang offline. Halaman yang memerlukan koneksi internet atau autentikasi tidak dapat dibuka tanpa jaringan.</p></body></html>',
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          }
        );
      })
    );
    return;
  }

  // 4. Static assets (_next/static, icons, images, fonts): Cache-First / Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|woff|woff2|ttf|otf|css|js|webmanifest)$/i);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const cacheControl = (networkResponse.headers.get('Cache-Control') || '').toLowerCase();
              if (!cacheControl.includes('no-store') && !cacheControl.includes('private')) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
            }
            return networkResponse;
          })
          .catch(() => null);

        return cachedResponse || fetchPromise.then((res) => res || new Response('', { status: 404 }));
      })
    );
    return;
  }

  // 5. Default strategy: Pass through to network without caching unapproved resources
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
