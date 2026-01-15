/**
 * SCRIPT PRINCIPAL
 * Lógica de interactividad del sitio
 */

// =============================================
// NAVEGACIÓN Y MENÚ
// =============================================

const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');
let lockedScrollY = 0;

function lockPageScroll() {
    lockedScrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.width = '100%';
}

function unlockPageScroll() {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, lockedScrollY);
}

if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
        const isActive = menuToggle.classList.toggle('active');
        navMenu.classList.toggle('active');

        if (isActive) {
            lockPageScroll();
        } else {
            unlockPageScroll();
        }
    });

    // Cerrar menú al hacer click en un link
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navMenu.classList.remove('active');
            unlockPageScroll();
        });
    });
}

// =============================================
// HEADER HIDE ON SCROLL
// =============================================

const header = document.querySelector('.header');
let lastScrollTop = 0;

if (header) {
    window.addEventListener('scroll', throttle(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // No ocultar si el menú está abierto
        if (navMenu?.classList.contains('active')) return;

        if (scrollTop > lastScrollTop && scrollTop > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }

        lastScrollTop = Math.max(0, scrollTop);
    }, 100));
}

// =============================================
// SEARCH OVERLAY
// =============================================

const searchBtn = document.getElementById('searchBtn');
const searchOverlay = document.getElementById('searchOverlay');
const searchClose = document.getElementById('searchClose');
const searchInput = searchOverlay?.querySelector('.search-input');

if (searchBtn && searchOverlay) {
    searchBtn.addEventListener('click', () => {
        searchOverlay.classList.add('active');
        searchInput?.focus();
    });

    searchClose?.addEventListener('click', () => {
        searchOverlay.classList.remove('active');
    });

    searchOverlay.addEventListener('click', (e) => {
        if (e.target === searchOverlay) {
            searchOverlay.classList.remove('active');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
            searchOverlay.classList.remove('active');
        }
    });
}

// =============================================
// SMOOTH SCROLL
// =============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 80;
            const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    });
});

// =============================================
// CARRITO UI
// =============================================

const cartBtn = document.querySelector('.cart-btn');

if (cartBtn) {
    cartBtn.addEventListener('click', () => {
        const isInPages = window.location.pathname.includes('/pages/');
        const cartUrl = isInPages ? 'carrito.html' : 'pages/carrito.html';
        window.location.href = cartUrl;
    });
}

// =============================================
// PRODUCTOS - CLICK HANDLER
// =============================================

document.querySelectorAll('.producto-card').forEach(card => {
    card.addEventListener('click', () => {
        const productId = card.dataset.productId;
        if (productId) {
            const isInPages = window.location.pathname.includes('/pages/');
            const base = isInPages ? '' : 'pages/';
            window.location.href = `${base}producto.html?id=${encodeURIComponent(productId)}`;
        }
    });
});

// =============================================
// SOCIAL FLOAT - HIDE NEAR FOOTER
// =============================================

const socialFloat = document.getElementById('socialFloat');
const footer = document.getElementById('footer');

if (socialFloat && footer) {
    const handleSocialFloatScroll = throttle(() => {
        const footerRect = footer.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // Si el footer está visible en pantalla o cerca de estarlo
        const footerIsNear = footerRect.top <= windowHeight + 100;

        if (footerIsNear) {
            socialFloat.classList.add('hidden-near-footer');
        } else {
            socialFloat.classList.remove('hidden-near-footer');
        }
    }, 100);

    window.addEventListener('scroll', handleSocialFloatScroll);
    handleSocialFloatScroll(); // Ejecutar una vez al cargar
}

// =============================================
// AVISOS FLOTANTES
// =============================================

// AVISOS DESACTIVADOS - Descomentar para habilitar
// async function loadSiteNotices() {
//     if (window.location.pathname.includes('admin')) return;
//     try {
//         const notices = await api.getActiveNotices();
//         if (notices && notices.length > 0) {
//             renderNotice(notices[0]);
//         }
//     } catch (error) {
//         if (CONFIG?.DEBUG) console.log('No se pudieron cargar avisos');
//     }
// }

