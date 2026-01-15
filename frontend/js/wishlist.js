/**
 * WISHLIST - Sistema de favoritos
 * Permite a usuarios guardar productos favoritos
 */

class Wishlist {
    constructor() {
        this.items = [];
        this.storageKey = 'wishlist';
        this.load();
    }

    /**
     * Cargar wishlist desde localStorage
     */
    load() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            const parsed = stored ? JSON.parse(stored) : [];
            // Filter out null/undefined items and ensure each has an id
            this.items = parsed.filter(item => item && item.id);
        } catch (e) {
            console.warn('Error loading wishlist:', e);
            this.items = [];
        }
    }

    /**
     * Guardar wishlist en localStorage
     */
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.items));
            this.updateBadge();
            this.notify();
        } catch (e) {
            console.warn('Error saving wishlist:', e);
        }
    }

    /**
     * Agregar producto a wishlist
     */
    add(producto) {
        const id = producto.id || producto.product_id;
        if (!this.isInWishlist(id)) {
            this.items.push({
                id: id,
                nombre: producto.nombre || producto.name,
                precio: producto.precio || producto.price,
                precioOriginal: producto.precioOriginal,
                descuento: producto.descuento,
                imagen: producto.imagen || producto.image || producto.image_url,
                marca: producto.marca,
                addedAt: new Date().toISOString()
            });
            this.save();
            return true;
        }
        return false;
    }

    /**
     * Remover producto de wishlist
     */
    remove(productId) {
        const initialLength = this.items.length;
        const strId = String(productId);
        this.items = this.items.filter(item => item && String(item.id) !== strId);
        if (this.items.length !== initialLength) {
            this.save();
            return true;
        }
        return false;
    }

    /**
     * Toggle wishlist (agregar/quitar)
     */
    toggle(producto) {
        const id = producto.id || producto.product_id;
        if (this.isInWishlist(id)) {
            this.remove(id);
            return false; // Was removed
        } else {
            this.add(producto);
            return true; // Was added
        }
    }

    /**
     * Verificar si producto está en wishlist
     */
    isInWishlist(productId) {
        return this.items.some(item => item && (item.id === productId || item.id === String(productId) || String(item.id) === String(productId)));
    }

    /**
     * Obtener todos los items
     */
    getAll() {
        return [...this.items];
    }

    /**
     * Obtener cantidad de items
     */
    getCount() {
        return this.items.length;
    }

    /**
     * Limpiar wishlist
     */
    clear() {
        this.items = [];
        this.save();
    }

    /**
     * Actualizar badge en header
     */
    updateBadge() {
        const badges = document.querySelectorAll('.wishlist-count');
        const count = this.getCount();

        badges.forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        });
    }

    /**
     * Notificar cambios (custom event)
     */
    notify() {
        window.dispatchEvent(new CustomEvent('wishlistUpdated', {
            detail: { items: this.items, count: this.getCount() }
        }));
    }
}

// Instancia global
const wishlist = new Wishlist();

/**
 * Crear botón wishlist para un producto
 */
function createWishlistButton(producto, options = {}) {
    const { size = 'medium', showLabel = false } = options;
    const id = producto.id || producto.product_id;
    const isActive = wishlist.isInWishlist(id);

    const button = document.createElement('button');
    button.className = `wishlist-btn ${size} ${isActive ? 'active' : ''}`;
    button.dataset.productId = id;
    button.setAttribute('aria-label', isActive ? 'Quitar de favoritos' : 'Agregar a favoritos');
    button.title = isActive ? 'Quitar de favoritos' : 'Agregar a favoritos';

    button.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="${isActive ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        ${showLabel ? `<span>${isActive ? 'En favoritos' : 'Agregar a favoritos'}</span>` : ''}
    `;

    button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const wasAdded = wishlist.toggle(producto);
        button.classList.toggle('active', wasAdded);

        // Update SVG fill
        const svg = button.querySelector('svg');
        svg.setAttribute('fill', wasAdded ? 'currentColor' : 'none');

        // Update label if present
        const label = button.querySelector('span');
        if (label) {
            label.textContent = wasAdded ? 'En favoritos' : 'Agregar a favoritos';
        }

        // Update title
        button.title = wasAdded ? 'Quitar de favoritos' : 'Agregar a favoritos';
        button.setAttribute('aria-label', button.title);

        // Show notification
        showWishlistNotification(wasAdded ? 'Agregado a favoritos' : 'Eliminado de favoritos');
    });

    return button;
}

/**
 * Mostrar notificación de wishlist
 */
function showWishlistNotification(message) {
    const existing = document.querySelector('.wishlist-notification');
    if (existing) existing.remove();

    const notif = document.createElement('div');
    notif.className = 'wishlist-notification';
    notif.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <span>${message}</span>
    `;

    document.body.appendChild(notif);

    // Animate in
    requestAnimationFrame(() => {
        notif.classList.add('show');
    });

    // Remove after delay
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 2000);
}

