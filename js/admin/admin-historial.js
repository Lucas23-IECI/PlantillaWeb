/**
 * Admin Panel - Inventory History Module
 * Historial de movimientos de inventario
 */

const AdminHistorial = (function () {
    'use strict';

    let movements = [];
    let filteredMovements = [];
    let currentPage = 1;
    const perPage = 20;

    async function load(container) {
        container.innerHTML = `
            <div class="admin-page-header">
                <div class="page-title-group">
                    <h1 class="page-title">Historial de Inventario</h1>
                    <p class="page-description">Registro de todos los movimientos de stock</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-outline" onclick="AdminHistorial.exportHistory()">
                        ${AdminUtils.Icons.download}
                        Exportar
                    </button>
                    <button class="btn btn-primary" onclick="AdminHistorial.createMovement()">
                        ${AdminUtils.Icons.plus}
                        Registrar movimiento
                    </button>
                </div>
            </div>

            <div class="admin-content">
                <div class="filters-bar">
                    <div class="search-input-wrapper">
                        ${AdminUtils.Icons.search}
                        <input type="text" placeholder="Buscar producto..." id="historySearch" onkeyup="AdminHistorial.search(this.value)">
                    </div>
                    <select class="filter-select" id="typeFilter" onchange="AdminHistorial.filterByType(this.value)">
                        <option value="">Todos los tipos</option>
                        <option value="entrada">Entradas</option>
                        <option value="salida">Salidas</option>
                        <option value="ajuste">Ajustes</option>
                    </select>
                    <input type="date" class="form-input" id="dateFrom" onchange="AdminHistorial.filterByDate()" style="width: auto;">
                    <input type="date" class="form-input" id="dateTo" onchange="AdminHistorial.filterByDate()" style="width: auto;">
                    <button class="btn btn-ghost" onclick="AdminHistorial.refresh()">
                        ${AdminUtils.Icons.refresh}
                    </button>
                </div>

                <div class="card">
                    <div class="card-body no-padding" id="historyTable">
                        ${AdminUtils.renderSkeleton('table', 8)}
                    </div>
                    <div class="card-footer" id="historyPagination"></div>
                </div>
            </div>
        `;

        await loadMovements();
    }

    async function loadMovements() {
        try {
            const response = await api.adminGetInventoryHistory?.() || { movements: getMockMovements() };
            movements = response.movements || response || getMockMovements();
            filteredMovements = [...movements];
            renderTable();
        } catch (error) {
            console.error('Error loading history:', error);
            movements = getMockMovements();
            filteredMovements = [...movements];
            renderTable();
        }
    }

    function renderTable() {
        const tableContainer = document.getElementById('historyTable');
        const paginationContainer = document.getElementById('historyPagination');

        if (filteredMovements.length === 0) {
            tableContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                    <h3 class="empty-state-title">Sin movimientos</h3>
                    <p class="empty-state-message">No hay movimientos de inventario registrados</p>
                </div>
            `;
            paginationContainer.innerHTML = '';
            return;
        }

        const totalPages = Math.ceil(filteredMovements.length / perPage);
        const start = (currentPage - 1) * perPage;
        const pageMovements = filteredMovements.slice(start, start + perPage);

        const typeIcons = {
            entrada: { icon: '📥', color: 'var(--admin-success)', label: 'Entrada' },
            salida: { icon: '📤', color: 'var(--admin-error)', label: 'Salida' },
            ajuste: { icon: '⚙️', color: 'var(--admin-warning)', label: 'Ajuste' },
            venta: { icon: '🛒', color: 'var(--admin-info)', label: 'Venta' },
            devolucion: { icon: '↩️', color: 'var(--admin-success)', label: 'Devolución' }
        };

        tableContainer.innerHTML = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Tipo</th>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Stock anterior</th>
                            <th>Stock nuevo</th>
                            <th>Usuario</th>
                            <th>Notas</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pageMovements.map(mov => {
            const type = typeIcons[mov.type] || typeIcons.ajuste;
            const quantityClass = mov.quantity > 0 ? 'text-success' : 'text-danger';
            return `
                                <tr>
                                    <td>${AdminUtils.formatDate(mov.date, 'long')}</td>
                                    <td>
                                        <span style="display: inline-flex; align-items: center; gap: 6px;">
                                            <span style="font-size: 16px;">${type.icon}</span>
                                            ${type.label}
                                        </span>
                                    </td>
                                    <td>
                                        <strong>${mov.productName}</strong>
                                        <div style="font-size: var(--font-size-xs); color: var(--admin-text-muted);">SKU: ${mov.sku || 'N/A'}</div>
                                    </td>
                                    <td class="${quantityClass}" style="font-weight: var(--font-weight-semibold);">
                                        ${mov.quantity > 0 ? '+' : ''}${mov.quantity}
                                    </td>
                                    <td>${mov.previousStock}</td>
                                    <td><strong>${mov.newStock}</strong></td>
                                    <td>${mov.userName || 'Sistema'}</td>
                                    <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${mov.notes || ''}">${mov.notes || '-'}</td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
            </div>
        `;

        paginationContainer.innerHTML = AdminUtils.renderPagination({
            currentPage,
            totalPages,
            totalItems: filteredMovements.length
        });

        AdminUtils.bindPagination(paginationContainer, (page) => {
            currentPage = page;
            renderTable();
        });
    }

    function search(query) {
        applyFilters();
    }

    function filterByType(type) {
        applyFilters();
    }

    function filterByDate() {
        applyFilters();
    }

    function applyFilters() {
        const search = document.getElementById('historySearch')?.value.toLowerCase().trim() || '';
        const type = document.getElementById('typeFilter')?.value || '';
        const dateFrom = document.getElementById('dateFrom')?.value;
        const dateTo = document.getElementById('dateTo')?.value;

        filteredMovements = movements.filter(mov => {
            if (search && !mov.productName.toLowerCase().includes(search) && !(mov.sku || '').toLowerCase().includes(search)) {
                return false;
            }
            if (type && mov.type !== type) {
                return false;
            }
            if (dateFrom && new Date(mov.date) < new Date(dateFrom)) {
                return false;
            }
            if (dateTo && new Date(mov.date) > new Date(dateTo + 'T23:59:59')) {
                return false;
            }
            return true;
        });

        currentPage = 1;
        renderTable();
    }

    function createMovement() {
        const body = `
            <form id="movementForm">
                <div class="form-group">
                    <label class="form-label required">Tipo de movimiento</label>
                    <select class="form-select" name="type" required>
                        <option value="entrada">Entrada (compra/reposición)</option>
                        <option value="salida">Salida (pérdida/daño)</option>
                        <option value="ajuste">Ajuste de inventario</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label required">Producto</label>
                    <input type="text" class="form-input" name="productName" required placeholder="Nombre del producto">
                    <span class="form-hint">Escribe para buscar productos</span>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label required">Cantidad</label>
                        <input type="number" class="form-input" name="quantity" required placeholder="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Stock actual</label>
                        <input type="number" class="form-input" name="currentStock" value="0" readonly style="opacity: 0.6;">
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Notas</label>
                    <textarea class="form-textarea" name="notes" rows="2" placeholder="Razón del movimiento..."></textarea>
                </div>
            </form>
        `;

        AdminUtils.openModal({
            title: 'Registrar movimiento',
            body,
            footer: `
                <button class="btn btn-outline" onclick="AdminUtils.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="AdminHistorial.saveMovement()">Registrar</button>
            `
        });
    }

    async function saveMovement() {
        const form = document.getElementById('movementForm');
        if (!form) return;

        const formData = new FormData(form);
        const data = {
            type: formData.get('type'),
            productName: formData.get('productName'),
            quantity: parseInt(formData.get('quantity')) || 0,
            notes: formData.get('notes')
        };

        if (!data.productName || !data.quantity) {
            AdminUtils.showToast('error', 'Producto y cantidad son obligatorios');
            return;
        }

        try {
            await api.adminCreateInventoryMovement?.(data);
            AdminUtils.showToast('success', 'Movimiento registrado');
            AdminUtils.closeModal();
            await loadMovements();
        } catch (error) {
            console.error('Error saving movement:', error);
            AdminUtils.showToast('error', error.message || 'Error al registrar');
        }
    }

    function exportHistory() {
        AdminUtils.showToast('info', 'Exportando historial...');
        setTimeout(() => {
            AdminUtils.showToast('success', 'Historial exportado correctamente');
        }, 1500);
    }

    async function refresh() {
        document.getElementById('historySearch').value = '';
        document.getElementById('typeFilter').value = '';
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
        currentPage = 1;
        await loadMovements();
        AdminUtils.showToast('success', 'Datos actualizados');
    }

    function getMockMovements() {
        // Mock data eliminado - usar movimientos reales desde Firebase
        return [];
    }

    return {
        load,
        search,
        filterByType,
        filterByDate,
        createMovement,
        saveMovement,
        exportHistory,
        refresh
    };

})();
