/**
 * Admin Panel - Reports Module
 */

const AdminReportes = (function() {
    'use strict';

    let currentTab = 'ventas';

    async function load(container) {
        container.innerHTML = `
            <div class="admin-page-header">
                <div class="page-title-group">
                    <h1 class="page-title">Reportes</h1>
                    <p class="page-description">Estadísticas y análisis de tu tienda</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-outline" onclick="AdminReportes.exportReport()">
                        ${AdminUtils.Icons.download}
                        Exportar
                    </button>
                </div>
            </div>

            <div class="admin-content">
                <div class="tabs" id="reportTabs">
                    <button class="tab ${currentTab === 'ventas' ? 'active' : ''}" onclick="AdminReportes.switchTab('ventas')">Ventas</button>
                    <button class="tab ${currentTab === 'productos' ? 'active' : ''}" onclick="AdminReportes.switchTab('productos')">Productos</button>
                    <button class="tab ${currentTab === 'clientes' ? 'active' : ''}" onclick="AdminReportes.switchTab('clientes')">Clientes</button>
                </div>

                <div id="reportContent">
                    ${renderTabContent()}
                </div>
            </div>
        `;
    }

    function switchTab(tab) {
        currentTab = tab;
        
        // Update tab buttons
        document.querySelectorAll('.tab').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.tab[onclick*="${tab}"]`)?.classList.add('active');
        
        // Render content
        document.getElementById('reportContent').innerHTML = renderTabContent();
    }

    function renderTabContent() {
        switch (currentTab) {
            case 'ventas':
                return renderVentasReport();
            case 'productos':
                return renderProductosReport();
            case 'clientes':
                return renderClientesReport();
            default:
                return '';
        }
    }

    function renderVentasReport() {
        const data = {
            totalVentas: 12500000,
            pedidos: 256,
            ticketPromedio: 48828,
            conversionRate: 3.2
        };

        return `
            <div class="stats-grid mb-4">
                <div class="stat-card">
                    <div class="stat-card-header">
                        <span class="stat-card-title">Ventas totales</span>
                        <div class="stat-card-icon success">${AdminUtils.Icons.dollarSign}</div>
                    </div>
                    <div class="stat-card-value">${AdminUtils.formatCurrency(data.totalVentas)}</div>
                    <div class="stat-card-change positive">
                        ${AdminUtils.Icons.trendingUp}
                        12.5% vs mes anterior
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-header">
                        <span class="stat-card-title">Pedidos</span>
                        <div class="stat-card-icon primary">${AdminUtils.Icons.shoppingBag}</div>
                    </div>
                    <div class="stat-card-value">${AdminUtils.formatNumber(data.pedidos)}</div>
                    <div class="stat-card-change positive">
                        ${AdminUtils.Icons.trendingUp}
                        8.2% vs mes anterior
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-header">
                        <span class="stat-card-title">Ticket promedio</span>
                        <div class="stat-card-icon warning">${AdminUtils.Icons.dollarSign}</div>
                    </div>
                    <div class="stat-card-value">${AdminUtils.formatCurrency(data.ticketPromedio)}</div>
                    <div class="stat-card-change positive">
                        ${AdminUtils.Icons.trendingUp}
                        3.8% vs mes anterior
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-header">
                        <span class="stat-card-title">Tasa de conversión</span>
                        <div class="stat-card-icon info">${AdminUtils.Icons.trendingUp}</div>
                    </div>
                    <div class="stat-card-value">${data.conversionRate}%</div>
                    <div class="stat-card-change negative">
                        ${AdminUtils.Icons.trendingDown}
                        0.5% vs mes anterior
                    </div>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Ventas por mes</h3>
                    </div>
                    <div class="card-body">
                        ${renderBarChart([
                            { label: 'Ene', value: 3200000, max: 5000000 },
                            { label: 'Feb', value: 2800000, max: 5000000 },
                            { label: 'Mar', value: 3500000, max: 5000000 },
                            { label: 'Abr', value: 4100000, max: 5000000 },
                            { label: 'May', value: 3800000, max: 5000000 },
                            { label: 'Jun', value: 4500000, max: 5000000 }
                        ])}
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Métodos de pago</h3>
                    </div>
                    <div class="card-body">
                        ${renderPieChart([
                            { label: 'Webpay', value: 65, color: '#8b5cf6' },
                            { label: 'Transferencia', value: 25, color: '#22c55e' },
                            { label: 'Efectivo', value: 10, color: '#3b82f6' }
                        ])}
                    </div>
                </div>
            </div>
        `;
    }

    function renderProductosReport() {
        const topProducts = [
            { name: 'Producto Premium', sales: 145, revenue: 1450000 },
            { name: 'Producto Básico', sales: 120, revenue: 360000 },
            { name: 'Producto Especial', sales: 89, revenue: 890000 },
            { name: 'Producto Nuevo', sales: 67, revenue: 335000 },
            { name: 'Producto Classic', sales: 45, revenue: 225000 }
        ];

        const categories = [
            { name: 'Categoría 1', value: 45 },
            { name: 'Categoría 2', value: 30 },
            { name: 'Categoría 3', value: 15 },
            { name: 'Otros', value: 10 }
        ];

        return `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Top productos vendidos</h3>
                    </div>
                    <div class="card-body no-padding">
                        <div class="table-container">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Producto</th>
                                        <th>Ventas</th>
                                        <th>Ingresos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${topProducts.map((p, i) => `
                                        <tr>
                                            <td><strong>${i + 1}</strong></td>
                                            <td>${p.name}</td>
                                            <td>${p.sales}</td>
                                            <td><strong style="color:var(--admin-success);">${AdminUtils.formatCurrency(p.revenue)}</strong></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Ventas por categoría</h3>
                    </div>
                    <div class="card-body">
                        ${renderPieChart(categories.map((c, i) => ({
                            label: c.name,
                            value: c.value,
                            color: ['#8b5cf6', '#22c55e', '#3b82f6', '#eab308'][i]
                        })))}
                    </div>
                </div>
            </div>

            <div class="card mt-4">
                <div class="card-header">
                    <h3 class="card-title">Productos con stock bajo</h3>
                </div>
                <div class="card-body">
                    <div class="alert alert-warning">
                        <div class="alert-icon">${AdminUtils.Icons.warning}</div>
                        <div class="alert-content">
                            <div class="alert-title">Atención</div>
                            <div class="alert-message">Hay 5 productos con stock menor a 10 unidades</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderClientesReport() {
        const clientStats = {
            totalClientes: 1240,
            nuevosClientes: 85,
            recurrentes: 420,
            retention: 33.8
        };

        return `
            <div class="stats-grid mb-4">
                <div class="stat-card">
                    <div class="stat-card-header">
                        <span class="stat-card-title">Total clientes</span>
                        <div class="stat-card-icon primary">${AdminUtils.Icons.users}</div>
                    </div>
                    <div class="stat-card-value">${AdminUtils.formatNumber(clientStats.totalClientes)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-header">
                        <span class="stat-card-title">Nuevos (este mes)</span>
                        <div class="stat-card-icon success">${AdminUtils.Icons.users}</div>
                    </div>
                    <div class="stat-card-value">${AdminUtils.formatNumber(clientStats.nuevosClientes)}</div>
                    <div class="stat-card-change positive">
                        ${AdminUtils.Icons.trendingUp}
                        15.3% vs mes anterior
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-header">
                        <span class="stat-card-title">Recurrentes</span>
                        <div class="stat-card-icon info">${AdminUtils.Icons.users}</div>
                    </div>
                    <div class="stat-card-value">${AdminUtils.formatNumber(clientStats.recurrentes)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-header">
                        <span class="stat-card-title">Tasa de retención</span>
                        <div class="stat-card-icon warning">${AdminUtils.Icons.trendingUp}</div>
                    </div>
                    <div class="stat-card-value">${clientStats.retention}%</div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Top clientes por compras</h3>
                </div>
                <div class="card-body no-padding">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Cliente</th>
                                    <th>Pedidos</th>
                                    <th>Total gastado</th>
                                    <th>Última compra</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${[
                                    { name: 'María García', email: 'maria@email.com', orders: 12, total: 1560000, lastPurchase: new Date(Date.now() - 86400000 * 3) },
                                    { name: 'Carlos López', email: 'carlos@email.com', orders: 8, total: 890000, lastPurchase: new Date(Date.now() - 86400000 * 7) },
                                    { name: 'Ana Martínez', email: 'ana@email.com', orders: 7, total: 720000, lastPurchase: new Date(Date.now() - 86400000 * 2) },
                                    { name: 'Juan Pérez', email: 'juan@email.com', orders: 5, total: 450000, lastPurchase: new Date(Date.now() - 86400000 * 15) },
                                    { name: 'Pedro Sánchez', email: 'pedro@email.com', orders: 4, total: 380000, lastPurchase: new Date(Date.now() - 86400000 * 30) }
                                ].map((c, i) => `
                                    <tr>
                                        <td><strong>${i + 1}</strong></td>
                                        <td>
                                            <div style="font-weight:500;">${c.name}</div>
                                            <div style="font-size:12px;color:var(--admin-text-muted);">${c.email}</div>
                                        </td>
                                        <td>${c.orders}</td>
                                        <td><strong style="color:var(--admin-success);">${AdminUtils.formatCurrency(c.total)}</strong></td>
                                        <td>${AdminUtils.formatDate(c.lastPurchase, 'relative')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    function renderBarChart(data) {
        const max = Math.max(...data.map(d => d.value));
        
        return `
            <div class="bar-chart">
                ${data.map(item => `
                    <div class="bar-item">
                        <span class="bar-label">${item.label}</span>
                        <div class="bar-track">
                            <div class="bar-fill" style="width:${(item.value / max) * 100}%;">
                                <span class="bar-value">${AdminUtils.formatCurrency(item.value)}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderPieChart(data) {
        const total = data.reduce((sum, d) => sum + d.value, 0);
        
        return `
            <div style="display:flex;align-items:center;gap:24px;">
                <div style="width:120px;height:120px;border-radius:50%;background:conic-gradient(${generateConicGradient(data)});flex-shrink:0;"></div>
                <div class="pie-legend">
                    ${data.map(item => `
                        <div class="pie-legend-item">
                            <span class="pie-legend-color" style="background:${item.color};"></span>
                            <span>${item.label}</span>
                            <strong style="margin-left:auto;">${item.value}%</strong>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function generateConicGradient(data) {
        let accumulated = 0;
        const gradientParts = [];
        
        data.forEach(item => {
            const start = accumulated;
            accumulated += (item.value / 100) * 360;
            gradientParts.push(`${item.color} ${start}deg ${accumulated}deg`);
        });
        
        return gradientParts.join(', ');
    }

    function exportReport() {
        AdminUtils.showToast('info', 'Generando reporte...');
        setTimeout(() => {
            AdminUtils.showToast('success', `Reporte de ${currentTab} exportado`);
        }, 1500);
    }

    return {
        load,
        switchTab,
        exportReport
    };

})();
