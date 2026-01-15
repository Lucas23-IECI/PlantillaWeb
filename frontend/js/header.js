document.addEventListener('DOMContentLoaded', function () {
    initHeaderSearch();
    initMobileMenu();
    initUserButton();
    initThemeToggle();
});

function initHeaderSearch() {
    const searchContainer = document.querySelector('.header-search');
    const searchIcon = document.querySelector('.search-icon');
    const searchInput = document.querySelector('.header-search input');

    if (!searchContainer || !searchIcon || !searchInput) return;

    searchIcon.addEventListener('click', function (e) {
        e.stopPropagation();
        const isExpanded = searchContainer.classList.contains('expanded');

        if (!isExpanded) {
            searchContainer.classList.add('expanded');
            setTimeout(() => searchInput.focus(), 300);
        } else if (!searchInput.value.trim()) {
            searchContainer.classList.remove('expanded');
        }
    });

    document.addEventListener('click', function (e) {
        if (!searchContainer.contains(e.target)) {
            if (!searchInput.value.trim()) {
                searchContainer.classList.remove('expanded');
            }
        }
    });

    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && searchInput.value.trim()) {
            const query = encodeURIComponent(searchInput.value.trim());
            window.location.href = `/pages/productos.html?busqueda=${query}`;
        }
    });
}

function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileClose = document.querySelector('.mobile-close');
    const mobileOverlay = document.querySelector('.mobile-overlay');

    if (!menuToggle || !mobileMenu) return;

    menuToggle.addEventListener('click', function () {
        mobileMenu.classList.add('open');
        if (mobileOverlay) {
            mobileOverlay.classList.add('show');
        }
        document.body.style.overflow = 'hidden';
    });

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

    const mobileLinks = mobileMenu.querySelectorAll('.mobile-nav a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
}

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

setActiveNavLink();

function initUserButton() {
    const userBtn = document.querySelector('.user-btn');
    if (!userBtn) return;

    userBtn.addEventListener('click', function () {
        if (typeof isLoggedIn === 'function' && isLoggedIn()) {
            const isInPages = window.location.pathname.includes('/pages/');
            window.location.href = isInPages ? 'cuenta.html' : '/pages/cuenta.html';
        } else {
            const isInPages = window.location.pathname.includes('/pages/');
            window.location.href = isInPages ? 'login.html' : '/pages/login.html';
        }
    });
}

function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    themeToggle.addEventListener('click', function () {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}
