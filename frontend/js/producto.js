let productoActual = null;
let cantidadSeleccionada = 1;

document.addEventListener('DOMContentLoaded', function () {
    loadProductDetail();
    updateCartBadge();
});

async function loadProductDetail() {
    const container = document.getElementById('productoContent');
    if (!container) return;
    container.innerHTML = `
        <div class="producto-loading">
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <h3>Cargando producto...</h3>
                <p>Un momento por favor</p>
            </div>
        </div>
    `;
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        mostrarError(container, 'Producto no especificado');
        return;
    }

    try {
        let producto = null;

        try {
            if (typeof api !== 'undefined' && api.getProductById) {
                producto = await api.getProductById(productId);
            }
        } catch (apiError) {
            console.warn('API no disponible, usando mock');
        }
        if (!producto) {
            const mockProducts = (typeof generarProductosMock === 'function') ? generarProductosMock() : getProductosMock();
            producto = mockProducts.find(p =>
                p.product_id === productId ||
                p.id === productId ||
                String(p.id) === String(productId) ||
                p.id === parseInt(productId)
            );
        }

        if (!producto) {
            mostrarError(container, 'Producto no encontrado');
            return;
        }
        productoActual = normalizeProduct(producto);
        document.title = `${productoActual.nombre} | Mi Tienda`;

        renderProducto(container, productoActual);
        renderProductosRecomendados(productoActual);
        if (typeof wishlist !== 'undefined' && wishlist.isInWishlist(productoActual.id)) {
            const btn = document.querySelector('.btn-wishlist-large');
            if (btn) btn.classList.add('active');
        }

    } catch (error) {
        console.error('Error cargando producto:', error);
        mostrarError(container, 'Error al cargar el producto');
    }
}

function normalizeProduct(p) {
    return {
        id: p.product_id || p.id,
        nombre: p.name || p.nombre || 'Producto sin nombre',
        marca: p.brand || p.marca || '',
        precio: Number(p.price || p.precio || 0),
        precioOriginal: Number(p.original_price || p.precioOriginal || 0),
        descuento: p.discount || p.descuento || 0,
        descripcion: p.description || p.descripcion || '',
        categoria: p.category || p.categoria || 'General',
        imagen: p.image_url || p.image || p.imagen,
        imagenes: p.images || p.imagenes || [p.image_url || p.image || p.imagen],
        stock: Number(p.stock || p.quantity || 0),
        rating: Number(p.rating || 0),
        reviews: Number(p.reviews || 0),
        garantia: p.garantia || '1 año',
        envioGratis: p.envioGratis || (Number(p.price || p.precio) > 50000)
    };
}

