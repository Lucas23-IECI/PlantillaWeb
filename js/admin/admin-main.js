/**
 * Admin Panel - Main Controller
 * Navegación, tema, autenticación
 */

(function() {
    'use strict';

    // ==========================================
    // INITIALIZATION
    // ==========================================
    
    document.addEventListener('DOMContentLoaded', async () => {
        // Initialize theme first (to prevent flash)
        initTheme();
        
        // Check authentication
        if (!checkAdminAuth()) {
            window.location.href = 'login.html?redirect=admin.html';
            return;
        }

        // Initialize UI
        initializeUI();
        initializeNavigation();
        initializeMobileSidebar();
        
        // Load initial section
        const hash = window.location.hash.slice(1) || 'dashboard';
        navigateToSection(hash);

        // Load user info
        loadUserInfo();
    });

    // ==========================================
    // THEME MANAGEMENT
    // ==========================================
    
    function initTheme() {
        const storedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Set initial theme
        if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }

        // Theme toggle button
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        }
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.classList.add('theme-transitioning');
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        setTimeout(() => {
            document.documentElement.classList.remove('theme-transitioning');
        }, 300);
    }

    // ==========================================
    // AUTH CHECK
    // ==========================================
    
    function checkAdminAuth() {
        if (typeof getCurrentUser === 'undefined') return true; // Skip if auth not loaded
        const user = getCurrentUser();
        return user && user.admin === true;
    }

    // ==========================================
    // UI INITIALIZATION
    // ==========================================
    
    function initializeUI() {
        // User dropdown toggle
        const userDropdown = document.getElementById('userDropdown');
        const userDropdownBtn = document.getElementById('userDropdownBtn');
        
        if (userDropdownBtn && userDropdown) {
            userDropdownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('open');
            });

            document.addEventListener('click', (e) => {
                if (!userDropdown.contains(e.target)) {
                    userDropdown.classList.remove('open');
                }
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (typeof clearAuthSession === 'function') {
                    clearAuthSession();
                }
                window.location.href = '../home.html';
            });
        }

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape to close modals/sidebar
            if (e.key === 'Escape') {
                AdminUtils.closeModal();
                closeMobileSidebar();
            }
        });
    }

    function loadUserInfo() {
        if (typeof getCurrentUser === 'undefined') return;
        
        const user = getCurrentUser();
        if (user) {
            const userNameEl = document.getElementById('userName');
            const userAvatarEl = document.getElementById('userAvatar');
            
            if (userNameEl) {
                userNameEl.textContent = user.name || user.email || 'Admin';
            }
            if (userAvatarEl) {
                const initials = (user.name || user.email || 'A')
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();
                userAvatarEl.textContent = initials;
            }
        }
    }

    // ==========================================
    // NAVIGATION
    // ==========================================
    
    function initializeNavigation() {
        // Header nav links
        document.querySelectorAll('.admin-nav-link[data-section]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                navigateToSection(section);
            });
        });

        // Sidebar nav links
        document.querySelectorAll('.nav-item[data-section]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                navigateToSection(section);
                closeMobileSidebar();
            });
        });

        // Dropdown items with section
        document.querySelectorAll('.admin-dropdown-item[data-section]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                navigateToSection(section);
                document.getElementById('userDropdown')?.classList.remove('open');
            });
        });

        // Handle hash changes
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.slice(1) || 'dashboard';
            navigateToSection(hash);
        });
    }

    async function navigateToSection(section) {
        // Update hash without triggering hashchange
        if (window.location.hash.slice(1) !== section) {
            history.pushState(null, '', `#${section}`);
        }

        // Update active nav items (header)
        document.querySelectorAll('.admin-nav-link').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === section) {
                item.classList.add('active');
            }
        });

        // Update active nav items (sidebar)
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === section) {
                item.classList.add('active');
            }
        });

        // Load section content
        const contentEl = document.getElementById('adminContent');
        if (!contentEl) return;

        // Show loading
        contentEl.innerHTML = `
            <div class="loading-overlay">
                <div class="loader loader-lg"></div>
                <div class="loading-text">Cargando...</div>
            </div>
        `;

        try {
            switch (section) {
                case 'dashboard':
                    await AdminDashboard.load(contentEl);
                    break;
                case 'pedidos':
                    await AdminPedidos.load(contentEl);
                    break;
                case 'productos':
                    await AdminProductos.load(contentEl);
                    break;
                case 'categorias':
                    if (typeof AdminCategorias !== 'undefined') {
                        await AdminCategorias.load(contentEl);
                    } else {
                        showComingSoon(contentEl, 'Categorías');
                    }
                    break;
                case 'usuarios':
                    await AdminUsuarios.load(contentEl);
                    break;
                case 'descuentos':
                    await AdminDescuentos.load(contentEl);
                    break;
                case 'avisos':
                    await AdminAvisos.load(contentEl);
                    break;
                case 'reportes':
                    await AdminReportes.load(contentEl);
                    break;
                case 'proveedores':
                    if (typeof AdminProveedores !== 'undefined') {
                        await AdminProveedores.load(contentEl);
                    } else {
                        showComingSoon(contentEl, 'Proveedores');
                    }
                    break;
                case 'historial':
                    if (typeof AdminHistorial !== 'undefined') {
                        await AdminHistorial.load(contentEl);
                    } else {
                        showComingSoon(contentEl, 'Historial de Inventario');
                    }
                    break;
                case 'alertas':
                    if (typeof AdminAlertas !== 'undefined') {
                        await AdminAlertas.load(contentEl);
                    } else {
                        showComingSoon(contentEl, 'Alertas de Stock');
                    }
                    break;
                case 'configuracion':
                    showComingSoon(contentEl, 'Configuración');
                    break;
                default:
                    await AdminDashboard.load(contentEl);
            }
        } catch (error) {
            console.error('Error loading section:', error);
            contentEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                        </svg>
                    </div>
                    <h3 class="empty-state-title">Error al cargar</h3>
                    <p class="empty-state-message">${error.message || 'Ocurrió un error inesperado'}</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }

    function showComingSoon(container, title) {
        container.innerHTML = `
            <div class="admin-page-header">
                <div class="page-title-group">
                    <h1 class="page-title">${title}</h1>
                    <p class="page-description">Esta sección está en desarrollo</p>
                </div>
            </div>
            <div class="card">
                <div class="card-body">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                            </svg>
                        </div>
                        <h3 class="empty-state-title">Próximamente</h3>
                        <p class="empty-state-message">Esta funcionalidad estará disponible pronto. Estamos trabajando en ella.</p>
                    </div>
                </div>
            </div>
        `;
    }

    // ==========================================
    // MOBILE SIDEBAR
    // ==========================================
    
    function initializeMobileSidebar() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const sidebar = document.getElementById('adminSidebar');
        const overlay = document.getElementById('sidebarOverlay');

        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                sidebar?.classList.add('mobile-open');
                overlay?.classList.add('active');
                document.body.classList.add('no-scroll');
            });
        }

        if (overlay) {
            overlay.addEventListener('click', closeMobileSidebar);
        }
    }

    function closeMobileSidebar() {
        const sidebar = document.getElementById('adminSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        sidebar?.classList.remove('mobile-open');
        overlay?.classList.remove('active');
        document.body.classList.remove('no-scroll');
    }

    // ==========================================
    // EXPOSE GLOBAL FUNCTIONS
    // ==========================================
    
    window.AdminMain = {
        navigateToSection,
        toggleTheme,
        closeMobileSidebar
    };

})();
