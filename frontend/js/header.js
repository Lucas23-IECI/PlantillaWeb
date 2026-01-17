/**
 * HEADER COMPONENT - JavaScript
 * Funcionalidad para búsqueda expandible y menú móvil
 */

document.addEventListener('DOMContentLoaded', function () {
    initHeaderSearch();
    initMobileMenu();
    initUserButton();
    initThemeToggle();
});

/**
 * Inicializar búsqueda expandible
 */
function initHeaderSearch() {
    const searchContainer = document.querySelector('.header-search');
    const searchIcon = document.querySelector('.search-icon');
    const searchInput = document.querySelector('.header-search input');

    if (!searchContainer || !searchIcon || !searchInput) return;

    // Toggle expansión al hacer click en el icono
    searchIcon.addEventListener('click', function (e) {
        e.stopPropagation();
        const isExpanded = searchContainer.classList.contains('expanded');

        if (!isExpanded) {
            // Expandir
            searchContainer.classList.add('expanded');
            setTimeout(() => searchInput.focus(), 300);
        } else if (!searchInput.value.trim()) {
            // Colapsar solo si no hay texto
            searchContainer.classList.remove('expanded');
        }
    });

    // Cerrar al hacer click fuera
    document.addEventListener('click', function (e) {
        if (!searchContainer.contains(e.target)) {
            if (!searchInput.value.trim()) {
                searchContainer.classList.remove('expanded');
            }
        }
    });

    // Manejar submit de búsqueda
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && searchInput.value.trim()) {
            // Redirigir a página de búsqueda o buscar
            const query = encodeURIComponent(searchInput.value.trim());
            window.location.href = `/pages/productos.html?busqueda=${query}`;
        }
    });
}

/**
 * Inicializar menú móvil
 */
function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileClose = document.querySelector('.mobile-close');
    const mobileOverlay = document.querySelector('.mobile-overlay');

    if (!menuToggle || !mobileMenu) return;

    // Abrir menú
    menuToggle.addEventListener('click', function () {
        mobileMenu.classList.add('open');
        if (mobileOverlay) {
            mobileOverlay.classList.add('show');
        }
        document.body.style.overflow = 'hidden';
    });

    // Cerrar menú
    function closeMobileMenu() {
        mobileMenu.classList.remove('open');
        if (mobileOverlay) {
            mobileOverlay.classList.remove('show');
        }
        document.body.style.overflow = '';
    }

    if (mobileClose) {
        mobileClose.addEventListener('click', closeMobileMenu);
    }

    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', closeMobileMenu);
    }

    // Cerrar al hacer click en un link
    const mobileLinks = mobileMenu.querySelectorAll('.mobile-nav a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
}

/**
 * Marcar link activo en navegación
 */
function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links a, .mobile-nav a');

    navLinks.forEach(link => {
        const linkPath = new URL(link.href).pathname;
        if (linkPath === currentPath ||
            (currentPath === '/' && linkPath === '/') ||
            (currentPath.includes(linkPath) && linkPath !== '/')) {
            link.classList.add('active');
        }
    });
}

// Ejecutar al cargar
setActiveNavLink();

/**
 * Inicializar botón de usuario con dropdown
 */
function initUserButton() {
    const userBtn = document.querySelector('.user-btn');
    if (!userBtn) return;

    // Create dropdown container
    const dropdownContainer = document.createElement('div');
    dropdownContainer.className = 'user-dropdown-container';
    userBtn.parentNode.style.position = 'relative';
    userBtn.parentNode.appendChild(dropdownContainer);

    userBtn.addEventListener('click', function (e) {
        e.stopPropagation();

        const loggedIn = typeof isLoggedIn === 'function' && isLoggedIn();

        if (!loggedIn) {
            // Go to login
            const isInPages = window.location.pathname.includes('/pages/');
            window.location.href = isInPages ? 'login.html' : '/pages/login.html';
            return;
        }

        // Toggle dropdown
        const existingDropdown = document.querySelector('.user-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
            return;
        }

        // Get user info
        const user = typeof getStoredUser === 'function' ? getStoredUser() : null;
        const userName = user?.name || user?.email || 'Usuario';
        const isAdmin = user?.role === 'admin';
        const isInPages = window.location.pathname.includes('/pages/');

        // Create dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'user-dropdown';
        dropdown.innerHTML = `
            <div class="user-dropdown-header">
                <div class="user-dropdown-avatar">${userName.charAt(0).toUpperCase()}</div>
                <div class="user-dropdown-info">
                    <span class="user-dropdown-name">${userName}</span>
                    <span class="user-dropdown-email">${user?.email || ''}</span>
                </div>
            </div>
            <div class="user-dropdown-divider"></div>
            <a href="${isInPages ? 'cuenta.html' : '/pages/cuenta.html'}" class="user-dropdown-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Mi Cuenta
            </a>
            <a href="${isInPages ? 'cuenta.html#orders' : '/pages/cuenta.html#orders'}" class="user-dropdown-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                Mis Pedidos
            </a>
            ${isAdmin ? `
            <a href="${isInPages ? 'admin.html' : '/pages/admin.html'}" class="user-dropdown-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5"></path>
                    <path d="M2 12l10 5 10-5"></path>
                </svg>
                Panel Admin
            </a>
            ` : ''}
            <div class="user-dropdown-divider"></div>
            <button class="user-dropdown-item user-dropdown-logout" onclick="handleLogout(); window.location.reload();">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Cerrar Sesión
            </button>
        `;

        dropdownContainer.appendChild(dropdown);

        // Close dropdown when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeDropdown(e) {
                if (!dropdown.contains(e.target) && e.target !== userBtn) {
                    dropdown.remove();
                    document.removeEventListener('click', closeDropdown);
                }
            });
        }, 10);
    });

    // Update button style if logged in
    if (typeof isLoggedIn === 'function' && isLoggedIn()) {
        userBtn.classList.add('logged-in');
    }
}

/**
 * Inicializar toggle de tema
 */
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    // Get saved theme or prefer dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    themeToggle.addEventListener('click', function () {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}
