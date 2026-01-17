document.addEventListener('DOMContentLoaded', function () {
    initProductsPage();
});
let estadoProductos = {
    productos: [],
    filtros: {
        categoria: '',
        precioMin: '',
        precioMax: '',
        stock: '',
        busqueda: '',
        marcas: []
    },
    orden: '',
    vista: 'grid', // 'grid' o 'list'
    paginaActual: 1,
    productosPorPagina: 12,
    cargado: false
};
const productosCache = new Map();
let prefetchQueue = [];
let isLoadingProducts = false;

function initProductsPage() {
    const productosGrid = document.getElementById('productosGrid');
    if (!productosGrid) {
        return;
    }
    const elements = {
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
        searchProducts: document.getElementById('searchProducts'),
        searchClearBtn: document.getElementById('searchClearBtn'),
        viewBtns: document.querySelectorAll('.view-btn'),
        sortBy: document.getElementById('sortBy'),
        productosGrid: document.getElementById('productosGrid'),
        productosCount: document.getElementById('productosCount'),
        filterCount: document.getElementById('filterCount')
    };
    const filtersOverlay = document.getElementById('filtersOverlay');

    elements.toggleFilters?.addEventListener('click', () => {
        elements.filtersSidebar?.classList.toggle('show');
        filtersOverlay?.classList.toggle('show');
    });

    elements.filtersCloseBtn?.addEventListener('click', () => {
        elements.filtersSidebar?.classList.remove('show');
        filtersOverlay?.classList.remove('show');
    });
    filtersOverlay?.addEventListener('click', () => {
        elements.filtersSidebar?.classList.remove('show');
        filtersOverlay?.classList.remove('show');
    });
    elements.clearFilters?.addEventListener('click', () => {
        limpiarFiltros(elements);
    });
    elements.categoryTree?.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = link.dataset.category;
            estadoProductos.filtros.categoria = category;
            elements.categoryTree.querySelectorAll('a').forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            aplicarFiltros(elements);
        });
    });
    elements.stockOptions?.forEach(radio => {
        radio.addEventListener('change', (e) => {
            estadoProductos.filtros.stock = e.target.value;
            aplicarFiltros(elements);
        });
    });
    elements.clearAllFilters?.addEventListener('click', () => {
        limpiarFiltros(elements);
    });
    elements.applyFilters?.addEventListener('click', () => {
        aplicarFiltros(elements);
    });
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
    elements.viewBtns?.forEach(btn => {
        btn.addEventListener('click', () => {
            const vista = btn.dataset.view;
            cambiarVista(vista, elements);
        });
    });
    elements.sortBy?.addEventListener('change', (e) => {
        estadoProductos.orden = e.target.value;
        ordenarYRenderizar(elements);
    });
    // Brand checkbox listeners - AUTO APPLY
    const brandCheckboxes = elements.brandList?.querySelectorAll("input[type=checkbox]");
    brandCheckboxes?.forEach(cb => {
        cb.addEventListener("change", () => {
            const marca = cb.value;
            if (cb.checked) {
                if (!estadoProductos.filtros.marcas.includes(marca)) {
                    estadoProductos.filtros.marcas.push(marca);
                }
            } else {
                estadoProductos.filtros.marcas = estadoProductos.filtros.marcas.filter(m => m !== marca);
            }
            aplicarFiltros(elements); // AUTO APPLY
        });
    });

    // Price Range Slider listeners - AUTO APPLY
    elements.priceRangeMin?.addEventListener('input', (e) => {
        const minVal = parseInt(e.target.value);
        const maxVal = parseInt(elements.priceRangeMax?.value || 5000000);
        // Prevent min from exceeding max
        if (minVal > maxVal - 10000) {
            e.target.value = maxVal - 10000;
        }
        estadoProductos.filtros.precioMin = e.target.value;
        if (elements.priceMinDisplay) {
            elements.priceMinDisplay.textContent = formatPrice(parseInt(e.target.value) || 0);
        }
    });
    elements.priceRangeMin?.addEventListener('change', () => {
        aplicarFiltros(elements); // AUTO APPLY on release
    });

    elements.priceRangeMax?.addEventListener('input', (e) => {
        const maxVal = parseInt(e.target.value);
        const minVal = parseInt(elements.priceRangeMin?.value || 0);
        // Prevent max from going below min
        if (maxVal < minVal + 10000) {
            e.target.value = minVal + 10000;
        }
        estadoProductos.filtros.precioMax = e.target.value;
        if (elements.priceMaxDisplay) {
            elements.priceMaxDisplay.textContent = formatPrice(parseInt(e.target.value) || 5000000);
        }
    });
    elements.priceRangeMax?.addEventListener('change', () => {
        aplicarFiltros(elements); // AUTO APPLY on release
    });

    // Filter section collapse/expand toggle
    document.querySelectorAll('.filter-title[data-toggle]').forEach(title => {
        title.addEventListener('click', () => {
            const section = title.closest('.filter-section');
            section.classList.toggle('collapsed');
            const arrow = title.querySelector('svg');
            if (arrow) {
                arrow.style.transform = section.classList.contains('collapsed') ? 'rotate(-90deg)' : '';
            }
        });
    });

    // Brand search filter
    elements.brandSearch?.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const brandItems = elements.brandList?.querySelectorAll('li');
        brandItems?.forEach(item => {
            const label = item.querySelector('label');
            const brandText = label?.textContent.toLowerCase() || '';
            if (brandText.includes(searchTerm)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    });

    cargarProductos(elements);
    leerParametrosURL(elements);
}

