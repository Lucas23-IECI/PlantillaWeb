/**
 * Admin Panel - Products Module
 */

const AdminProductos = (function() {
    'use strict';

    let products = [];
    let filteredProducts = [];
    let currentView = 'grid'; // grid, list, table
    let currentPage = 1;
    const perPage = 12;

    async function load(container) {
        container.innerHTML = `
            <div class="admin-page-header">
                <div class="page-title-group">
                    <h1 class="page-title">Productos</h1>
                    <p class="page-description">Gestiona el catálogo de productos</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-primary" onclick="AdminProductos.createProduct()">
                        ${AdminUtils.Icons.plus}
                        Nuevo producto
                    </button>
                </div>
            </div>

            <div class="admin-content">
                <div class="filters-bar">
                    <div class="search-input-wrapper">
                        ${AdminUtils.Icons.search}
                        <input type="text" placeholder="Buscar producto..." id="productSearch" onkeyup="AdminProductos.search(this.value)">
                    </div>
                    <select class="filter-select" id="categoryFilter" onchange="AdminProductos.filterByCategory(this.value)">
                        <option value="">Todas las categorías</option>
                    </select>
                    <select class="filter-select" id="stockFilter" onchange="AdminProductos.filterByStock(this.value)">
                        <option value="">Todo el stock</option>
                        <option value="instock">En stock</option>
                        <option value="low">Stock bajo (&lt;10)</option>
                        <option value="out">Sin stock</option>
                    </select>
                    <div class="filters-right">
                        <div class="view-toggle">
                            <button class="view-toggle-btn ${currentView === 'grid' ? 'active' : ''}" onclick="AdminProductos.setView('grid')" title="Vista cuadrícula">
                                ${AdminUtils.Icons.grid}
                            </button>
                            <button class="view-toggle-btn ${currentView === 'list' ? 'active' : ''}" onclick="AdminProductos.setView('list')" title="Vista lista">
                                ${AdminUtils.Icons.list}
                            </button>
                            <button class="view-toggle-btn ${currentView === 'table' ? 'active' : ''}" onclick="AdminProductos.setView('table')" title="Vista tabla">
                                ${AdminUtils.Icons.table}
                            </button>
                        </div>
                        <button class="btn btn-ghost" onclick="AdminProductos.refresh()">
                            ${AdminUtils.Icons.refresh}
                        </button>
                    </div>
                </div>

                <div id="productsContainer">
                    <div class="products-grid">
                        ${[1,2,3,4,5,6].map(() => `
                            <div class="product-card">
                                <div class="skeleton skeleton-image"></div>
                                <div class="card-body">
                                    <div class="skeleton skeleton-title"></div>
                                    <div class="skeleton skeleton-text"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div id="productsPagination" style="margin-top:16px;"></div>
            </div>
        `;

        await loadProducts();
    }

    async function loadProducts() {
        try {
            const response = await api.getAdminProducts();
            const rawProducts = response.products || response || [];
            // Normalize product IDs: backend returns product_id, frontend uses id
            products = rawProducts.map(p => ({
                ...p,
                id: p.id || p._id || p.product_id,
                // Ensure image_url is available (backwards compatibility)
                image_url: p.image_url || p.image || ''
            }));
            filteredProducts = [...products];
            populateCategories();
            render();
        } catch (error) {
            console.error('Error loading products:', error);
            products = getMockProducts();
            filteredProducts = [...products];
            populateCategories();
            render();
        }
    }

    function populateCategories() {
        const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
        const select = document.getElementById('categoryFilter');
        if (select) {
            select.innerHTML = `
                <option value="">Todas las categorías</option>
                ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
            `;
        }
    }

    function render() {
        const container = document.getElementById('productsContainer');
        const pagination = document.getElementById('productsPagination');

        if (filteredProducts.length === 0) {
            container.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <div class="empty-state">
                            <div class="empty-state-icon">${AdminUtils.Icons.package}</div>
                            <h3 class="empty-state-title">Sin productos</h3>
                            <p class="empty-state-message">No se encontraron productos con los filtros seleccionados</p>
                            <button class="btn btn-primary" onclick="AdminProductos.createProduct()">
                                ${AdminUtils.Icons.plus} Crear producto
                            </button>
                        </div>
                    </div>
                </div>
            `;
            pagination.innerHTML = '';
            return;
        }

        const totalPages = Math.ceil(filteredProducts.length / perPage);
        const start = (currentPage - 1) * perPage;
        const pageProducts = filteredProducts.slice(start, start + perPage);

        if (currentView === 'grid') {
            container.innerHTML = renderGrid(pageProducts);
        } else if (currentView === 'list') {
            container.innerHTML = renderList(pageProducts);
        } else {
            container.innerHTML = renderTable(pageProducts);
        }

        pagination.innerHTML = AdminUtils.renderPagination({
            currentPage,
            totalPages,
            totalItems: filteredProducts.length
        });

        AdminUtils.bindPagination(pagination, (page) => {
            currentPage = page;
            render();
        });
    }

    function renderGrid(items) {
        return `
            <div class="products-grid">
                ${items.map(product => `
                    <div class="product-card">
                        <div class="product-card-image">
                            ${product.image_url ? 
                                `<img src="${product.image_url}" alt="${product.name}" loading="lazy">` :
                                `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--admin-text-muted);">${AdminUtils.Icons.package}</div>`
                            }
                            <div class="product-card-badges">
                                ${product.stock <= 0 ? '<span class="badge badge-danger">Sin stock</span>' : ''}
                                ${product.stock > 0 && product.stock < 10 ? '<span class="badge badge-warning">Stock bajo</span>' : ''}
                                ${product.featured ? '<span class="badge badge-primary">Destacado</span>' : ''}
                            </div>
                            <div class="product-card-actions">
                                <button class="btn btn-outline btn-icon" onclick="AdminProductos.editProduct('${product.id || product._id}')" title="Editar">
                                    ${AdminUtils.Icons.edit}
                                </button>
                                <button class="btn btn-outline btn-icon" onclick="AdminProductos.deleteProduct('${product.id || product._id}')" title="Eliminar">
                                    ${AdminUtils.Icons.trash}
                                </button>
                            </div>
                        </div>
                        <div class="product-card-body">
                            <h4 class="product-card-name">${product.name}</h4>
                            <p class="product-card-category">${product.category || 'Sin categoría'}</p>
                            <div class="product-card-price">
                                <span class="current">${AdminUtils.formatCurrency(product.price)}</span>
                                ${product.originalPrice ? `<span class="original">${AdminUtils.formatCurrency(product.originalPrice)}</span>` : ''}
                            </div>
                            <div class="product-card-stock ${product.stock < 10 ? 'low' : ''}">
                                Stock: ${product.stock || 0} unidades
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderList(items) {
        return `
            <div class="products-list">
                ${items.map(product => `
                    <div class="product-list-item">
                        <div class="product-list-image">
                            ${product.image_url ? 
                                `<img src="${product.image_url}" alt="${product.name}">` :
                                `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--admin-text-muted);">${AdminUtils.Icons.package}</div>`
                            }
                        </div>
                        <div class="product-list-info">
                            <h4 class="product-list-name">${product.name}</h4>
                            <p class="product-list-meta">${product.category || 'Sin categoría'} • SKU: ${product.sku || 'N/A'}</p>
                        </div>
                        <div class="product-list-price">${AdminUtils.formatCurrency(product.price)}</div>
                        <div class="product-list-stock">
                            <span class="badge ${product.stock > 10 ? 'badge-success' : product.stock > 0 ? 'badge-warning' : 'badge-danger'}">
                                ${product.stock || 0}
                            </span>
                        </div>
                        <div class="product-list-actions">
                            <button class="btn btn-ghost btn-icon btn-sm" onclick="AdminProductos.editProduct('${product.id || product._id}')" title="Editar">
                                ${AdminUtils.Icons.edit}
                            </button>
                            <button class="btn btn-ghost btn-icon btn-sm" onclick="AdminProductos.deleteProduct('${product.id || product._id}')" title="Eliminar">
                                ${AdminUtils.Icons.trash}
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderTable(items) {
        return `
            <div class="card">
                <div class="card-body no-padding">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th style="width:60px;">Imagen</th>
                                    <th>Nombre</th>
                                    <th>Categoría</th>
                                    <th>Precio</th>
                                    <th>Stock</th>
                                    <th>Estado</th>
                                    <th style="width:100px;">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map(product => `
                                    <tr>
                                        <td>
                                            <div style="width:40px;height:40px;border-radius:6px;overflow:hidden;background:var(--admin-bg-muted);">
                                                ${product.image_url ? 
                                                    `<img src="${product.image_url}" alt="" style="width:100%;height:100%;object-fit:cover;">` :
                                                    `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--admin-text-muted);">${AdminUtils.Icons.package}</div>`
                                                }
                                            </div>
                                        </td>
                                        <td><strong>${product.name}</strong></td>
                                        <td>${product.category || '-'}</td>
                                        <td>${AdminUtils.formatCurrency(product.price)}</td>
                                        <td>
                                            <span class="badge ${product.stock > 10 ? 'badge-success' : product.stock > 0 ? 'badge-warning' : 'badge-danger'}">
                                                ${product.stock || 0}
                                            </span>
                                        </td>
                                        <td>${AdminUtils.getStatusBadge(product.active !== false ? 'active' : 'inactive')}</td>
                                        <td>
                                            <div class="d-flex gap-1">
                                                <button class="btn btn-ghost btn-icon btn-sm" onclick="AdminProductos.editProduct('${product.id || product._id}')" title="Editar">
                                                    ${AdminUtils.Icons.edit}
                                                </button>
                                                <button class="btn btn-ghost btn-icon btn-sm" onclick="AdminProductos.deleteProduct('${product.id || product._id}')" title="Eliminar">
                                                    ${AdminUtils.Icons.trash}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    function setView(view) {
        currentView = view;
        document.querySelectorAll('.view-toggle-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.view-toggle-btn[onclick*="${view}"]`)?.classList.add('active');
        render();
    }

    function search(query) {
        const q = query.toLowerCase().trim();
        if (!q) {
            filteredProducts = [...products];
        } else {
            filteredProducts = products.filter(p => 
                p.name.toLowerCase().includes(q) ||
                (p.category || '').toLowerCase().includes(q) ||
                (p.sku || '').toLowerCase().includes(q)
            );
        }
        currentPage = 1;
        render();
    }

    function filterByCategory(category) {
        applyFilters();
    }

    function filterByStock(stock) {
        applyFilters();
    }

    function applyFilters() {
        const category = document.getElementById('categoryFilter')?.value;
        const stock = document.getElementById('stockFilter')?.value;
        const search = document.getElementById('productSearch')?.value.toLowerCase().trim();

        filteredProducts = products.filter(p => {
            if (category && p.category !== category) return false;
            if (stock === 'instock' && p.stock <= 0) return false;
            if (stock === 'low' && (p.stock > 10 || p.stock <= 0)) return false;
            if (stock === 'out' && p.stock > 0) return false;
            if (search && !p.name.toLowerCase().includes(search)) return false;
            return true;
        });

        currentPage = 1;
        render();
    }

    function createProduct() {
        openProductModal();
    }

    function editProduct(productId) {
        const product = products.find(p => (p.id || p._id) == productId);
        if (product) {
            openProductModal(product);
        }
    }

    function openProductModal(product = null) {
        const isEdit = !!product;
        const title = isEdit ? 'Editar producto' : 'Nuevo producto';

        const body = `
            <form id="productForm" class="fade-in">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label required">Nombre</label>
                        <input type="text" class="form-input" name="name" value="${product?.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">SKU</label>
                        <input type="text" class="form-input" name="sku" value="${product?.sku || ''}">
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Descripción</label>
                    <textarea class="form-textarea" name="description" rows="3">${product?.description || ''}</textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label required">Precio</label>
                        <input type="number" class="form-input" name="price" value="${product?.price || ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Precio original</label>
                        <input type="number" class="form-input" name="originalPrice" value="${product?.originalPrice || ''}">
                        <span class="form-hint">Para mostrar descuento</span>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label required">Stock</label>
                        <input type="number" class="form-input" name="stock" value="${product?.stock || 0}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Categoría</label>
                        <input type="text" class="form-input" name="category" value="${product?.category || ''}" list="categoryList">
                        <datalist id="categoryList">
                            ${[...new Set(products.map(p => p.category).filter(Boolean))].map(c => `<option value="${c}">`).join('')}
                        </datalist>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">URL de imagen</label>
                    <input type="url" class="form-input" name="image_url" value="${product?.image_url || ''}" placeholder="https://...">
                    ${product?.image_url ? `<div style="margin-top:8px;"><img src="${product.image_url}" alt="Preview" style="max-width:120px;max-height:80px;border-radius:6px;border:1px solid var(--admin-border);"></div>` : ''}
                </div>

                <div class="form-row">
                    <label class="form-checkbox">
                        <input type="checkbox" name="active" ${product?.active !== false ? 'checked' : ''}>
                        Producto activo
                    </label>
                    <label class="form-checkbox">
                        <input type="checkbox" name="featured" ${product?.featured ? 'checked' : ''}>
                        Producto destacado
                    </label>
                    <label class="form-checkbox">
                        <input type="checkbox" name="hasVariants" id="hasVariantsCheck" ${product?.variants?.length > 0 ? 'checked' : ''} onchange="AdminProductos.toggleVariantsSection()">
                        Tiene variantes
                    </label>
                </div>

                <!-- Variants Section -->
                <div id="variantsSection" style="display: ${product?.variants?.length > 0 ? 'block' : 'none'}; margin-top: var(--spacing-lg); padding-top: var(--spacing-lg); border-top: 1px solid var(--admin-border);">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--spacing-md);">
                        <label class="form-label" style="margin-bottom: 0;">Variantes del producto</label>
                        <button type="button" class="btn btn-outline btn-sm" onclick="AdminProductos.addVariantRow()">
                            ${AdminUtils.Icons.plus} Agregar variante
                        </button>
                    </div>
                    <div id="variantsList">
                        ${(product?.variants || []).map((v, i) => renderVariantRow(v, i)).join('') || renderVariantRow(null, 0)}
                    </div>
                    <p class="form-hint">Define opciones como: Talla S, Rojo, etc. Cada variante tiene su propio SKU, precio y stock.</p>
                </div>
            </form>
        `;

        AdminUtils.openModal({
            title,
            body,
            size: 'lg',
            footer: `
                <button class="btn btn-outline" onclick="AdminUtils.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="AdminProductos.saveProduct('${product?.id || product?._id || ''}')">
                    ${isEdit ? 'Guardar cambios' : 'Crear producto'}
                </button>
            `
        });
    }

    async function saveProduct(productId) {
        const form = document.getElementById('productForm');
        if (!form) return;

        const formData = new FormData(form);
        const hasVariants = form.querySelector('[name="hasVariants"]')?.checked || false;
        
        const data = {
            name: formData.get('name'),
            sku: formData.get('sku'),
            description: formData.get('description'),
            price: parseFloat(formData.get('price')) || 0,
            originalPrice: parseFloat(formData.get('originalPrice')) || null,
            stock: parseInt(formData.get('stock')) || 0,
            category: formData.get('category'),
            image_url: formData.get('image_url'),
            active: form.querySelector('[name="active"]').checked,
            featured: form.querySelector('[name="featured"]').checked,
            variants: hasVariants ? collectVariants() : []
        };

        if (!data.name || !data.price) {
            AdminUtils.showToast('error', 'Nombre y precio son obligatorios');
            return;
        }

        try {
            if (productId) {
                await api.adminUpdateProduct(productId, data);
                AdminUtils.showToast('success', 'Producto actualizado');
            } else {
                await api.adminCreateProduct(data);
                AdminUtils.showToast('success', 'Producto creado');
            }
            AdminUtils.closeModal();
            await loadProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            AdminUtils.showToast('error', error.message || 'Error al guardar producto');
        }
    }

    async function deleteProduct(productId) {
        const product = products.find(p => (p.id || p._id) == productId);
        if (!product) return;

        const confirmed = await AdminUtils.confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`, 'Eliminar producto');
        if (!confirmed) return;

        try {
            await api.adminDeleteProduct(productId);
            AdminUtils.showToast('success', 'Producto eliminado');
            await loadProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            AdminUtils.showToast('error', error.message || 'Error al eliminar producto');
        }
    }

    async function refresh() {
        document.getElementById('productSearch').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('stockFilter').value = '';
        currentPage = 1;
        await loadProducts();
        AdminUtils.showToast('success', 'Productos actualizados');
    }

    // ==========================================
    // VARIANTS MANAGEMENT
    // ==========================================
    
    let variantCounter = 0;

    function toggleVariantsSection() {
        const checkbox = document.getElementById('hasVariantsCheck');
        const section = document.getElementById('variantsSection');
        if (checkbox && section) {
            section.style.display = checkbox.checked ? 'block' : 'none';
        }
    }

    function renderVariantRow(variant = null, index = 0) {
        const id = variant?.id || `new_${variantCounter++}`;
        return `
            <div class="variant-row" data-variant-id="${id}" style="display: grid; grid-template-columns: 1fr 100px 100px 80px 40px; gap: var(--spacing-sm); margin-bottom: var(--spacing-sm); align-items: end;">
                <div class="form-group" style="margin-bottom: 0;">
                    ${index === 0 ? '<label class="form-label" style="font-size:11px;">Nombre (ej: Talla M, Color Rojo)</label>' : ''}
                    <input type="text" class="form-input" name="variant_name_${id}" value="${variant?.name || ''}" placeholder="Nombre de variante">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    ${index === 0 ? '<label class="form-label" style="font-size:11px;">SKU</label>' : ''}
                    <input type="text" class="form-input" name="variant_sku_${id}" value="${variant?.sku || ''}" placeholder="SKU">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    ${index === 0 ? '<label class="form-label" style="font-size:11px;">Precio +/-</label>' : ''}
                    <input type="number" class="form-input" name="variant_price_${id}" value="${variant?.priceModifier || 0}" placeholder="0">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    ${index === 0 ? '<label class="form-label" style="font-size:11px;">Stock</label>' : ''}
                    <input type="number" class="form-input" name="variant_stock_${id}" value="${variant?.stock || 0}" placeholder="0">
                </div>
                <button type="button" class="btn btn-ghost btn-icon btn-sm" onclick="AdminProductos.removeVariantRow('${id}')" title="Eliminar" style="${index === 0 ? 'margin-top: 18px;' : ''}">
                    ${AdminUtils.Icons.trash}
                </button>
            </div>
        `;
    }

    function addVariantRow() {
        const container = document.getElementById('variantsList');
        if (!container) return;
        
        const existingRows = container.querySelectorAll('.variant-row').length;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = renderVariantRow(null, existingRows);
        container.appendChild(tempDiv.firstElementChild);
    }

    function removeVariantRow(variantId) {
        const row = document.querySelector(`.variant-row[data-variant-id="${variantId}"]`);
        if (row) {
            row.remove();
        }
    }

    function collectVariants() {
        const variants = [];
        const rows = document.querySelectorAll('.variant-row');
        
        rows.forEach(row => {
            const id = row.dataset.variantId;
            const name = row.querySelector(`[name="variant_name_${id}"]`)?.value;
            const sku = row.querySelector(`[name="variant_sku_${id}"]`)?.value;
            const priceModifier = parseFloat(row.querySelector(`[name="variant_price_${id}"]`)?.value) || 0;
            const stock = parseInt(row.querySelector(`[name="variant_stock_${id}"]`)?.value) || 0;
            
            if (name) {
                variants.push({
                    id: id.startsWith('new_') ? undefined : id,
                    name,
                    sku,
                    priceModifier,
                    stock
                });
            }
        });
        
        return variants;
    }

    function getMockProducts() {
        return [
            { id: '1', name: 'Producto Premium', category: 'Categoría 1', price: 99990, stock: 25, image_url: '', active: true, featured: true },
            { id: '2', name: 'Producto Básico', category: 'Categoría 1', price: 29990, stock: 50, image_url: '', active: true },
            { id: '3', name: 'Producto Especial', category: 'Categoría 2', price: 149990, stock: 8, image_url: '', active: true },
            { id: '4', name: 'Camiseta con Variantes', category: 'Categoría 2', price: 19990, stock: 0, image_url: '', active: true, variants: [
                { id: 'v1', name: 'Talla S', sku: 'CAM-S', priceModifier: 0, stock: 10 },
                { id: 'v2', name: 'Talla M', sku: 'CAM-M', priceModifier: 0, stock: 15 },
                { id: 'v3', name: 'Talla L', sku: 'CAM-L', priceModifier: 2000, stock: 8 }
            ]},
            { id: '5', name: 'Producto Classic', category: 'Categoría 3', price: 39990, stock: 100, image_url: '', active: false },
            { id: '6', name: 'Producto Edición Limitada', category: 'Categoría 1', price: 199990, stock: 3, image_url: '', active: true, featured: true }
        ];
    }

    return {
        load,
        setView,
        search,
        filterByCategory,
        filterByStock,
        createProduct,
        editProduct,
        saveProduct,
        deleteProduct,
        refresh,
        // Variants
        toggleVariantsSection,
        addVariantRow,
        removeVariantRow
    };

})();
