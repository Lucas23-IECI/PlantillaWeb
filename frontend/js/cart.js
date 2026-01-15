class Cart {
    constructor() {
        this.storageKey = 'cart_items';
        this.items = [];
        this.load();
    }

    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            this.items = saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.warn('Error cargando carrito:', e);
            this.items = [];
        }
    }

    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.items));
            this.notify();
        } catch (e) {
            console.warn('Error guardando carrito:', e);
        }
    }

    add(product, quantity = 1, note = '') {
        const productId = product.id || product.product_id;
        const productName = product.nombre || product.name;
        const productPrice = product.precio || product.price;
        const productImage = product.imagen || product.image_url || '';

        const existingIndex = this.items.findIndex(item =>
            (item.id || item.product_id) === productId
        );

        if (existingIndex > -1) {
            this.items[existingIndex].quantity += quantity;
        } else {
            this.items.push({
                id: productId,
                product_id: productId,
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

        if (typeof openMiniCart === 'function') {
            openMiniCart();
        }
    }

    remove(productId) {
        this.items = this.items.filter(item =>
            (item.id || item.product_id) != productId
        );
        this.save();
    }

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

    updateNote(productId, note) {
        const item = this.items.find(item => item.product_id === productId);
        if (item) {
            item.note = note;
            this.save();
        }
    }

    getAll() {
        return this.items;
    }

    getCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    getSubtotal() {
        return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    getTotal(discount = 0) {
        return Math.max(0, this.getSubtotal() - discount);
    }

    isEmpty() {
        return this.items.length === 0;
    }

    clear() {
        this.items = [];
        this.save();
    }

    notify() {
        document.dispatchEvent(new CustomEvent('cartUpdated', {
            detail: {
                count: this.getCount(),
                total: this.getSubtotal(),
                items: this.items
            }
        }));
    }

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

const cart = new Cart();

function updateCartBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const count = cart.getCount();

    badges.forEach(badge => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    });
}

document.addEventListener('cartUpdated', updateCartBadge);

document.addEventListener('DOMContentLoaded', updateCartBadge);