function renderNotice(notice) {
    const existing = document.querySelector('.site-notice');
    if (existing) existing.remove();

    const noticeEl = document.createElement('div');
    noticeEl.className = 'site-notice';
    noticeEl.innerHTML = `
        <div class="site-notice__inner">
            <p class="site-notice__text">${escapeHtml(notice.message)}</p>
        </div>
    `;
    document.body.appendChild(noticeEl);
}

// =============================================
// RENDER PRODUCTOS HOME
// =============================================

async function loadHomeProducts() {
    const container = document.querySelector('.productos-grid');
    if (!container) return;

    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    // Mock data - siempre disponible como fallback
    const mockProducts = [
        { product_id: 1, name: 'Laptop Pro 15"', price: 899000, image_url: 'https://picsum.photos/400/400?random=1' },
        { product_id: 2, name: 'Audífonos Bluetooth', price: 59000, image_url: 'https://picsum.photos/400/400?random=2' },
        { product_id: 3, name: 'Smartwatch Fitness', price: 129000, image_url: 'https://picsum.photos/400/400?random=3' },
        { product_id: 4, name: 'Cámara Digital', price: 450000, image_url: 'https://picsum.photos/400/400?random=4' }
    ];

    let products = mockProducts; // Default to mock

    // Try to get real products from API
    try {
        if (typeof api !== 'undefined' && api.getHomeFeaturedProducts) {
            const apiProducts = await api.getHomeFeaturedProducts();
            if (apiProducts && apiProducts.length > 0) {
                products = apiProducts;
            }
        }
    } catch (apiError) {
        console.warn('API no disponible, usando productos de muestra');
    }

    // Render products
    try {
        container.innerHTML = products.map(product => {
            const name = product.name || 'Producto';
            const price = product.price || 0;
            const imageUrl = product.image_url || 'https://picsum.photos/400/400?random=99';
            const priceFormatted = typeof formatPrice === 'function' ? formatPrice(price) : `$${price.toLocaleString('es-CL')}`;
            const safeName = typeof escapeHtml === 'function' ? escapeHtml(name) : name;

            return `
                <article class="producto-card" data-product-id="${product.product_id || product.id}">
                    <div class="producto-image">
                        <img src="${imageUrl}" alt="${safeName}" loading="lazy">
                    </div>
                    <div class="producto-info">
                        <h3 class="producto-nombre">${safeName}</h3>
                        <p class="producto-precio">${priceFormatted}</p>
                    </div>
                </article>
            `;
        }).join('');

        // Click handlers
        container.querySelectorAll('.producto-card').forEach(card => {
            card.addEventListener('click', () => {
                const productId = card.dataset.productId;
                if (productId) {
                    const base = window.location.pathname.includes('/pages/') ? '' : 'pages/';
                    window.location.href = `${base}producto.html?id=${encodeURIComponent(productId)}`;
                }
            });
        });
    } catch (renderError) {
        console.error('Error renderizando productos:', renderError);
        container.innerHTML = '<p class="empty-state-text">Error mostrando productos</p>';
    }
}

// =============================================
// RENDER CATÁLOGO PRODUCTOS
// =============================================

async function loadCatalogProducts() {
    const container = document.querySelector('.catalog-grid');
    if (!container) return;

    try {
        container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
        const products = await api.getProducts();

        if (!products || products.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📦</div>
                    <h3 class="empty-state-title">No hay productos disponibles</h3>
                    <p class="empty-state-text">Vuelve pronto, estamos agregando productos nuevos.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = products.map(product => `
            <article class="producto-card" data-product-id="${product.product_id}">
                <div class="producto-image">
                    <img src="${product.image_url || '../images/products/placeholder.png'}" 
                         alt="${escapeHtml(product.name)}"
                         loading="lazy">
                </div>
                <div class="producto-info">
                    <h3 class="producto-nombre">${escapeHtml(product.name)}</h3>
                    <p class="producto-precio">${formatPrice(product.price)}</p>
                </div>
            </article>
        `).join('');

        // Re-attach click handlers
        container.querySelectorAll('.producto-card').forEach(card => {
            card.addEventListener('click', () => {
                const productId = card.dataset.productId;
                if (productId) {
                    window.location.href = `producto.html?id=${encodeURIComponent(productId)}`;
                }
            });
        });
    } catch (error) {
        console.error('Error cargando catálogo:', error);
        container.innerHTML = '<p class="empty-state-text">Error al cargar productos</p>';
    }
}

// =============================================
// FORMULARIO DE CONTACTO
// =============================================

const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(contactForm);
        const name = formData.get('name');
        const email = formData.get('email');
        const message = formData.get('message');

        // Validación básica
        if (!name || !email || !message) {
            showNotification('Por favor completa todos los campos', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showNotification('Por favor ingresa un email válido', 'error');
            return;
        }

        // Enviar por WhatsApp
        const whatsappNumber = CONFIG?.WHATSAPP_NUMBER || '56912345678';
        const whatsappMessage = `Hola! Mi nombre es ${name}. ${message}. Mi email es: ${email}`;
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

        window.open(whatsappUrl, '_blank');
        showNotification('Te redirigimos a WhatsApp', 'success');
        contactForm.reset();
    });
}

