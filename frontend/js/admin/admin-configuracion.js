/**
 * Admin Store Configuration Module
 * Allows administrators to configure store settings
 */

(function() {
    'use strict';

    // Default settings
    const DEFAULT_SETTINGS = {
        site_name: 'Mi Tienda',
        site_description: 'Tu tienda online de confianza',
        logo_url: '',
        favicon_url: '',
        primary_color: '#667eea',
        accent_color: '#e94560',
        contact_email: 'contacto@mitienda.cl',
        contact_phone: '+56 9 1234 5678',
        contact_address: 'Av. Principal 123, Santiago, Chile',
        whatsapp_number: '56912345678',
        social_facebook: '',
        social_instagram: '',
        social_twitter: '',
        free_shipping_threshold: 50000,
        currency: 'CLP',
        currency_symbol: '$',
        timezone: 'America/Santiago',
        business_hours: 'Lunes a Viernes 9:00 - 18:00',
        meta_title: '',
        meta_description: '',
        google_analytics_id: '',
        facebook_pixel_id: ''
    };

    let currentSettings = { ...DEFAULT_SETTINGS };

    /**
     * Initialize configuration panel
     */
    window.initAdminConfiguracion = function() {
        const container = document.getElementById('adminContent');
        if (!container) return;

        container.innerHTML = renderConfigurationPanel();
        loadSettings();
        bindEvents();
    };

    /**
     * Render configuration panel HTML
     */
    function renderConfigurationPanel() {
        return `
            <div class="admin-config">
                <div class="admin-page-header">
                    <h1>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                        Configuración de la Tienda
                    </h1>
                    <p>Personaliza la información y apariencia de tu tienda</p>
                </div>

                <div class="config-tabs">
                    <button class="config-tab active" data-tab="general">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                        General
                    </button>
                    <button class="config-tab" data-tab="contact">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                        Contacto
                    </button>
                    <button class="config-tab" data-tab="appearance">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="13.5" cy="6.5" r=".5"/>
                            <circle cx="17.5" cy="10.5" r=".5"/>
                            <circle cx="8.5" cy="7.5" r=".5"/>
                            <circle cx="6.5" cy="12.5" r=".5"/>
                            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/>
                        </svg>
                        Apariencia
                    </button>
                    <button class="config-tab" data-tab="shipping">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="1" y="3" width="15" height="13"/>
                            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                            <circle cx="5.5" cy="18.5" r="2.5"/>
                            <circle cx="18.5" cy="18.5" r="2.5"/>
                        </svg>
                        Envíos
                    </button>
                    <button class="config-tab" data-tab="seo">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        SEO
                    </button>
                </div>

                <form id="configForm" class="config-form">
                    <!-- General Tab -->
                    <div class="config-section active" data-section="general">
                        <h2>Información General</h2>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="site_name">Nombre de la Tienda *</label>
                                <input type="text" id="site_name" name="site_name" required maxlength="100">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="site_description">Descripción Corta</label>
                                <textarea id="site_description" name="site_description" rows="2" maxlength="200" placeholder="Tu tienda online de confianza..."></textarea>
                            </div>
                        </div>

                        <div class="form-row two-cols">
                            <div class="form-group">
                                <label for="logo_url">Logo (URL o subir)</label>
                                <div class="file-upload-group">
                                    <input type="text" id="logo_url" name="logo_url" placeholder="https://...">
                                    <button type="button" class="btn-upload" data-target="logo_url">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                            <polyline points="17 8 12 3 7 8"/>
                                            <line x1="12" y1="3" x2="12" y2="15"/>
                                        </svg>
                                    </button>
                                </div>
                                <div class="logo-preview" id="logoPreview"></div>
                            </div>
                            <div class="form-group">
                                <label for="favicon_url">Favicon (URL o subir)</label>
                                <div class="file-upload-group">
                                    <input type="text" id="favicon_url" name="favicon_url" placeholder="https://...">
                                    <button type="button" class="btn-upload" data-target="favicon_url">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                            <polyline points="17 8 12 3 7 8"/>
                                            <line x1="12" y1="3" x2="12" y2="15"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="form-row two-cols">
                            <div class="form-group">
                                <label for="currency">Moneda</label>
                                <select id="currency" name="currency">
                                    <option value="CLP">Peso Chileno (CLP)</option>
                                    <option value="USD">Dólar (USD)</option>
                                    <option value="EUR">Euro (EUR)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="timezone">Zona Horaria</label>
                                <select id="timezone" name="timezone">
                                    <option value="America/Santiago">Santiago, Chile</option>
                                    <option value="America/Buenos_Aires">Buenos Aires</option>
                                    <option value="America/Lima">Lima</option>
                                    <option value="America/Bogota">Bogotá</option>
                                    <option value="America/Mexico_City">Ciudad de México</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Contact Tab -->
                    <div class="config-section" data-section="contact">
                        <h2>Información de Contacto</h2>
                        
                        <div class="form-row two-cols">
                            <div class="form-group">
                                <label for="contact_email">Email de Contacto *</label>
                                <input type="email" id="contact_email" name="contact_email" required>
                            </div>
                            <div class="form-group">
                                <label for="contact_phone">Teléfono</label>
                                <input type="tel" id="contact_phone" name="contact_phone" placeholder="+56 9 1234 5678">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="contact_address">Dirección</label>
                                <input type="text" id="contact_address" name="contact_address" placeholder="Calle, número, ciudad">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="whatsapp_number">WhatsApp (solo números)</label>
                                <input type="text" id="whatsapp_number" name="whatsapp_number" placeholder="56912345678">
                                <span class="form-hint">Ej: 56912345678 (sin + ni espacios)</span>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="business_hours">Horario de Atención</label>
                                <input type="text" id="business_hours" name="business_hours" placeholder="Lunes a Viernes 9:00 - 18:00">
                            </div>
                        </div>

                        <h3>Redes Sociales</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="social_facebook">Facebook</label>
                                <input type="url" id="social_facebook" name="social_facebook" placeholder="https://facebook.com/tutienda">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="social_instagram">Instagram</label>
                                <input type="url" id="social_instagram" name="social_instagram" placeholder="https://instagram.com/tutienda">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="social_twitter">Twitter/X</label>
                                <input type="url" id="social_twitter" name="social_twitter" placeholder="https://twitter.com/tutienda">
                            </div>
                        </div>
                    </div>

                    <!-- Appearance Tab -->
                    <div class="config-section" data-section="appearance">
                        <h2>Apariencia</h2>
                        
                        <div class="color-pickers">
                            <div class="form-group color-group">
                                <label for="primary_color">Color Primario</label>
                                <div class="color-input">
                                    <input type="color" id="primary_color" name="primary_color" value="#667eea">
                                    <input type="text" id="primary_color_text" value="#667eea" maxlength="7">
                                </div>
                                <span class="form-hint">Se usa en botones, enlaces y elementos destacados</span>
                            </div>
                            <div class="form-group color-group">
                                <label for="accent_color">Color de Acento</label>
                                <div class="color-input">
                                    <input type="color" id="accent_color" name="accent_color" value="#e94560">
                                    <input type="text" id="accent_color_text" value="#e94560" maxlength="7">
                                </div>
                                <span class="form-hint">Se usa en CTAs, badges y resaltados</span>
                            </div>
                        </div>

                        <div class="color-preview">
                            <h4>Vista previa</h4>
                            <div class="preview-box" id="colorPreview">
                                <button class="preview-btn primary">Botón Primario</button>
                                <button class="preview-btn accent">Botón Acento</button>
                                <span class="preview-link">Enlace de ejemplo</span>
                                <span class="preview-badge">Badge</span>
                            </div>
                        </div>
                    </div>

                    <!-- Shipping Tab -->
                    <div class="config-section" data-section="shipping">
                        <h2>Configuración de Envíos</h2>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="free_shipping_threshold">Envío Gratis desde (monto)</label>
                                <div class="input-with-prefix">
                                    <span class="prefix">$</span>
                                    <input type="number" id="free_shipping_threshold" name="free_shipping_threshold" min="0" step="1000">
                                </div>
                                <span class="form-hint">Deja en 0 para desactivar envío gratis</span>
                            </div>
                        </div>

                        <div class="info-box">
                            <h4>💡 Costos de Envío</h4>
                            <p>Los costos de envío específicos por zona se configuran en la sección de <strong>Productos > Envíos</strong>.</p>
                        </div>
                    </div>

                    <!-- SEO Tab -->
                    <div class="config-section" data-section="seo">
                        <h2>SEO y Analytics</h2>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="meta_title">Título SEO (Meta Title)</label>
                                <input type="text" id="meta_title" name="meta_title" maxlength="60" placeholder="Mi Tienda | Tu tienda online de confianza">
                                <span class="form-hint char-counter"><span id="metaTitleCount">0</span>/60 caracteres</span>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="meta_description">Descripción SEO (Meta Description)</label>
                                <textarea id="meta_description" name="meta_description" rows="3" maxlength="160" placeholder="Descubre los mejores productos..."></textarea>
                                <span class="form-hint char-counter"><span id="metaDescCount">0</span>/160 caracteres</span>
                            </div>
                        </div>

                        <h3>Analytics</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="google_analytics_id">Google Analytics ID</label>
                                <input type="text" id="google_analytics_id" name="google_analytics_id" placeholder="G-XXXXXXXXXX">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="facebook_pixel_id">Facebook Pixel ID</label>
                                <input type="text" id="facebook_pixel_id" name="facebook_pixel_id" placeholder="123456789012345">
                            </div>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" id="resetBtn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="1 4 1 10 7 10"/>
                                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                            </svg>
                            Restaurar Valores
                        </button>
                        <button type="submit" class="btn btn-primary" id="saveBtn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                                <polyline points="17 21 17 13 7 13 7 21"/>
                                <polyline points="7 3 7 8 15 8"/>
                            </svg>
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * Load settings from API
     */
    async function loadSettings() {
        try {
            const response = await api.get('/admin/settings');
            currentSettings = { ...DEFAULT_SETTINGS, ...(response.settings || {}) };
            populateForm(currentSettings);
        } catch (error) {
            console.warn('Could not load settings, using defaults');
            populateForm(DEFAULT_SETTINGS);
        }
    }

    /**
     * Populate form with settings
     */
    function populateForm(settings) {
        Object.entries(settings).forEach(([key, value]) => {
            const input = document.getElementById(key);
            if (input) {
                input.value = value;
                
                // Sync color text inputs
                if (key === 'primary_color' || key === 'accent_color') {
                    const textInput = document.getElementById(key + '_text');
                    if (textInput) textInput.value = value;
                }
            }
        });

        // Update logo preview
        updateLogoPreview();
        // Update color preview
        updateColorPreview();
        // Update char counters
        updateCharCounters();
    }

    /**
     * Bind events
     */
    function bindEvents() {
        // Tab switching
        document.querySelectorAll('.config-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.config-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.config-section').forEach(s => s.classList.remove('active'));
                
                tab.classList.add('active');
                const section = document.querySelector(`.config-section[data-section="${tab.dataset.tab}"]`);
                if (section) section.classList.add('active');
            });
        });

        // Form submission
        document.getElementById('configForm')?.addEventListener('submit', handleSubmit);

        // Reset button
        document.getElementById('resetBtn')?.addEventListener('click', () => {
            if (confirm('¿Restaurar valores por defecto?')) {
                currentSettings = { ...DEFAULT_SETTINGS };
                populateForm(currentSettings);
            }
        });

        // Color inputs sync
        ['primary_color', 'accent_color'].forEach(colorKey => {
            const colorInput = document.getElementById(colorKey);
            const textInput = document.getElementById(colorKey + '_text');

            colorInput?.addEventListener('input', (e) => {
                if (textInput) textInput.value = e.target.value;
                updateColorPreview();
            });

            textInput?.addEventListener('input', (e) => {
                const hex = e.target.value;
                if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                    if (colorInput) colorInput.value = hex;
                    updateColorPreview();
                }
            });
        });

        // Logo URL preview
        document.getElementById('logo_url')?.addEventListener('input', updateLogoPreview);

        // Character counters
        document.getElementById('meta_title')?.addEventListener('input', updateCharCounters);
        document.getElementById('meta_description')?.addEventListener('input', updateCharCounters);

        // Upload buttons (would integrate with Cloudinary)
        document.querySelectorAll('.btn-upload').forEach(btn => {
            btn.addEventListener('click', () => {
                showNotification('La funcionalidad de subida requiere integración con Cloudinary', 'info');
            });
        });
    }

    /**
     * Handle form submission
     */
    async function handleSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);
        const settings = {};

        formData.forEach((value, key) => {
            settings[key] = value;
        });

        const saveBtn = document.getElementById('saveBtn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-sm"></span> Guardando...';

        try {
            await api.post('/admin/settings', { settings });
            currentSettings = settings;
            showNotification('Configuración guardada correctamente', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            showNotification('Error al guardar configuración', 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                </svg>
                Guardar Cambios
            `;
        }
    }

    /**
     * Update logo preview
     */
    function updateLogoPreview() {
        const logoUrl = document.getElementById('logo_url')?.value;
        const preview = document.getElementById('logoPreview');
        
        if (preview) {
            if (logoUrl) {
                preview.innerHTML = `<img src="${logoUrl}" alt="Logo Preview" onerror="this.parentElement.innerHTML='<span>Error al cargar imagen</span>'">`;
            } else {
                preview.innerHTML = '<span>Sin logo configurado</span>';
            }
        }
    }

    /**
     * Update color preview
     */
    function updateColorPreview() {
        const primary = document.getElementById('primary_color')?.value || '#667eea';
        const accent = document.getElementById('accent_color')?.value || '#e94560';
        const preview = document.getElementById('colorPreview');

        if (preview) {
            const primaryBtn = preview.querySelector('.preview-btn.primary');
            const accentBtn = preview.querySelector('.preview-btn.accent');
            const link = preview.querySelector('.preview-link');
            const badge = preview.querySelector('.preview-badge');

            if (primaryBtn) primaryBtn.style.backgroundColor = primary;
            if (accentBtn) accentBtn.style.backgroundColor = accent;
            if (link) link.style.color = primary;
            if (badge) badge.style.backgroundColor = accent;
        }
    }

    /**
     * Update character counters
     */
    function updateCharCounters() {
        const titleInput = document.getElementById('meta_title');
        const descInput = document.getElementById('meta_description');
        
        if (titleInput) {
            document.getElementById('metaTitleCount').textContent = titleInput.value.length;
        }
        if (descInput) {
            document.getElementById('metaDescCount').textContent = descInput.value.length;
        }
    }

    /**
     * Show notification
     */
    function showNotification(message, type = 'info') {
        if (typeof window.showAdminNotification === 'function') {
            window.showAdminNotification(message, type);
        } else {
            alert(message);
        }
    }

    // Add styles
    addConfigStyles();

    function addConfigStyles() {
        if (document.getElementById('adminConfigStyles')) return;

        const style = document.createElement('style');
        style.id = 'adminConfigStyles';
        style.textContent = `
            .admin-config {
                max-width: 900px;
            }

            .admin-page-header {
                margin-bottom: var(--spacing-xl);
            }

            .admin-page-header h1 {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                margin-bottom: var(--spacing-xs);
            }

            .admin-page-header p {
                color: var(--color-text-muted);
            }

            .config-tabs {
                display: flex;
                gap: var(--spacing-xs);
                border-bottom: 1px solid var(--color-border);
                margin-bottom: var(--spacing-xl);
                overflow-x: auto;
                padding-bottom: var(--spacing-xs);
            }

            .config-tab {
                display: flex;
                align-items: center;
                gap: var(--spacing-xs);
                padding: var(--spacing-sm) var(--spacing-md);
                background: none;
                border: none;
                color: var(--color-text-light);
                font-size: var(--font-size-sm);
                font-weight: var(--font-weight-medium);
                cursor: pointer;
                white-space: nowrap;
                border-radius: var(--radius-md) var(--radius-md) 0 0;
                transition: all var(--transition-fast);
            }

            .config-tab:hover {
                background: var(--color-background-alt);
                color: var(--color-text);
            }

            .config-tab.active {
                color: var(--color-accent);
                border-bottom: 2px solid var(--color-accent);
            }

            .config-section {
                display: none;
            }

            .config-section.active {
                display: block;
            }

            .config-section h2 {
                font-size: var(--font-size-lg);
                margin-bottom: var(--spacing-lg);
            }

            .config-section h3 {
                font-size: var(--font-size-base);
                margin: var(--spacing-xl) 0 var(--spacing-md);
                padding-top: var(--spacing-lg);
                border-top: 1px solid var(--color-border);
            }

            .form-row {
                margin-bottom: var(--spacing-lg);
            }

            .form-row.two-cols {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: var(--spacing-md);
            }

            .form-group label {
                display: block;
                margin-bottom: var(--spacing-xs);
                font-size: var(--font-size-sm);
                font-weight: var(--font-weight-medium);
            }

            .form-group input,
            .form-group textarea,
            .form-group select {
                width: 100%;
                padding: var(--spacing-sm) var(--spacing-md);
                border: 1px solid var(--color-border);
                border-radius: var(--radius-md);
                font-size: var(--font-size-base);
                background: var(--color-surface);
                color: var(--color-text);
            }

            .form-hint {
                display: block;
                margin-top: var(--spacing-xs);
                font-size: var(--font-size-xs);
                color: var(--color-text-muted);
            }

            .file-upload-group {
                display: flex;
                gap: var(--spacing-sm);
            }

            .file-upload-group input {
                flex: 1;
            }

            .btn-upload {
                padding: var(--spacing-sm);
                background: var(--color-primary);
                color: white;
                border: none;
                border-radius: var(--radius-md);
                cursor: pointer;
            }

            .logo-preview {
                margin-top: var(--spacing-sm);
                padding: var(--spacing-md);
                background: var(--color-background-alt);
                border-radius: var(--radius-md);
                text-align: center;
                min-height: 80px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .logo-preview img {
                max-height: 60px;
                max-width: 100%;
            }

            .logo-preview span {
                color: var(--color-text-muted);
                font-size: var(--font-size-sm);
            }

            .color-pickers {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: var(--spacing-lg);
            }

            .color-input {
                display: flex;
                gap: var(--spacing-sm);
            }

            .color-input input[type="color"] {
                width: 50px;
                height: 40px;
                padding: 2px;
                cursor: pointer;
            }

            .color-input input[type="text"] {
                flex: 1;
                font-family: monospace;
            }

            .color-preview {
                margin-top: var(--spacing-lg);
            }

            .color-preview h4 {
                margin-bottom: var(--spacing-sm);
                font-size: var(--font-size-sm);
                color: var(--color-text-muted);
            }

            .preview-box {
                display: flex;
                align-items: center;
                gap: var(--spacing-md);
                padding: var(--spacing-lg);
                background: var(--color-background-alt);
                border-radius: var(--radius-md);
            }

            .preview-btn {
                padding: var(--spacing-sm) var(--spacing-md);
                border: none;
                border-radius: var(--radius-md);
                color: white;
                font-size: var(--font-size-sm);
                cursor: default;
            }

            .preview-link {
                font-size: var(--font-size-sm);
                text-decoration: underline;
            }

            .preview-badge {
                padding: 4px 8px;
                color: white;
                font-size: var(--font-size-xs);
                border-radius: var(--radius-full);
            }

            .input-with-prefix {
                display: flex;
            }

            .input-with-prefix .prefix {
                padding: var(--spacing-sm) var(--spacing-md);
                background: var(--color-background-alt);
                border: 1px solid var(--color-border);
                border-right: none;
                border-radius: var(--radius-md) 0 0 var(--radius-md);
                color: var(--color-text-muted);
            }

            .input-with-prefix input {
                border-radius: 0 var(--radius-md) var(--radius-md) 0;
            }

            .info-box {
                padding: var(--spacing-lg);
                background: rgba(102, 126, 234, 0.1);
                border-left: 4px solid var(--color-primary);
                border-radius: var(--radius-md);
            }

            .info-box h4 {
                margin: 0 0 var(--spacing-xs);
            }

            .info-box p {
                margin: 0;
                font-size: var(--font-size-sm);
            }

            .char-counter {
                text-align: right;
            }

            .form-actions {
                display: flex;
                justify-content: flex-end;
                gap: var(--spacing-md);
                margin-top: var(--spacing-2xl);
                padding-top: var(--spacing-lg);
                border-top: 1px solid var(--color-border);
            }

            .spinner-sm {
                display: inline-block;
                width: 14px;
                height: 14px;
                border: 2px solid currentColor;
                border-right-color: transparent;
                border-radius: 50%;
                animation: spin 0.75s linear infinite;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            @media (max-width: 768px) {
                .form-row.two-cols {
                    grid-template-columns: 1fr;
                }

                .color-pickers {
                    grid-template-columns: 1fr;
                }

                .config-tabs {
                    flex-wrap: nowrap;
                }

                .form-actions {
                    flex-direction: column;
                }

                .form-actions .btn {
                    width: 100%;
                    justify-content: center;
                }
            }
        `;
        document.head.appendChild(style);
    }

})();