/**
 * Renderizar página de wishlist
 */
function renderWishlistPage() {
    const container = document.getElementById('wishlistContainer');
    if (!container) return;

    const items = wishlist.getAll().filter(item => item !== null && item !== undefined);

    if (items.length === 0) {
        container.innerHTML = `
            <div class="wishlist-empty">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <h2>Tu lista de favoritos está vacía</h2>
                <p>Explora nuestros productos y guarda tus favoritos aquí</p>
                <a href="productos.html" class="btn btn-primary">Ver productos</a>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="wishlist-header">
            <h2>Mis Favoritos (${items.length})</h2>
            <button class="btn btn-outline-small" id="clearWishlist">Limpiar todo</button>
        </div>
        <div class="wishlist-grid">
            ${items.map(item => createWishlistItemHTML(item)).join('')}
        </div>
    `;

    // Event listeners
    container.querySelector('#clearWishlist')?.addEventListener('click', () => {
        if (confirm('¿Eliminar todos los favoritos?')) {
            wishlist.clear();
            renderWishlistPage();
        }
    });

    // Remove button (Heart icon in quick-actions)
    container.querySelectorAll('.quick-btn.wishlist').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click
            const id = parseInt(btn.dataset.id);
            wishlist.remove(id); // Remove from logic
            renderWishlistPage(); // Re-render
            showWishlistNotification('Eliminado de favoritos');
        });
    });

    // Add to cart button
    container.querySelectorAll('.quick-btn.cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click
            const id = parseInt(btn.dataset.id);
            const item = items.find(i => (i.id || i.product_id) === id);

            if (item && typeof cart !== 'undefined') {
                // Adapt item structure if needed for cart
                cart.add({
                    product_id: item.id || item.product_id,
                    name: item.nombre || item.name,
                    price: item.precio || item.price,
                    image_url: item.imagen || item.image || item.image_url
                }, 1);
                showWishlistNotification('Agregado al carrito');
            }
        });
    });

    // Card click (navigate to product)
    container.querySelectorAll('.producto-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            window.location.href = `producto.html?id=${id}`;
        });
    });
}

/**
 * Crear HTML para item de wishlist (Estilo Producto Card)
 */
function createWishlistItemHTML(item) {
    if (!item) return ''; // Safety check

    const formatPrice = (p) => '$' + p.toLocaleString('es-CL');
    const id = item.id || item.product_id;
    const nombre = item.nombre || item.name || 'Producto';
    const precio = item.precio || item.price || 0;
    const precioOriginal = item.precioOriginal;
    const imagen = item.imagen || item.image || item.image_url || '/images/products/placeholder.png';
    const marca = item.marca || '';
    const categoria = item.categoria || 'General';
    const descuento = item.descuento;

    return `
        <article class="producto-card" data-id="${id}">
            <div class="producto-imagen">
                <img src="${imagen}" alt="${nombre}" loading="lazy">
                ${descuento ? `<span class="producto-badge">-${descuento}%</span>` : ''}
                <div class="quick-actions">
                    <button class="quick-btn cart" data-id="${id}" title="Agregar al carrito">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                        </svg>
                    </button>
                    <button class="quick-btn wishlist active" data-id="${id}" title="Quitar de favoritos">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="producto-info">
                ${marca ? `<span class="producto-marca">${marca}</span>` : ''}
                <span class="producto-categoria">${categoria}</span>
                <h3 class="producto-nombre">${nombre}</h3>
                <div class="producto-precio">
                    ${precioOriginal ? `<span class="precio-original">${formatPrice(precioOriginal)}</span>` : ''}
                    <span class="precio-actual">${formatPrice(precio)}</span>
                </div>
            </div>
        </article>
    `;
}

// Initialize badge on load
document.addEventListener('DOMContentLoaded', () => {
    wishlist.updateBadge();
});
