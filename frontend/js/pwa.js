/**
 * PWA (Progressive Web App) Manager
 * Handles service worker registration, install prompts, and updates
 */

(function() {
    'use strict';

    const PWA = {
        deferredPrompt: null,
        isInstalled: false,
        swRegistration: null,

        /**
         * Initialize PWA functionality
         */
        init() {
            this.checkIfInstalled();
            this.registerServiceWorker();
            this.handleInstallPrompt();
            this.handleAppInstalled();
            this.setupUpdateHandler();
        },

        /**
         * Check if app is already installed
         */
        checkIfInstalled() {
            // Check display mode
            if (window.matchMedia('(display-mode: standalone)').matches) {
                this.isInstalled = true;
                console.log('[PWA] App is running in standalone mode');
            }

            // iOS Safari check
            if (window.navigator.standalone === true) {
                this.isInstalled = true;
                console.log('[PWA] App is running in iOS standalone mode');
            }
        },

        /**
         * Register Service Worker
         */
        async registerServiceWorker() {
            if (!('serviceWorker' in navigator)) {
                console.log('[PWA] Service workers not supported');
                return;
            }

            try {
                this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });

                console.log('[PWA] Service worker registered:', this.swRegistration.scope);

                // Check for updates on load
                this.swRegistration.addEventListener('updatefound', () => {
                    this.handleUpdate(this.swRegistration.installing);
                });

                // Check for updates periodically (every hour)
                setInterval(() => {
                    this.swRegistration.update();
                }, 60 * 60 * 1000);

            } catch (error) {
                console.error('[PWA] Service worker registration failed:', error);
            }
        },

        /**
         * Handle the install prompt (beforeinstallprompt)
         */
        handleInstallPrompt() {
            window.addEventListener('beforeinstallprompt', (e) => {
                // Prevent Chrome 67+ from automatically showing the prompt
                e.preventDefault();
                
                // Store the event for later use
                this.deferredPrompt = e;
                
                console.log('[PWA] Install prompt available');
                
                // Show custom install button/banner
                this.showInstallBanner();
            });
        },

        /**
         * Show custom install banner
         */
        showInstallBanner() {
            // Don't show if already installed or banner dismissed recently
            if (this.isInstalled) return;
            if (localStorage.getItem('pwaInstallDismissed')) {
                const dismissed = parseInt(localStorage.getItem('pwaInstallDismissed'));
                if (Date.now() - dismissed < 7 * 24 * 60 * 60 * 1000) return; // 7 days
            }

            const banner = document.createElement('div');
            banner.id = 'pwaInstallBanner';
            banner.innerHTML = `
                <div class="pwa-banner-content">
                    <div class="pwa-banner-icon">
                        <img src="/images/logo.svg" alt="Mi Tienda" width="40" height="40">
                    </div>
                    <div class="pwa-banner-text">
                        <strong>Instalar Mi Tienda</strong>
                        <span>Acceso rápido desde tu pantalla de inicio</span>
                    </div>
                    <div class="pwa-banner-actions">
                        <button id="pwaInstallBtn" class="btn btn-primary btn-sm">Instalar</button>
                        <button id="pwaDismissBtn" class="btn-close" aria-label="Cerrar">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;

            // Add styles
            this.addBannerStyles();

            // Insert banner
            document.body.appendChild(banner);

            // Animate in
            requestAnimationFrame(() => {
                banner.classList.add('show');
            });

            // Install button click
            document.getElementById('pwaInstallBtn').addEventListener('click', () => {
                this.installApp();
            });

            // Dismiss button click
            document.getElementById('pwaDismissBtn').addEventListener('click', () => {
                this.dismissInstallBanner();
            });
        },

        /**
         * Add banner styles
         */
        addBannerStyles() {
            if (document.getElementById('pwaBannerStyles')) return;

            const style = document.createElement('style');
            style.id = 'pwaBannerStyles';
            style.textContent = `
                #pwaInstallBanner {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: var(--color-surface, #ffffff);
                    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
                    z-index: 10000;
                    transform: translateY(100%);
                    transition: transform 0.3s ease;
                }

                #pwaInstallBanner.show {
                    transform: translateY(0);
                }

                .pwa-banner-content {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px 20px;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .pwa-banner-icon img {
                    border-radius: 10px;
                }

                .pwa-banner-text {
                    flex: 1;
                }

                .pwa-banner-text strong {
                    display: block;
                    font-size: 14px;
                    color: var(--color-text, #1f2937);
                }

                .pwa-banner-text span {
                    font-size: 12px;
                    color: var(--color-text-light, #6b7280);
                }

                .pwa-banner-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .pwa-banner-actions .btn-close {
                    background: none;
                    border: none;
                    padding: 8px;
                    cursor: pointer;
                    color: var(--color-text-light, #6b7280);
                    opacity: 0.7;
                    transition: opacity 0.2s;
                }

                .pwa-banner-actions .btn-close:hover {
                    opacity: 1;
                }

                @media (max-width: 480px) {
                    .pwa-banner-text span {
                        display: none;
                    }
                }

                /* Update banner */
                #pwaUpdateBanner {
                    position: fixed;
                    top: 80px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: var(--color-primary, #667eea);
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                    z-index: 10001;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    animation: slideDown 0.3s ease;
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }

                #pwaUpdateBanner button {
                    background: white;
                    color: var(--color-primary, #667eea);
                    border: none;
                    padding: 6px 16px;
                    border-radius: 4px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 13px;
                }
            `;
            document.head.appendChild(style);
        },

        /**
         * Install the app
         */
        async installApp() {
            if (!this.deferredPrompt) {
                console.log('[PWA] No install prompt available');
                return;
            }

            // Show the install prompt
            this.deferredPrompt.prompt();

            // Wait for user response
            const { outcome } = await this.deferredPrompt.userChoice;
            
            console.log('[PWA] User response:', outcome);

            if (outcome === 'accepted') {
                console.log('[PWA] User accepted install');
            }

            // Clear the prompt
            this.deferredPrompt = null;

            // Hide the banner
            this.hideInstallBanner();
        },

        /**
         * Dismiss install banner
         */
        dismissInstallBanner() {
            localStorage.setItem('pwaInstallDismissed', Date.now().toString());
            this.hideInstallBanner();
        },

        /**
         * Hide install banner
         */
        hideInstallBanner() {
            const banner = document.getElementById('pwaInstallBanner');
            if (banner) {
                banner.classList.remove('show');
                setTimeout(() => banner.remove(), 300);
            }
        },

        /**
         * Handle app installed event
         */
        handleAppInstalled() {
            window.addEventListener('appinstalled', () => {
                console.log('[PWA] App installed successfully');
                this.isInstalled = true;
                this.deferredPrompt = null;
                this.hideInstallBanner();

                // Track installation (analytics)
                if (typeof gtag === 'function') {
                    gtag('event', 'pwa_install', {
                        event_category: 'PWA',
                        event_label: 'App Installed'
                    });
                }
            });
        },

        /**
         * Handle service worker updates
         */
        handleUpdate(installingWorker) {
            installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed') {
                    if (navigator.serviceWorker.controller) {
                        // New update available
                        console.log('[PWA] New update available');
                        this.showUpdateBanner();
                    } else {
                        // First install
                        console.log('[PWA] Content cached for offline use');
                    }
                }
            });
        },

        /**
         * Setup update handler for active worker changes
         */
        setupUpdateHandler() {
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (refreshing) return;
                refreshing = true;
                window.location.reload();
            });
        },

        /**
         * Show update available banner
         */
        showUpdateBanner() {
            const banner = document.createElement('div');
            banner.id = 'pwaUpdateBanner';
            banner.innerHTML = `
                <span>🎉 Nueva versión disponible</span>
                <button id="pwaUpdateBtn">Actualizar</button>
            `;

            document.body.appendChild(banner);

            document.getElementById('pwaUpdateBtn').addEventListener('click', () => {
                this.applyUpdate();
            });
        },

        /**
         * Apply update
         */
        applyUpdate() {
            if (this.swRegistration && this.swRegistration.waiting) {
                this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
        },

        /**
         * Request notification permission
         */
        async requestNotificationPermission() {
            if (!('Notification' in window)) {
                console.log('[PWA] Notifications not supported');
                return false;
            }

            if (Notification.permission === 'granted') {
                return true;
            }

            if (Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                return permission === 'granted';
            }

            return false;
        },

        /**
         * Subscribe to push notifications
         */
        async subscribeToPush(vapidPublicKey) {
            if (!this.swRegistration) return null;

            try {
                const subscription = await this.swRegistration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
                });

                console.log('[PWA] Push subscription:', subscription);
                return subscription;
            } catch (error) {
                console.error('[PWA] Push subscription failed:', error);
                return null;
            }
        },

        /**
         * Convert VAPID key
         */
        urlBase64ToUint8Array(base64String) {
            const padding = '='.repeat((4 - base64String.length % 4) % 4);
            const base64 = (base64String + padding)
                .replace(/-/g, '+')
                .replace(/_/g, '/');

            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);

            for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
            }
            return outputArray;
        }
    };

    // Export globally
    window.PWA = PWA;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => PWA.init());
    } else {
        PWA.init();
    }

})();