function renderProducto(container, producto) {
    const stockStatus = getStockStatus(producto.stock);
    const precioFinal = getPrecioConDescuento(producto);
    const ahorro = producto.precioOriginal ? producto.precioOriginal - precioFinal : 0;

    container.innerHTML = `
        <!-- Navegación -->
        <div class="producto-nav">
            <a href="/pages/productos.html" class="btn-back">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                <span>Volver</span>
            </a>
            <div class="producto-nav-actions">
                <button class="action-btn" onclick="shareProducto()" aria-label="Compartir">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                </button>
            </div>
        </div>

        <!-- Contenido Principal -->
        <div class="producto-content">
            <!-- Galería Multi-Imagen -->
            <div class="producto-gallery">
                <div class="producto-main-image" id="mainImageContainer">
                    <img src="${producto.imagen}" alt="${escapeHtml(producto.nombre)}" id="mainImage" loading="lazy">
                    ${producto.descuento ? `
                        <div class="discount-badge">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M13 2.05v3.03c3.39.49 6 3.39 6 6.92s-2.61 6.43-6 6.92v3.03c5.05-.5 9-4.76 9-9.95s-3.95-9.45-9-9.95zM5.5 12c0-3.53 2.61-6.43 6-6.92V2.05C6.45 2.55 2.5 6.81 2.5 12s3.95 9.45 9 9.95v-3.03c-3.39-.49-6-3.39-6-6.92z"/>
                            </svg>
                            <span>-${producto.descuento}%</span>
                        </div>
                    ` : ''}
                </div>
                ${renderGalleryThumbnails(producto)}
            </div>

            <!-- Info -->
            <div class="producto-info">
                <div class="producto-header">
                    <div class="producto-meta">
                        ${producto.marca ? `<span class="producto-brand">${escapeHtml(producto.marca)}</span>` : ''}
                        <span class="producto-category">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
                                <line x1="7" y1="7" x2="7.01" y2="7"/>
                            </svg>
                            ${escapeHtml(producto.categoria)}
                        </span>
                    </div>
                    <h1 class="producto-title">${escapeHtml(producto.nombre)}</h1>
                    
                    <!-- Rating -->
                    <div class="producto-rating">
                        <div class="stars">
                            ${renderStars(producto.rating || 4)}
                        </div>
                        <span class="rating-text">(${(producto.rating || 4).toFixed(1)}) • ${producto.reviews || 0} reseñas</span>
                    </div>
                </div>

                <!-- Precios -->
                <div class="producto-pricing">
                    ${producto.precioOriginal ? `
                        <div class="pricing-with-discount">
                            <span class="precio-original">${formatPrice(producto.precioOriginal)}</span>
                            <span class="precio-actual">${formatPrice(precioFinal)}</span>
                            <span class="precio-ahorro">Ahorras ${formatPrice(ahorro)}</span>
                        </div>
                    ` : `
                        <span class="precio-actual">${formatPrice(producto.precio)}</span>
                    `}
                </div>

                <!-- Stock -->
                <div class="stock-status ${stockStatus.class}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>${stockStatus.text}</span>
                    ${stockStatus.available ? `<span class="stock-count">(${producto.stock} disponibles)</span>` : ''}
                </div>

                <!-- Descripción -->
                <div class="producto-description">
                    <h3>Descripción</h3>
                    <p>${escapeHtml(producto.descripcion || 'Sin descripción disponible.')}</p>
                </div>

                <!-- Acciones -->
                ${stockStatus.available ? `
                    <div class="producto-actions">
                        <div class="cantidad-selector">
                            <label>Cantidad:</label>
                            <div class="cantidad-controls">
                                <button class="cantidad-btn" onclick="changeCantidad(-1)" ${cantidadSeleccionada <= 1 ? 'disabled' : ''}>−</button>
                                <span class="cantidad-display" id="cantidadDisplay">${cantidadSeleccionada}</span>
                                <button class="cantidad-btn" onclick="changeCantidad(1)" ${cantidadSeleccionada >= producto.stock ? 'disabled' : ''}>+</button>
                            </div>
                        </div>
                        <div class="action-buttons">
                            <button class="btn-add-cart" onclick="addToCartDetail()">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                                </svg>
                                Agregar al carrito
                            </button>
                            <button class="btn-wishlist-large" onclick="toggleWishlist()" aria-label="Favoritos">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                ` : ''}

                <!-- Beneficios -->
                <div class="producto-benefits">
                    <div class="benefit-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        <span>Garantía de ${producto.garantia || '1 año'}</span>
                    </div>
                    <div class="benefit-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                            <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                        </svg>
                        <span>${producto.envioGratis ? 'Envío gratis' : 'Envío a todo el país'}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderProductosRecomendados(producto) {
    const container = document.getElementById('recomendadosContainer');
    if (!container) return;

    const mockProducts = (typeof generarProductosMock === 'function') ? generarProductosMock() : getProductosMock();
    const recomendados = mockProducts
        .filter(p => (p.category || p.categoria) === producto.categoria && (p.product_id || p.id) !== producto.id && (p.stock || p.quantity) > 0)
        .slice(0, 8)
        .map(normalizeProduct);

    if (recomendados.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.innerHTML = `
        <div class="recomendados-header">
            <h2>También te puede interesar</h2>
            <p>Productos similares en ${producto.categoria}</p>
        </div>
        <div class="recomendados-carousel">
            <button class="carousel-arrow carousel-prev" aria-label="Anterior">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            </button>
            <div class="recomendados-track">
                ${recomendados.map(p => crearCardRecomendado(p)).join('')}
            </div>
            <button class="carousel-arrow carousel-next" aria-label="Siguiente">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
        </div>
    `;
    initRecomendadosCarousel();
}

function initRecomendadosCarousel() {
    const track = document.querySelector('.recomendados-track');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');

    if (!track || !prevBtn || !nextBtn) return;

    const cards = track.querySelectorAll('.producto-card');
    if (cards.length === 0) return;

    const cardWidth = cards[0].offsetWidth + 20; // card width + gap
    let autoScrollInterval;
    function scrollCarousel(direction) {
        const scrollAmount = cardWidth * direction;
        track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
    prevBtn.addEventListener('click', () => {
        scrollCarousel(-1);
        resetAutoScroll();
    });

    nextBtn.addEventListener('click', () => {
        scrollCarousel(1);
        resetAutoScroll();
    });
    function startAutoScroll() {
        autoScrollInterval = setInterval(() => {
            if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 10) {
                track.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                scrollCarousel(1);
            }
        }, 4000);
    }

    function resetAutoScroll() {
        clearInterval(autoScrollInterval);
        startAutoScroll();
    }
    startAutoScroll();
    track.addEventListener('mouseenter', () => clearInterval(autoScrollInterval));
    track.addEventListener('mouseleave', startAutoScroll);
    function updateArrows() {
        prevBtn.style.opacity = track.scrollLeft <= 0 ? '0.3' : '1';
        nextBtn.style.opacity = track.scrollLeft + track.clientWidth >= track.scrollWidth - 10 ? '0.3' : '1';
    }

    track.addEventListener('scroll', updateArrows);
    updateArrows();
}

function crearCardRecomendado(producto) {
    const precioFinal = getPrecioConDescuento(producto);
    const isInWishlist = typeof wishlist !== 'undefined' && wishlist.exists && wishlist.exists(producto.id);

    return `
        <article class="recomendado-card">
            <div class="recomendado-imagen">
                <a href="producto.html?id=${producto.id}">
                    <img src="${producto.imagen}" alt="${escapeHtml(producto.nombre)}" loading="lazy">
                </a>
                ${producto.descuento ? `<span class="recomendado-badge">-${producto.descuento}%</span>` : ''}
                <button class="recomendado-wishlist ${isInWishlist ? 'active' : ''}" 
                        onclick="event.stopPropagation(); toggleRecomendadoWishlist(${producto.id})"
                        aria-label="Añadir a favoritos">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="${isInWishlist ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                </button>
            </div>
            <div class="recomendado-info">
                <span class="recomendado-brand">${escapeHtml(producto.marca || producto.categoria)}</span>
                <h4 class="recomendado-nombre">
                    <a href="producto.html?id=${producto.id}">${escapeHtml(producto.nombre)}</a>
                </h4>
                <div class="recomendado-precios">
                    ${producto.precioOriginal ? `<span class="precio-tachado">${formatPrice(producto.precioOriginal)}</span>` : ''}
                    <span class="precio-final">${formatPrice(precioFinal)}</span>
                </div>
                <button class="btn-agregar-carro" onclick="event.stopPropagation(); agregarRecomendadoAlCarro(${producto.id})">
                    Agregar al Carro
                </button>
            </div>
        </article>
    `;
}

function toggleRecomendadoWishlist(productId) {
    if (typeof wishlist === 'undefined') return;

    const producto = getProductoById(productId);
    if (!producto) return;

    if (wishlist.exists(productId)) {
        wishlist.remove(productId);
    } else {
        wishlist.add({
            product_id: productId,
            id: productId,
            name: producto.nombre,
            price: getPrecioConDescuento(producto),
            image_url: producto.imagen
        });
    }
    const btn = document.querySelector(`.recomendado-card button[onclick*="${productId}"]`);
    if (btn) {
        btn.classList.toggle('active');
        const svg = btn.querySelector('svg');
        if (svg) {
            svg.setAttribute('fill', wishlist.exists(productId) ? 'currentColor' : 'none');
        }
    }
}

function agregarRecomendadoAlCarro(productId) {
    const producto = getProductoById(productId);
    if (!producto) return;

    cart.add({
        product_id: productId,
        id: productId,
        name: producto.nombre,
        price: getPrecioConDescuento(producto),
        image_url: producto.imagen,
        quantity: 1
    });

    if (typeof showNotification === 'function') {
        showNotification(`${producto.nombre} agregado al carrito`, 'success');
    }
}

function getProductoById(productId) {
    const mockProducts = (typeof generarProductosMock === 'function') ? generarProductosMock() : getProductosMock();
    const found = mockProducts.find(p => (p.product_id || p.id) === productId || (p.product_id || p.id) === String(productId));
    return found ? normalizeProduct(found) : null;
}

function changeCantidad(delta) {
    if (!productoActual) return;

    const newCantidad = cantidadSeleccionada + delta;
    if (newCantidad >= 1 && newCantidad <= productoActual.stock) {
        cantidadSeleccionada = newCantidad;
        document.getElementById('cantidadDisplay').textContent = cantidadSeleccionada;
        const btns = document.querySelectorAll('.cantidad-btn');
        if (btns.length === 2) {
            btns[0].disabled = cantidadSeleccionada <= 1;
            btns[1].disabled = cantidadSeleccionada >= productoActual.stock;
        }
    }
}

function addToCartDetail() {
    if (!productoActual) return;

    if (typeof cart !== 'undefined' && cart.add) {
        cart.add(productoActual, cantidadSeleccionada);
    } else {
        let cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingIndex = cartItems.findIndex(item => item.id === productoActual.id);

        if (existingIndex >= 0) {
            cartItems[existingIndex].cantidad += cantidadSeleccionada;
        } else {
            cartItems.push({
                ...productoActual,
                cantidad: cantidadSeleccionada
            });
        }

        localStorage.setItem('cart', JSON.stringify(cartItems));
        updateCartBadge();
    }

    showNotification(`${productoActual.nombre} agregado al carrito`);
}

function toggleWishlist() {
    if (!productoActual) return;

    const btn = document.querySelector('.btn-wishlist-large');

    if (typeof wishlist !== 'undefined' && wishlist.toggle) {
        wishlist.toggle(productoActual);
        const isActive = wishlist.isInWishlist(productoActual.id);
        if (btn) btn.classList.toggle('active', isActive);
        showNotification(isActive ? 'Agregado a favoritos' : 'Eliminado de favoritos');
    } else {
        if (btn) {
            btn.classList.toggle('active');
            showNotification(btn.classList.contains('active') ? 'Agregado a favoritos' : 'Eliminado de favoritos');
        }
    }
}

function shareProducto() {
    if (navigator.share && productoActual) {
        navigator.share({
            title: productoActual.nombre,
            text: `Mira este producto: ${productoActual.nombre}`,
            url: window.location.href,
        });
    } else {
        navigator.clipboard.writeText(window.location.href);
        showNotification('Enlace copiado al portapapeles');
    }
}

function renderGalleryThumbnails(producto) {
    let allImages = [producto.imagen];

    if (producto.imagenes && Array.isArray(producto.imagenes) && producto.imagenes.length > 0) {
        allImages = [...allImages, ...producto.imagenes];
    }
    allImages = allImages.filter(img => img);
    if (allImages.length <= 1) {
        return '';
    }
    allImages = [...new Set(allImages)];

    return `
        <div class="gallery-thumbnails">
            ${allImages.map((img, index) => `
                <button class="gallery-thumb ${index === 0 ? 'active' : ''}" 
                        onclick="changeMainImage('${img}', this)"
                        aria-label="Ver imagen ${index + 1}">
                    <img src="${img}" alt="Vista ${index + 1}" loading="lazy">
                </button>
            `).join('')}
        </div>
    `;
}

function changeMainImage(imageUrl, thumbElement) {
    const mainImage = document.getElementById('mainImage');
    if (!mainImage) return;
    mainImage.style.opacity = '0';

    setTimeout(() => {
        mainImage.src = imageUrl;
        mainImage.style.opacity = '1';
    }, 200);
    document.querySelectorAll('.gallery-thumb').forEach(thumb => {
        thumb.classList.remove('active');
    });
    if (thumbElement) {
        thumbElement.classList.add('active');
    }
}

function getStockStatus(stock) {
    if (stock === 0) return { text: 'Sin stock', class: 'out-of-stock', available: false };
    if (stock <= 5) return { text: 'Últimas unidades', class: 'low-stock', available: true };
    return { text: 'Disponible', class: 'in-stock', available: true };
}

function getPrecioConDescuento(producto) {
    if (producto.descuento && producto.descuento > 0) {
        return producto.precio * (1 - producto.descuento / 100);
    }
    return producto.precio;
}

function renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<span class="star ${i <= Math.round(rating) ? 'active' : ''}">★</span>`;
    }
    return stars;
}

