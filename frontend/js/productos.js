/**
 * PRODUCTOS PAGE - JavaScript
 * Funcionalidad para filtros, búsqueda, sorting y vistas
 */

document.addEventListener('DOMContentLoaded', function () {
    initProductsPage();
});

// Estado de la página
let estadoProductos = {
    productos: [],
    filtros: {
        categoria: '',
        precioMin: '',
        precioMax: '',
        stock: '',
        busqueda: ''
    },
    orden: '',
    vista: 'grid', // 'grid' o 'list'
    paginaActual: 1,
    productosPorPagina: 12
};

function initProductsPage() {
    // Solo ejecutar en la página de productos (verificar que productosGrid existe)
    const productosGrid = document.getElementById('productosGrid');
    if (!productosGrid) {
        // No estamos en la página de productos, no hacer nada
        return;
    }

    // Elementos del DOM
    const elements = {
        // Filtros
        toggleFilters: document.getElementById('toggleFilters'),
        clearFilters: document.getElementById('clearFilters'),
        clearAllFilters: document.getElementById('clearAllFilters'),
        applyFilters: document.getElementById('applyFilters'),
        filtersSidebar: document.getElementById('filtersSidebar'),
        filtersCloseBtn: document.getElementById('filtersCloseBtn'),
        categoryTree: document.getElementById('categoryTree'),
        priceMin: document.getElementById('priceMin'),
        priceMax: document.getElementById('priceMax'),
        priceRangeMin: document.getElementById('priceRangeMin'),
        priceRangeMax: document.getElementById('priceRangeMax'),
        priceMinDisplay: document.getElementById('priceMinDisplay'),
        priceMaxDisplay: document.getElementById('priceMaxDisplay'),
        stockOptions: document.querySelectorAll('input[name="stock"]'),
        brandList: document.getElementById('brandList'),
        brandSearch: document.getElementById('brandSearch'),

        // Búsqueda
        searchProducts: document.getElementById('searchProducts'),
        searchClearBtn: document.getElementById('searchClearBtn'),

        // Vistas
        viewBtns: document.querySelectorAll('.view-btn'),

        // Ordenar
        sortBy: document.getElementById('sortBy'),

        // Grid y contador
        productosGrid: document.getElementById('productosGrid'),
        productosCount: document.getElementById('productosCount'),
        filterCount: document.getElementById('filterCount')
    };

    // Event Listeners

    // Toggle sidebar filters (mobile)
    const filtersOverlay = document.getElementById('filtersOverlay');

    elements.toggleFilters?.addEventListener('click', () => {
        elements.filtersSidebar?.classList.toggle('show');
        filtersOverlay?.classList.toggle('show');
    });

    elements.filtersCloseBtn?.addEventListener('click', () => {
        elements.filtersSidebar?.classList.remove('show');
        filtersOverlay?.classList.remove('show');
    });

    // Close filters when clicking overlay
    filtersOverlay?.addEventListener('click', () => {
        elements.filtersSidebar?.classList.remove('show');
        filtersOverlay?.classList.remove('show');
    });

    // Clear filters
    elements.clearFilters?.addEventListener('click', () => {
        limpiarFiltros(elements);
    });

    // Category tree click events
    elements.categoryTree?.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = link.dataset.category;
            estadoProductos.filtros.categoria = category;

            // Update active state
            elements.categoryTree.querySelectorAll('a').forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            aplicarFiltros(elements);
        });
    });

    // Stock radio buttons
    elements.stockOptions?.forEach(radio => {
        radio.addEventListener('change', (e) => {
            estadoProductos.filtros.stock = e.target.value;
            aplicarFiltros(elements);
        });
    });

    // Clear all filters button
    elements.clearAllFilters?.addEventListener('click', () => {
        limpiarFiltros(elements);
    });

    // Apply filters button
    elements.applyFilters?.addEventListener('click', () => {
        aplicarFiltros(elements);
    });

    // Price inputs
    elements.priceMin?.addEventListener('change', (e) => {
        estadoProductos.filtros.precioMin = e.target.value;
        if (elements.priceMinDisplay) {
            elements.priceMinDisplay.textContent = formatPrice(parseInt(e.target.value) || 0);
        }
    });

    elements.priceMax?.addEventListener('change', (e) => {
        estadoProductos.filtros.precioMax = e.target.value;
        if (elements.priceMaxDisplay) {
            elements.priceMaxDisplay.textContent = formatPrice(parseInt(e.target.value) || 5000000);
        }
    });

    // Búsqueda
    let searchTimeout;
    elements.searchProducts?.addEventListener('input', (e) => {
        const value = e.target.value;
        elements.searchClearBtn.style.display = value ? 'block' : 'none';

        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            estadoProductos.filtros.busqueda = value;
            aplicarFiltros(elements);
        }, 500);
    });

    elements.searchClearBtn?.addEventListener('click', () => {
        elements.searchProducts.value = '';
        elements.searchClearBtn.style.display = 'none';
        estadoProductos.filtros.busqueda = '';
        aplicarFiltros(elements);
    });

    // Toggle vistas
    elements.viewBtns?.forEach(btn => {
        btn.addEventListener('click', () => {
            const vista = btn.dataset.view;
            cambiarVista(vista, elements);
        });
    });

    // Ordenar
    elements.sortBy?.addEventListener('change', (e) => {
        estadoProductos.orden = e.target.value;
        ordenarYRenderizar(elements);
    });

    // Cargar productos iniciales
    cargarProductos(elements);

    // Leer parámetros de URL
    leerParametrosURL(elements);
}