async function cargarProductos(elements) {
    if (isLoadingProducts) return;
    isLoadingProducts = true;
    const skeletonCount = 12;
    elements.productosGrid.innerHTML = generarSkeletons(skeletonCount);
    requestAnimationFrame(async () => {
        let productos = [];
        try {
            if (typeof api !== 'undefined' && api.getProducts) {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 1000); // 1s timeout
                const response = await api.getProducts();
                clearTimeout(timeoutId);
                productos = response.products || response || [];
            }
        } catch (apiError) {
            console.warn('API Error loading products:', apiError.message);
            // Show error toast to user
            if (typeof showNotification === 'function') {
                showNotification('Error cargando productos del servidor', 'warning');
            }
        }
        if (!productos || productos.length === 0) {
            productos = generarProductosMock();
        }

        estadoProductos.productos = productos;
        estadoProductos.cargado = true;
        cargarCategorias(elements);
        requestAnimationFrame(() => {
            renderizarProductos(elements);
            isLoadingProducts = false;
        });
    });
}

function generarSkeletons(count) {
    let skeletons = '';
    for (let i = 0; i < count; i++) {
        skeletons += `
            <article class="producto-card skeleton-card">
                <div class="skeleton-imagen"></div>
                <div class="skeleton-info">
                    <div class="skeleton-text skeleton-categoria"></div>
                    <div class="skeleton-text skeleton-nombre"></div>
                    <div class="skeleton-text skeleton-precio"></div>
                </div>
            </article>
        `;
    }
    return skeletons;
}

