/**
 * HOME PRODUCTOS - Carga productos destacados en la página de inicio
 */

// Ejecutar cuando esté listo (o inmediatamente si ya cargó)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomeProductos);
} else {
    // DOM ya listo, ejecutar inmediatamente
    initHomeProductos();
}

/**
 * Inicializar productos en home
 */
function initHomeProductos() {
    const container = document.getElementById('productosDestacados');
    if (!container) return;

    cargarProductosDestacados(container);
}

/**
 * Cargar productos destacados con mock data
 */
function cargarProductosDestacados(container) {
    // Usar productos mock si generarProductosMock existe
    let productos = [];

    if (typeof generarProductosMock === 'function') {
        productos = generarProductosMock();
    } else {
        // Fallback: productos básicos
        productos = getProductosFallback();
    }

    // Mostrar máximo 6 productos destacados
    const destacados = productos.slice(0, 6);

    // Renderizar grid
    container.innerHTML = `
        <div class="productos-home-grid">
            ${destacados.map(p => crearCardProductoHome(p)).join('')}
        </div>
    `;

    // Agregar click events
    container.querySelectorAll('.producto-home-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const productId = card.dataset.id;
            window.location.href = `pages/producto.html?id=${productId}`;
        });
    });
}

/**
 * Crear card de producto para home
 */
function crearCardProductoHome(producto) {
    const nombre = producto.nombre || producto.name || 'Producto';
    const precio = producto.precio || producto.price || 0;
    const precioOriginal = producto.precioOriginal || producto.originalPrice;
    const marca = producto.marca || '';
    const descuento = producto.descuento || producto.discount;
    const imagen = producto.imagen || producto.image;
    const rating = producto.rating || 0;

    // Format price
    const formatPrice = (p) => '$' + p.toLocaleString('es-CL');

    // Render stars
    const starsHtml = renderStarsHome(rating);

    return `
        <article class="producto-home-card" data-id="${producto.id}">
            <div class="producto-home-imagen">
                <img src="${imagen}" alt="${nombre}" loading="lazy">
                ${descuento ? `<span class="producto-badge">-${descuento}%</span>` : ''}
            </div>
            <div class="producto-home-info">
                ${marca ? `<span class="producto-marca">${marca}</span>` : ''}
                <h3 class="producto-nombre">${nombre}</h3>
                ${rating > 0 ? `
                    <div class="producto-rating">
                        <div class="stars">${starsHtml}</div>
                        <span class="rating-text">${rating.toFixed(1)}</span>
                    </div>
                ` : ''}
                <div class="producto-precio">
                    ${precioOriginal ? `<span class="precio-original">${formatPrice(precioOriginal)}</span>` : ''}
                    <span class="precio-actual">${formatPrice(precio)}</span>
                </div>
            </div>
        </article>
    `;
}

/**
 * Render rating stars
 */
function renderStarsHome(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<span class="star ${i <= Math.round(rating) ? 'active' : ''}">★</span>`;
    }
    return stars;
}

/**
 * Fallback products if main mock not available
 * NOTA: Mock data eliminado - usar productos reales desde Firebase
 */
function getProductosFallback() {
    // Productos fallback eliminados - la app ahora usa Firebase
    return [];
}
