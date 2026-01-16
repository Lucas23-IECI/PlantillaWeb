/**
 * Admin Panel - Utility Functions
 * Toast notifications, modals, formatting, etc.
 */

const AdminUtils = (function() {
    'use strict';

    // ==========================================
    // ICONS (SVG strings)
    // ==========================================
    
    const Icons = {
        success: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>`,
        error: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>`,
        warning: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>`,
        info: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>`,
        close: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>`,
        search: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>`,
        plus: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>`,
        edit: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>`,
        trash: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>`,
        eye: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>`,
        download: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>`,
        upload: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
        </svg>`,
        grid: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
        </svg>`,
        list: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
        </svg>`,
        table: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>`,
        filter: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
        </svg>`,
        refresh: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>`,
        arrowUp: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
        </svg>`,
        arrowDown: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
        </svg>`,
        chevronLeft: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>`,
        chevronRight: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
        </svg>`,
        package: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
        </svg>`,
        users: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
        </svg>`,
        shoppingBag: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
        </svg>`,
        dollarSign: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>`,
        trendingUp: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
        </svg>`,
        trendingDown: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/>
        </svg>`,
        folder: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
        </svg>`,
        dollar: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>`,
        check: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
        </svg>`,
        ban: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
        </svg>`,
        copy: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
        </svg>`,
        layers: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>`,
    };

    // ==========================================
    // TOAST NOTIFICATIONS
    // ==========================================
    
    function showToast(type, message, title = null, duration = 4000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = Icons[type] || Icons.info;
        const toastTitle = title || getToastTitle(type);

        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-title">${toastTitle}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">${Icons.close}</button>
        `;

        container.appendChild(toast);

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            removeToast(toast);
        });

        // Auto remove
        if (duration > 0) {
            setTimeout(() => removeToast(toast), duration);
        }
    }

    function getToastTitle(type) {
        const titles = {
            success: 'Éxito',
            error: 'Error',
            warning: 'Advertencia',
            info: 'Información'
        };
        return titles[type] || 'Notificación';
    }

    function removeToast(toast) {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }

    // Add slideOut animation
    if (!document.getElementById('admin-utils-styles')) {
        const style = document.createElement('style');
        style.id = 'admin-utils-styles';
        style.textContent = `
            @keyframes slideOut {
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // ==========================================
    // MODAL
    // ==========================================
    
    function openModal(options = {}) {
        const overlay = document.getElementById('modalOverlay');
        const modal = document.getElementById('modal');
        const title = document.getElementById('modalTitle');
        const body = document.getElementById('modalBody');
        const footer = document.getElementById('modalFooter');
        const closeBtn = document.getElementById('modalClose');

        if (!overlay || !modal) return;

        // Set size
        modal.className = 'modal';
        if (options.size) {
            modal.classList.add(`modal-${options.size}`);
        }

        // Set content
        title.innerHTML = options.title || 'Modal';
        body.innerHTML = options.body || '';
        
        // Footer buttons
        if (options.footer !== false) {
            footer.style.display = 'flex';
            footer.innerHTML = options.footer || `
                <button class="btn btn-outline" onclick="AdminUtils.closeModal()">Cancelar</button>
                <button class="btn btn-primary" id="modalConfirmBtn">Confirmar</button>
            `;
        } else {
            footer.style.display = 'none';
        }

        // Show
        overlay.classList.add('active');
        document.body.classList.add('no-scroll');

        // Close handlers
        closeBtn.onclick = closeModal;
        overlay.onclick = (e) => {
            if (e.target === overlay) closeModal();
        };

        // Return confirm button for binding
        return document.getElementById('modalConfirmBtn');
    }

    function closeModal() {
        const overlay = document.getElementById('modalOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        }
    }

    // ==========================================
    // CONFIRM DIALOG
    // ==========================================
    
    function confirm(message, title = 'Confirmar') {
        return new Promise((resolve) => {
            const body = `
                <div style="text-align:center; padding: 20px 0;">
                    <div style="width:48px; height:48px; margin:0 auto 16px; color: var(--admin-warning);">
                        ${Icons.warning}
                    </div>
                    <p style="color: var(--admin-text-secondary); margin:0;">${message}</p>
                </div>
            `;

            const footer = `
                <button class="btn btn-outline" onclick="AdminUtils.closeModal(); AdminUtils._confirmResolve(false);">Cancelar</button>
                <button class="btn btn-danger" onclick="AdminUtils.closeModal(); AdminUtils._confirmResolve(true);">Confirmar</button>
            `;

            openModal({ title, body, footer });
            AdminUtils._confirmResolve = resolve;
        });
    }

    // ==========================================
    // FORMATTING
    // ==========================================
    
    function formatCurrency(amount) {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(amount || 0);
    }

    function formatNumber(num) {
        return new Intl.NumberFormat('es-CL').format(num || 0);
    }

    function formatDate(date, format = 'short') {
        if (!date) return '-';
        const d = new Date(date);
        
        if (format === 'short') {
            return d.toLocaleDateString('es-CL', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        }
        
        if (format === 'long') {
            return d.toLocaleDateString('es-CL', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        if (format === 'relative') {
            const now = new Date();
            const diff = now - d;
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);

            if (minutes < 1) return 'Ahora';
            if (minutes < 60) return `Hace ${minutes} min`;
            if (hours < 24) return `Hace ${hours}h`;
            if (days < 7) return `Hace ${days} días`;
            return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
        }

        return d.toLocaleDateString('es-CL');
    }

    function formatPercent(value, decimals = 1) {
        return `${(value || 0).toFixed(decimals)}%`;
    }

    // ==========================================
    // STATUS BADGES
    // ==========================================
    
    function getStatusBadge(status) {
        const statuses = {
            // Orders
            pending: { label: 'Pendiente', class: 'badge-warning' },
            processing: { label: 'Procesando', class: 'badge-info' },
            paid: { label: 'Pagado', class: 'badge-success' },
            shipped: { label: 'Enviado', class: 'badge-primary' },
            delivered: { label: 'Entregado', class: 'badge-success' },
            cancelled: { label: 'Cancelado', class: 'badge-danger' },
            refunded: { label: 'Reembolsado', class: 'badge-neutral' },
            
            // Products
            active: { label: 'Activo', class: 'badge-success' },
            inactive: { label: 'Inactivo', class: 'badge-neutral' },
            draft: { label: 'Borrador', class: 'badge-warning' },
            
            // Users
            admin: { label: 'Admin', class: 'badge-primary' },
            user: { label: 'Usuario', class: 'badge-neutral' },
            
            // Discount codes
            enabled: { label: 'Habilitado', class: 'badge-success' },
            disabled: { label: 'Deshabilitado', class: 'badge-danger' },
            
            // Notices
            published: { label: 'Publicado', class: 'badge-success' },
            scheduled: { label: 'Programado', class: 'badge-info' },
        };

        const config = statuses[status] || { label: status, class: 'badge-neutral' };
        return `<span class="badge ${config.class}">${config.label}</span>`;
    }

    // ==========================================
    // PAGINATION
    // ==========================================
    
    function renderPagination(options = {}) {
        const { currentPage, totalPages, totalItems, onPageChange } = options;
        
        if (totalPages <= 1) return '';

        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        
        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        let html = '<div class="pagination">';
        
        // Info
        html += `<span class="pagination-info">Página ${currentPage} de ${totalPages}</span>`;
        
        // Prev
        html += `<button class="pagination-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>
            ${Icons.chevronLeft}
        </button>`;

        // First
        if (start > 1) {
            html += `<button class="pagination-btn" data-page="1">1</button>`;
            if (start > 2) {
                html += `<span class="pagination-btn" style="cursor:default;">...</span>`;
            }
        }

        // Pages
        for (let i = start; i <= end; i++) {
            html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        // Last
        if (end < totalPages) {
            if (end < totalPages - 1) {
                html += `<span class="pagination-btn" style="cursor:default;">...</span>`;
            }
            html += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
        }

        // Next
        html += `<button class="pagination-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>
            ${Icons.chevronRight}
        </button>`;

        html += '</div>';
        return html;
    }

    function bindPagination(container, callback) {
        container.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                if (!isNaN(page) && !btn.disabled) {
                    callback(page);
                }
            });
        });
    }

    // ==========================================
    // LOADING STATES
    // ==========================================
    
    function showLoading(container, message = 'Cargando...') {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        if (!container) return;

        container.innerHTML = `
            <div class="loading-overlay" style="position:relative; min-height:200px; display:flex; align-items:center; justify-content:center;">
                <div class="loader loader-lg"></div>
                <div class="loading-text">${message}</div>
            </div>
        `;
    }

    function showEmpty(container, options = {}) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        if (!container) return;

        const icon = options.icon || Icons.package;
        const title = options.title || 'Sin resultados';
        const message = options.message || 'No hay datos para mostrar';

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${icon}</div>
                <h3 class="empty-state-title">${title}</h3>
                <p class="empty-state-message">${message}</p>
                ${options.action ? `<button class="btn btn-primary" onclick="${options.action.handler}">${options.action.label}</button>` : ''}
            </div>
        `;
    }

    // ==========================================
    // SKELETON LOADERS
    // ==========================================
    
    function renderSkeleton(type = 'card', count = 3) {
        let html = '';
        
        if (type === 'card') {
            for (let i = 0; i < count; i++) {
                html += `
                    <div class="card">
                        <div class="card-body">
                            <div class="skeleton skeleton-image" style="height:150px; margin-bottom:16px;"></div>
                            <div class="skeleton skeleton-title"></div>
                            <div class="skeleton skeleton-text" style="width:80%;"></div>
                            <div class="skeleton skeleton-text" style="width:60%;"></div>
                        </div>
                    </div>
                `;
            }
        } else if (type === 'table') {
            html = '<div class="table-container"><table class="table"><tbody>';
            for (let i = 0; i < count; i++) {
                html += `
                    <tr>
                        <td><div class="skeleton skeleton-text" style="width:40px;"></div></td>
                        <td><div class="skeleton skeleton-text" style="width:150px;"></div></td>
                        <td><div class="skeleton skeleton-text" style="width:100px;"></div></td>
                        <td><div class="skeleton skeleton-text" style="width:80px;"></div></td>
                    </tr>
                `;
            }
            html += '</tbody></table></div>';
        }
        
        return html;
    }

    // ==========================================
    // DEBOUNCE
    // ==========================================
    
    function debounce(fn, delay = 300) {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // ==========================================
    // EXPORTS
    // ==========================================
    
    return {
        Icons,
        showToast,
        openModal,
        closeModal,
        confirm,
        formatCurrency,
        formatNumber,
        formatDate,
        formatPercent,
        getStatusBadge,
        renderPagination,
        bindPagination,
        showLoading,
        showEmpty,
        renderSkeleton,
        debounce,
        _confirmResolve: null
    };

})();
