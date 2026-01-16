/**
 * Admin Panel - Suppliers Module
 * Gestión de proveedores
 */

const AdminProveedores = (function() {
    'use strict';

    let suppliers = [];
    let currentPage = 1;
    const perPage = 10;

    async function load(container) {
        container.innerHTML = `
            <div class="admin-page-header">
                <div class="page-title-group">
                    <h1 class="page-title">Proveedores</h1>
                    <p class="page-description">Gestiona tus proveedores y sus productos</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-primary" onclick="AdminProveedores.createSupplier()">
                        ${AdminUtils.Icons.plus}
                        Nuevo proveedor
                    </button>
                </div>
            </div>

            <div class="admin-content">
                <div class="filters-bar">
                    <div class="search-input-wrapper">
                        ${AdminUtils.Icons.search}
                        <input type="text" placeholder="Buscar proveedor..." id="supplierSearch" onkeyup="AdminProveedores.search(this.value)">
                    </div>
                    <button class="btn btn-ghost" onclick="AdminProveedores.refresh()">
                        ${AdminUtils.Icons.refresh}
                    </button>
                </div>

                <div id="suppliersGrid" class="products-grid">
                    ${AdminUtils.renderSkeleton('card', 4)}
                </div>
                <div id="suppliersPagination" style="margin-top: var(--spacing-md);"></div>
            </div>
        `;

        await loadSuppliers();
    }

    async function loadSuppliers() {
        try {
            const response = await api.adminGetSuppliers?.() || { suppliers: getMockSuppliers() };
            suppliers = response.suppliers || response || getMockSuppliers();
            render();
        } catch (error) {
            console.error('Error loading suppliers:', error);
            suppliers = getMockSuppliers();
            render();
        }
    }

    function render() {
        const container = document.getElementById('suppliersGrid');
        const pagination = document.getElementById('suppliersPagination');

        if (suppliers.length === 0) {
            container.innerHTML = `
                <div class="card" style="grid-column: 1 / -1;">
                    <div class="card-body">
                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/>
                                </svg>
                            </div>
                            <h3 class="empty-state-title">Sin proveedores</h3>
                            <p class="empty-state-message">Agrega tu primer proveedor</p>
                            <button class="btn btn-primary" onclick="AdminProveedores.createSupplier()">
                                ${AdminUtils.Icons.plus} Agregar proveedor
                            </button>
                        </div>
                    </div>
                </div>
            `;
            pagination.innerHTML = '';
            return;
        }

        const totalPages = Math.ceil(suppliers.length / perPage);
        const start = (currentPage - 1) * perPage;
        const pageSuppliers = suppliers.slice(start, start + perPage);

        container.innerHTML = pageSuppliers.map(supplier => `
            <div class="card supplier-card">
                <div class="card-body">
                    <div style="display: flex; align-items: center; gap: var(--spacing-md); margin-bottom: var(--spacing-md);">
                        <div style="width: 48px; height: 48px; border-radius: var(--radius-lg); background: var(--admin-surface-hover); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">
                            ${supplier.logo || '🏭'}
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <h4 style="margin: 0; font-weight: var(--font-weight-semibold); color: var(--admin-text);">${supplier.name}</h4>
                            <p style="margin: 2px 0 0; font-size: var(--font-size-xs); color: var(--admin-text-muted);">
                                ${supplier.productCount || 0} productos
                            </p>
                        </div>
                        ${AdminUtils.getStatusBadge(supplier.active ? 'active' : 'inactive')}
                    </div>

                    <div style="font-size: var(--font-size-sm); color: var(--admin-text-secondary); margin-bottom: var(--spacing-md);">
                        ${supplier.email ? `<div style="margin-bottom: 4px;">📧 ${supplier.email}</div>` : ''}
                        ${supplier.phone ? `<div style="margin-bottom: 4px;">📞 ${supplier.phone}</div>` : ''}
                        ${supplier.address ? `<div>📍 ${supplier.address}</div>` : ''}
                    </div>

                    <div style="display: flex; gap: var(--spacing-xs); justify-content: flex-end; border-top: 1px solid var(--admin-border); padding-top: var(--spacing-md); margin-top: auto;">
                        <button class="btn btn-ghost btn-sm" onclick="AdminProveedores.viewSupplier('${supplier.id}')" title="Ver detalles">
                            ${AdminUtils.Icons.eye}
                        </button>
                        <button class="btn btn-ghost btn-sm" onclick="AdminProveedores.editSupplier('${supplier.id}')" title="Editar">
                            ${AdminUtils.Icons.edit}
                        </button>
                        <button class="btn btn-ghost btn-sm" onclick="AdminProveedores.deleteSupplier('${supplier.id}')" title="Eliminar">
                            ${AdminUtils.Icons.trash}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        pagination.innerHTML = AdminUtils.renderPagination({
            currentPage,
            totalPages,
            totalItems: suppliers.length
        });

        AdminUtils.bindPagination(pagination, (page) => {
            currentPage = page;
            render();
        });
    }

    function search(query) {
        // Implementar filtrado
        render();
    }

    function createSupplier() {
        openSupplierModal();
    }

    function editSupplier(supplierId) {
        const supplier = suppliers.find(s => s.id === supplierId);
        if (supplier) {
            openSupplierModal(supplier);
        }
    }

    function openSupplierModal(supplier = null) {
        const isEdit = !!supplier;
        const title = isEdit ? 'Editar proveedor' : 'Nuevo proveedor';

        const body = `
            <form id="supplierForm">
                <div class="form-group">
                    <label class="form-label required">Nombre</label>
                    <input type="text" class="form-input" name="name" value="${supplier?.name || ''}" required placeholder="Nombre del proveedor">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-input" name="email" value="${supplier?.email || ''}" placeholder="email@proveedor.com">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Teléfono</label>
                        <input type="tel" class="form-input" name="phone" value="${supplier?.phone || ''}" placeholder="+56 9 1234 5678">
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Dirección</label>
                    <input type="text" class="form-input" name="address" value="${supplier?.address || ''}" placeholder="Dirección completa">
                </div>

                <div class="form-group">
                    <label class="form-label">Sitio web</label>
                    <input type="url" class="form-input" name="website" value="${supplier?.website || ''}" placeholder="https://...">
                </div>

                <div class="form-group">
                    <label class="form-label">Notas</label>
                    <textarea class="form-textarea" name="notes" rows="3" placeholder="Notas adicionales...">${supplier?.notes || ''}</textarea>
                </div>

                <div class="form-group">
                    <label class="form-checkbox">
                        <input type="checkbox" name="active" ${supplier?.active !== false ? 'checked' : ''}>
                        Proveedor activo
                    </label>
                </div>
            </form>
        `;

        AdminUtils.openModal({
            title,
            body,
            size: 'lg',
            footer: `
                <button class="btn btn-outline" onclick="AdminUtils.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="AdminProveedores.saveSupplier('${supplier?.id || ''}')">
                    ${isEdit ? 'Guardar cambios' : 'Crear proveedor'}
                </button>
            `
        });
    }

    async function saveSupplier(supplierId) {
        const form = document.getElementById('supplierForm');
        if (!form) return;

        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            website: formData.get('website'),
            notes: formData.get('notes'),
            active: form.querySelector('[name="active"]').checked
        };

        if (!data.name) {
            AdminUtils.showToast('error', 'El nombre es obligatorio');
            return;
        }

        try {
            if (supplierId) {
                await api.adminUpdateSupplier?.(supplierId, data);
                AdminUtils.showToast('success', 'Proveedor actualizado');
            } else {
                await api.adminCreateSupplier?.(data);
                AdminUtils.showToast('success', 'Proveedor creado');
            }
            AdminUtils.closeModal();
            await loadSuppliers();
        } catch (error) {
            console.error('Error saving supplier:', error);
            AdminUtils.showToast('error', error.message || 'Error al guardar');
        }
    }

    function viewSupplier(supplierId) {
        const supplier = suppliers.find(s => s.id === supplierId);
        if (!supplier) return;

        const body = `
            <div style="display: flex; align-items: center; gap: var(--spacing-lg); margin-bottom: var(--spacing-lg); padding-bottom: var(--spacing-lg); border-bottom: 1px solid var(--admin-border);">
                <div style="width: 64px; height: 64px; border-radius: var(--radius-lg); background: var(--admin-surface-hover); display: flex; align-items: center; justify-content: center; font-size: 28px;">
                    ${supplier.logo || '🏭'}
                </div>
                <div>
                    <h3 style="margin: 0; font-size: var(--font-size-xl);">${supplier.name}</h3>
                    <p style="margin: 4px 0 0; color: var(--admin-text-muted);">${supplier.productCount || 0} productos</p>
                </div>
            </div>

            <div style="display: grid; gap: var(--spacing-md);">
                ${supplier.email ? `<div><strong>Email:</strong> ${supplier.email}</div>` : ''}
                ${supplier.phone ? `<div><strong>Teléfono:</strong> ${supplier.phone}</div>` : ''}
                ${supplier.address ? `<div><strong>Dirección:</strong> ${supplier.address}</div>` : ''}
                ${supplier.website ? `<div><strong>Sitio web:</strong> <a href="${supplier.website}" target="_blank">${supplier.website}</a></div>` : ''}
                ${supplier.notes ? `<div><strong>Notas:</strong><br>${supplier.notes}</div>` : ''}
            </div>
        `;

        AdminUtils.openModal({
            title: 'Detalles del proveedor',
            body,
            footer: `
                <button class="btn btn-outline" onclick="AdminUtils.closeModal()">Cerrar</button>
                <button class="btn btn-primary" onclick="AdminProveedores.editSupplier('${supplierId}')">Editar</button>
            `
        });
    }

    async function deleteSupplier(supplierId) {
        const supplier = suppliers.find(s => s.id === supplierId);
        if (!supplier) return;

        const confirmed = await AdminUtils.confirm(`¿Eliminar el proveedor "${supplier.name}"?`, 'Eliminar proveedor');
        if (!confirmed) return;

        try {
            await api.adminDeleteSupplier?.(supplierId);
            AdminUtils.showToast('success', 'Proveedor eliminado');
            await loadSuppliers();
        } catch (error) {
            console.error('Error deleting supplier:', error);
            AdminUtils.showToast('error', error.message || 'Error al eliminar');
        }
    }

    async function refresh() {
        currentPage = 1;
        await loadSuppliers();
        AdminUtils.showToast('success', 'Datos actualizados');
    }

    function getMockSuppliers() {
        return [
            { id: '1', name: 'TechSupply Co.', email: 'ventas@techsupply.com', phone: '+56 2 1234 5678', address: 'Av. Principal 123, Santiago', productCount: 45, active: true, logo: '🖥️' },
            { id: '2', name: 'ModaExpress', email: 'contacto@modaexpress.cl', phone: '+56 9 8765 4321', productCount: 32, active: true, logo: '👕' },
            { id: '3', name: 'Distribuidora Global', email: 'info@distglobal.com', phone: '+56 2 9876 5432', address: 'Zona Industrial Norte', productCount: 28, active: true, logo: '📦' },
            { id: '4', name: 'Importadora Sur', email: 'ventas@importsur.cl', productCount: 15, active: false, logo: '🚢' }
        ];
    }

    return {
        load,
        search,
        createSupplier,
        editSupplier,
        saveSupplier,
        viewSupplier,
        deleteSupplier,
        refresh
    };

})();
