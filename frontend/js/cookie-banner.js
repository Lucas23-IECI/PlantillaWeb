/**
 * GDPR Cookie Consent Banner
 * Handles cookie consent and preferences
 */

(function() {
    'use strict';

    const COOKIE_NAME = 'cookie_consent';
    const COOKIE_EXPIRY_DAYS = 365;

    // Cookie categories
    const COOKIE_CATEGORIES = {
        essential: {
            name: 'Cookies Esenciales',
            description: 'Necesarias para el funcionamiento del sitio. No pueden desactivarse.',
            required: true,
            enabled: true
        },
        preferences: {
            name: 'Cookies de Preferencias',
            description: 'Recuerdan tus preferencias como idioma y tema.',
            required: false,
            enabled: true
        },
        analytics: {
            name: 'Cookies Analíticas',
            description: 'Nos ayudan a entender cómo usas el sitio.',
            required: false,
            enabled: true
        },
        marketing: {
            name: 'Cookies de Marketing',
            description: 'Utilizadas para mostrarte anuncios relevantes.',
            required: false,
            enabled: false
        }
    };

    /**
     * Get consent from cookie
     */
    function getConsent() {
        const cookie = getCookie(COOKIE_NAME);
        if (cookie) {
            try {
                return JSON.parse(cookie);
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    /**
     * Save consent to cookie
     */
    function saveConsent(consent) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + COOKIE_EXPIRY_DAYS);
        
        document.cookie = `${COOKIE_NAME}=${JSON.stringify(consent)}; expires=${expiry.toUTCString()}; path=/; SameSite=Lax`;
        
        // Dispatch event for other scripts
        window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: consent }));
    }

    /**
     * Get cookie by name
     */
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    /**
     * Check if specific category is consented
     */
    window.hasCookieConsent = function(category) {
        const consent = getConsent();
        if (!consent) return false;
        return consent[category] === true;
    };

    /**
     * Create and show the cookie banner
     */
    function createBanner() {
        const banner = document.createElement('div');
        banner.id = 'cookieBanner';
        banner.className = 'cookie-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', 'Consentimiento de cookies');
        
        banner.innerHTML = `
            <div class="cookie-banner-content">
                <div class="cookie-banner-text">
                    <h3>🍪 Utilizamos Cookies</h3>
                    <p>Usamos cookies para mejorar tu experiencia, analizar el tráfico y personalizar contenido. Puedes aceptar todas, rechazar las opcionales o configurar tus preferencias.</p>
                </div>
                <div class="cookie-banner-actions">
                    <button class="btn-cookie btn-cookie-settings" id="cookieSettings">
                        Configurar
                    </button>
                    <button class="btn-cookie btn-cookie-reject" id="cookieReject">
                        Solo Esenciales
                    </button>
                    <button class="btn-cookie btn-cookie-accept" id="cookieAccept">
                        Aceptar Todas
                    </button>
                </div>
                <a href="pages/privacidad.html#cookies" class="cookie-link">Más información</a>
            </div>
        `;

        document.body.appendChild(banner);

        // Bind events
        document.getElementById('cookieAccept').addEventListener('click', acceptAll);
        document.getElementById('cookieReject').addEventListener('click', rejectOptional);
        document.getElementById('cookieSettings').addEventListener('click', showSettings);

        // Show with animation
        requestAnimationFrame(() => {
            banner.classList.add('visible');
        });
    }

    /**
     * Create settings modal
     */
    function createSettingsModal() {
        const modal = document.createElement('div');
        modal.id = 'cookieSettingsModal';
        modal.className = 'cookie-modal';
        
        modal.innerHTML = `
            <div class="cookie-modal-backdrop"></div>
            <div class="cookie-modal-content">
                <div class="cookie-modal-header">
                    <h3>Configuración de Cookies</h3>
                    <button class="cookie-modal-close" id="closeSettings">&times;</button>
                </div>
                <div class="cookie-modal-body">
                    <p>Selecciona qué cookies deseas permitir. Las cookies esenciales son necesarias para el funcionamiento del sitio.</p>
                    
                    <div class="cookie-categories">
                        ${Object.entries(COOKIE_CATEGORIES).map(([key, cat]) => `
                            <div class="cookie-category">
                                <div class="category-header">
                                    <div class="category-info">
                                        <h4>${cat.name}</h4>
                                        <p>${cat.description}</p>
                                    </div>
                                    <label class="cookie-toggle ${cat.required ? 'disabled' : ''}">
                                        <input type="checkbox" 
                                               data-category="${key}" 
                                               ${cat.enabled ? 'checked' : ''} 
                                               ${cat.required ? 'disabled' : ''}>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="cookie-modal-footer">
                    <button class="btn-cookie btn-cookie-settings" id="saveSettings">
                        Guardar Preferencias
                    </button>
                    <button class="btn-cookie btn-cookie-accept" id="acceptAllSettings">
                        Aceptar Todas
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Bind events
        document.getElementById('closeSettings').addEventListener('click', hideSettings);
        modal.querySelector('.cookie-modal-backdrop').addEventListener('click', hideSettings);
        document.getElementById('saveSettings').addEventListener('click', saveSettings);
        document.getElementById('acceptAllSettings').addEventListener('click', () => {
            acceptAll();
            hideSettings();
        });

        return modal;
    }

    /**
     * Show settings modal
     */
    function showSettings() {
        let modal = document.getElementById('cookieSettingsModal');
        if (!modal) {
            modal = createSettingsModal();
        }
        modal.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Hide settings modal
     */
    function hideSettings() {
        const modal = document.getElementById('cookieSettingsModal');
        if (modal) {
            modal.classList.remove('visible');
            document.body.style.overflow = '';
        }
    }

    /**
     * Accept all cookies
     */
    function acceptAll() {
        const consent = {};
        Object.keys(COOKIE_CATEGORIES).forEach(key => {
            consent[key] = true;
        });
        consent.timestamp = new Date().toISOString();
        
        saveConsent(consent);
        hideBanner();
        enableAnalytics();
    }

    /**
     * Reject optional cookies
     */
    function rejectOptional() {
        const consent = {};
        Object.entries(COOKIE_CATEGORIES).forEach(([key, cat]) => {
            consent[key] = cat.required;
        });
        consent.timestamp = new Date().toISOString();
        
        saveConsent(consent);
        hideBanner();
    }

    /**
     * Save settings from modal
     */
    function saveSettings() {
        const consent = {};
        const checkboxes = document.querySelectorAll('#cookieSettingsModal input[data-category]');
        
        checkboxes.forEach(checkbox => {
            consent[checkbox.dataset.category] = checkbox.checked;
        });
        consent.timestamp = new Date().toISOString();
        
        saveConsent(consent);
        hideBanner();
        hideSettings();

        if (consent.analytics) {
            enableAnalytics();
        }
    }

    /**
     * Hide the banner
     */
    function hideBanner() {
        const banner = document.getElementById('cookieBanner');
        if (banner) {
            banner.classList.remove('visible');
            setTimeout(() => banner.remove(), 300);
        }
    }

    /**
     * Enable analytics scripts
     */
    function enableAnalytics() {
        // Enable Google Analytics or other analytics
        // Example: if gtag exists, enable it
        if (window.dataLayer) {
            window.dataLayer.push(['consent', 'update', {
                'analytics_storage': 'granted',
                'ad_storage': hasCookieConsent('marketing') ? 'granted' : 'denied'
            }]);
        }
    }

    /**
     * Add CSS styles
     */
    function addStyles() {
        if (document.getElementById('cookieBannerStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'cookieBannerStyles';
        style.textContent = `
            .cookie-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: var(--color-surface, #fff);
                box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
                z-index: 99999;
                transform: translateY(100%);
                transition: transform 0.3s ease-out;
                border-top: 3px solid var(--color-accent, #06b6d4);
            }
            
            .cookie-banner.visible {
                transform: translateY(0);
            }
            
            .cookie-banner-content {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px 24px;
                display: flex;
                align-items: center;
                gap: 24px;
                flex-wrap: wrap;
            }
            
            .cookie-banner-text {
                flex: 1;
                min-width: 280px;
            }
            
            .cookie-banner-text h3 {
                margin: 0 0 8px;
                font-size: 16px;
                color: var(--color-text, #1a1a2e);
            }
            
            .cookie-banner-text p {
                margin: 0;
                font-size: 14px;
                color: var(--color-text-light, #666);
                line-height: 1.5;
            }
            
            .cookie-banner-actions {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }
            
            .btn-cookie {
                padding: 10px 20px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                border: none;
            }
            
            .btn-cookie-accept {
                background: var(--color-accent, #06b6d4);
                color: white;
            }
            
            .btn-cookie-accept:hover {
                background: #0891b2;
                transform: translateY(-1px);
            }
            
            .btn-cookie-reject {
                background: transparent;
                border: 1px solid var(--color-border, #ddd);
                color: var(--color-text, #1a1a2e);
            }
            
            .btn-cookie-reject:hover {
                background: var(--color-background-alt, #f5f5f5);
            }
            
            .btn-cookie-settings {
                background: var(--color-primary, #667eea);
                color: white;
            }
            
            .btn-cookie-settings:hover {
                background: #5a6fd6;
            }
            
            .cookie-link {
                font-size: 13px;
                color: var(--color-accent, #06b6d4);
                text-decoration: none;
            }
            
            .cookie-link:hover {
                text-decoration: underline;
            }
            
            /* Cookie Modal */
            .cookie-modal {
                position: fixed;
                inset: 0;
                z-index: 100000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s;
            }
            
            .cookie-modal.visible {
                opacity: 1;
                visibility: visible;
            }
            
            .cookie-modal-backdrop {
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
            }
            
            .cookie-modal-content {
                position: relative;
                background: var(--color-surface, #fff);
                border-radius: 16px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                transform: scale(0.95);
                transition: transform 0.3s;
            }
            
            .cookie-modal.visible .cookie-modal-content {
                transform: scale(1);
            }
            
            .cookie-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 24px;
                border-bottom: 1px solid var(--color-border, #eee);
            }
            
            .cookie-modal-header h3 {
                margin: 0;
                font-size: 18px;
            }
            
            .cookie-modal-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: var(--color-text-muted, #999);
                padding: 0;
                line-height: 1;
            }
            
            .cookie-modal-body {
                padding: 20px 24px;
                overflow-y: auto;
            }
            
            .cookie-modal-body > p {
                margin: 0 0 16px;
                font-size: 14px;
                color: var(--color-text-light, #666);
            }
            
            .cookie-categories {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .cookie-category {
                background: var(--color-background-alt, #f5f5f5);
                border-radius: 8px;
                padding: 16px;
            }
            
            .category-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 16px;
            }
            
            .category-info h4 {
                margin: 0 0 4px;
                font-size: 14px;
                font-weight: 600;
            }
            
            .category-info p {
                margin: 0;
                font-size: 13px;
                color: var(--color-text-muted, #888);
            }
            
            /* Toggle Switch */
            .cookie-toggle {
                position: relative;
                display: inline-block;
                width: 48px;
                height: 26px;
                flex-shrink: 0;
            }
            
            .cookie-toggle input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            .toggle-slider {
                position: absolute;
                cursor: pointer;
                inset: 0;
                background: #ccc;
                border-radius: 26px;
                transition: 0.3s;
            }
            
            .toggle-slider:before {
                position: absolute;
                content: "";
                height: 20px;
                width: 20px;
                left: 3px;
                bottom: 3px;
                background: white;
                border-radius: 50%;
                transition: 0.3s;
            }
            
            .cookie-toggle input:checked + .toggle-slider {
                background: var(--color-success, #28a745);
            }
            
            .cookie-toggle input:checked + .toggle-slider:before {
                transform: translateX(22px);
            }
            
            .cookie-toggle.disabled .toggle-slider {
                background: var(--color-success, #28a745);
                opacity: 0.6;
                cursor: not-allowed;
            }
            
            .cookie-modal-footer {
                display: flex;
                gap: 12px;
                padding: 16px 24px;
                border-top: 1px solid var(--color-border, #eee);
                justify-content: flex-end;
            }
            
            @media (max-width: 600px) {
                .cookie-banner-content {
                    flex-direction: column;
                    text-align: center;
                }
                
                .cookie-banner-actions {
                    width: 100%;
                    justify-content: center;
                }
                
                .btn-cookie {
                    flex: 1;
                    min-width: 100px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Initialize cookie consent
     */
    function init() {
        // Add styles
        addStyles();

        // Check if consent already given
        const consent = getConsent();
        
        if (!consent) {
            // Show banner after a short delay
            setTimeout(createBanner, 1000);
        } else {
            // Apply saved consent
            if (consent.analytics) {
                enableAnalytics();
            }
        }

        // Add settings button to footer if exists
        addSettingsButton();
    }

    /**
     * Add settings button to footer
     */
    function addSettingsButton() {
        // Try to find footer legal links
        const footerLinks = document.querySelector('.footer-legal ul, .footer-links');
        if (footerLinks) {
            const li = document.createElement('li');
            const btn = document.createElement('button');
            btn.className = 'cookie-settings-link';
            btn.textContent = 'Configuración de Cookies';
            btn.style.cssText = 'background: none; border: none; color: inherit; cursor: pointer; font: inherit; text-decoration: underline;';
            btn.addEventListener('click', showSettings);
            li.appendChild(btn);
            footerLinks.appendChild(li);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for external use
    window.cookieConsent = {
        show: createBanner,
        showSettings: showSettings,
        hasConsent: window.hasCookieConsent,
        getConsent: getConsent
    };

})();
