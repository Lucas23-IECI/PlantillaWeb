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

function cargarProductosDestacados(container) {
    let productos = [];

    if (typeof generarProductosMock === 'function') {
        productos = generarProductosMock();
    } else {
        productos = getProductosFallback();
    }

    const destacados = productos.slice(0, 6);

    container.innerHTML = `
        <div class="productos-home-grid">
            ${destacados.map(p => crearCardProductoHome(p)).join('')}
        </div>
    `;

    container.querySelectorAll('.producto-home-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const productId = card.dataset.id;
            window.location.href = `pages/producto.html?id=${productId}`;
        });
    });
}

function crearCardProductoHome(producto) {
    const nombre = producto.nombre || producto.name || 'Producto';
    const precio = producto.precio || producto.price || 0;
    const precioOriginal = producto.precioOriginal || producto.originalPrice;
    const marca = producto.marca || '';
    const descuento = producto.descuento || producto.discount;
    const imagen = producto.imagen || producto.image;
    const rating = producto.rating || 0;

    const formatPrice = (p) => '$' + p.toLocaleString('es-CL');

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

function renderStarsHome(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<span class="star ${i <= Math.round(rating) ? 'active' : ''}">★</span>`;
    }
    return stars;
}

function getProductosFallback() {
    return [
        {
            id: 1,
            nombre: 'MacBook Pro 14"',
            marca: 'Apple',
            precio: 1899000,
            precioOriginal: 2199000,
            descuento: 14,
            imagen: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop',
            rating: 4.9
        },
        {
            id: 4,
            nombre: 'Nike Air Max 270',
            marca: 'Nike',
            precio: 119000,
            precioOriginal: 159000,
            descuento: 25,
            imagen: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop',
            rating: 4.8
        },
        {
            id: 5,
            nombre: 'Sony WH-1000XM5',
            marca: 'Sony',
            precio: 289000,
            precioOriginal: 350000,
            descuento: 17,
            imagen: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
            rating: 4.9
        },
        {
            id: 9,
            nombre: 'Apple Watch Ultra 2',
            marca: 'Apple',
            precio: 799000,
            imagen: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop',
            rating: 4.8
        },
        {
            id: 6,
            nombre: 'Jeans Levi\'s 501',
            marca: 'Levi\'s',
            precio: 59000,
            precioOriginal: 79000,
            descuento: 25,
            imagen: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=600&h=600&fit=crop',
            rating: 4.6
        },
        {
            id: 12,
            nombre: 'Mochila Patagonia 28L',
            marca: 'Patagonia',
            precio: 89000,
            imagen: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop',
            rating: 4.6
        }
    ];
}
