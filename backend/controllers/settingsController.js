/**
 * Settings Controller
 * Manages store configuration settings
 */

const { getDb } = require('../config/firebaseAdmin');

const SETTINGS_COLLECTION = 'settings';
const SETTINGS_DOC_ID = 'store_config';

/**
 * Get store settings
 */
async function getSettings(req, res) {
    try {
        const db = getDb();
        const settingsDoc = await db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID).get();

        if (!settingsDoc.exists) {
            return res.json({ settings: null });
        }

        res.json({ settings: settingsDoc.data() });
    } catch (error) {
        console.error('Error getting settings:', error);
        res.status(500).json({ error: 'Error al obtener configuración' });
    }
}

/**
 * Update store settings (admin only)
 */
async function updateSettings(req, res) {
    try {
        const { settings } = req.body;

        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({ error: 'Configuración inválida' });
        }

        const db = getDb();
        
        // Sanitize and validate settings
        const sanitizedSettings = {
            site_name: sanitizeString(settings.site_name, 100),
            site_description: sanitizeString(settings.site_description, 200),
            logo_url: sanitizeUrl(settings.logo_url),
            favicon_url: sanitizeUrl(settings.favicon_url),
            primary_color: sanitizeColor(settings.primary_color) || '#667eea',
            accent_color: sanitizeColor(settings.accent_color) || '#e94560',
            contact_email: sanitizeEmail(settings.contact_email),
            contact_phone: sanitizeString(settings.contact_phone, 30),
            contact_address: sanitizeString(settings.contact_address, 200),
            whatsapp_number: sanitizeString(settings.whatsapp_number, 20).replace(/\D/g, ''),
            social_facebook: sanitizeUrl(settings.social_facebook),
            social_instagram: sanitizeUrl(settings.social_instagram),
            social_twitter: sanitizeUrl(settings.social_twitter),
            free_shipping_threshold: parseInt(settings.free_shipping_threshold) || 0,
            currency: ['CLP', 'USD', 'EUR'].includes(settings.currency) ? settings.currency : 'CLP',
            currency_symbol: settings.currency === 'USD' ? '$' : settings.currency === 'EUR' ? '€' : '$',
            timezone: sanitizeString(settings.timezone, 50),
            business_hours: sanitizeString(settings.business_hours, 100),
            meta_title: sanitizeString(settings.meta_title, 60),
            meta_description: sanitizeString(settings.meta_description, 160),
            google_analytics_id: sanitizeString(settings.google_analytics_id, 20),
            facebook_pixel_id: sanitizeString(settings.facebook_pixel_id, 20),
            updatedAt: new Date(),
            updatedBy: req.user?.uid || 'unknown'
        };

        await db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID).set(sanitizedSettings, { merge: true });

        res.json({ 
            success: true, 
            message: 'Configuración actualizada correctamente',
            settings: sanitizedSettings 
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Error al actualizar configuración' });
    }
}

/**
 * Get public settings (for frontend)
 */
async function getPublicSettings(req, res) {
    try {
        const db = getDb();
        const settingsDoc = await db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID).get();

        if (!settingsDoc.exists) {
            return res.json({ settings: getDefaultPublicSettings() });
        }

        const data = settingsDoc.data();
        
        // Return only public-facing settings
        const publicSettings = {
            site_name: data.site_name || 'Mi Tienda',
            site_description: data.site_description || '',
            logo_url: data.logo_url || '',
            favicon_url: data.favicon_url || '',
            primary_color: data.primary_color || '#667eea',
            accent_color: data.accent_color || '#e94560',
            contact_email: data.contact_email || '',
            contact_phone: data.contact_phone || '',
            contact_address: data.contact_address || '',
            whatsapp_number: data.whatsapp_number || '',
            social_facebook: data.social_facebook || '',
            social_instagram: data.social_instagram || '',
            social_twitter: data.social_twitter || '',
            free_shipping_threshold: data.free_shipping_threshold || 0,
            currency: data.currency || 'CLP',
            currency_symbol: data.currency_symbol || '$',
            business_hours: data.business_hours || ''
        };

        res.json({ settings: publicSettings });
    } catch (error) {
        console.error('Error getting public settings:', error);
        res.status(500).json({ error: 'Error al obtener configuración' });
    }
}

// Helper functions
function sanitizeString(str, maxLength = 500) {
    if (!str || typeof str !== 'string') return '';
    return str.trim().substring(0, maxLength);
}

function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    try {
        new URL(trimmed);
        return trimmed;
    } catch {
        return '';
    }
}

function sanitizeEmail(email) {
    if (!email || typeof email !== 'string') return '';
    const trimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmed) ? trimmed : '';
}

function sanitizeColor(color) {
    if (!color || typeof color !== 'string') return null;
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    return hexRegex.test(color) ? color : null;
}

function getDefaultPublicSettings() {
    return {
        site_name: 'Mi Tienda',
        site_description: 'Tu tienda online de confianza',
        logo_url: '',
        favicon_url: '',
        primary_color: '#667eea',
        accent_color: '#e94560',
        contact_email: '',
        contact_phone: '',
        contact_address: '',
        whatsapp_number: '',
        social_facebook: '',
        social_instagram: '',
        social_twitter: '',
        free_shipping_threshold: 50000,
        currency: 'CLP',
        currency_symbol: '$',
        business_hours: ''
    };
}

module.exports = {
    getSettings,
    updateSettings,
    getPublicSettings
};
