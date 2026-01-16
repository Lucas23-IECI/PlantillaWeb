/**
 * Lazy Loading & Performance Utilities
 * Implements native lazy loading with fallback for older browsers
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        rootMargin: '50px 0px',
        threshold: 0.01,
        defaultPlaceholder: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3C/svg%3E',
        fadeInDuration: 300
    };

    /**
     * Initialize lazy loading for images
     */
    function initLazyLoading() {
        // Use native lazy loading when supported
        if ('loading' in HTMLImageElement.prototype) {
            initNativeLazyLoad();
        } else {
            initIntersectionObserverLazyLoad();
        }
    }

    /**
     * Native lazy loading implementation
     */
    function initNativeLazyLoad() {
        const lazyImages = document.querySelectorAll('img[data-src], img.lazy');
        
        lazyImages.forEach(img => {
            // Set native loading attribute
            img.loading = 'lazy';
            
            // If using data-src pattern
            if (img.dataset.src) {
                img.src = img.dataset.src;
                delete img.dataset.src;
            }
            
            if (img.dataset.srcset) {
                img.srcset = img.dataset.srcset;
                delete img.dataset.srcset;
            }
            
            img.classList.remove('lazy');
            img.classList.add('lazy-loaded');
        });
    }

    /**
     * Intersection Observer fallback for browsers without native lazy loading
     */
    function initIntersectionObserverLazyLoad() {
        if (!('IntersectionObserver' in window)) {
            // Final fallback: load all images immediately
            loadAllImages();
            return;
        }

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadImage(entry.target);
                    obs.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: CONFIG.rootMargin,
            threshold: CONFIG.threshold
        });

        const lazyImages = document.querySelectorAll('img[data-src], img.lazy');
        lazyImages.forEach(img => observer.observe(img));
    }

    /**
     * Load a single image
     */
    function loadImage(img) {
        const src = img.dataset.src || img.src;
        const srcset = img.dataset.srcset;

        if (!src) return;

        // Create a temporary image to preload
        const tempImage = new Image();
        
        tempImage.onload = () => {
            if (srcset) {
                img.srcset = srcset;
            }
            img.src = src;
            img.classList.remove('lazy');
            img.classList.add('lazy-loaded');
            
            // Optional fade-in animation
            img.style.opacity = '0';
            img.style.transition = `opacity ${CONFIG.fadeInDuration}ms ease`;
            requestAnimationFrame(() => {
                img.style.opacity = '1';
            });
        };

        tempImage.onerror = () => {
            console.warn('Failed to load image:', src);
            img.classList.add('lazy-error');
        };

        tempImage.src = src;
        if (srcset) tempImage.srcset = srcset;
    }

    /**
     * Load all images immediately (fallback)
     */
    function loadAllImages() {
        const lazyImages = document.querySelectorAll('img[data-src], img.lazy');
        lazyImages.forEach(loadImage);
    }

    /**
     * Optimize images by converting to WebP when possible
     * Note: This requires server-side support or pre-converted images
     */
    function initWebPSupport() {
        // Check WebP support
        const webpSupported = document.createElement('canvas')
            .toDataURL('image/webp')
            .indexOf('data:image/webp') === 0;

        if (webpSupported) {
            document.documentElement.classList.add('webp-supported');
        } else {
            document.documentElement.classList.add('no-webp');
        }

        return webpSupported;
    }

    /**
     * Initialize lazy loading for iframes
     */
    function initLazyIframes() {
        const lazyIframes = document.querySelectorAll('iframe[data-src]');
        
        if (!('IntersectionObserver' in window)) {
            lazyIframes.forEach(iframe => {
                iframe.src = iframe.dataset.src;
            });
            return;
        }

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const iframe = entry.target;
                    iframe.src = iframe.dataset.src;
                    delete iframe.dataset.src;
                    obs.unobserve(iframe);
                }
            });
        }, {
            rootMargin: '200px 0px',
            threshold: 0
        });

        lazyIframes.forEach(iframe => observer.observe(iframe));
    }

    /**
     * Initialize lazy loading for background images
     */
    function initLazyBackgrounds() {
        const lazyBackgrounds = document.querySelectorAll('[data-bg]');
        
        if (!('IntersectionObserver' in window)) {
            lazyBackgrounds.forEach(el => {
                el.style.backgroundImage = `url(${el.dataset.bg})`;
            });
            return;
        }

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    el.style.backgroundImage = `url(${el.dataset.bg})`;
                    el.classList.add('bg-loaded');
                    delete el.dataset.bg;
                    obs.unobserve(el);
                }
            });
        }, {
            rootMargin: '100px 0px',
            threshold: 0
        });

        lazyBackgrounds.forEach(el => observer.observe(el));
    }

    /**
     * Prefetch critical resources
     */
    function prefetchResources(urls) {
        if (!('link' in document.createElement('link'))) return;

        urls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            link.as = guessResourceType(url);
            document.head.appendChild(link);
        });
    }

    /**
     * Preconnect to external domains
     */
    function preconnectDomains(domains) {
        domains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = domain;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
    }

    /**
     * Guess resource type for prefetch
     */
    function guessResourceType(url) {
        const ext = url.split('.').pop().toLowerCase();
        const types = {
            'css': 'style',
            'js': 'script',
            'woff': 'font',
            'woff2': 'font',
            'ttf': 'font',
            'jpg': 'image',
            'jpeg': 'image',
            'png': 'image',
            'webp': 'image',
            'gif': 'image',
            'svg': 'image'
        };
        return types[ext] || 'fetch';
    }

    /**
     * Defer non-critical CSS
     */
    function loadDeferredStyles(hrefs) {
        hrefs.forEach(href => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.media = 'print';
            link.onload = function() {
                this.media = 'all';
            };
            document.head.appendChild(link);
        });
    }

    /**
     * Initialize all performance optimizations
     */
    function initPerformance() {
        // Check WebP support first
        initWebPSupport();

        // Initialize lazy loading on DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                initLazyLoading();
                initLazyIframes();
                initLazyBackgrounds();
            });
        } else {
            initLazyLoading();
            initLazyIframes();
            initLazyBackgrounds();
        }

        // Preconnect to common external domains
        preconnectDomains([
            'https://res.cloudinary.com',
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com'
        ]);
    }

    // Expose utilities globally
    window.LazyLoad = {
        init: initPerformance,
        loadImage,
        prefetch: prefetchResources,
        preconnect: preconnectDomains,
        loadDeferredStyles,
        isWebPSupported: initWebPSupport
    };

    // Auto-initialize
    initPerformance();

})();