/**
 * Cargar productos desde API
 */
async function cargarProductos(elements) {
    try {
        elements.productosGrid.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Cargando productos...</p>
            </div>
        `;

        let productos = [];

        // Intentar cargar desde API primero
        try {
            if (typeof api !== 'undefined' && api.getProducts) {
                const response = await api.getProducts();
                productos = response.products || response || [];
            }
        } catch (apiError) {
            console.warn('API no disponible, usando productos mock:', apiError.message);
        }

        // Si no hay productos, usar mock
        if (!productos || productos.length === 0) {
            console.log('Usando productos mock');
            productos = generarProductosMock();
        }

        estadoProductos.productos = productos;

        // Cargar categorías en el select
        cargarCategorias(elements);

        // Renderizar productos
        renderizarProductos(elements);

    } catch (error) {
        console.error('Error cargando productos:', error);
        // Fallback final - usar mock
        estadoProductos.productos = generarProductosMock();
        cargarCategorias(elements);
        renderizarProductos(elements);
    }
}

/**
 * Filtrar productos según estado
 */
function filtrarProductos() {
    let productosFiltrados = [...estadoProductos.productos];

    const { categoria, precioMin, precioMax, stock, busqueda } = estadoProductos.filtros;

    // Filtro por categoría
    if (categoria) {
        productosFiltrados = productosFiltrados.filter(p =>
            (p.categoria || p.category || '').toLowerCase() === categoria.toLowerCase()
        );
    }

    // Filtro por precio
    if (precioMin) {
        productosFiltrados = productosFiltrados.filter(p =>
            (p.precio || p.price) >= parseFloat(precioMin)
        );
    }

    if (precioMax) {
        productosFiltrados = productosFiltrados.filter(p =>
            (p.precio || p.price) <= parseFloat(precioMax)
        );
    }

    // Filtro por stock
    if (stock === 'in-stock') {
        productosFiltrados = productosFiltrados.filter(p =>
            (p.stock || p.quantity || 0) > 0
        );
    } else if (stock === 'out-of-stock') {
        productosFiltrados = productosFiltrados.filter(p =>
            (p.stock || p.quantity || 0) === 0
        );
    }

    // Filtro por búsqueda
    if (busqueda) {
        const termino = busqueda.toLowerCase();
        productosFiltrados = productosFiltrados.filter(p => {
            const nombre = (p.nombre || p.name || '').toLowerCase();
            const categoria = (p.categoria || p.category || '').toLowerCase();
            const descripcion = (p.descripcion || p.description || '').toLowerCase();
            return nombre.includes(termino) || categoria.includes(termino) || descripcion.includes(termino);
        });
    }

    return productosFiltrados;
}

/**
 * Ordenar productos
 */
function ordenarProductos(productos) {
    const productosOrdenados = [...productos];

    switch (estadoProductos.orden) {
        case 'precio_asc':
            productosOrdenados.sort((a, b) => (a.precio || a.price) - (b.precio || b.price));
            break;
        case 'precio_desc':
            productosOrdenados.sort((a, b) => (b.precio || b.price) - (a.precio || a.price));
            break;
        case 'nombre_asc':
            productosOrdenados.sort((a, b) => (a.nombre || a.name).localeCompare(b.nombre || b.name));
            break;
        case 'nombre_desc':
            productosOrdenados.sort((a, b) => (b.nombre || b.name).localeCompare(a.nombre || a.name));
            break;
    }

    return productosOrdenados;
}

/**
 * Renderizar productos en el grid
 */
function renderizarProductos(elements) {
    const productosFiltrados = filtrarProductos();
    const productosOrdenados = ordenarProductos(productosFiltrados);

    // Actualizar contador
    elements.productosCount.textContent = `${productosOrdenados.length} producto${productosOrdenados.length !== 1 ? 's' : ''} encontrado${productosOrdenados.length !== 1 ? 's' : ''}`;

    // Actualizar contador de filtros activos
    const filtrosActivos = contarFiltrosActivos();
    if (filtrosActivos > 0) {
        elements.filterCount.textContent = filtrosActivos;
        elements.filterCount.style.display = 'flex';
        elements.clearFilters.style.display = 'flex';
    } else {
        elements.filterCount.style.display = 'none';
        elements.clearFilters.style.display = 'none';
    }

    // Renderizar
    if (productosOrdenados.length === 0) {
        elements.productosGrid.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <h3>No se encontraron productos</h3>
                <p>Intenta ajustar los filtros de búsqueda</p>
            </div>
        `;
        return;
    }

    elements.productosGrid.innerHTML = productosOrdenados.map(producto => crearCardProducto(producto)).join('');

    // Agregar event listeners a las cards
    elements.productosGrid.querySelectorAll('.producto-card').forEach((card, index) => {
        card.addEventListener('click', () => {
            const producto = productosOrdenados[index];
            const productId = producto.id || producto.product_id;
            window.location.href = `producto.html?id=${productId}`;
        });
    });
}

