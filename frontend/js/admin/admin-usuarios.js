/**
 * Admin Panel - Users Module
 */

const AdminUsuarios = (function() {
    'use strict';

    let users = [];
    let filteredUsers = [];
    let currentPage = 1;
    const perPage = 15;

    async function load(container) {
        container.innerHTML = `
            <div class="admin-page-header">
                <div class="page-title-group">
                    <h1 class="page-title">Usuarios</h1>
                    <p class="page-description">Gestiona los usuarios de tu tienda</p>
                </div>
            </div>

            <div class="admin-content">
                <div class="filters-bar">
                    <div class="search-input-wrapper">
                        ${AdminUtils.Icons.search}
                        <input type="text" placeholder="Buscar usuario..." id="userSearch" onkeyup="AdminUsuarios.search(this.value)">
                    </div>
                    <select class="filter-select" id="roleFilter" onchange="AdminUsuarios.filterByRole(this.value)">
                        <option value="">Todos los roles</option>
                        <option value="admin">Administradores</option>
                        <option value="user">Usuarios</option>
                    </select>
                    <button class="btn btn-ghost" onclick="AdminUsuarios.refresh()">
                        ${AdminUtils.Icons.refresh}
                    </button>
                </div>

                <div class="card">
                    <div class="card-body no-padding" id="usersTable">
                        ${AdminUtils.renderSkeleton('table', 5)}
                    </div>
                    <div class="card-footer" id="usersPagination"></div>
                </div>
            </div>
        `;

        await loadUsers();
    }

    async function loadUsers() {
        try {
            const response = await api.getAdminUsers?.() || { users: getMockUsers() };
            users = response.users || response || [];
            filteredUsers = [...users];
            renderTable();
        } catch (error) {
            console.error('Error loading users:', error);
            users = getMockUsers();
            filteredUsers = [...users];
            renderTable();
        }
    }

    function renderTable() {
        const tableContainer = document.getElementById('usersTable');
        const paginationContainer = document.getElementById('usersPagination');

        if (filteredUsers.length === 0) {
            tableContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">${AdminUtils.Icons.users}</div>
                    <h3 class="empty-state-title">Sin usuarios</h3>
                    <p class="empty-state-message">No se encontraron usuarios</p>
                </div>
            `;
            paginationContainer.innerHTML = '';
            return;
        }

        const totalPages = Math.ceil(filteredUsers.length / perPage);
        const start = (currentPage - 1) * perPage;
        const pageUsers = filteredUsers.slice(start, start + perPage);

        tableContainer.innerHTML = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Registro</th>
                            <th>Pedidos</th>
                            <th style="width:100px;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pageUsers.map(user => `
                            <tr>
                                <td>
                                    <div style="display:flex;align-items:center;gap:10px;">
                                        <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--admin-primary),#c084fc);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;">
                                            ${(user.name || user.email || 'U').substring(0, 2).toUpperCase()}
                                        </div>
                                        <strong>${user.name || 'Sin nombre'}</strong>
                                    </div>
                                </td>
                                <td>${user.email}</td>
                                <td>${AdminUtils.getStatusBadge(user.admin ? 'admin' : 'user')}</td>
                                <td>${AdminUtils.formatDate(user.createdAt || user.registeredAt, 'short')}</td>
                                <td>${user.orderCount || 0}</td>
                                <td>
                                    <div class="d-flex gap-1">
                                        <button class="btn btn-ghost btn-icon btn-sm" onclick="AdminUsuarios.viewUser('${user.id || user._id}')" title="Ver detalles">
                                            ${AdminUtils.Icons.eye}
                                        </button>
                                        <button class="btn btn-ghost btn-icon btn-sm" onclick="AdminUsuarios.editUser('${user.id || user._id}')" title="Editar">
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
            totalItems: filteredUsers.length
        });

        AdminUtils.bindPagination(paginationContainer, (page) => {
            currentPage = page;
            renderTable();
        });
    }

    function search(query) {
        const q = query.toLowerCase().trim();
        if (!q) {
            filteredUsers = [...users];
        } else {
            filteredUsers = users.filter(u => 
                (u.name || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q)
            );
        }
        currentPage = 1;
        renderTable();
    }

    function filterByRole(role) {
        if (!role) {
            filteredUsers = [...users];
        } else if (role === 'admin') {
            filteredUsers = users.filter(u => u.admin === true);
        } else {
            filteredUsers = users.filter(u => !u.admin);
        }
        currentPage = 1;
        renderTable();
    }

    function viewUser(userId) {
        const user = users.find(u => (u.id || u._id) == userId);
        if (!user) return;

        const body = `
            <div style="display:flex;flex-direction:column;gap:16px;">
                <div style="display:flex;align-items:center;gap:16px;padding-bottom:16px;border-bottom:1px solid var(--admin-border);">
                    <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--admin-primary),#c084fc);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:600;">
                        ${(user.name || user.email || 'U').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h3 style="margin:0;font-size:18px;">${user.name || 'Sin nombre'}</h3>
                        <p style="margin:4px 0 0;color:var(--admin-text-muted);">${user.email}</p>
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
                    <div>
                        <label style="font-size:12px;color:var(--admin-text-muted);">Rol</label>
                        <div>${AdminUtils.getStatusBadge(user.admin ? 'admin' : 'user')}</div>
                    </div>
                    <div>
                        <label style="font-size:12px;color:var(--admin-text-muted);">Teléfono</label>
                        <div>${user.phone || 'No registrado'}</div>
                    </div>
                    <div>
                        <label style="font-size:12px;color:var(--admin-text-muted);">Fecha de registro</label>
                        <div>${AdminUtils.formatDate(user.createdAt || user.registeredAt, 'long')}</div>
                    </div>
                    <div>
                        <label style="font-size:12px;color:var(--admin-text-muted);">Pedidos realizados</label>
                        <div>${user.orderCount || 0}</div>
                    </div>
                </div>
            </div>
        `;

        AdminUtils.openModal({
            title: 'Detalles del usuario',
            body,
            footer: `
                <button class="btn btn-outline" onclick="AdminUtils.closeModal()">Cerrar</button>
                <button class="btn btn-primary" onclick="AdminUsuarios.editUser('${user.id || user._id}')">Editar</button>
            `
        });
    }

    function editUser(userId) {
        const user = users.find(u => (u.id || u._id) == userId);
        if (!user) return;

        const body = `
            <form id="userForm">
                <div class="form-group">
                    <label class="form-label">Nombre</label>
                    <input type="text" class="form-input" name="name" value="${user.name || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-input" name="email" value="${user.email}" readonly style="opacity:0.6;">
                    <span class="form-hint">El email no se puede modificar</span>
                </div>
                <div class="form-group">
                    <label class="form-label">Teléfono</label>
                    <input type="tel" class="form-input" name="phone" value="${user.phone || ''}">
                </div>
                <div class="form-group">
                    <label class="form-checkbox">
                        <input type="checkbox" name="admin" ${user.admin ? 'checked' : ''}>
                        Usuario administrador
                    </label>
                </div>
            </form>
        `;

        AdminUtils.openModal({
            title: 'Editar usuario',
            body,
            footer: `
                <button class="btn btn-outline" onclick="AdminUtils.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="AdminUsuarios.saveUser('${user.id || user._id}')">Guardar</button>
            `
        });
    }

    async function saveUser(userId) {
        const form = document.getElementById('userForm');
        if (!form) return;

        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            admin: form.querySelector('[name="admin"]').checked
        };

        try {
            await api.adminUpdateUser?.(userId, data);
            AdminUtils.closeModal();
            AdminUtils.showToast('success', 'Usuario actualizado');
            await loadUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            AdminUtils.showToast('error', error.message || 'Error al guardar usuario');
        }
    }

    async function refresh() {
        document.getElementById('userSearch').value = '';
        document.getElementById('roleFilter').value = '';
        currentPage = 1;
        await loadUsers();
        AdminUtils.showToast('success', 'Usuarios actualizados');
    }

    function getMockUsers() {
        return [
            { id: '1', name: 'Admin Principal', email: 'admin@tienda.com', admin: true, phone: '+56912345678', orderCount: 0, createdAt: new Date(Date.now() - 86400000 * 365) },
            { id: '2', name: 'Juan Pérez', email: 'juan@email.com', admin: false, phone: '+56987654321', orderCount: 5, createdAt: new Date(Date.now() - 86400000 * 30) },
            { id: '3', name: 'María García', email: 'maria@email.com', admin: false, phone: '+56911111111', orderCount: 12, createdAt: new Date(Date.now() - 86400000 * 60) },
            { id: '4', name: 'Carlos López', email: 'carlos@email.com', admin: false, orderCount: 3, createdAt: new Date(Date.now() - 86400000 * 15) },
            { id: '5', name: 'Ana Martínez', email: 'ana@email.com', admin: false, phone: '+56922222222', orderCount: 8, createdAt: new Date(Date.now() - 86400000 * 45) }
        ];
    }

    return {
        load,
        search,
        filterByRole,
        viewUser,
        editUser,
        saveUser,
        refresh
    };

})();
