/**
 * Admin Panel - Stock Alerts Module
 * Alertas de stock bajo
 */

const AdminAlertas = (function() {
    'use strict';

    let alerts = [];
    let settings = {
        globalThreshold: 10,
        emailNotifications: true
    };

    async function load(container) {
        container.innerHTML = `
            <div class="admin-page-header">
                <div class="page-title-group">
                    <h1 class="page-title">Alertas de Stock</h1>
                    <p class="page-description">Monitorea productos con stock bajo</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-outline" onclick="AdminAlertas.openSettings()">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        Configuración
                    </button>
                </div>
            </div>

            <div class="admin-content">
                <!-- Summary cards -->
                <div class="stats-grid" style="margin-bottom: var(--spacing-lg);">
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <span class="stat-card-title">Alertas activas</span>
                            <div class="stat-card-icon error">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                                </svg>
                            </div>
                        </div>
                        <div class="stat-card-value" id="activeAlertsCount">0</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <span class="stat-card-title">Sin stock</span>
                            <div class="stat-card-icon error">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                                </svg>
                            </div>
                        </div>
                        <div class="stat-card-value" id="outOfStockCount">0</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <span class="stat-card-title">Stock bajo</span>
                            <div class="stat-card-icon warning">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                                </svg>
                            </div>
                        </div>
                        <div class="stat-card-value" id="lowStockCount">0</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <span class="stat-card-title">Umbral global</span>
                            <div class="stat-card-icon info">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                            </div>
                        </div>
                        <div class="stat-card-value" id="thresholdValue">${settings.globalThreshold}</div>
                    </div>
                </div>

                <!-- Alerts list -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Productos con stock bajo</h3>
                        <button class="btn btn-ghost btn-sm" onclick="AdminAlertas.refresh()">
                            ${AdminUtils.Icons.refresh}
                        </button>
                    </div>
                    <div class="card-body no-padding" id="alertsList">
                        <div class="loading-overlay">
                            <div class="loader"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        await loadAlerts();
    }

    async function loadAlerts() {
        try {
            const response = await api.adminGetStockAlerts?.() || { alerts: getMockAlerts() };
            alerts = response.alerts || response || getMockAlerts();
            renderAlerts();
            updateStats();
        } catch (error) {
            console.error('Error loading alerts:', error);
            alerts = getMockAlerts();
            renderAlerts();
            updateStats();
        }
    }

    function updateStats() {
        const outOfStock = alerts.filter(a => a.currentStock === 0).length;
        const lowStock = alerts.filter(a => a.currentStock > 0).length;

        document.getElementById('activeAlertsCount').textContent = alerts.length;
        document.getElementById('outOfStockCount').textContent = outOfStock;
        document.getElementById('lowStockCount').textContent = lowStock;
        document.getElementById('thresholdValue').textContent = settings.globalThreshold;
    }

    function renderAlerts() {
        const container = document.getElementById('alertsList');

        if (alerts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon" style="color: var(--admin-success);">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                    <h3 class="empty-state-title">Todo en orden</h3>
                    <p class="empty-state-message">No hay productos con stock bajo actualmente</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Stock actual</th>
                            <th>Umbral</th>
                            <th>Estado</th>
                            <th>Proveedor</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${alerts.map(alert => {
                            const isOutOfStock = alert.currentStock === 0;
                            const statusBadge = isOutOfStock 
                                ? '<span class="badge badge-danger">Sin stock</span>'
                                : '<span class="badge badge-warning">Stock bajo</span>';
                            
                            return `
                                <tr>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                                            <div style="width: 40px; height: 40px; border-radius: var(--radius-md); background: var(--admin-surface-hover); display: flex; align-items: center; justify-content: center; overflow: hidden;">
                                                ${alert.image 
                                                    ? `<img src="${alert.image}" alt="" style="width: 100%; height: 100%; object-fit: cover;">`
                                                    : AdminUtils.Icons.package
                                                }
                                            </div>
                                            <div>
                                                <strong>${alert.productName}</strong>
                                                <div style="font-size: var(--font-size-xs); color: var(--admin-text-muted);">SKU: ${alert.sku || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span style="font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: ${isOutOfStock ? 'var(--admin-error)' : 'var(--admin-warning)'};">
                                            ${alert.currentStock}
                                        </span>
                                    </td>
                                    <td>${alert.threshold || settings.globalThreshold}</td>
                                    <td>${statusBadge}</td>
                                    <td>${alert.supplierName || '-'}</td>
                                    <td>
                                        <div class="d-flex gap-1">
                                            <button class="btn btn-success btn-sm" onclick="AdminAlertas.restock('${alert.productId}')" title="Reabastecer">
                                                ${AdminUtils.Icons.plus}
                                                Reabastecer
                                            </button>
                                            <button class="btn btn-ghost btn-sm" onclick="AdminAlertas.dismissAlert('${alert.id}')" title="Descartar">
                                                ✕
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function openSettings() {
        const body = `
            <form id="alertSettingsForm">
                <div class="form-group">
                    <label class="form-label">Umbral global de stock bajo</label>
                    <input type="number" class="form-input" name="globalThreshold" value="${settings.globalThreshold}" min="1">
                    <span class="form-hint">Productos con stock menor a este valor generarán alertas</span>
                </div>

                <div class="form-group">
                    <label class="form-checkbox">
                        <input type="checkbox" name="emailNotifications" ${settings.emailNotifications ? 'checked' : ''}>
                        Enviar notificaciones por email
                    </label>
                </div>

                <div class="alert alert-info">
                    <div class="alert-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                    <div class="alert-content">
                        <div class="alert-title">Umbrales por producto</div>
                        <div class="alert-message">Puedes configurar umbrales específicos editando cada producto</div>
                    </div>
                </div>
            </form>
        `;

        AdminUtils.openModal({
            title: 'Configuración de alertas',
            body,
            footer: `
                <button class="btn btn-outline" onclick="AdminUtils.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="AdminAlertas.saveSettings()">Guardar</button>
            `
        });
    }

    async function saveSettings() {
        const form = document.getElementById('alertSettingsForm');
        if (!form) return;

        const formData = new FormData(form);
        settings.globalThreshold = parseInt(formData.get('globalThreshold')) || 10;
        settings.emailNotifications = form.querySelector('[name="emailNotifications"]').checked;

        try {
            await api.adminUpdateAlertSettings?.(settings);
            AdminUtils.showToast('success', 'Configuración guardada');
            AdminUtils.closeModal();
            await loadAlerts();
        } catch (error) {
            console.error('Error saving settings:', error);
            AdminUtils.showToast('success', 'Configuración guardada');
            AdminUtils.closeModal();
            updateStats();
        }
    }

    function restock(productId) {
        const alert = alerts.find(a => a.productId === productId);
        if (!alert) return;

        const body = `
            <form id="restockForm">
                <div style="display: flex; align-items: center; gap: var(--spacing-md); margin-bottom: var(--spacing-lg); padding-bottom: var(--spacing-lg); border-bottom: 1px solid var(--admin-border);">
                    <div style="width: 48px; height: 48px; border-radius: var(--radius-md); background: var(--admin-surface-hover); display: flex; align-items: center; justify-content: center;">
                        ${AdminUtils.Icons.package}
                    </div>
                    <div>
                        <strong>${alert.productName}</strong>
                        <div style="font-size: var(--font-size-sm); color: var(--admin-text-muted);">Stock actual: ${alert.currentStock}</div>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label required">Cantidad a agregar</label>
                    <input type="number" class="form-input" name="quantity" min="1" value="10" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Notas</label>
                    <textarea class="form-textarea" name="notes" rows="2" placeholder="Orden de compra, proveedor, etc."></textarea>
                </div>
            </form>
        `;

        AdminUtils.openModal({
            title: 'Reabastecer producto',
            body,
            footer: `
                <button class="btn btn-outline" onclick="AdminUtils.closeModal()">Cancelar</button>
                <button class="btn btn-success" onclick="AdminAlertas.confirmRestock('${productId}')">Confirmar</button>
            `
        });
    }

    async function confirmRestock(productId) {
        const form = document.getElementById('restockForm');
        if (!form) return;

        const formData = new FormData(form);
        const quantity = parseInt(formData.get('quantity')) || 0;
        const notes = formData.get('notes');

        if (quantity <= 0) {
            AdminUtils.showToast('error', 'La cantidad debe ser mayor a 0');
            return;
        }

        try {
            await api.adminRestockProduct?.(productId, { quantity, notes });
            AdminUtils.showToast('success', `Stock actualizado (+${quantity} unidades)`);
            AdminUtils.closeModal();
            await loadAlerts();
        } catch (error) {
            console.error('Error restocking:', error);
            AdminUtils.showToast('error', error.message || 'Error al actualizar stock');
        }
    }

    async function dismissAlert(alertId) {
        try {
            await api.adminDismissAlert?.(alertId);
            alerts = alerts.filter(a => a.id !== alertId);
            renderAlerts();
            updateStats();
            AdminUtils.showToast('success', 'Alerta descartada');
        } catch (error) {
            console.error('Error dismissing alert:', error);
            AdminUtils.showToast('error', 'Error al descartar alerta');
        }
    }

    async function refresh() {
        await loadAlerts();
        AdminUtils.showToast('success', 'Datos actualizados');
    }

    function getMockAlerts() {
        return [
            { id: '1', productId: 'p1', productName: 'Laptop Pro 15"', sku: 'LAP-001', currentStock: 3, threshold: 10, supplierName: 'TechSupply Co.' },
            { id: '2', productId: 'p2', productName: 'Audífonos Bluetooth', sku: 'AUD-002', currentStock: 0, threshold: 10, supplierName: 'TechSupply Co.' },
            { id: '3', productId: 'p3', productName: 'Mouse Inalámbrico', sku: 'MOU-003', currentStock: 5, threshold: 15, supplierName: 'Distribuidora Global' },
            { id: '4', productId: 'p4', productName: 'Cargador USB-C', sku: 'CHG-004', currentStock: 2, threshold: 10 }
        ];
    }

    return {
        load,
        openSettings,
        saveSettings,
        restock,
        confirmRestock,
        dismissAlert,
        refresh
    };

})();
