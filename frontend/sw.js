/**
 * Service Worker for Mi Tienda PWA
 * Provides offline functionality, caching, and push notifications
 */

const CACHE_NAME = 'mi-tienda-v3';
const STATIC_CACHE = 'static-v3';
const DYNAMIC_CACHE = 'dynamic-v3';
const IMAGE_CACHE = 'images-v3';

// Resources to cache immediately
const STATIC_ASSETS = [
    '/',
    '/home.html',
    '/css/main.css',
    '/css/base.css',
    '/css/variables.css',
    '/css/pages/home.css',
    '/js/config.js',
    '/js/utils.js',
    '/js/auth.js',
    '/js/cart.js',
    '/js/api.js',
    '/js/header.js',
    '/js/script.js',
    '/images/logo.svg',
    '/images/favicon.svg',
    '/manifest.json'
];

// Pages to cache for offline access
const OFFLINE_PAGES = [
    '/pages/productos.html',
    '/pages/carrito.html',
    '/pages/contacto.html',
    '/pages/nosotros.html'
];

// Cache size limits
const MAX_DYNAMIC_CACHE_ITEMS = 50;
const MAX_IMAGE_CACHE_ITEMS = 100;

/**
 * Install event - cache static assets
 */
self.addEventListener('install', event => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                // Cache offline pages
                return caches.open(DYNAMIC_CACHE)
                    .then(cache => cache.addAll(OFFLINE_PAGES));
            })
            .then(() => self.skipWaiting())
            .catch(err => console.error('[SW] Install failed:', err))
    );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', event => {
    console.log('[SW] Activating service worker...');

    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => {
                            return name !== STATIC_CACHE &&
                                name !== DYNAMIC_CACHE &&
                                name !== IMAGE_CACHE;
                        })
                        .map(name => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

/**
 * Fetch event - serve from cache, fallback to network
 */
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip API requests (always fetch from network)
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Handle image requests
    if (isImageRequest(request)) {
        event.respondWith(cacheFirstWithRefresh(request, IMAGE_CACHE));
        return;
    }

    // Handle static assets
    if (isStaticAsset(request)) {
        event.respondWith(cacheFirst(request, STATIC_CACHE));
        return;
    }

    // Handle page requests
    if (request.mode === 'navigate') {
        event.respondWith(networkFirstWithOffline(request));
        return;
    }

    // Default: network first with cache fallback
    event.respondWith(networkFirst(request));
});

/**
 * Cache-first strategy
 */
async function cacheFirst(request, cacheName) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        return createOfflineResponse();
    }
}

/**
 * Cache-first with background refresh
 */
async function cacheFirstWithRefresh(request, cacheName) {
    const cached = await caches.match(request);

    // Fetch fresh version in background
    const fetchPromise = fetch(request)
        .then(async response => {
            if (response.ok) {
                const cache = await caches.open(cacheName);
                cache.put(request, response.clone());
                await trimCache(cacheName, MAX_IMAGE_CACHE_ITEMS);
            }
            return response;
        })
        .catch(() => cached);

    return cached || fetchPromise;
}

/**
 * Network-first strategy
 */
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        return cached || createOfflineResponse();
    }
}

/**
 * Network-first with offline page fallback
 */
async function networkFirstWithOffline(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
            await trimCache(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_ITEMS);
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;

        // Return offline page
        return caches.match('/pages/offline.html') || createOfflinePage();
    }
}

/**
 * Check if request is for an image
 */
function isImageRequest(request) {
    const url = new URL(request.url);
    return (
        request.destination === 'image' ||
        /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname)
    );
}

/**
 * Check if request is for a static asset
 */
function isStaticAsset(request) {
    const url = new URL(request.url);
    return (
        /\.(css|js|woff|woff2|ttf|eot)$/i.test(url.pathname) ||
        url.pathname.includes('/fonts/')
    );
}

/**
 * Trim cache to max items
 */
async function trimCache(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length > maxItems) {
        // Delete oldest items first
        const toDelete = keys.slice(0, keys.length - maxItems);
        await Promise.all(toDelete.map(key => cache.delete(key)));
    }
}

/**
 * Create offline response
 */
function createOfflineResponse() {
    return new Response('Offline - No cached version available', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' }
    });
}

/**
 * Create offline page
 */
function createOfflinePage() {
    const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sin conexión | Mi Tienda</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: system-ui, -apple-system, sans-serif;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-align: center;
                    padding: 20px;
                }
                .offline-container {
                    max-width: 400px;
                }
                .offline-icon {
                    font-size: 64px;
                    margin-bottom: 20px;
                }
                h1 {
                    font-size: 24px;
                    margin-bottom: 10px;
                }
                p {
                    opacity: 0.9;
                    margin-bottom: 20px;
                }
                .retry-btn {
                    display: inline-block;
                    padding: 12px 24px;
                    background: white;
                    color: #667eea;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    transition: transform 0.2s;
                }
                .retry-btn:hover {
                    transform: scale(1.05);
                }
            </style>
        </head>
        <body>
            <div class="offline-container">
                <div class="offline-icon">📶</div>
                <h1>Sin conexión</h1>
                <p>Parece que no tienes conexión a internet. Verifica tu conexión e intenta nuevamente.</p>
                <a href="/" class="retry-btn" onclick="window.location.reload(); return false;">
                    Reintentar
                </a>
            </div>
        </body>
        </html>
    `;

    return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
    });
}

/**
 * Handle push notifications
 */
self.addEventListener('push', event => {
    if (!event.data) return;

    const data = event.data.json();

    const options = {
        body: data.body || 'Tienes una nueva notificación',
        icon: '/images/icons/icon-192x192.png',
        badge: '/images/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            url: data.url || '/'
        },
        actions: [
            { action: 'open', title: 'Ver' },
            { action: 'close', title: 'Cerrar' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Mi Tienda', options)
    );
});

/**
 * Handle notification click
 */
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'close') return;

    const url = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(windowClients => {
                // Check if a window is already open
                for (const client of windowClients) {
                    if (client.url === url && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});

/**
 * Handle background sync
 */
self.addEventListener('sync', event => {
    if (event.tag === 'sync-cart') {
        event.waitUntil(syncCart());
    }
});

/**
 * Sync cart with server
 */
async function syncCart() {
    // Implementation would depend on your cart storage strategy
    console.log('[SW] Syncing cart...');
}

console.log('[SW] Service Worker loaded');
