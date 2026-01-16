/**
 * Image Optimizer Utility
 * Handles responsive images, WebP fallbacks, and optimal image loading
 */

(function() {
    'use strict';

    const ImageOptimizer = {
        
        // Cloudinary base URL (update with your cloud name)
        cloudinaryBase: 'https://res.cloudinary.com/demo',
        
        // Default image placeholder
        placeholder: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext x="200" y="150" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="16"%3ECargando...%3C/text%3E%3C/svg%3E',
        
        // Error placeholder
        errorPlaceholder: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23fecaca" width="400" height="300"/%3E%3Ctext x="200" y="150" text-anchor="middle" fill="%23dc2626" font-family="sans-serif" font-size="14"%3EImagen no disponible%3C/text%3E%3C/svg%3E',
        
        // Check if WebP is supported
        webpSupported: null,
        
        /**
         * Initialize optimizer and detect WebP support
         */
        async init() {
            this.webpSupported = await this.checkWebPSupport();
            this.setupResponsiveImages();
            return this;
        },
        
        /**
         * Check WebP support using feature detection
         */
        checkWebPSupport() {
            return new Promise(resolve => {
                const webP = new Image();
                webP.onload = webP.onerror = () => {
                    resolve(webP.height === 2);
                };
                webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
            });
        },
        
        /**
         * Get optimized image URL with Cloudinary transformations
         * @param {string} originalUrl - Original image URL
         * @param {object} options - Transformation options
         */
        getOptimizedUrl(originalUrl, options = {}) {
            if (!originalUrl) return this.placeholder;
            
            // If already a Cloudinary URL, add transformations
            if (originalUrl.includes('cloudinary.com')) {
                return this.addCloudinaryTransformations(originalUrl, options);
            }
            
            // For other URLs, return as-is (consider proxying through your backend)
            return originalUrl;
        },
        
        /**
         * Add Cloudinary transformations to URL
         */
        addCloudinaryTransformations(url, options = {}) {
            const {
                width = 'auto',
                height = 'auto',
                quality = 'auto:good',
                format = 'auto',
                crop = 'fill',
                gravity = 'auto'
            } = options;
            
            // Build transformation string
            const transforms = [];
            
            if (width !== 'auto') transforms.push(`w_${width}`);
            if (height !== 'auto') transforms.push(`h_${height}`);
            transforms.push(`c_${crop}`);
            transforms.push(`g_${gravity}`);
            transforms.push(`q_${quality}`);
            transforms.push(`f_${format}`);
            
            const transformString = transforms.join(',');
            
            // Insert transforms into Cloudinary URL
            return url.replace('/upload/', `/upload/${transformString}/`);
        },
        
        /**
         * Generate srcset for responsive images
         * @param {string} url - Base image URL
         * @param {array} widths - Array of widths to generate
         */
        generateSrcset(url, widths = [320, 640, 768, 1024, 1280, 1920]) {
            if (!url || !url.includes('cloudinary.com')) {
                return '';
            }
            
            return widths
                .map(w => {
                    const optimizedUrl = this.getOptimizedUrl(url, { width: w });
                    return `${optimizedUrl} ${w}w`;
                })
                .join(', ');
        },
        
        /**
         * Create an optimized image element
         * @param {object} config - Image configuration
         */
        createImage(config) {
            const {
                src,
                alt = '',
                className = '',
                width,
                height,
                lazy = true,
                responsive = true,
                sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
            } = config;
            
            const img = document.createElement('img');
            
            // Set alt text
            img.alt = alt;
            
            // Add class
            if (className) img.className = className;
            
            // Set dimensions to prevent layout shift
            if (width) img.width = width;
            if (height) img.height = height;
            
            // Set loading attribute
            if (lazy) img.loading = 'lazy';
            
            // Set decoding attribute for better performance
            img.decoding = 'async';
            
            // Generate responsive srcset
            if (responsive && src.includes('cloudinary.com')) {
                const srcset = this.generateSrcset(src);
                if (srcset) {
                    img.srcset = srcset;
                    img.sizes = sizes;
                }
            }
            
            // Set optimized src
            img.src = this.getOptimizedUrl(src, { width, height });
            
            // Error handling
            img.onerror = () => {
                img.src = this.errorPlaceholder;
                img.classList.add('img-error');
            };
            
            return img;
        },
        
        /**
         * Create a picture element with WebP fallback
         * @param {object} config - Image configuration
         */
        createPicture(config) {
            const {
                src,
                alt = '',
                className = '',
                width,
                height,
                lazy = true,
                sizes = '100vw'
            } = config;
            
            const picture = document.createElement('picture');
            
            // WebP source
            if (this.webpSupported && src.includes('cloudinary.com')) {
                const webpSource = document.createElement('source');
                webpSource.type = 'image/webp';
                webpSource.srcset = this.generateSrcset(
                    this.getOptimizedUrl(src, { format: 'webp' })
                );
                webpSource.sizes = sizes;
                picture.appendChild(webpSource);
            }
            
            // Fallback image
            const img = this.createImage({
                src,
                alt,
                className,
                width,
                height,
                lazy,
                responsive: true,
                sizes
            });
            
            picture.appendChild(img);
            
            return picture;
        },
        
        /**
         * Set up responsive images on existing img elements
         */
        setupResponsiveImages() {
            const images = document.querySelectorAll('img[data-responsive]');
            
            images.forEach(img => {
                const src = img.dataset.src || img.src;
                
                if (!src || !src.includes('cloudinary.com')) return;
                
                // Generate srcset
                const srcset = this.generateSrcset(src);
                if (srcset) {
                    img.srcset = srcset;
                    img.sizes = img.dataset.sizes || '100vw';
                }
                
                // Enable lazy loading
                if (!img.hasAttribute('loading')) {
                    img.loading = 'lazy';
                }
                
                // Enable async decoding
                img.decoding = 'async';
                
                // Remove data attribute
                delete img.dataset.responsive;
            });
        },
        
        /**
         * Get optimal image dimensions based on container
         * @param {HTMLElement} container - Container element
         */
        getOptimalDimensions(container) {
            const rect = container.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            
            return {
                width: Math.ceil(rect.width * dpr),
                height: Math.ceil(rect.height * dpr)
            };
        },
        
        /**
         * Preload critical images
         * @param {array} urls - Array of image URLs to preload
         */
        preloadImages(urls) {
            urls.forEach(url => {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = this.getOptimizedUrl(url);
                
                if (this.webpSupported) {
                    link.type = 'image/webp';
                }
                
                document.head.appendChild(link);
            });
        }
    };
    
    // Export globally
    window.ImageOptimizer = ImageOptimizer;
    
    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ImageOptimizer.init());
    } else {
        ImageOptimizer.init();
    }
    
})();
