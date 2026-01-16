/**
 * SEO Schema.org JSON-LD Generator
 * Dynamically generates structured data for SEO
 */

(function() {
    'use strict';

    // Site configuration (customize these)
    const SITE_CONFIG = {
        name: window.CONFIG?.SITE_NAME || 'Mi Tienda',
        url: window.location.origin,
        logo: window.location.origin + '/images/logo.svg',
        description: 'Tu tienda online de confianza con los mejores productos',
        phone: '+56 9 1234 5678',
        email: 'contacto@mitienda.cl',
        address: {
            streetAddress: 'Av. Principal 123',
            addressLocality: 'Santiago',
            addressRegion: 'Metropolitana',
            postalCode: '7500000',
            addressCountry: 'CL'
        },
        social: {
            facebook: 'https://facebook.com/mitienda',
            instagram: 'https://instagram.com/mitienda',
            twitter: 'https://twitter.com/mitienda'
        },
        priceRange: '$$ - $$$',
        currency: 'CLP'
    };

    /**
     * Add JSON-LD script to head
     */
    function addSchema(schema) {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
    }

    /**
     * Organization Schema
     */
    function addOrganizationSchema() {
        const schema = {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: SITE_CONFIG.name,
            url: SITE_CONFIG.url,
            logo: SITE_CONFIG.logo,
            description: SITE_CONFIG.description,
            contactPoint: {
                '@type': 'ContactPoint',
                telephone: SITE_CONFIG.phone,
                email: SITE_CONFIG.email,
                contactType: 'customer service',
                availableLanguage: 'Spanish'
            },
            address: {
                '@type': 'PostalAddress',
                ...SITE_CONFIG.address
            },
            sameAs: Object.values(SITE_CONFIG.social)
        };
        addSchema(schema);
    }

    /**
     * Local Business Schema (for physical stores)
     */
    function addLocalBusinessSchema() {
        const schema = {
            '@context': 'https://schema.org',
            '@type': 'Store',
            name: SITE_CONFIG.name,
            url: SITE_CONFIG.url,
            logo: SITE_CONFIG.logo,
            image: SITE_CONFIG.logo,
            description: SITE_CONFIG.description,
            telephone: SITE_CONFIG.phone,
            email: SITE_CONFIG.email,
            priceRange: SITE_CONFIG.priceRange,
            address: {
                '@type': 'PostalAddress',
                ...SITE_CONFIG.address
            },
            geo: {
                '@type': 'GeoCoordinates',
                latitude: '-33.4489',
                longitude: '-70.6693'
            },
            openingHoursSpecification: [
                {
                    '@type': 'OpeningHoursSpecification',
                    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                    opens: '09:00',
                    closes: '18:00'
                },
                {
                    '@type': 'OpeningHoursSpecification',
                    dayOfWeek: 'Saturday',
                    opens: '10:00',
                    closes: '14:00'
                }
            ],
            sameAs: Object.values(SITE_CONFIG.social)
        };
        addSchema(schema);
    }

    /**
     * Website Schema with SearchAction
     */
    function addWebsiteSchema() {
        const schema = {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: SITE_CONFIG.name,
            url: SITE_CONFIG.url,
            potentialAction: {
                '@type': 'SearchAction',
                target: {
                    '@type': 'EntryPoint',
                    urlTemplate: SITE_CONFIG.url + '/pages/productos.html?search={search_term_string}'
                },
                'query-input': 'required name=search_term_string'
            }
        };
        addSchema(schema);
    }

    /**
     * Product Schema
     */
    window.addProductSchema = function(product) {
        if (!product) return;

        const name = product.name || product.nombre || 'Producto';
        const description = product.description || product.descripcion || '';
        const price = product.price || product.precio || 0;
        const image = product.image_url || product.imagen || SITE_CONFIG.logo;
        const sku = product.sku || product.id || '';
        const brand = product.brand || product.marca || SITE_CONFIG.name;
        const stock = product.stock ?? 10;
        const rating = product.rating || 0;
        const reviewCount = product.reviews_count || 0;

        const schema = {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: name,
            description: description,
            image: image,
            sku: sku,
            brand: {
                '@type': 'Brand',
                name: brand
            },
            offers: {
                '@type': 'Offer',
                url: window.location.href,
                priceCurrency: SITE_CONFIG.currency,
                price: price,
                availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                seller: {
                    '@type': 'Organization',
                    name: SITE_CONFIG.name
                }
            }
        };

        // Add aggregate rating if available
        if (rating > 0 && reviewCount > 0) {
            schema.aggregateRating = {
                '@type': 'AggregateRating',
                ratingValue: rating,
                reviewCount: reviewCount,
                bestRating: 5,
                worstRating: 1
            };
        }

        addSchema(schema);
    };

    /**
     * Breadcrumb Schema
     */
    window.addBreadcrumbSchema = function(items) {
        if (!items || !items.length) return;

        const schema = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: items.map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: item.name,
                item: item.url || undefined
            }))
        };

        addSchema(schema);
    };

    /**
     * FAQ Schema
     */
    window.addFAQSchema = function(faqs) {
        if (!faqs || !faqs.length) return;

        const schema = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map(faq => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: faq.answer
                }
            }))
        };

        addSchema(schema);
    };

    /**
     * Article Schema (for blog/news)
     */
    window.addArticleSchema = function(article) {
        if (!article) return;

        const schema = {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: article.title,
            description: article.description,
            image: article.image,
            author: {
                '@type': 'Organization',
                name: SITE_CONFIG.name
            },
            publisher: {
                '@type': 'Organization',
                name: SITE_CONFIG.name,
                logo: {
                    '@type': 'ImageObject',
                    url: SITE_CONFIG.logo
                }
            },
            datePublished: article.datePublished,
            dateModified: article.dateModified || article.datePublished
        };

        addSchema(schema);
    };

    /**
     * Update meta tags dynamically
     */
    window.updateMetaTags = function(options) {
        const { title, description, image, url, type = 'website' } = options;

        // Update title
        if (title) {
            document.title = title + ' | ' + SITE_CONFIG.name;
            updateMeta('og:title', title);
            updateMeta('twitter:title', title);
        }

        // Update description
        if (description) {
            updateMeta('description', description);
            updateMeta('og:description', description);
            updateMeta('twitter:description', description);
        }

        // Update image
        if (image) {
            updateMeta('og:image', image);
            updateMeta('twitter:image', image);
        }

        // Update URL
        const pageUrl = url || window.location.href;
        updateMeta('og:url', pageUrl);
        updateLink('canonical', pageUrl);

        // Update type
        updateMeta('og:type', type);
    };

    /**
     * Update or create meta tag
     */
    function updateMeta(name, content) {
        let meta = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
        
        if (!meta) {
            meta = document.createElement('meta');
            if (name.startsWith('og:') || name.startsWith('article:')) {
                meta.setAttribute('property', name);
            } else {
                meta.setAttribute('name', name);
            }
            document.head.appendChild(meta);
        }
        
        meta.setAttribute('content', content);
    }

    /**
     * Update or create link tag
     */
    function updateLink(rel, href) {
        let link = document.querySelector(`link[rel="${rel}"]`);
        
        if (!link) {
            link = document.createElement('link');
            link.setAttribute('rel', rel);
            document.head.appendChild(link);
        }
        
        link.setAttribute('href', href);
    }

    /**
     * Initialize base schemas
     */
    function init() {
        const path = window.location.pathname;

        // Add organization schema to all pages
        addOrganizationSchema();

        // Add website schema to homepage
        if (path === '/' || path.includes('home.html') || path.includes('index.html')) {
            addWebsiteSchema();
            addLocalBusinessSchema();
        }

        // Ensure base meta tags exist
        ensureBaseMeta();
    }

    /**
     * Ensure base meta tags exist
     */
    function ensureBaseMeta() {
        // Twitter card type
        if (!document.querySelector('meta[name="twitter:card"]')) {
            updateMeta('twitter:card', 'summary_large_image');
        }

        // OG site name
        if (!document.querySelector('meta[property="og:site_name"]')) {
            updateMeta('og:site_name', SITE_CONFIG.name);
        }

        // OG locale
        if (!document.querySelector('meta[property="og:locale"]')) {
            updateMeta('og:locale', 'es_CL');
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