/**
 * Crear HTML de card de producto (Premium con Galería)
 */
function crearCardProducto(producto) {
    const productId = producto.id || producto.product_id;
    const nombre = producto.nombre || producto.name || 'Producto sin nombre';
    const precio = producto.precio || producto.price || 0;
    const precioOriginal = producto.precioOriginal || producto.original_price || producto.originalPrice;
    const categoria = producto.categoria || producto.category || 'General';
    const imagenPrincipal = producto.imagen || producto.image || producto.image_url || '../images/products/placeholder.png';
    const imagenes = producto.imagenes || producto.images || [imagenPrincipal];
    const descuento = producto.descuento || producto.discount;
    const stock = producto.stock || producto.quantity || 0;
    const marca = producto.marca || producto.brand || '';
    const descripcion = producto.descripcion || producto.description || '';
    const rating = producto.rating || 0;
    const reviews = producto.reviews || 0;

    // Truncar descripción
    const descripcionCorta = descripcion.length > 60
        ? descripcion.substring(0, 60) + '...'
        : descripcion;

    // Stock status
    const stockStatus = getStockStatus(stock);

    // Render stars
    const starsHtml = renderStars(rating);

    // Generar galería solo si hay más de 1 imagen
    const hasGallery = imagenes.length > 1;
    const galleryDotsHtml = hasGallery ? `
        <div class="gallery-dots">
            ${imagenes.map((_, i) => `<button class="gallery-dot ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="Ver imagen ${i + 1}"></button>`).join('')}
        </div>
    ` : '';

    const galleryArrowsHtml = hasGallery ? `
        <button class="gallery-arrow prev" onclick="event.stopPropagation(); cambiarImagenGaleria(this, -1)" aria-label="Imagen anterior">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <button class="gallery-arrow next" onclick="event.stopPropagation(); cambiarImagenGaleria(this, 1)" aria-label="Siguiente imagen">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
    ` : '';

    return `
        <article class="producto-card ${hasGallery ? 'has-gallery' : ''}" data-id="${productId}" data-images='${JSON.stringify(imagenes)}' data-current-image="0">
            <div class="producto-imagen">
                <img src="${imagenPrincipal}" alt="${nombre}" loading="lazy">
                ${descuento ? `<span class="producto-badge">-${descuento}%</span>` : ''}
                ${stock <= 5 && stock > 0 ? `<span class="badge-stock low-stock">Últimas ${stock}</span>` : ''}
                ${stock === 0 ? `<span class="badge-stock out-of-stock">Agotado</span>` : ''}
                ${galleryArrowsHtml}
                ${galleryDotsHtml}
                <div class="quick-actions">
                    <button class="quick-btn cart" onclick="event.stopPropagation(); agregarAlCarrito('${productId}')" aria-label="Agregar al carrito" ${stock === 0 ? 'disabled' : ''}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                        </svg>
                    </button>
                    <button class="quick-btn wishlist" onclick="event.stopPropagation(); toggleWishlistCard(this, '${productId}')" aria-label="Favoritos">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="producto-info">
                ${marca ? `<span class="producto-marca">${marca}</span>` : ''}
                <span class="producto-categoria">${categoria}</span>
                <h3 class="producto-nombre">${nombre}</h3>
                ${descripcionCorta ? `<p class="producto-descripcion">${descripcionCorta}</p>` : ''}
                ${rating > 0 ? `
                    <div class="producto-rating">
                        <div class="stars">${starsHtml}</div>
                        <span class="rating-text">${rating.toFixed(1)} (${reviews})</span>
                    </div>
                ` : ''}
                <div class="producto-precio">
                    ${precioOriginal ? `<span class="precio-original">$${formatearPrecio(precioOriginal)}</span>` : ''}
                    <span class="precio-actual">$${formatearPrecio(precio)}</span>
                </div>
            </div>
        </article>
    `;
}

/**
 * Cambiar imagen en galería de card
 */
function cambiarImagenGaleria(btn, direction) {
    const card = btn.closest('.producto-card');
    const images = JSON.parse(card.dataset.images);
    let currentIndex = parseInt(card.dataset.currentImage) || 0;

    currentIndex += direction;
    if (currentIndex < 0) currentIndex = images.length - 1;
    if (currentIndex >= images.length) currentIndex = 0;

    card.dataset.currentImage = currentIndex;

    // Update image
    const img = card.querySelector('.producto-imagen img');
    img.style.opacity = '0';
    setTimeout(() => {
        img.src = images[currentIndex];
        img.style.opacity = '1';
    }, 150);

    // Update dots
    card.querySelectorAll('.gallery-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
    });
}

// Event delegation for gallery dots
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('gallery-dot')) {
        e.stopPropagation();
        const card = e.target.closest('.producto-card');
        const images = JSON.parse(card.dataset.images);
        const index = parseInt(e.target.dataset.index);

        card.dataset.currentImage = index;

        const img = card.querySelector('.producto-imagen img');
        img.style.opacity = '0';
        setTimeout(() => {
            img.src = images[index];
            img.style.opacity = '1';
        }, 150);

        card.querySelectorAll('.gallery-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }
});

/**
 * Get stock status
 */
function getStockStatus(stock) {
    if (stock === 0) return { text: 'Agotado', class: 'out-of-stock' };
    if (stock <= 5) return { text: `Últimas ${stock}`, class: 'low-stock' };
    return { text: 'Disponible', class: 'in-stock' };
}

/**
 * Render rating stars
 */
function renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<span class="star ${i <= Math.round(rating) ? 'active' : ''}">★</span>`;
    }
    return stars;
}

