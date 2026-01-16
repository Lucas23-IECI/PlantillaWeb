/**
 * Admin Panel - Notices/Banners Module
 */

const AdminAvisos = (function() {
    'use strict';

    let notices = [];

    async function load(container) {
        container.innerHTML = `
            <div class="admin-page-header">
                <div class="page-title-group">
                    <h1 class="page-title">Avisos y banners</h1>
                    <p class="page-description">Gestiona notificaciones y promociones visibles</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-primary" onclick="AdminAvisos.createNotice()">
                        ${AdminUtils.Icons.plus}
                        Nuevo aviso
                    </button>
                </div>
            </div>

            <div class="admin-content">
                <div class="card">
                    <div class="card-body" id="noticesList">
                        <div class="loading-overlay" style="position:relative; min-height:200px;">
                            <div class="loader loader-lg"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        await loadNotices();
    }

    async function loadNotices() {
        try {
            const response = await api.adminListNotices();
            notices = response.notices || response || [];
            renderList();
        } catch (error) {
            console.error('Error loading notices:', error);
            notices = getMockNotices();
            renderList();
        }
    }

    function renderList() {
        const container = document.getElementById('noticesList');

        if (notices.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
                        </svg>
                    </div>
                    <h3 class="empty-state-title">Sin avisos</h3>
                    <p class="empty-state-message">Crea tu primer aviso o banner</p>
                    <button class="btn btn-primary" onclick="AdminAvisos.createNotice()">
                        ${AdminUtils.Icons.plus} Crear aviso
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:12px;">
                ${notices.map(notice => `
                    <div style="display:flex;align-items:center;gap:16px;padding:16px;background:var(--admin-bg-body);border:1px solid var(--admin-border);border-radius:var(--radius-lg);${!notice.active ? 'opacity:0.6;' : ''}">
                        <div style="width:8px;height:60px;border-radius:4px;background:${notice.color || 'var(--admin-primary)'};flex-shrink:0;"></div>
                        
                        <div style="flex:1;min-width:0;">
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                                <h4 style="margin:0;font-size:14px;font-weight:600;">${notice.title}</h4>
                                ${AdminUtils.getStatusBadge(notice.active ? 'published' : 'draft')}
                                ${notice.type === 'banner' ? '<span class="badge badge-info">Banner</span>' : '<span class="badge badge-neutral">Aviso</span>'}
                            </div>
                            <p style="margin:0;font-size:13px;color:var(--admin-text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${notice.message || notice.content || ''}</p>
                            <div style="font-size:12px;color:var(--admin-text-muted);margin-top:6px;">
                                ${notice.startDate ? `Desde: ${AdminUtils.formatDate(notice.startDate, 'short')}` : 'Sin fecha de inicio'}
                                ${notice.endDate ? ` • Hasta: ${AdminUtils.formatDate(notice.endDate, 'short')}` : ''}
                            </div>
                        </div>

                        <div style="display:flex;gap:4px;flex-shrink:0;">
                            <button class="btn btn-ghost btn-icon" onclick="AdminAvisos.toggleNotice('${notice.id || notice._id}')" title="${notice.active ? 'Desactivar' : 'Activar'}">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="18" height="18">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="${notice.active ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'}"/>
                                </svg>
                            </button>
                            <button class="btn btn-ghost btn-icon" onclick="AdminAvisos.editNotice('${notice.id || notice._id}')" title="Editar">
                                ${AdminUtils.Icons.edit}
                            </button>
                            <button class="btn btn-ghost btn-icon" onclick="AdminAvisos.deleteNotice('${notice.id || notice._id}')" title="Eliminar">
                                ${AdminUtils.Icons.trash}
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function createNotice() {
        openNoticeModal();
    }

    function editNotice(noticeId) {
        const notice = notices.find(n => (n.id || n._id) == noticeId);
        if (notice) {
            openNoticeModal(notice);
        }
    }

    function openNoticeModal(notice = null) {
        const isEdit = !!notice;
        const title = isEdit ? 'Editar aviso' : 'Nuevo aviso';

        const body = `
            <form id="noticeForm">
                <div class="form-group">
                    <label class="form-label required">Título</label>
                    <input type="text" class="form-input" name="title" value="${notice?.title || ''}" required placeholder="Promoción de verano">
                </div>

                <div class="form-group">
                    <label class="form-label required">Mensaje</label>
                    <textarea class="form-textarea" name="message" rows="3" required placeholder="¡Aprovecha nuestros descuentos de temporada!">${notice?.message || notice?.content || ''}</textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Tipo</label>
                        <select class="form-select" name="type">
                            <option value="notice" ${notice?.type === 'notice' ? 'selected' : ''}>Aviso</option>
                            <option value="banner" ${notice?.type === 'banner' ? 'selected' : ''}>Banner</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Color</label>
                        <input type="color" class="form-input" name="color" value="${notice?.color || '#8b5cf6'}" style="height:42px;padding:4px;">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Fecha de inicio</label>
                        <input type="datetime-local" class="form-input" name="startDate" value="${notice?.startDate ? new Date(notice.startDate).toISOString().slice(0, 16) : ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Fecha de fin</label>
                        <input type="datetime-local" class="form-input" name="endDate" value="${notice?.endDate ? new Date(notice.endDate).toISOString().slice(0, 16) : ''}">
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">URL de enlace (opcional)</label>
                    <input type="url" class="form-input" name="link" value="${notice?.link || ''}" placeholder="https://...">
                </div>

                <div class="form-group">
                    <label class="form-checkbox">
                        <input type="checkbox" name="active" ${notice?.active !== false ? 'checked' : ''}>
                        Aviso activo
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
                <button class="btn btn-primary" onclick="AdminAvisos.saveNotice('${notice?.id || notice?._id || ''}')">
                    ${isEdit ? 'Guardar cambios' : 'Crear aviso'}
                </button>
            `
        });
    }

    async function saveNotice(noticeId) {
        const form = document.getElementById('noticeForm');
        if (!form) return;

        const formData = new FormData(form);
        const data = {
            title: formData.get('title'),
            message: formData.get('message'),
            type: formData.get('type'),
            color: formData.get('color'),
            startDate: formData.get('startDate') || null,
            endDate: formData.get('endDate') || null,
            link: formData.get('link') || null,
            active: form.querySelector('[name="active"]').checked
        };

        if (!data.title || !data.message) {
            AdminUtils.showToast('error', 'Título y mensaje son obligatorios');
            return;
        }

        try {
            if (noticeId) {
                await api.adminUpdateNotice(noticeId, data);
                AdminUtils.showToast('success', 'Aviso actualizado');
            } else {
                await api.adminCreateNotice(data);
                AdminUtils.showToast('success', 'Aviso creado');
            }
            AdminUtils.closeModal();
            await loadNotices();
        } catch (error) {
            console.error('Error saving notice:', error);
            AdminUtils.showToast('error', error.message || 'Error al guardar aviso');
        }
    }

    async function toggleNotice(noticeId) {
        const notice = notices.find(n => (n.id || n._id) == noticeId);
        if (!notice) return;

        try {
            await api.adminUpdateNotice(noticeId, { active: !notice.active });
            AdminUtils.showToast('success', notice.active ? 'Aviso desactivado' : 'Aviso activado');
            await loadNotices();
        } catch (error) {
            console.error('Error toggling notice:', error);
            AdminUtils.showToast('error', error.message || 'Error al actualizar aviso');
        }
    }

    async function deleteNotice(noticeId) {
        const confirmed = await AdminUtils.confirm('¿Eliminar este aviso?', 'Eliminar aviso');
        if (!confirmed) return;

        try {
            await api.adminDeleteNotice(noticeId);
            AdminUtils.showToast('success', 'Aviso eliminado');
            await loadNotices();
        } catch (error) {
            console.error('Error deleting notice:', error);
            AdminUtils.showToast('error', error.message || 'Error al eliminar aviso');
        }
    }

    function getMockNotices() {
        return [
            { id: '1', title: 'Promoción de verano', message: '¡Hasta 50% de descuento en productos seleccionados!', type: 'banner', color: '#22c55e', active: true, startDate: new Date(), endDate: new Date(Date.now() + 86400000 * 30) },
            { id: '2', title: 'Envío gratis', message: 'Envío gratis en compras sobre $50.000', type: 'notice', color: '#3b82f6', active: true },
            { id: '3', title: 'Mantenimiento programado', message: 'El sitio estará en mantenimiento el domingo', type: 'notice', color: '#eab308', active: false }
        ];
    }

    return {
        load,
        createNotice,
        editNotice,
        saveNotice,
        toggleNotice,
        deleteNotice
    };

})();
