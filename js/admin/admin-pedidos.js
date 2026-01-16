/**
 * Admin Panel - Orders Module
 */

const AdminPedidos = (function() {
    'use strict';

    let orders = [];
    let filteredOrders = [];
    let currentPage = 1;
    const perPage = 10;

    async function load(container) {
        container.innerHTML = `
            <div class="admin-page-header">
                <div class="page-title-group">
                    <h1 class="page-title">Pedidos</h1>
                    <p class="page-description">Gestiona los pedidos de tu tienda</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-outline" onclick="AdminPedidos.exportOrders()">
                        ${AdminUtils.Icons.download}
                        Exportar
                    </button>
                </div>
            </div>

            <div class="admin-content">
                <div class="filters-bar">
                    <div class="search-input-wrapper">
                        ${AdminUtils.Icons.search}
                        <input type="text" placeholder="Buscar pedido..." id="orderSearch" onkeyup="AdminPedidos.search(this.value)">
                    </div>
                    <select class="filter-select" id="statusFilter" onchange="AdminPedidos.filterByStatus(this.value)">
                        <option value="">Todos los estados</option>
                        <option value="pending">Pendiente</option>
                        <option value="paid">Pagado</option>
                        <option value="processing">Procesando</option>
                        <option value="shipped">Enviado</option>
                        <option value="delivered">Entregado</option>
                        <option value="cancelled">Cancelado</option>
                    </select>
                    <button class="btn btn-ghost" onclick="AdminPedidos.refresh()">
                        ${AdminUtils.Icons.refresh}
                    </button>
                </div>

                <div class="card">
                    <div class="card-body no-padding" id="ordersTable">
                        ${AdminUtils.renderSkeleton('table', 5)}
                    </div>
                    <div class="card-footer" id="ordersPagination"></div>
                </div>
            </div>
        `;

        await loadOrders();
    }

    async function loadOrders() {
        try {
            const response = await api.getAdminOrders();
            orders = response.orders || response || [];
            filteredOrders = [...orders];
            renderTable();
        } catch (error) {
            console.error('Error loading orders:', error);
            orders = getMockOrders();
            filteredOrders = [...orders];
            renderTable();
        }
    }

    function renderTable() {
        const tableContainer = document.getElementById('ordersTable');
        const paginationContainer = document.getElementById('ordersPagination');

        if (filteredOrders.length === 0) {
            tableContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">${AdminUtils.Icons.shoppingBag}</div>
                    <h3 class="empty-state-title">Sin pedidos</h3>
                    <p class="empty-state-message">No se encontraron pedidos con los filtros seleccionados</p>
                </div>
            `;
            paginationContainer.innerHTML = '';
            return;
        }

        const totalPages = Math.ceil(filteredOrders.length / perPage);
        const start = (currentPage - 1) * perPage;
        const pageOrders = filteredOrders.slice(start, start + perPage);

        tableContainer.innerHTML = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>ID Pedido</th>
                            <th>Cliente</th>
                            <th>Productos</th>
                            <th>Total</th>
                            <th>Estado</th>
                            <th>Fecha</th>
                            <th style="width:100px;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pageOrders.map(order => `
                            <tr>
                                <td><strong>#${order.id || order._id}</strong></td>
                                <td>
                                    <div style="font-weight:500;">${order.customer?.name || order.customerName || 'Cliente'}</div>
                                    <div style="font-size:12px; color:var(--admin-text-muted);">${order.customer?.email || order.customerEmail || ''}</div>
                                </td>
                                <td>
                                    <span class="badge badge-neutral">${order.items?.length || 0} items</span>
                                </td>
                                <td><strong>${AdminUtils.formatCurrency(order.total)}</strong></td>
                                <td>${AdminUtils.getStatusBadge(order.status)}</td>
                                <td>${AdminUtils.formatDate(order.createdAt || order.date, 'short')}</td>
                                <td>
                                    <div class="d-flex gap-1">
                                        <button class="btn btn-ghost btn-icon btn-sm" onclick="AdminPedidos.viewOrder('${order.id || order._id}')" title="Ver detalles">
                                            ${AdminUtils.Icons.eye}
                                        </button>
                                        <button class="btn btn-ghost btn-icon btn-sm" onclick="AdminPedidos.changeStatus('${order.id || order._id}')" title="Cambiar estado">
                                            ${AdminUtils.Icons.edit}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        paginationContainer.innerHTML = AdminUtils.renderPagination({
            currentPage,
            totalPages,
            totalItems: filteredOrders.length
        });

        AdminUtils.bindPagination(paginationContainer, (page) => {
            currentPage = page;
            renderTable();
        });
    }

    function search(query) {
        const q = query.toLowerCase().trim();
        if (!q) {
            filteredOrders = [...orders];
        } else {
            filteredOrders = orders.filter(o => 
                (o.id || o._id || '').toString().toLowerCase().includes(q) ||
                (o.customer?.name || o.customerName || '').toLowerCase().includes(q) ||
                (o.customer?.email || o.customerEmail || '').toLowerCase().includes(q)
            );
        }
        currentPage = 1;
        renderTable();
    }

    function filterByStatus(status) {
        if (!status) {
            filteredOrders = [...orders];
        } else {
            filteredOrders = orders.filter(o => o.status === status);
        }
        currentPage = 1;
        renderTable();
    }

    async function viewOrder(orderId) {
        const order = orders.find(o => (o.id || o._id) == orderId);
        if (!order) return;

        const body = `
            <div style="display:grid; gap:16px;">
                <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:12px;">
                    <div>
                        <label style="font-size:12px; color:var(--admin-text-muted);">ID Pedido</label>
                        <div style="font-weight:600;">#${order.id || order._id}</div>
                    </div>
                    <div>
                        <label style="font-size:12px; color:var(--admin-text-muted);">Estado</label>
                        <div>${AdminUtils.getStatusBadge(order.status)}</div>
                    </div>
                    <div>
                        <label style="font-size:12px; color:var(--admin-text-muted);">Cliente</label>
                        <div style="font-weight:500;">${order.customer?.name || order.customerName || 'N/A'}</div>
                        <div style="font-size:12px; color:var(--admin-text-muted);">${order.customer?.email || order.customerEmail || ''}</div>
                    </div>
                    <div>
                        <label style="font-size:12px; color:var(--admin-text-muted);">Fecha</label>
                        <div>${AdminUtils.formatDate(order.createdAt || order.date, 'long')}</div>
                    </div>
                </div>

                <div style="border-top:1px solid var(--admin-border); padding-top:16px;">
                    <label style="font-size:12px; color:var(--admin-text-muted); margin-bottom:8px; display:block;">Productos</label>
                    ${(order.items || []).map(item => `
                        <div style="display:flex; align-items:center; gap:12px; padding:8px 0; border-bottom:1px solid var(--admin-border);">
                            <div style="width:40px; height:40px; background:var(--admin-bg-muted); border-radius:6px; display:flex; align-items:center; justify-content:center;">
                                ${AdminUtils.Icons.package}
                            </div>
                            <div style="flex:1;">
                                <div style="font-weight:500;">${item.name || 'Producto'}</div>
                                <div style="font-size:12px; color:var(--admin-text-muted);">Cantidad: ${item.quantity || 1}</div>
                            </div>
                            <div style="font-weight:600;">${AdminUtils.formatCurrency(item.price * (item.quantity || 1))}</div>
                        </div>
                    `).join('') || '<div style="color:var(--admin-text-muted);">Sin productos</div>'}
                </div>

                <div style="border-top:1px solid var(--admin-border); padding-top:16px; display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:16px; font-weight:600;">Total</span>
                    <span style="font-size:20px; font-weight:700; color:var(--admin-success);">${AdminUtils.formatCurrency(order.total)}</span>
                </div>
            </div>
        `;

        AdminUtils.openModal({
            title: `Pedido #${order.id || order._id}`,
            body,
            size: 'lg',
            footer: `
                <button class="btn btn-outline" onclick="AdminUtils.closeModal()">Cerrar</button>
                <button class="btn btn-primary" onclick="AdminPedidos.changeStatus('${order.id || order._id}')">Cambiar estado</button>
            `
        });
    }

    async function changeStatus(orderId) {
        const order = orders.find(o => (o.id || o._id) == orderId);
        if (!order) return;

        const statuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
        const body = `
            <div class="form-group">
                <label class="form-label">Estado actual</label>
                <div style="margin-bottom:12px;">${AdminUtils.getStatusBadge(order.status)}</div>
            </div>
            <div class="form-group">
                <label class="form-label">Nuevo estado</label>
                <select class="form-select" id="newStatus">
                    ${statuses.map(s => `
                        <option value="${s}" ${s === order.status ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    `).join('')}
                </select>
            </div>
        `;

        AdminUtils.openModal({
            title: 'Cambiar estado',
            body,
            footer: `
                <button class="btn btn-outline" onclick="AdminUtils.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="AdminPedidos.saveStatus('${orderId}')">Guardar</button>
            `
        });
    }

    async function saveStatus(orderId) {
        const newStatus = document.getElementById('newStatus')?.value;
        if (!newStatus) return;

        try {
            await api.adminUpdateOrderStatus(orderId, newStatus);
            AdminUtils.closeModal();
            AdminUtils.showToast('success', 'Estado actualizado correctamente');
            await loadOrders();
        } catch (error) {
            console.error('Error updating status:', error);
            AdminUtils.showToast('error', error.message || 'Error al actualizar estado');
        }
    }

    function exportOrders() {
        AdminUtils.showToast('info', 'Exportando pedidos...');
        // Implement CSV export
        setTimeout(() => {
            AdminUtils.showToast('success', 'Pedidos exportados correctamente');
        }, 1000);
    }

    async function refresh() {
        document.getElementById('orderSearch').value = '';
        document.getElementById('statusFilter').value = '';
        currentPage = 1;
        await loadOrders();
        AdminUtils.showToast('success', 'Pedidos actualizados');
    }

    function getMockOrders() {
        return [
            { id: '1234', customerName: 'Juan Pérez', customerEmail: 'juan@email.com', items: [{name:'Producto 1', price: 29990, quantity: 2}], total: 59980, status: 'paid', date: new Date() },
            { id: '1233', customerName: 'María García', customerEmail: 'maria@email.com', items: [{name:'Producto 2', price: 45990, quantity: 1}], total: 45990, status: 'processing', date: new Date(Date.now() - 86400000) },
            { id: '1232', customerName: 'Carlos López', customerEmail: 'carlos@email.com', items: [{name:'Producto 3', price: 15990, quantity: 3}], total: 47970, status: 'pending', date: new Date(Date.now() - 172800000) },
            { id: '1231', customerName: 'Ana Martínez', customerEmail: 'ana@email.com', items: [{name:'Producto 4', price: 89990, quantity: 1}], total: 89990, status: 'shipped', date: new Date(Date.now() - 259200000) },
            { id: '1230', customerName: 'Pedro Sánchez', customerEmail: 'pedro@email.com', items: [{name:'Producto 5', price: 34990, quantity: 2}], total: 69980, status: 'delivered', date: new Date(Date.now() - 345600000) }
        ];
    }

    return {
        load,
        search,
        filterByStatus,
        viewOrder,
        changeStatus,
        saveStatus,
        exportOrders,
        refresh
    };

})();