function formatPrice(precio) {
    return '$' + new Intl.NumberFormat('es-CL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(precio);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function mostrarError(container, mensaje) {
    container.innerHTML = `
        <div class="producto-error">
            <div class="error-content">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <h2>${mensaje}</h2>
                <p>El producto que buscas no existe o ha sido eliminado.</p>
                <a href="/pages/productos.html" class="btn-back">Volver a productos</a>
            </div>
        </div>
    `;
}

function updateCartBadge() {
    const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cartItems.reduce((sum, item) => sum + (item.cantidad || 1), 0);

    const badge = document.getElementById('cartCount');
    if (badge) {
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

function showNotification(mensaje) {
    const notif = document.createElement('div');
    notif.textContent = mensaje;
    notif.style.cssText = 'position:fixed;top:20px;right:20px;background:var(--color-primary, #1a1a2e);color:white;padding:16px 24px;border-radius:12px;z-index:10000;animation:fadeIn 0.3s ease-out;box-shadow:0 4px 20px rgba(0,0,0,0.2)';
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

function getProductosMock() {
    return [
        {
            product_id: 'prod_1',
            name: 'MacBook Pro 14"',
            brand: 'Apple',
            price: 1899000,
            original_price: 2199000,
            discount: 14,
            description: 'MacBook Pro con chip M3 Pro, 18GB RAM y 512GB SSD. Pantalla Liquid Retina XDR de 14.2 pulgadas.',
            image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop',
            images: [
                'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=800&fit=crop'
            ],
            stock: 10,
            rating: 4.9,
            reviews: 287,
            category: 'Electrónica'
        },
        {
            product_id: 'prod_2',
            name: 'iPhone 15 Pro Max',
            brand: 'Apple',
            price: 1499000,
            original_price: 1699000,
            discount: 12,
            description: 'iPhone 15 Pro Max con chip A17 Pro, cámara de 48MP y pantalla Super Retina XDR de 6.7".',
            image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&h=600&fit=crop',
            images: [
                'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800&h=800&fit=crop'
            ],
            stock: 15,
            rating: 4.8,
            reviews: 523,
            category: 'Electrónica'
        },
        {
            product_id: 'prod_3',
            name: 'Camiseta Algodón Premium',
            brand: 'UrbanStyle',
            price: 25000,
            original_price: 35000,
            discount: 29,
            description: 'Camiseta 100% algodón orgánico certificado. Disponible en 8 colores. Corte regular fit.',
            image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop',
            images: [
                'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1618354691551-44de113f0164?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&h=800&fit=crop'
            ],
            stock: 50,
            rating: 4.5,
            reviews: 156,
            category: 'Ropa'
        }
    ];
}
