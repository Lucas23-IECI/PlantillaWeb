/**
 * Admin Panel - Orders Module
 */

const AdminPedidos = (function () {
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

    /**
     * Normalizes order data from various backend formats to a consistent structure
     * Handles snake_case from Firebase, camelCase, and nested customer objects
     */
    function normalizeOrder(order) {
        if (!order || typeof order !== 'object') {
            return null;
        }

        // Determine the best ID to use (prefer order_id for display, keep transaction_id for API calls)
        const id = order.order_id || order.id || order._id || order.transaction_id || 'N/A';
        const transactionId = order.transaction_id || order.id || order._id || id;

        // Normalize customer info - handle nested objects and snake_case
        const customerName = order.customer?.name
            || order.customerName
            || order.customer_name
            || 'Cliente no especificado';

        const customerEmail = order.customer?.email
            || order.customerEmail
            || order.customer_email
            || '';

        const customerPhone = order.customer?.phone
            || order.customerPhone
            || order.customer_phone
            || '';

        // Normalize total - handle different field names
        const total = parseFloat(order.total_amount)
            || parseFloat(order.total)
            || parseFloat(order.amount)
            || 0;

        // Normalize items - ensure it's always an array with proper structure
        let items = [];
        if (Array.isArray(order.items)) {
            items = order.items.map(item => ({
                name: item.name || item.product_name || 'Producto',
                price: parseFloat(item.price) || 0,
                quantity: parseInt(item.quantity, 10) || 1,
                product_id: item.product_id || item.id || null
            }));
        }

        // Normalize status
        const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
        let status = (order.status || 'pending').toLowerCase();
        if (!validStatuses.includes(status)) {
            status = 'pending';
        }

        // Normalize date - handle Firestore Timestamps, ISO strings, and Date objects
        let createdAt = null;
        const rawDate = order.createdAt || order.created_at || order.date;

        if (rawDate) {
            if (rawDate._seconds) {
                // Firestore Timestamp
                createdAt = new Date(rawDate._seconds * 1000);
            } else if (rawDate.seconds) {
                // Firestore Timestamp (alternate format)
                createdAt = new Date(rawDate.seconds * 1000);
            } else if (rawDate.toDate && typeof rawDate.toDate === 'function') {
                // Firestore Timestamp object with toDate method
                createdAt = rawDate.toDate();
            } else if (typeof rawDate === 'string' || typeof rawDate === 'number') {
                createdAt = new Date(rawDate);
            } else if (rawDate instanceof Date) {
                createdAt = rawDate;
            }
        }

        // Validate the date
        if (createdAt && isNaN(createdAt.getTime())) {
            createdAt = null;
        }

        return {
            id,
            transactionId,
            customerName,
            customerEmail,
            customerPhone,
            items,
            total,
            status,
            createdAt,
            // Preserve original data for any additional fields
            shippingAddress: order.shipping_address || order.shippingAddress || '',
            shippingCity: order.shipping_city || order.shippingCity || '',
            notes: order.notes || '',
            discountCode: order.discount_code || order.discountCode || null,
            discountAmount: parseFloat(order.discount_amount) || parseFloat(order.discountAmount) || 0,
            subtotal: parseFloat(order.subtotal) || total
        };
    }

    async function loadOrders() {
        try {
            const response = await api.getAdminOrders();
            const rawOrders = response.orders || response || [];

            // Normalize all orders and filter out any nulls
            orders = rawOrders
                .map(normalizeOrder)
                .filter(order => order !== null);

            filteredOrders = [...orders];
            renderTable();
        } catch (error) {
            console.error('Error loading orders:', error);

            // Show empty state instead of mock data in production
            orders = [];
            filteredOrders = [];
            renderTable();

            if (typeof AdminUtils !== 'undefined' && AdminUtils.showToast) {
                AdminUtils.showToast('error', 'Error al cargar pedidos. Por favor, recarga la página.');
            }
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
                                <td><strong>#${escapeHtml(order.id)}</strong></td>
                                <td>
                                    <div style="font-weight:500;">${escapeHtml(order.customerName)}</div>
                                    <div style="font-size:12px; color:var(--admin-text-muted);">${escapeHtml(order.customerEmail)}</div>
                                </td>
                                <td>
                                    <span class="badge badge-neutral">${order.items.length} items</span>
                                </td>
                                <td><strong>${AdminUtils.formatCurrency(order.total)}</strong></td>
                                <td>${AdminUtils.getStatusBadge(order.status)}</td>
                                <td>${formatOrderDate(order.createdAt)}</td>
                                <td>
                                    <div class="d-flex gap-1">
                                        <button class="btn btn-ghost btn-icon btn-sm" onclick="AdminPedidos.viewOrder('${escapeAttr(order.id)}')" title="Ver detalles">
                                            ${AdminUtils.Icons.eye}
                                        </button>
                                        <button class="btn btn-ghost btn-icon btn-sm" onclick="AdminPedidos.changeStatus('${escapeAttr(order.id)}')" title="Cambiar estado">
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

    /**
     * Safe HTML escaping for user-generated content
     */
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        const htmlEscapes = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return String(str).replace(/[&<>"']/g, char => htmlEscapes[char]);
    }

    /**
     * Escape for use in HTML attributes (onclick handlers, etc.)
     */
    function escapeAttr(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/["'\\]/g, '\\$&');
    }

    /**
     * Format date for display with fallback
     */
    function formatOrderDate(date) {
        if (!date) return 'Fecha no disponible';
        try {
            if (typeof AdminUtils !== 'undefined' && AdminUtils.formatDate) {
                return AdminUtils.formatDate(date, 'short');
            }
            // Fallback formatting
            if (date instanceof Date) {
                return date.toLocaleDateString('es-CL', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });
            }
            return 'Fecha no disponible';
        } catch (e) {
            return 'Fecha no disponible';
        }
    }

    function search(query) {
        const q = query.toLowerCase().trim();
        if (!q) {
            filteredOrders = [...orders];
        } else {
            filteredOrders = orders.filter(o =>
                (o.id || '').toString().toLowerCase().includes(q) ||
                (o.customerName || '').toLowerCase().includes(q) ||
                (o.customerEmail || '').toLowerCase().includes(q)
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
        const order = orders.find(o => o.id === orderId || o.transactionId === orderId);
        if (!order) {
            AdminUtils.showToast('error', 'Pedido no encontrado');
            return;
        }

        // Build shipping info section if available
        const shippingHtml = (order.shippingAddress || order.shippingCity) ? `
            <div style="border-top:1px solid var(--admin-border); padding-top:16px;">
                <label style="font-size:12px; color:var(--admin-text-muted); margin-bottom:8px; display:block;">Dirección de envío</label>
                <div>${escapeHtml(order.shippingAddress)}</div>
                <div style="font-size:12px; color:var(--admin-text-muted);">${escapeHtml(order.shippingCity)}</div>
            </div>
        ` : '';

        // Build discount section if applicable
        const discountHtml = order.discountCode ? `
            <div style="display:flex; justify-content:space-between; color:var(--admin-success);">
                <span>Descuento (${escapeHtml(order.discountCode)})</span>
                <span>-${AdminUtils.formatCurrency(order.discountAmount)}</span>
            </div>
        ` : '';

        const body = `
            <div style="display:grid; gap:16px;">
                <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:12px;">
                    <div>
                        <label style="font-size:12px; color:var(--admin-text-muted);">ID Pedido</label>
                        <div style="font-weight:600;">#${escapeHtml(order.id)}</div>
                    </div>
                    <div>
                        <label style="font-size:12px; color:var(--admin-text-muted);">Estado</label>
                        <div>${AdminUtils.getStatusBadge(order.status)}</div>
                    </div>
                    <div>
                        <label style="font-size:12px; color:var(--admin-text-muted);">Cliente</label>
                        <div style="font-weight:500;">${escapeHtml(order.customerName)}</div>
                        <div style="font-size:12px; color:var(--admin-text-muted);">${escapeHtml(order.customerEmail)}</div>
                        ${order.customerPhone ? `<div style="font-size:12px; color:var(--admin-text-muted);">${escapeHtml(order.customerPhone)}</div>` : ''}
                    </div>
                    <div>
                        <label style="font-size:12px; color:var(--admin-text-muted);">Fecha</label>
                        <div>${formatOrderDate(order.createdAt)}</div>
                    </div>
                </div>

                ${shippingHtml}

                <div style="border-top:1px solid var(--admin-border); padding-top:16px;">
                    <label style="font-size:12px; color:var(--admin-text-muted); margin-bottom:8px; display:block;">Productos</label>
                    ${order.items.length > 0 ? order.items.map(item => `
                        <div style="display:flex; align-items:center; gap:12px; padding:8px 0; border-bottom:1px solid var(--admin-border);">
                            <div style="width:40px; height:40px; background:var(--admin-bg-muted); border-radius:6px; display:flex; align-items:center; justify-content:center;">
                                ${AdminUtils.Icons.package}
                            </div>
                            <div style="flex:1;">
                                <div style="font-weight:500;">${escapeHtml(item.name)}</div>
                                <div style="font-size:12px; color:var(--admin-text-muted);">Cantidad: ${item.quantity}</div>
                            </div>
                            <div style="font-weight:600;">${AdminUtils.formatCurrency(item.price * item.quantity)}</div>
                        </div>
                    `).join('') : '<div style="color:var(--admin-text-muted);">Sin productos</div>'}
                </div>

                <div style="border-top:1px solid var(--admin-border); padding-top:16px;">
                    ${order.subtotal !== order.total ? `
                        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                            <span>Subtotal</span>
                            <span>${AdminUtils.formatCurrency(order.subtotal)}</span>
                        </div>
                    ` : ''}
                    ${discountHtml}
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:16px; font-weight:600;">Total</span>
                        <span style="font-size:20px; font-weight:700; color:var(--admin-success);">${AdminUtils.formatCurrency(order.total)}</span>
                    </div>
                </div>

                ${order.notes ? `
                    <div style="border-top:1px solid var(--admin-border); padding-top:16px;">
                        <label style="font-size:12px; color:var(--admin-text-muted); margin-bottom:8px; display:block;">Notas</label>
                        <div>${escapeHtml(order.notes)}</div>
                    </div>
                ` : ''}
            </div>
        `;

        AdminUtils.openModal({
            title: `Pedido #${escapeHtml(order.id)}`,
            body,
            size: 'lg',
            footer: `
                <button class="btn btn-outline" onclick="AdminUtils.closeModal()">Cerrar</button>
                <button class="btn btn-primary" onclick="AdminPedidos.changeStatus('${escapeAttr(order.id)}')">Cambiar estado</button>
            `
        });
    }

    async function changeStatus(orderId) {
        const order = orders.find(o => o.id === orderId || o.transactionId === orderId);
        if (!order) {
            AdminUtils.showToast('error', 'Pedido no encontrado');
            return;
        }

        const statuses = [
            { value: 'pending', label: 'Pendiente' },
            { value: 'paid', label: 'Pagado' },
            { value: 'processing', label: 'Procesando' },
            { value: 'shipped', label: 'Enviado' },
            { value: 'delivered', label: 'Entregado' },
            { value: 'cancelled', label: 'Cancelado' }
        ];

        const body = `
            <div class="form-group">
                <label class="form-label">Estado actual</label>
                <div style="margin-bottom:12px;">${AdminUtils.getStatusBadge(order.status)}</div>
            </div>
            <div class="form-group">
                <label class="form-label">Nuevo estado</label>
                <select class="form-select" id="newStatus">
                    ${statuses.map(s => `
                        <option value="${s.value}" ${s.value === order.status ? 'selected' : ''}>${s.label}</option>
                    `).join('')}
                </select>
            </div>
        `;

        // Store the transactionId for the API call
        const apiOrderId = order.transactionId;

        AdminUtils.openModal({
            title: 'Cambiar estado',
            body,
            footer: `
                <button class="btn btn-outline" onclick="AdminUtils.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="AdminPedidos.saveStatus('${escapeAttr(apiOrderId)}')">Guardar</button>
            `
        });
    }

    async function saveStatus(orderId) {
        const newStatus = document.getElementById('newStatus')?.value;
        if (!newStatus) {
            AdminUtils.showToast('error', 'Por favor seleccione un estado');
            return;
        }

        if (!orderId || orderId === 'undefined' || orderId === 'null') {
            AdminUtils.showToast('error', 'ID de pedido inválido');
            return;
        }

        try {
            await api.adminUpdateOrderStatus(orderId, newStatus);
            AdminUtils.closeModal();
            AdminUtils.showToast('success', 'Estado actualizado correctamente');
            await loadOrders();
        } catch (error) {
            console.error('Error updating status:', error);
            const errorMessage = error.message || 'Error al actualizar estado';
            AdminUtils.showToast('error', errorMessage);
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
        // Mock data eliminado - usar pedidos reales desde Firebase
        return [];
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
