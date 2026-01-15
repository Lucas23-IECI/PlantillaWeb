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
 * Inicializar botón de usuario
 */
function initUserButton() {
    const userBtn = document.querySelector('.user-btn');
    if (!userBtn) return;

    userBtn.addEventListener('click', function () {
        // Check if logged in
        if (typeof isLoggedIn === 'function' && isLoggedIn()) {
            // Go to account
            const isInPages = window.location.pathname.includes('/pages/');
            window.location.href = isInPages ? 'cuenta.html' : '/pages/cuenta.html';
        } else {
            // Go to login
            const isInPages = window.location.pathname.includes('/pages/');
            window.location.href = isInPages ? 'login.html' : '/pages/login.html';
        }
    });
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