/**
 * Toggle wishlist from card
 */
function toggleWishlistCard(btn, productId) {
    // Find the product data
    const producto = estadoProductos.productos.find(p =>
        (p.id || p.product_id) === productId ||
        (p.id || p.product_id) === String(productId)
    );

    if (!producto) {
        console.warn('Producto no encontrado:', productId);
        return;
    }

    // Use the global wishlist object if available
    if (typeof wishlist !== 'undefined' && wishlist.toggle) {
        const wasAdded = wishlist.toggle(producto);
        btn.classList.toggle('active', wishlist.isInWishlist(productId));

        if (btn.classList.contains('active')) {
            showNotification('Agregado a favoritos', 'success');
        } else {
            showNotification('Eliminado de favoritos', 'info');
        }
    } else {
        // Fallback: toggle class and use localStorage directly
        btn.classList.toggle('active');
        let wishlistItems = JSON.parse(localStorage.getItem('wishlist') || '[]');

        if (btn.classList.contains('active')) {
            // Add full product object
            const exists = wishlistItems.some(item => item.id === productId);
            if (!exists) {
                wishlistItems.push({
                    id: productId,
                    nombre: producto.nombre || producto.name,
                    precio: producto.precio || producto.price,
                    imagen: producto.imagen || producto.image || producto.image_url,
                    marca: producto.marca || producto.brand
                });
            }
            showNotification('Agregado a favoritos', 'success');
        } else {
            wishlistItems = wishlistItems.filter(item => item.id !== productId);
            showNotification('Eliminado de favoritos', 'info');
        }

        localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
    }
}

