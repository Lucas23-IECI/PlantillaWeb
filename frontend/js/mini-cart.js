/**
 * MINI CART SIDEBAR
 * Drawer que aparece al agregar productos
 */

// Inicializar al cargar DOM
document.addEventListener('DOMContentLoaded', initMiniCart);

/**
 * Inicializar mini cart
 */
function initMiniCart() {
    // Crear estructura HTML si no existe
    if (!document.getElementById('miniCart')) {
        createMiniCartHTML();
    }

    // Escuchar cambios del carrito
    document.addEventListener('cartUpdated', renderMiniCartItems);

    // Click en carrito del header abre mini cart
    const cartBtns = document.querySelectorAll('.cart-btn');
    cartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openMiniCart();
        });
    });

    // Render inicial
    renderMiniCartItems();
}

/**
 * Crear estructura HTML del mini cart
 */
function createMiniCartHTML() {
    const html = `
        <div class="mini-cart-overlay" id="miniCartOverlay"></div>
        <aside class="mini-cart" id="miniCart">
            <div class="mini-cart-header">
                <h3>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                    </svg>
                    Mi Carrito
                    <span class="mini-cart-count" id="miniCartCount">0</span>
                </h3>
                <button class="mini-cart-close" onclick="closeMiniCart()" aria-label="Cerrar">×</button>
            </div>
            <div class="mini-cart-items" id="miniCartItems">
                <!-- Items dinámicos -->
            </div>
            <div class="mini-cart-footer" id="miniCartFooter">
                <div class="mini-cart-subtotal">
                    <span>Subtotal</span>
                    <span id="miniCartSubtotal">$0</span>
                </div>
                <div class="mini-cart-actions">
                    <a href="/pages/carrito.html" class="btn-view-cart">Ver Carrito</a>
                    <a href="/pages/carrito.html" class="btn-checkout">Finalizar Compra</a>
                </div>
            </div>
        </aside>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    // Eventos
    document.getElementById('miniCartOverlay').addEventListener('click', closeMiniCart);
}

/**
 * Abrir mini cart
 */
function openMiniCart() {
    const miniCart = document.getElementById('miniCart');
    const overlay = document.getElementById('miniCartOverlay');

    if (miniCart && overlay) {
        miniCart.classList.add('show');
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cerrar mini cart
 */
function closeMiniCart() {
    const miniCart = document.getElementById('miniCart');
    const overlay = document.getElementById('miniCartOverlay');

    if (miniCart && overlay) {
        miniCart.classList.remove('show');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }
}

/**
 * Renderizar items del mini cart
 */
function renderMiniCartItems() {
    const container = document.getElementById('miniCartItems');
    const countEl = document.getElementById('miniCartCount');
    const subtotalEl = document.getElementById('miniCartSubtotal');
    const footer = document.getElementById('miniCartFooter');

    if (!container || typeof cart === 'undefined') return;

    const items = cart.getAll();
    const count = cart.getCount();
    const subtotal = cart.getSubtotal();

    // Update count badge
    if (countEl) {
        countEl.textContent = count;
        countEl.style.display = count > 0 ? 'inline-block' : 'none';
    }

    // Update subtotal
    if (subtotalEl) {
        subtotalEl.textContent = formatPriceCart(subtotal);
    }

    // Show/hide footer
    if (footer) {
        footer.style.display = items.length > 0 ? 'block' : 'none';
    }

    // Render items
    if (items.length === 0) {
        container.innerHTML = `
            <div class="mini-cart-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                </svg>
                <h4>Tu carrito está vacío</h4>
                <p>Agrega productos para comenzar</p>
            </div>
        `;
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="mini-cart-item" data-id="${item.id || item.product_id}">
            <div class="mini-cart-item-image">
                <img src="${item.imagen || item.image_url || '/images/products/placeholder.png'}" alt="${item.nombre || item.name}" loading="lazy">
            </div>
            <div class="mini-cart-item-info">
                <span class="mini-cart-item-name">${item.nombre || item.name}</span>
                <span class="mini-cart-item-price">${formatPriceCart((item.precio || item.price) * item.quantity)}</span>
                <div class="mini-cart-item-controls">
                    <div class="mini-cart-qty">
                        <button onclick="updateMiniCartQty(${item.id || item.product_id}, -1)">−</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateMiniCartQty(${item.id || item.product_id}, 1)">+</button>
                    </div>
                    <button class="mini-cart-remove" onclick="removeMiniCartItem(${item.id || item.product_id})" aria-label="Eliminar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Actualizar cantidad en mini cart
 */
function updateMiniCartQty(productId, delta) {
    if (typeof cart === 'undefined') return;

    const items = cart.getAll();
    const item = items.find(i => (i.id || i.product_id) == productId);

    if (item) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) {
            cart.remove(productId);
        } else {
            cart.updateQuantity(productId, newQty);
        }
    }
}

/**
 * Eliminar item del mini cart
 */
function removeMiniCartItem(productId) {
    if (typeof cart !== 'undefined') {
        cart.remove(productId);
    }
}

/**
 * Formatear precio para carrito
 */
function formatPriceCart(precio) {
    return '$' + new Intl.NumberFormat('es-CL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(precio);
}

// Exponer funciones globalmente
window.openMiniCart = openMiniCart;
window.closeMiniCart = closeMiniCart;
