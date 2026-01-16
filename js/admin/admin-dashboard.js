/**
 * Admin Panel - Dashboard Module
 * Statistics and overview
 */

const AdminDashboard = (function() {
    'use strict';

    let stats = null;

    async function load(container) {
        container.innerHTML = `
            <div class="admin-page-header">
                <div class="page-title-group">
                    <h1 class="page-title">Dashboard</h1>
                    <p class="page-description">Resumen general de tu tienda</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-outline" onclick="AdminDashboard.refresh()">
                        ${AdminUtils.Icons.refresh}
                        Actualizar
                    </button>
                </div>
            </div>

            <div class="admin-content" id="dashboardContent">
                ${renderSkeletonStats()}
            </div>
        `;

        await loadStats();
    }

    async function loadStats() {
        const content = document.getElementById('dashboardContent');
        
        try {
            stats = await api.getAdminStats();
            renderContent(content);
        } catch (error) {
            console.error('Error loading stats:', error);
            // Use mock data for demo
            stats = getMockStats();
            renderContent(content);
        }
    }

    function renderContent(container) {
        container.innerHTML = `
            ${renderStats()}
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--spacing-lg); margin-top: var(--spacing-lg);">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            ${AdminUtils.Icons.trendingUp}
                            Ventas recientes
                        </h3>
                        <select class="filter-select" id="salesPeriod" onchange="AdminDashboard.updateChart()">
                            <option value="7">Últimos 7 días</option>
                            <option value="30" selected>Últimos 30 días</option>
                            <option value="90">Últimos 90 días</option>
                        </select>
                    </div>
                    <div class="card-body" id="salesChart">
                        ${renderSalesChart()}
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            ${AdminUtils.Icons.package}
                            Top productos
                        </h3>
                    </div>
                    <div class="card-body no-padding">
                        ${renderTopProducts()}
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: var(--spacing-lg); margin-top: var(--spacing-lg);">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Pedidos recientes</h3>
                        <a href="#pedidos" class="btn btn-ghost btn-sm">Ver todos</a>
                    </div>
                    <div class="card-body no-padding">
                        ${renderRecentOrders()}
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Actividad reciente</h3>
                    </div>
                    <div class="card-body">
                        ${renderActivity()}
                    </div>
                </div>
            </div>
        `;
    }

    function renderSkeletonStats() {
        return `
            <div class="stats-grid">
                ${[1,2,3,4].map(() => `
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <div class="skeleton skeleton-text" style="width:100px;"></div>
                            <div class="skeleton" style="width:36px;height:36px;border-radius:6px;"></div>
                        </div>
                        <div class="skeleton" style="width:120px;height:32px;margin-top:12px;"></div>
                        <div class="skeleton skeleton-text" style="width:80px;margin-top:8px;"></div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderStats() {
        const cards = [
            {
                title: 'Ventas totales',
                value: AdminUtils.formatCurrency(stats.totalSales || 0),
                change: stats.salesChange || 12.5,
                icon: AdminUtils.Icons.dollarSign,
                iconClass: 'success'
            },
            {
                title: 'Pedidos',
                value: AdminUtils.formatNumber(stats.totalOrders || 0),
                change: stats.ordersChange || 8.2,
                icon: AdminUtils.Icons.shoppingBag,
                iconClass: 'primary'
            },
            {
                title: 'Productos',
                value: AdminUtils.formatNumber(stats.totalProducts || 0),
                change: stats.productsChange || 3.1,
                icon: AdminUtils.Icons.package,
                iconClass: 'warning'
            },
            {
                title: 'Usuarios',
                value: AdminUtils.formatNumber(stats.totalUsers || 0),
                change: stats.usersChange || 15.3,
                icon: AdminUtils.Icons.users,
                iconClass: 'info'
            }
        ];

        return `
            <div class="stats-grid">
                ${cards.map(card => `
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <span class="stat-card-title">${card.title}</span>
                            <div class="stat-card-icon ${card.iconClass}">${card.icon}</div>
                        </div>
                        <div class="stat-card-value">${card.value}</div>
                        <div class="stat-card-change ${card.change >= 0 ? 'positive' : 'negative'}">
                            ${card.change >= 0 ? AdminUtils.Icons.trendingUp : AdminUtils.Icons.trendingDown}
                            ${Math.abs(card.change)}% vs mes anterior
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderSalesChart() {
        // CSS-based bar chart
        const data = stats.salesData || [
            { label: 'Lun', value: 4200 },
            { label: 'Mar', value: 5800 },
            { label: 'Mié', value: 3100 },
            { label: 'Jue', value: 6700 },
            { label: 'Vie', value: 8200 },
            { label: 'Sáb', value: 7100 },
            { label: 'Dom', value: 4500 }
        ];

        const max = Math.max(...data.map(d => d.value));

        return `
            <div style="display:flex; align-items:flex-end; gap:8px; height:200px; padding-top:20px;">
                ${data.map(item => {
                    const height = (item.value / max) * 100;
                    return `
                        <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:8px;">
                            <div style="width:100%; height:${height}%; background: linear-gradient(180deg, var(--admin-primary) 0%, var(--admin-primary-hover) 100%); border-radius: 4px 4px 0 0; min-height:4px; position:relative;" title="${AdminUtils.formatCurrency(item.value)}">
                            </div>
                            <span style="font-size:11px; color:var(--admin-text-muted);">${item.label}</span>
                        </div>
                    `;
                }).join('')}
            </div>
            <div style="text-align:center; margin-top:16px; padding-top:16px; border-top:1px solid var(--admin-border);">
                <span style="font-size:13px; color:var(--admin-text-secondary);">
                    Total del período: <strong style="color:var(--admin-text);">${AdminUtils.formatCurrency(data.reduce((a,b) => a + b.value, 0))}</strong>
                </span>
            </div>
        `;
    }

    function renderTopProducts() {
        const products = stats.topProducts || [
            { name: 'Producto Premium', sales: 145, revenue: 1450000 },
            { name: 'Producto Básico', sales: 120, revenue: 360000 },
            { name: 'Producto Especial', sales: 89, revenue: 890000 },
            { name: 'Producto Nuevo', sales: 67, revenue: 335000 },
            { name: 'Producto Classic', sales: 45, revenue: 225000 }
        ];

        const maxSales = Math.max(...products.map(p => p.sales));

        return `
            <div style="padding: 12px 0;">
                ${products.map((product, i) => `
                    <div style="display:flex; align-items:center; padding: 10px 16px; gap: 12px; ${i < products.length - 1 ? 'border-bottom: 1px solid var(--admin-border);' : ''}">
                        <span style="width: 20px; font-size: 12px; font-weight: 600; color: var(--admin-text-muted);">${i + 1}</span>
                        <div style="flex:1; min-width:0;">
                            <div style="font-size: 13px; font-weight: 500; color: var(--admin-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${product.name}</div>
                            <div style="font-size: 12px; color: var(--admin-text-muted);">${product.sales} vendidos</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size: 13px; font-weight: 600; color: var(--admin-success);">${AdminUtils.formatCurrency(product.revenue)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderRecentOrders() {
        const orders = stats.recentOrders || [
            { id: '#1234', customer: 'Juan Pérez', total: 89900, status: 'paid', date: new Date() },
            { id: '#1233', customer: 'María García', total: 156000, status: 'processing', date: new Date(Date.now() - 3600000) },
            { id: '#1232', customer: 'Carlos López', total: 45000, status: 'pending', date: new Date(Date.now() - 7200000) },
            { id: '#1231', customer: 'Ana Martínez', total: 234500, status: 'shipped', date: new Date(Date.now() - 86400000) }
        ];

        if (orders.length === 0) {
            return `
                <div class="empty-state" style="padding: 32px;">
                    <p style="color: var(--admin-text-muted);">No hay pedidos recientes</p>
                </div>
            `;
        }

        return `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Pedido</th>
                            <th>Cliente</th>
                            <th>Total</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map(order => `
                            <tr>
                                <td><strong>${order.id}</strong></td>
                                <td>${order.customer}</td>
                                <td>${AdminUtils.formatCurrency(order.total)}</td>
                                <td>${AdminUtils.getStatusBadge(order.status)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function renderActivity() {
        const activities = [
            { type: 'order', message: 'Nuevo pedido #1234', time: 'Hace 5 min' },
            { type: 'user', message: 'Nuevo usuario registrado', time: 'Hace 15 min' },
            { type: 'product', message: 'Stock bajo en "Producto X"', time: 'Hace 1 hora' },
            { type: 'order', message: 'Pedido #1230 entregado', time: 'Hace 2 horas' }
        ];

        const icons = {
            order: AdminUtils.Icons.shoppingBag,
            user: AdminUtils.Icons.users,
            product: AdminUtils.Icons.package
        };

        return `
            <div style="display:flex; flex-direction:column; gap:12px;">
                ${activities.map(activity => `
                    <div style="display:flex; align-items:flex-start; gap:12px;">
                        <div style="width:32px; height:32px; border-radius:50%; background:var(--admin-bg-muted); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                            <div style="width:16px; height:16px; color:var(--admin-text-muted);">${icons[activity.type]}</div>
                        </div>
                        <div style="flex:1;">
                            <div style="font-size:13px; color:var(--admin-text);">${activity.message}</div>
                            <div style="font-size:12px; color:var(--admin-text-muted);">${activity.time}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function getMockStats() {
        return {
            totalSales: 12500000,
            totalOrders: 256,
            totalProducts: 89,
            totalUsers: 1240,
            salesChange: 12.5,
            ordersChange: 8.2,
            productsChange: 3.1,
            usersChange: 15.3
        };
    }

    async function refresh() {
        AdminUtils.showToast('info', 'Actualizando datos...');
        await loadStats();
        AdminUtils.showToast('success', 'Dashboard actualizado');
    }

    function updateChart() {
        const period = document.getElementById('salesPeriod')?.value || '30';
        // In real implementation, fetch data for the period
        const chartContainer = document.getElementById('salesChart');
        if (chartContainer) {
            chartContainer.innerHTML = renderSalesChart();
        }
    }

    return {
        load,
        refresh,
        updateChart
    };

})();