/**
 * Aplicar filtros
 */
function aplicarFiltros(elements) {
    renderizarProductos(elements);
}

/**
 * Ordenar y renderizar
 */
function ordenarYRenderizar(elements) {
    renderizarProductos(elements);
}

/**
 * Limpiar filtros
 */
function limpiarFiltros(elements) {
    estadoProductos.filtros = {
        categoria: '',
        precioMin: '',
        precioMax: '',
        stock: '',
        busqueda: ''
    };

    elements.filterCategory.value = '';
    elements.priceMin.value = '';
    elements.priceMax.value = '';
    elements.filterStock.value = '';
    elements.searchProducts.value = '';
    elements.searchClearBtn.style.display = 'none';

    renderizarProductos(elements);
}

/**
 * Cambiar vista (grid/list)
 */
function cambiarVista(vista, elements) {
    estadoProductos.vista = vista;

    elements.viewBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === vista);
    });

    elements.productosGrid.classList.remove('view-grid', 'view-list');
    elements.productosGrid.classList.add(`view-${vista}`);
}

/**
 * Contar filtros activos
 */
function contarFiltrosActivos() {
    let count = 0;
    const { categoria, precioMin, precioMax, stock, busqueda } = estadoProductos.filtros;

    if (categoria) count++;
    if (precioMin) count++;
    if (precioMax) count++;
    if (stock) count++;
    if (busqueda) count++;

    return count;
}

/**
 * Cargar categorías dinámicamente
 */
