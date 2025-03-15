const CACHE_NAME = 'legal-marketplace-v1';
const BASE_PATH = '/legal-marketplace-sa';
const STATIC_ASSETS = [
    `${BASE_PATH}/`,
    `${BASE_PATH}/index.html`,
    `${BASE_PATH}/ar/index.html`,
    `${BASE_PATH}/logo.svg`,
    `${BASE_PATH}/favicon.png`,
    `${BASE_PATH}/apple-touch-icon.png`,
    `${BASE_PATH}/js/analytics.js`,
    'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap'
];

// Install service worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate service worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
        .then(() => {
            // Take control of all clients immediately
            return self.clients.claim();
        })
    );
});

// Fetch event handler with improved caching strategy
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Handle analytics endpoints differently
    if (event.request.url.includes('/analytics')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    // Return cached response immediately
                    // And update cache in background
                    const fetchPromise = fetch(event.request).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            const cachePromise = caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, networkResponse.clone());
                            });
                            // Don't wait for cache update
                            cachePromise.catch(console.error);
                        }
                    });
                    fetchPromise.catch(console.error);
                    return response;
                }

                // If not in cache, fetch from network
                return fetch(event.request).then((response) => {
                    // Check if we received a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    // Add to cache
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        })
                        .catch(console.error);

                    return response;
                });
            })
            .catch(() => {
                // Return offline fallback if available
                return caches.match(`${BASE_PATH}/offline.html`);
            })
    );
}); 