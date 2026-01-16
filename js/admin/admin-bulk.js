/**
 * Admin Panel - Bulk Operations Module
 * Operaciones masivas sobre productos
 */

const AdminBulk = (function() {
    'use strict';

    let selectedIds = new Set();

    /**
     * Initialize bulk selection on a table
     */
    function initBulkSelection(tableContainerId, options = {}) {
        const container = document.getElementById(tableContainerId);
        if (!container) return;

        const {
            onSelectionChange = () => {},
            itemSelector = 'tr[data-id]',
            checkboxSelector = '.bulk-checkbox'
        } = options;

        // Handle select all checkbox
        container.addEventListener('change', (e) => {
            if (e.target.matches('.bulk-select-all')) {
                const isChecked = e.target.checked;
                container.querySelectorAll(checkboxSelector).forEach(cb => {
                    cb.checked = isChecked;
                    const id = cb.closest(itemSelector)?.dataset.id;
                    if (id) {
                        if (isChecked) {
                            selectedIds.add(id);
                        } else {
                            selectedIds.delete(id);
                        }
                    }
                });
                onSelectionChange(selectedIds);
            }
            // Handle individual checkboxes
            else if (e.target.matches(checkboxSelector)) {
                const id = e.target.closest(itemSelector)?.dataset.id;
                if (id) {
                    if (e.target.checked) {
                        selectedIds.add(id);
                    } else {
                        selectedIds.delete(id);
                    }
                }
                // Update select all checkbox
                const allChecked = container.querySelectorAll(checkboxSelector).length === 
                    container.querySelectorAll(`${checkboxSelector}:checked`).length;
                const selectAll = container.querySelector('.bulk-select-all');
                if (selectAll) selectAll.checked = allChecked;
                
                onSelectionChange(selectedIds);
            }
        });
    }

    /**
     * Get selected IDs
     */
    function getSelectedIds() {
        return Array.from(selectedIds);
    }

    /**
     * Clear selection
     */
    function clearSelection() {
        selectedIds.clear();
        document.querySelectorAll('.bulk-checkbox, .bulk-select-all').forEach(cb => {
            cb.checked = false;
        });
    }

    /**
     * Render bulk actions bar
     */
    function renderBulkActionsBar(targetId, actions = []) {
        const target = document.getElementById(targetId);
        if (!target) return;

        const count = selectedIds.size;
        
        if (count === 0) {
            target.innerHTML = '';
            target.style.display = 'none';
            return;
        }

        const defaultActions = [
            { id: 'delete', label: 'Eliminar', icon: AdminUtils.Icons.trash, class: 'btn-danger', action: () => bulkDelete() },
            { id: 'activate', label: 'Activar', icon: AdminUtils.Icons.check, class: 'btn-success', action: () => bulkUpdateStatus(true) },
            { id: 'deactivate', label: 'Desactivar', icon: AdminUtils.Icons.ban, class: 'btn-outline', action: () => bulkUpdateStatus(false) },
            { id: 'category', label: 'Cambiar categoría', icon: AdminUtils.Icons.folder, class: 'btn-outline', action: () => bulkChangeCategory() },
            { id: 'price', label: 'Actualizar precio', icon: AdminUtils.Icons.dollar, class: 'btn-outline', action: () => bulkUpdatePrice() }
        ];

        const finalActions = actions.length > 0 ? actions : defaultActions;

        target.innerHTML = `
            <div class="bulk-actions-bar">
                <span class="bulk-count">${count} ${count === 1 ? 'seleccionado' : 'seleccionados'}</span>
                <div class="bulk-actions">
                    ${finalActions.map(a => `
                        <button class="btn ${a.class || 'btn-outline'} btn-sm" onclick="AdminBulk.actions['${a.id}']?.()">
                            ${a.icon || ''}
                            ${a.label}
                        </button>
                    `).join('')}
                </div>
                <button class="btn btn-ghost btn-sm" onclick="AdminBulk.clearSelection()">
                    Cancelar
                </button>
            </div>
        `;
        target.style.display = 'block';

        // Store actions for onclick handlers
        AdminBulk.actions = {};
        finalActions.forEach(a => {
            AdminBulk.actions[a.id] = a.action;
        });
    }

    /**
     * Bulk delete
     */
    async function bulkDelete() {
        const count = selectedIds.size;
        const confirmed = await AdminUtils.confirm(
            `¿Eliminar ${count} ${count === 1 ? 'producto' : 'productos'} seleccionados?\n\nEsta acción no se puede deshacer.`,
            'Eliminar seleccionados'
        );
        if (!confirmed) return;

        try {
            await api.adminBulkDeleteProducts?.(getSelectedIds());
            AdminUtils.showToast('success', `${count} productos eliminados`);
            clearSelection();
            
            // Refresh products list
            if (typeof AdminProductos !== 'undefined') {
                AdminProductos.refresh?.();
            }
        } catch (error) {
            console.error('Bulk delete error:', error);
            AdminUtils.showToast('error', error.message || 'Error al eliminar');
        }
    }

    /**
     * Bulk update status
     */
    async function bulkUpdateStatus(active) {
        const count = selectedIds.size;
        const action = active ? 'activar' : 'desactivar';

        try {
            await api.adminBulkUpdateProducts?.(getSelectedIds(), { active });
            AdminUtils.showToast('success', `${count} productos ${active ? 'activados' : 'desactivados'}`);
            clearSelection();
            
            if (typeof AdminProductos !== 'undefined') {
                AdminProductos.refresh?.();
            }
        } catch (error) {
            console.error('Bulk update status error:', error);
            AdminUtils.showToast('error', error.message || `Error al ${action}`);
        }
    }

    /**
     * Bulk change category modal
     */
    function bulkChangeCategory() {
        const body = `
            <form id="bulkCategoryForm">
                <p style="margin-bottom: var(--spacing-md); color: var(--admin-text-secondary);">
                    Cambiar la categoría de ${selectedIds.size} productos
                </p>
                <div class="form-group">
                    <label class="form-label required">Nueva categoría</label>
                    <select class="form-select" name="categoryId" required id="bulkCategorySelect">
                        <option value="">Seleccionar categoría...</option>
                        <!-- Se llena dinámicamente -->
                    </select>
                </div>
            </form>
        `;

        AdminUtils.openModal({
            title: 'Cambiar categoría',
            body,
            footer: `
                <button class="btn btn-outline" onclick="AdminUtils.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="AdminBulk.confirmCategoryChange()">Aplicar</button>
            `
        });

        // Load categories
        loadCategoriesSelect();
    }

    async function loadCategoriesSelect() {
        const select = document.getElementById('bulkCategorySelect');
        if (!select) return;

        try {
            const categories = await api.adminGetCategories?.() || [];
            const cats = categories.categories || categories || [];
            
            select.innerHTML = '<option value="">Seleccionar categoría...</option>' +
                cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        } catch (error) {
            console.error('Error loading categories:', error);
            select.innerHTML = `
                <option value="">Sin categorías</option>
                <option value="cat1">Electrónica</option>
                <option value="cat2">Ropa</option>
                <option value="cat3">Hogar</option>
            `;
        }
    }

    async function confirmCategoryChange() {
        const form = document.getElementById('bulkCategoryForm');
        if (!form) return;

        const categoryId = form.querySelector('[name="categoryId"]').value;
        if (!categoryId) {
            AdminUtils.showToast('error', 'Selecciona una categoría');
            return;
        }

        try {
            await api.adminBulkUpdateProducts?.(getSelectedIds(), { categoryId });
            AdminUtils.showToast('success', `Categoría actualizada en ${selectedIds.size} productos`);
            AdminUtils.closeModal();
            clearSelection();
            
            if (typeof AdminProductos !== 'undefined') {
                AdminProductos.refresh?.();
            }
        } catch (error) {
            console.error('Bulk category change error:', error);
            AdminUtils.showToast('error', error.message || 'Error al cambiar categoría');
        }
    }

    /**
     * Bulk update price modal
     */
    function bulkUpdatePrice() {
        const body = `
            <form id="bulkPriceForm">
                <p style="margin-bottom: var(--spacing-md); color: var(--admin-text-secondary);">
                    Actualizar precio de ${selectedIds.size} productos
                </p>
                
                <div class="form-group">
                    <label class="form-label required">Tipo de ajuste</label>
                    <select class="form-select" name="adjustType" id="priceAdjustType" onchange="AdminBulk.togglePriceFields()">
                        <option value="percentage">Porcentaje</option>
                        <option value="fixed">Valor fijo</option>
                        <option value="set">Establecer precio</option>
                    </select>
                </div>

                <div class="form-group" id="percentageField">
                    <label class="form-label">Porcentaje (%)</label>
                    <input type="number" class="form-input" name="percentage" value="10" step="0.1">
                    <span class="form-hint">Positivo para aumentar, negativo para disminuir</span>
                </div>

                <div class="form-group" id="fixedField" style="display: none;">
                    <label class="form-label">Valor a agregar/restar</label>
                    <input type="number" class="form-input" name="fixedValue" value="0">
                    <span class="form-hint">Positivo para aumentar, negativo para disminuir</span>
                </div>

                <div class="form-group" id="setField" style="display: none;">
                    <label class="form-label">Nuevo precio</label>
                    <input type="number" class="form-input" name="setPrice" value="0" min="0">
                </div>
            </form>
        `;

        AdminUtils.openModal({
            title: 'Actualizar precios',
            body,
            footer: `
                <button class="btn btn-outline" onclick="AdminUtils.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="AdminBulk.confirmPriceUpdate()">Aplicar</button>
            `
        });
    }

    function togglePriceFields() {
        const type = document.getElementById('priceAdjustType')?.value;
        document.getElementById('percentageField').style.display = type === 'percentage' ? 'block' : 'none';
        document.getElementById('fixedField').style.display = type === 'fixed' ? 'block' : 'none';
        document.getElementById('setField').style.display = type === 'set' ? 'block' : 'none';
    }

    async function confirmPriceUpdate() {
        const form = document.getElementById('bulkPriceForm');
        if (!form) return;

        const formData = new FormData(form);
        const adjustType = formData.get('adjustType');
        
        let priceUpdate = { type: adjustType };
        
        switch (adjustType) {
            case 'percentage':
                priceUpdate.value = parseFloat(formData.get('percentage')) || 0;
                break;
            case 'fixed':
                priceUpdate.value = parseFloat(formData.get('fixedValue')) || 0;
                break;
            case 'set':
                priceUpdate.value = parseFloat(formData.get('setPrice')) || 0;
                break;
        }

        try {
            await api.adminBulkUpdateProducts?.(getSelectedIds(), { priceUpdate });
            AdminUtils.showToast('success', `Precios actualizados en ${selectedIds.size} productos`);
            AdminUtils.closeModal();
            clearSelection();
            
            if (typeof AdminProductos !== 'undefined') {
                AdminProductos.refresh?.();
            }
        } catch (error) {
            console.error('Bulk price update error:', error);
            AdminUtils.showToast('error', error.message || 'Error al actualizar precios');
        }
    }

    /**
     * Bulk update stock
     */
    function bulkUpdateStock() {
        const body = `
            <form id="bulkStockForm">
                <p style="margin-bottom: var(--spacing-md); color: var(--admin-text-secondary);">
                    Actualizar stock de ${selectedIds.size} productos
                </p>
                
                <div class="form-group">
                    <label class="form-label required">Tipo de ajuste</label>
                    <select class="form-select" name="adjustType">
                        <option value="add">Agregar</option>
                        <option value="subtract">Restar</option>
                        <option value="set">Establecer valor</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label required">Cantidad</label>
                    <input type="number" class="form-input" name="quantity" value="0" min="0" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Notas</label>
                    <input type="text" class="form-input" name="notes" placeholder="Razón del ajuste...">
                </div>
            </form>
        `;

        AdminUtils.openModal({
            title: 'Actualizar stock',
            body,
            footer: `
                <button class="btn btn-outline" onclick="AdminUtils.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="AdminBulk.confirmStockUpdate()">Aplicar</button>
            `
        });
    }

    async function confirmStockUpdate() {
        const form = document.getElementById('bulkStockForm');
        if (!form) return;

        const formData = new FormData(form);
        const stockUpdate = {
            type: formData.get('adjustType'),
            quantity: parseInt(formData.get('quantity')) || 0,
            notes: formData.get('notes')
        };

        try {
            await api.adminBulkUpdateProducts?.(getSelectedIds(), { stockUpdate });
            AdminUtils.showToast('success', `Stock actualizado en ${selectedIds.size} productos`);
            AdminUtils.closeModal();
            clearSelection();
            
            if (typeof AdminProductos !== 'undefined') {
                AdminProductos.refresh?.();
            }
        } catch (error) {
            console.error('Bulk stock update error:', error);
            AdminUtils.showToast('error', error.message || 'Error al actualizar stock');
        }
    }

    // Add CSS for bulk actions bar
    if (!document.getElementById('admin-bulk-styles')) {
        const style = document.createElement('style');
        style.id = 'admin-bulk-styles';
        style.textContent = `
            .bulk-actions-bar {
                display: flex;
                align-items: center;
                gap: var(--spacing-md);
                padding: var(--spacing-md);
                background: var(--admin-surface);
                border: 1px solid var(--admin-border);
                border-radius: var(--radius-lg);
                margin-bottom: var(--spacing-md);
            }
            .bulk-count {
                font-weight: var(--font-weight-medium);
                color: var(--admin-text);
            }
            .bulk-actions {
                display: flex;
                gap: var(--spacing-xs);
                flex: 1;
            }
            .bulk-checkbox {
                width: 18px;
                height: 18px;
                accent-color: var(--admin-accent);
            }
        `;
        document.head.appendChild(style);
    }

    return {
        initBulkSelection,
        getSelectedIds,
        clearSelection,
        renderBulkActionsBar,
        bulkDelete,
        bulkUpdateStatus,
        bulkChangeCategory,
        confirmCategoryChange,
        bulkUpdatePrice,
        togglePriceFields,
        confirmPriceUpdate,
        bulkUpdateStock,
        confirmStockUpdate,
        actions: {} // Placeholder for dynamic actions
    };

})();
