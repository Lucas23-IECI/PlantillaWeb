/**
 * Admin Panel - Discount Codes Module
 */

const AdminDescuentos = (function() {
    'use strict';

    let codes = [];

    async function load(container) {
        container.innerHTML = `
            <div class="admin-page-header">
                <div class="page-title-group">
                    <h1 class="page-title">Códigos de descuento</h1>
                    <p class="page-description">Gestiona cupones y promociones</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-primary" onclick="AdminDescuentos.createCode()">
                        ${AdminUtils.Icons.plus}
                        Nuevo código
                    </button>
                </div>
            </div>

            <div class="admin-content">
                <div class="card">
                    <div class="card-body no-padding" id="codesTable">
                        ${AdminUtils.renderSkeleton('table', 3)}
                    </div>
                </div>
            </div>
        `;

        await loadCodes();
    }

    async function loadCodes() {
        try {
            const response = await api.adminListDiscountCodes();
            codes = response.codes || response || [];
            renderTable();
        } catch (error) {
            console.error('Error loading discount codes:', error);
            codes = getMockCodes();
            renderTable();
        }
    }

    function renderTable() {
        const tableContainer = document.getElementById('codesTable');

        if (codes.length === 0) {
            tableContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                        </svg>
                    </div>
                    <h3 class="empty-state-title">Sin códigos</h3>
                    <p class="empty-state-message">Crea tu primer código de descuento</p>
                    <button class="btn btn-primary" onclick="AdminDescuentos.createCode()">
                        ${AdminUtils.Icons.plus} Crear código
                    </button>
                </div>
            `;
            return;
        }

        tableContainer.innerHTML = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Descuento</th>
                            <th>Usos</th>
                            <th>Válido hasta</th>
                            <th>Estado</th>
                            <th style="width:100px;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${codes.map(code => `
                            <tr>
                                <td>
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <code style="background:var(--admin-bg-muted);padding:4px 8px;border-radius:4px;font-weight:600;">${code.code}</code>
                                        <button class="btn btn-ghost btn-icon btn-sm" onclick="navigator.clipboard.writeText('${code.code}'); AdminUtils.showToast('success', 'Código copiado');" title="Copiar">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="14" height="14">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                                <td>
                                    <strong style="color:var(--admin-success);">
                                        ${code.type === 'percentage' ? `${code.value}%` : AdminUtils.formatCurrency(code.value)}
                                    </strong>
                                </td>
                                <td>${code.usedCount || 0}${code.maxUses ? ` / ${code.maxUses}` : ''}</td>
                                <td>${code.expiresAt ? AdminUtils.formatDate(code.expiresAt, 'short') : 'Sin límite'}</td>
                                <td>${AdminUtils.getStatusBadge(code.active ? 'enabled' : 'disabled')}</td>
                                <td>
                                    <div class="d-flex gap-1">
                                        <button class="btn btn-ghost btn-icon btn-sm" onclick="AdminDescuentos.editCode('${code.code}')" title="Editar">
                                            ${AdminUtils.Icons.edit}
                                        </button>
                                        <button class="btn btn-ghost btn-icon btn-sm" onclick="AdminDescuentos.deleteCode('${code.code}')" title="Eliminar">
                                            ${AdminUtils.Icons.trash}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function createCode() {
        openCodeModal();
    }

    function editCode(codeId) {
        const code = codes.find(c => c.code === codeId);
        if (code) {
            openCodeModal(code);
        }
    }

    function openCodeModal(code = null) {
        const isEdit = !!code;
        const title = isEdit ? 'Editar código' : 'Nuevo código de descuento';

        const body = `
            <form id="codeForm">
                <div class="form-group">
                    <label class="form-label required">Código</label>
                    <input type="text" class="form-input" name="code" value="${code?.code || ''}" ${isEdit ? 'readonly style="opacity:0.6;"' : ''} required placeholder="VERANO2024" style="text-transform:uppercase;">
                    ${isEdit ? '<span class="form-hint">El código no se puede modificar</span>' : '<span class="form-hint">Sin espacios ni caracteres especiales</span>'}
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label required">Tipo de descuento</label>
                        <select class="form-select" name="type">
                            <option value="percentage" ${code?.type === 'percentage' ? 'selected' : ''}>Porcentaje (%)</option>
                            <option value="fixed" ${code?.type === 'fixed' ? 'selected' : ''}>Monto fijo ($)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label required">Valor</label>
                        <input type="number" class="form-input" name="value" value="${code?.value || ''}" required placeholder="10">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Mínimo de compra</label>
                        <input type="number" class="form-input" name="minPurchase" value="${code?.minPurchase || ''}" placeholder="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Usos máximos</label>
                        <input type="number" class="form-input" name="maxUses" value="${code?.maxUses || ''}" placeholder="Sin límite">
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Válido hasta</label>
                    <input type="datetime-local" class="form-input" name="expiresAt" value="${code?.expiresAt ? new Date(code.expiresAt).toISOString().slice(0, 16) : ''}">
                </div>

                <div class="form-group">
                    <label class="form-checkbox">
                        <input type="checkbox" name="active" ${code?.active !== false ? 'checked' : ''}>
                        Código activo
                    </label>
                </div>
            </form>
        `;

        AdminUtils.openModal({
            title,
            body,
            footer: `
                <button class="btn btn-outline" onclick="AdminUtils.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="AdminDescuentos.saveCode('${code?.code || ''}')">
                    ${isEdit ? 'Guardar cambios' : 'Crear código'}
                </button>
            `
        });
    }

    async function saveCode(originalCode) {
        const form = document.getElementById('codeForm');
        if (!form) return;

        const formData = new FormData(form);
        const data = {
            code: formData.get('code').toUpperCase().trim(),
            type: formData.get('type'),
            value: parseFloat(formData.get('value')) || 0,
            minPurchase: parseFloat(formData.get('minPurchase')) || 0,
            maxUses: parseInt(formData.get('maxUses')) || null,
            expiresAt: formData.get('expiresAt') || null,
            active: form.querySelector('[name="active"]').checked
        };

        if (!data.code || !data.value) {
            AdminUtils.showToast('error', 'Código y valor son obligatorios');
            return;
        }

        try {
            if (originalCode) {
                await api.adminUpdateDiscountCode(originalCode, data);
                AdminUtils.showToast('success', 'Código actualizado');
            } else {
                await api.adminCreateDiscountCode(data);
                AdminUtils.showToast('success', 'Código creado');
            }
            AdminUtils.closeModal();
            await loadCodes();
        } catch (error) {
            console.error('Error saving code:', error);
            AdminUtils.showToast('error', error.message || 'Error al guardar código');
        }
    }

    async function deleteCode(codeId) {
        const confirmed = await AdminUtils.confirm(`¿Eliminar el código "${codeId}"?`, 'Eliminar código');
        if (!confirmed) return;

        try {
            await api.adminDeleteDiscountCode(codeId);
            AdminUtils.showToast('success', 'Código eliminado');
            await loadCodes();
        } catch (error) {
            console.error('Error deleting code:', error);
            AdminUtils.showToast('error', error.message || 'Error al eliminar código');
        }
    }

    function getMockCodes() {
        return [
            { code: 'VERANO2024', type: 'percentage', value: 15, usedCount: 45, maxUses: 100, expiresAt: new Date(Date.now() + 86400000 * 30), active: true },
            { code: 'BIENVENIDO', type: 'percentage', value: 10, usedCount: 128, maxUses: null, expiresAt: null, active: true },
            { code: 'DESCUENTO20K', type: 'fixed', value: 20000, usedCount: 12, maxUses: 50, minPurchase: 100000, expiresAt: new Date(Date.now() + 86400000 * 15), active: true },
            { code: 'NAVIDAD', type: 'percentage', value: 25, usedCount: 200, maxUses: 200, expiresAt: new Date(Date.now() - 86400000 * 30), active: false }
        ];
    }

    return {
        load,
        createCode,
        editCode,
        saveCode,
        deleteCode
    };

})();