function cargarCategorias(elements) {
    // Category tree is now static in HTML, but we can update counts if needed
    const categorias = [...new Set(estadoProductos.productos.map(p => p.categoria || p.category || 'General'))];

    // Update category tree links if they exist
    if (elements.categoryTree) {
        // Update active state based on current filter
        const currentCategory = estadoProductos.filtros.categoria;
        elements.categoryTree.querySelectorAll('a').forEach(link => {
            if (link.dataset.category === currentCategory) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
}

/**
 * Leer parámetros de URL
 */
function leerParametrosURL(elements) {
    const params = new URLSearchParams(window.location.search);

    if (params.has('busqueda')) {
        const busqueda = params.get('busqueda');
        if (elements.searchProducts) {
            elements.searchProducts.value = busqueda;
        }
        estadoProductos.filtros.busqueda = busqueda;
        if (elements.searchClearBtn) {
            elements.searchClearBtn.style.display = 'block';
        }
    }

    if (params.has('categoria')) {
        const categoria = params.get('categoria');
        estadoProductos.filtros.categoria = categoria;
        // Update category tree active state
        if (elements.categoryTree) {
            elements.categoryTree.querySelectorAll('a').forEach(link => {
                if (link.dataset.category === categoria) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        }
    }
}

/**
 * Formatear precio
 */
function formatearPrecio(precio) {
    return new Intl.NumberFormat('es-CL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(precio);
}

/**
 * Agregar al carrito (global para onclick)
 */
function agregarAlCarrito(productoId) {
    // Buscar el producto en el estado actual
    let producto = null;

    if (estadoProductos && estadoProductos.productos) {
        producto = estadoProductos.productos.find(p => p.id === productoId);
    }

    // Si no está en estado, buscar en mock
    if (!producto) {
        const mockProducts = generarProductosMock();
        producto = mockProducts.find(p => p.id === productoId);
    }

    if (producto && typeof cart !== 'undefined' && cart.add) {
        cart.add(producto, 1);
    } else {
        console.log('Agregar al carrito:', productoId);
        showNotification('Producto agregado al carrito');
    }
}

/**
 * Toggle wishlist desde card de producto
 */
function toggleWishlistCard(button, productoId) {
    // Buscar producto en estado
    let producto = estadoProductos.productos.find(p =>
        (p.id === productoId || p.product_id === productoId)
    );

    // Si no está en estado, buscar en mock
    if (!producto) {
        const mockProducts = generarProductosMock();
        producto = mockProducts.find(p => p.id === productoId);
    }

    if (producto && typeof wishlist !== 'undefined' && wishlist.toggle) {
        const wasAdded = wishlist.toggle(producto);

        // Update button visual
        button.classList.toggle('active', wasAdded);
        const svg = button.querySelector('svg');
        if (svg) {
            svg.setAttribute('fill', wasAdded ? 'currentColor' : 'none');
        }

        // Show notification
        if (typeof showWishlistNotification === 'function') {
            showWishlistNotification(wasAdded ? 'Agregado a favoritos' : 'Eliminado de favoritos');
        }
    }
}

/**
 * Generar productos mock para desarrollo
 * Incluye rating, reviews e imagenes[] para galería
 */
function generarProductosMock() {
    return [
        {
            id: 1,
            nombre: 'MacBook Pro 14"',
            marca: 'Apple',
            sku: 'LPT-001',
            precio: 1899000,
            precioOriginal: 2199000,
            descuento: 14,
            categoria: 'Electrónica',
            imagen: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop',
            imagenes: [
                'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop'
            ],
            stock: 10,
            rating: 4.9,
            reviews: 287,
            descripcion: 'MacBook Pro con chip M3 Pro, 18GB RAM y 512GB SSD. Pantalla Liquid Retina XDR de 14.2 pulgadas.',
            activo: true
        },
        {
            id: 2,
            nombre: 'Camiseta Algodón Premium',
            marca: 'UrbanStyle',
            sku: 'CAM-002',
            precio: 25000,
            precioOriginal: 35000,
            descuento: 29,
            categoria: 'Ropa',
            imagen: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop',
            imagenes: [
                'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1618354691551-44de113f0164?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&h=800&fit=crop'
            ],
            stock: 25,
            rating: 4.5,
            reviews: 156,
            descripcion: 'Camiseta 100% algodón orgánico certificado. Disponible en 8 colores. Corte regular fit.',
            activo: true
        },
        {
            id: 3,
            nombre: 'Lámpara LED Moderna',
            marca: 'LumiHome',
            sku: 'LAM-003',
            precio: 45000,
            categoria: 'Hogar',
            imagen: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&h=600&fit=crop',
            imagenes: [
                'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=800&h=800&fit=crop'
            ],
            stock: 15,
            rating: 4.3,
            reviews: 89,
            descripcion: 'Lámpara de mesa con luz LED regulable en 3 tonos y control táctil. Diseño minimalista escandinavo.',
            activo: true
        },
        {
            id: 4,
            nombre: 'Nike Air Max 270',
            marca: 'Nike',
            sku: 'ZAP-004',
            precio: 119000,
            precioOriginal: 159000,
            descuento: 25,
            categoria: 'Deportes',
            imagen: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop',
            imagenes: [
                'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=800&fit=crop'
            ],
            stock: 8,
            rating: 4.8,
            reviews: 423,
            descripcion: 'Zapatillas con la unidad Air más grande jamás creada. Amortiguación revolucionaria para uso diario.',
            activo: true
        },
        {
            id: 5,
            nombre: 'Sony WH-1000XM5',
            marca: 'Sony',
            sku: 'AUD-005',
            precio: 289000,
            precioOriginal: 350000,
            descuento: 17,
            categoria: 'Electrónica',
            imagen: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
            imagenes: [
                'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=800&fit=crop'
            ],
            stock: 30,
            rating: 4.9,
            reviews: 512,
            descripcion: 'Audífonos inalámbricos con la mejor cancelación de ruido del mercado. 30 horas de batería.',
            activo: true
        },
        {
            id: 6,
            nombre: 'Jeans Levi\'s 501',
            marca: 'Levi\'s',
            sku: 'JEA-006',
            precio: 59000,
            precioOriginal: 79000,
            descuento: 25,
            categoria: 'Ropa',
            imagen: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=600&h=600&fit=crop',
            imagenes: [
                'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&h=800&fit=crop'
            ],
            stock: 20,
            rating: 4.6,
            reviews: 234,
            descripcion: 'El original 501. Corte recto icónico con botones. Tela denim 12.5 oz.',
            activo: true
        },
        {
            id: 7,
            nombre: 'Silla Ergonómica Herman Miller',
            marca: 'Herman Miller',
            sku: 'SIL-007',
            precio: 459000,
            categoria: 'Hogar',
            imagen: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&h=600&fit=crop',
            imagenes: [
                'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1505797149-35b7a5db97c2?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&h=800&fit=crop'
            ],
            stock: 3,
            rating: 4.9,
            reviews: 178,
            descripcion: 'Silla Aeron ergonómica con soporte lumbar PostureFit SL. Garantía 12 años.',
            activo: true
        },
        {
            id: 8,
            nombre: 'Balón Adidas Champions',
            marca: 'Adidas',
            sku: 'FUT-008',
            precio: 45000,
            categoria: 'Deportes',
            imagen: 'https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?w=600&h=600&fit=crop',
            imagenes: [
                'https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=800&fit=crop'
            ],
            stock: 50,
            rating: 4.4,
            reviews: 67,
            descripcion: 'Balón oficial UEFA Champions League. Tamaño 5, peso y rebote certificados.',
            activo: true
        },
        {
            id: 9,
            nombre: 'Apple Watch Ultra 2',
            marca: 'Apple',
            sku: 'SWT-009',
            precio: 799000,
            categoria: 'Electrónica',
            imagen: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop',
            imagenes: [
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&h=800&fit=crop'
            ],
            stock: 12,
            rating: 4.8,
            reviews: 356,
            descripcion: 'El Apple Watch más resistente. Caja de titanio, 36h batería, GPS de doble frecuencia.',
            activo: true
        },
        {
            id: 10,
            nombre: 'Parka North Face Thermoball',
            marca: 'The North Face',
            sku: 'CHA-010',
            precio: 189000,
            precioOriginal: 249000,
            descuento: 24,
            categoria: 'Ropa',
            imagen: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=600&fit=crop',
            imagenes: [
                'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=800&fit=crop'
            ],
            stock: 7,
            rating: 4.7,
            reviews: 143,
            descripcion: 'Parka Thermoball Eco con aislamiento sintético reciclado. Resistente al agua.',
            activo: true
        },
        {
            id: 11,
            nombre: 'Set Arte Abstracto',
            marca: 'ArtDecó',
            sku: 'DEC-011',
            precio: 75000,
            categoria: 'Hogar',
            imagen: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&h=600&fit=crop',
            imagenes: [
                'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=800&fit=crop'
            ],
            stock: 0,
            rating: 4.2,
            reviews: 45,
            descripcion: 'Set de 3 cuadros abstractos modernos 40x60cm. Marco de madera natural.',
            activo: true
        },
        {
            id: 12,
            nombre: 'Mochila Patagonia 28L',
            marca: 'Patagonia',
            sku: 'MOC-012',
            precio: 89000,
            categoria: 'Deportes',
            imagen: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop',
            imagenes: [
                'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800&h=800&fit=crop'
            ],
            stock: 18,
            rating: 4.6,
            reviews: 198,
            descripcion: 'Mochila Refugio Pack 28L hecha con materiales 100% reciclados. Resistente al agua.',
            activo: true
        }
    ];
}

/**
 * Mostrar notificación
 */
function showNotification(mensaje) {
    // Implementación simple de notificación
    const notif = document.createElement('div');
    notif.textContent = mensaje;
    notif.style.cssText = 'position:fixed;top:20px;right:20px;background:#29A937;color:white;padding:16px 24px;border-radius:8px;z-index:10000;animation:slideIn 0.3s ease-out';
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}
