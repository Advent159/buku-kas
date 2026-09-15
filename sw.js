const CACHE_NAME = 'buku-kas-v1';
const FILES_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './jspdf.min.js',
    './jspdf-autotable.min.js'
];

// Install - cache semua file
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('📦 Caching files...');
            return cache.addAll(FILES_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// Activate - hapus cache lama
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => {
                        console.log('🗑️ Menghapus cache lama:', key);
                        return caches.delete(key);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch - ambil dari cache dulu, kalau tidak ada ambil dari network
self.addEventListener('fetch', (event) => {
    // Skip request non-GET
    if (event.request.method !== 'GET') return;
    
    // Skip request ke Google Fonts (biarkan online)
    const url = event.request.url;
    if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }
    
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then((networkResponse) => {
                // Cache response baru kalau sukses
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Kalau offline dan tidak ada di cache, return index.html
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});