// Normalize text: remove accents and lowercase
function normalizeText(str) {
    return (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function filtrarProductos() {
    let productosFiltrados = [...estadoProductos.productos];

    const { categoria, precioMin, precioMax, stock, busqueda } = estadoProductos.filtros;
    if (categoria) {
        productosFiltrados = productosFiltrados.filter(p =>
            normalizeText(p.categoria || p.category) === normalizeText(categoria)
        );
    }
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
    if (stock === 'in-stock') {
        productosFiltrados = productosFiltrados.filter(p =>
            (p.stock || p.quantity || 0) > 0
        );
    } else if (stock === 'out-of-stock') {
        productosFiltrados = productosFiltrados.filter(p =>
            (p.stock || p.quantity || 0) === 0
        );
    }
    if (busqueda) {
        const termino = busqueda.toLowerCase();
        productosFiltrados = productosFiltrados.filter(p => {
            const nombre = (p.nombre || p.name || '').toLowerCase();
            const categoria = (p.categoria || p.category || '').toLowerCase();
            const descripcion = (p.descripcion || p.description || '').toLowerCase();
            return nombre.includes(termino) || categoria.includes(termino) || descripcion.includes(termino);
        });
    }

    // Brand filtering
    const marcas = estadoProductos.filtros.marcas || [];
    if (marcas.length > 0) {
        productosFiltrados = productosFiltrados.filter(p =>
            marcas.some(m => (p.marca || p.brand || "").toLowerCase() === m.toLowerCase())
        );
    }
    return productosFiltrados;
}

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

function renderizarProductos(elements) {
    const productosFiltrados = filtrarProductos();
    const productosOrdenados = ordenarProductos(productosFiltrados);
    elements.productosCount.textContent = `${productosOrdenados.length} producto${productosOrdenados.length !== 1 ? 's' : ''} encontrado${productosOrdenados.length !== 1 ? 's' : ''}`;
    const filtrosActivos = contarFiltrosActivos();
    if (filtrosActivos > 0) {
        elements.filterCount.textContent = filtrosActivos;
        elements.filterCount.style.display = 'flex';
        elements.clearFilters.style.display = 'flex';
    } else {
        elements.filterCount.style.display = 'none';
        elements.clearFilters.style.display = 'none';
    }
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
    elements.productosGrid.querySelectorAll('.producto-card').forEach((card, index) => {
        card.addEventListener('click', () => {
            const producto = productosOrdenados[index];
            const productId = producto.id || producto.product_id;
            window.location.href = `producto.html?id=${productId}`;
        });
    });
}

function crearCardProducto(producto) {
    const productId = producto.id || producto.product_id;
    const nombre = producto.nombre || producto.name || 'Producto sin nombre';
    const precio = producto.precio || producto.price || 0;
    const precioOriginal = producto.precioOriginal || producto.original_price || producto.originalPrice;
    const categoria = producto.categoria || producto.category || 'General';
    const imagenPrincipal = producto.imagen || producto.image || producto.image_url || '../images/products/placeholder.png';
    const imagenes = producto.imagenes || producto.images || [imagenPrincipal];
    const descuento = producto.descuento || producto.discount ||
        (precioOriginal && precio < precioOriginal ? Math.round((1 - precio / precioOriginal) * 100) : 0);
    const stock = producto.stock || producto.quantity || 0;
    const marca = producto.marca || producto.brand || '';
    const descripcion = producto.descripcion || producto.description || '';
    const rating = producto.rating || 0;
    const reviews = producto.reviews || 0;
    const descripcionCorta = descripcion.length > 60
        ? descripcion.substring(0, 60) + '...'
        : descripcion;
    const stockStatus = getStockStatus(stock);
    const starsHtml = renderStars(rating);
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

function cambiarImagenGaleria(btn, direction) {
    const card = btn.closest('.producto-card');
    const images = JSON.parse(card.dataset.images);
    let currentIndex = parseInt(card.dataset.currentImage) || 0;

    currentIndex += direction;
    if (currentIndex < 0) currentIndex = images.length - 1;
    if (currentIndex >= images.length) currentIndex = 0;

    card.dataset.currentImage = currentIndex;
    const img = card.querySelector('.producto-imagen img');
    img.style.opacity = '0';
    setTimeout(() => {
        img.src = images[currentIndex];
        img.style.opacity = '1';
    }, 150);
    card.querySelectorAll('.gallery-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
    });
}
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

function getStockStatus(stock) {
    if (stock === 0) return { text: 'Agotado', class: 'out-of-stock' };
    if (stock <= 5) return { text: `Últimas ${stock}`, class: 'low-stock' };
    return { text: 'Disponible', class: 'in-stock' };
}

function renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<span class="star ${i <= Math.round(rating) ? 'active' : ''}">★</span>`;
    }
    return stars;
}

function toggleWishlistCard(btn, productId) {
    const producto = estadoProductos.productos.find(p =>
        (p.id || p.product_id) === productId ||
        (p.id || p.product_id) === String(productId)
    );

    if (!producto) {
        console.warn('Producto no encontrado:', productId);
        return;
    }
    if (typeof wishlist !== 'undefined' && wishlist.toggle) {
        const wasAdded = wishlist.toggle(producto);
        btn.classList.toggle('active', wishlist.isInWishlist(productId));

        if (btn.classList.contains('active')) {
            showNotification('Agregado a favoritos', 'success');
        } else {
            showNotification('Eliminado de favoritos', 'info');
        }
    } else {
        btn.classList.toggle('active');
        let wishlistItems = JSON.parse(localStorage.getItem('wishlist') || '[]');

        if (btn.classList.contains('active')) {
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

function aplicarFiltros(elements) {
    // Sync price sliders before filtering (use slider values, not text inputs)
    if (elements.priceRangeMin) estadoProductos.filtros.precioMin = elements.priceRangeMin.value;
    if (elements.priceRangeMax) estadoProductos.filtros.precioMax = elements.priceRangeMax.value;
    // Sync brand checkboxes before filtering
    const brandCheckboxes = elements.brandList?.querySelectorAll("input[type=checkbox]:checked");
    estadoProductos.filtros.marcas = [];
    brandCheckboxes?.forEach(cb => estadoProductos.filtros.marcas.push(cb.value));
    renderizarProductos(elements);
}

function ordenarYRenderizar(elements) {
    renderizarProductos(elements);
}

function limpiarFiltros(elements) {
    estadoProductos.filtros = {
        categoria: '',
        precioMin: '',
        precioMax: '',
        stock: '',
        busqueda: '',
        marcas: []
    };

    // Clear category tree
    if (elements.categoryTree) {
        elements.categoryTree.querySelectorAll('a').forEach(link => link.classList.remove('active'));
        const allCatLink = elements.categoryTree.querySelector('a[data-category=""]');
        if (allCatLink) allCatLink.classList.add('active');
    }
    // Reset price sliders to defaults
    if (elements.priceRangeMin) elements.priceRangeMin.value = 0;
    if (elements.priceRangeMax) elements.priceRangeMax.value = 5000000;
    if (elements.priceMinDisplay) elements.priceMinDisplay.textContent = '$0';
    if (elements.priceMaxDisplay) elements.priceMaxDisplay.textContent = '$5.000.000';
    // Clear brand checkboxes
    const brandCheckboxes = elements.brandList?.querySelectorAll("input[type=checkbox]");
    brandCheckboxes?.forEach(cb => { cb.checked = false; });
    // Clear stock radios
    if (elements.stockOptions) {
        elements.stockOptions.forEach(radio => { radio.checked = radio.value === ''; });
    }
    // Clear search
    if (elements.searchProducts) elements.searchProducts.value = '';
    if (elements.searchClearBtn) elements.searchClearBtn.style.display = 'none';

    renderizarProductos(elements);
}

function cambiarVista(vista, elements) {
    estadoProductos.vista = vista;

    elements.viewBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === vista);
    });

    elements.productosGrid.classList.remove('view-grid', 'view-list');
    elements.productosGrid.classList.add(`view-${vista}`);
}

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

function cargarCategorias(elements) {
    const categorias = [...new Set(estadoProductos.productos.map(p => p.categoria || p.category || 'General'))];
    if (elements.categoryTree) {
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

function formatearPrecio(precio) {
    return new Intl.NumberFormat('es-CL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(precio);
}

function agregarAlCarrito(productoId) {
    let producto = null;

    if (estadoProductos && estadoProductos.productos) {
        producto = estadoProductos.productos.find(p => p.id === productoId);
    }
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

function generarProductosMock() {
    // Mock data eliminado - usar productos reales desde Firebase
    return [];
}

function showNotification(mensaje) {
    const notif = document.createElement('div');
    notif.textContent = mensaje;
    notif.style.cssText = 'position:fixed;top:20px;right:20px;background:#29A937;color:white;padding:16px 24px;border-radius:8px;z-index:10000;animation:slideIn 0.3s ease-out';
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}
