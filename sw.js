const CACHE_NAME = 'fl-cache-v2';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './css/components.css',
  './js/app.js',
  './js/auth.js',
  './js/store.js',
  './js/student.js',
  './js/admin.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // تفعيل فوري بدون انتظار
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// حذف الكاش القديم تلقائياً
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