// =============================================
// INICIALIZACIÓN
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    // Actualizar links de auth
    if (typeof updateAuthLinks === 'function') {
        updateAuthLinks();
    }

    // Avisos desactivados
    // if (typeof api !== 'undefined') {
    //     loadSiteNotices();
    // }

    // DESACTIVADO: Ahora usamos home-productos.js para productos destacados
    // if (document.querySelector('.productos-grid') && !window.location.pathname.includes('/pages/')) {
    //     loadHomeProducts();
    // }

    // Cargar catálogo si estamos en productos
    if (document.querySelector('.catalog-grid')) {
        loadCatalogProducts();
    }

    // Inicializar badge del carrito
    if (typeof updateCartBadge === 'function') {
        updateCartBadge();
    }
});

// =============================================
// HELPERS (si no están disponibles de utils.js)
// =============================================

if (typeof throttle === 'undefined') {
    function throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

if (typeof escapeHtml === 'undefined') {
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

if (typeof formatPrice === 'undefined') {
    function formatPrice(price) {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(price);
    }
}

if (typeof isValidEmail === 'undefined') {
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
}

// =============================================
// DARK MODE
// =============================================

// =============================================
// DARK MODE
// =============================================

function initTheme() {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Establecer tema inicial
    if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }

    // Crear botón si no existe (y si hay header)
    const headerActions = document.querySelector('.header-actions');
    if (headerActions && !document.getElementById('themeToggle')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'themeToggle';
        toggleBtn.className = 'theme-toggle-btn';
        toggleBtn.setAttribute('aria-label', 'Cambiar tema');
        // Icono (Sol/Luna) - Visualización controlada por CSS
        toggleBtn.innerHTML = `
            <svg class="icon-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
            <svg class="icon-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
        `;

        toggleBtn.addEventListener('click', toggleTheme);

        // Insertar al inicio de actions
        headerActions.insertBefore(toggleBtn, headerActions.firstChild);
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    // Agregar clase de transición para suavizar cambio
    document.documentElement.classList.add('theme-transitioning');

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Remover clase de transición después de completar
    setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
    }, 300);
}

// Inicializar tema al cargar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
} else {
    initTheme();
}

// =============================================
// SOCIAL FLOAT - Ocultar cerca del footer
// =============================================

function initSocialFloat() {
    const socialFloat = document.querySelector('.social-float-container');
    const footer = document.querySelector('.footer, #footer');

    if (!socialFloat || !footer) return;

    function handleScroll() {
        const footerRect = footer.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // Si el footer está visible en pantalla o cerca (100px de buffer)
        const footerIsNear = footerRect.top <= windowHeight + 100;

        socialFloat.classList.toggle('hidden-near-footer', footerIsNear);
    }

    // Ejecutar al hacer scroll y al cargar
    window.addEventListener('scroll', throttle(handleScroll, 100));
    handleScroll();
}

// Inicializar social float
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSocialFloat);
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
} else {
    initSocialFloat();
    initScrollAnimations();
}

// =============================================
// SCROLL ANIMATIONS (Intersection Observer)
// =============================================
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    if (animatedElements.length === 0) return;

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Animate only once
            }
        });
    }, observerOptions);

    animatedElements.forEach(el => {
        observer.observe(el);
    });
}
