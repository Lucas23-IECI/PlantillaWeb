/**
 * CARRITO DE COMPRAS
 * Gestiona items, localStorage y eventos
 */

class Cart {
    constructor() {
        this.storageKey = 'cart_items';
        this.items = [];
        this.load();
    }

    /**
     * Cargar carrito desde localStorage
     */
    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            this.items = saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.warn('Error cargando carrito:', e);
            this.items = [];
        }
    }

    /**
     * Guardar carrito en localStorage
     */
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.items));
            this.notify();
        } catch (e) {
            console.warn('Error guardando carrito:', e);
        }
    }

    /**
     * Agregar producto al carrito
     * @param {Object} product - Producto a agregar
     * @param {number} quantity - Cantidad (default: 1)
     * @param {string} note - Nota personalizada (opcional)
     */
    add(product, quantity = 1, note = '') {
        // Support both id and product_id
        const productId = product.id || product.product_id;
        const productName = product.nombre || product.name;
        const productPrice = product.precio || product.price;
        const productImage = product.imagen || product.image_url || '';

        const existingIndex = this.items.findIndex(item =>
            (item.id || item.product_id) === productId
        );

        if (existingIndex > -1) {
            // Aumentar cantidad si ya existe
            this.items[existingIndex].quantity += quantity;
        } else {
            // Agregar nuevo item
            this.items.push({
                id: productId,
                product_id: productId, // backwards compat
                name: productName,
                nombre: productName,
                price: productPrice,
                precio: productPrice,
                image_url: productImage,
                imagen: productImage,
                quantity: quantity,
                note: note
            });
        }

        this.save();

        if (typeof showNotification === 'function') {
            showNotification(`${productName} agregado al carrito`, 'success');
        }

        // Open mini cart
        if (typeof openMiniCart === 'function') {
            openMiniCart();
        }
    }

    /**
     * Remover producto del carrito
     * @param {string|number} productId - ID del producto
     */
    remove(productId) {
        this.items = this.items.filter(item =>
            (item.id || item.product_id) != productId
        );
        this.save();
    }

    /**
     * Actualizar cantidad de un producto
     * @param {string|number} productId - ID del producto
     * @param {number} quantity - Nueva cantidad
     */
    updateQuantity(productId, quantity) {
        const item = this.items.find(item =>
            (item.id || item.product_id) == productId
        );
        if (item) {
            if (quantity <= 0) {
                this.remove(productId);
            } else {
                item.quantity = quantity;
                this.save();
            }
        }
    }

    /**
     * Actualizar nota de un producto
     * @param {string} productId - ID del producto
     * @param {string} note - Nueva nota
     */
    updateNote(productId, note) {
        const item = this.items.find(item => item.product_id === productId);
        if (item) {
            item.note = note;
            this.save();
        }
    }

    /**
     * Obtener todos los items
     * @returns {Array} - Items del carrito
     */
    getAll() {
        return this.items;
    }

    /**
     * Obtener cantidad total de items
     * @returns {number} - Cantidad total
     */
    getCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    /**
     * Obtener subtotal
     * @returns {number} - Subtotal
     */
    getSubtotal() {
        return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    /**
     * Obtener total (con descuento aplicado)
     * @param {number} discount - Descuento a aplicar (default: 0)
     * @returns {number} - Total
     */
    getTotal(discount = 0) {
        return Math.max(0, this.getSubtotal() - discount);
    }

    /**
     * Verificar si el carrito está vacío
     * @returns {boolean}
     */
    isEmpty() {
        return this.items.length === 0;
    }

    /**
     * Limpiar carrito
     */
    clear() {
        this.items = [];
        this.save();
    }

    /**
     * Notificar cambios (dispara evento personalizado)
     */
    notify() {
        document.dispatchEvent(new CustomEvent('cartUpdated', {
            detail: {
                count: this.getCount(),
                total: this.getSubtotal(),
                items: this.items
            }
        }));
    }

    /**
     * Obtener items formateados para la API
     * @returns {Array} - Items para enviar a la API
     */
    getItemsForApi() {
        return this.items.map(item => ({
            product_id: item.product_id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            note: item.note || ''
        }));
    }
}

// Instancia global del carrito
const cart = new Cart();

/**
 * Actualizar badge del carrito
 */
function updateCartBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const count = cart.getCount();

    badges.forEach(badge => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    });
}

// Escuchar cambios del carrito
document.addEventListener('cartUpdated', updateCartBadge);

// Inicializar badge al cargar
document.addEventListener('DOMContentLoaded', updateCartBadge);
