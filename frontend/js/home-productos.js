// VERSION FIX 2
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomeProductos);
} else {
    initHomeProductos();
}

function initHomeProductos() {
    const container = document.getElementById('productosDestacados');
    if (!container) return;

    cargarProductosDestacados(container);
}

async function cargarProductosDestacados(container) {
    let productos = [];

    // Intentar cargar desde API primero
    try {
        if (typeof api !== 'undefined' && api.getProducts) {
            const response = await api.getProducts();
            productos = response.products || response || [];
        }
    } catch (error) {
        console.warn('Error cargando productos destacados:', error);
    }

    // Si no hay productos de la API, mostrar mensaje vacío
    if (!productos || productos.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">No hay productos destacados disponibles</p>';
        return;
    }

    const destacados = productos.slice(0, 6);

    container.innerHTML = destacados.map(p => crearCardProductoHome(p)).join('');

    container.querySelectorAll('.producto-home-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const productId = card.dataset.id;
            window.location.href = `pages/producto.html?id=${productId}`;
        });
    });
}

function crearCardProductoHome(producto) {
    const productId = producto.id || producto.product_id || producto._id;
    const nombre = producto.nombre || producto.name || 'Producto';
    const precio = producto.precio || producto.price || 0;
    const precioOriginal = producto.precioOriginal || producto.originalPrice || producto.original_price;
    const marca = producto.marca || producto.brand || '';
    const descuento = producto.descuento || producto.discount ||
        (precioOriginal && precio < precioOriginal ? Math.round((1 - precio / precioOriginal) * 100) : 0);
    const imagen = producto.imagen || producto.image || producto.image_url || 'https://via.placeholder.com/300';
    const rating = producto.rating || 0;

    const formatPrice = (p) => '$' + p.toLocaleString('es-CL');

    const starsHtml = renderStarsHome(rating);

    return `
        <article class="producto-home-card" data-id="${productId}">
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

function renderStarsHome(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<span class="star ${i <= Math.round(rating) ? 'active' : ''}">★</span>`;
    }
    return stars;
}

function getProductosFallback() {
    // Mock data eliminado - usar productos reales desde Firebase
    return [];
}
