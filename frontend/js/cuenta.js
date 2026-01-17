/**
 * Cuenta/Profile Page Module
 * Handles all user profile functionality
 */

(function () {
    'use strict';

    // Check auth
    if (!requireAuth()) return;

    const user = getStoredUser();
    const content = document.getElementById('cuentaContent');
    let currentSection = 'profile';
    let userProfile = null;
    let userAddresses = [];
    let userWishlist = [];
    let userOrders = [];

    // ==========================================
    // INITIALIZATION
    // ==========================================

    async function init() {
        setupNavigation();
        await loadUserData();
        updateProfileBanner();
        loadSection('profile');
        updateAuthLinks();
    }

    async function loadUserData() {
        try {
            // Load profile data
            userProfile = await api.getUserProfile().catch(() => null);

            // Load wishlist
            userWishlist = await loadWishlistData();

            // Load orders count for badge
            const ordersResult = await api.getMyTransactions().catch(() => ({ transactions: [] }));
            userOrders = ordersResult.transactions || [];

            // Update badges
            updateBadges();
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    function loadWishlistData() {
        // Get wishlist from localStorage
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        return Promise.resolve(wishlist);
    }

    function updateBadges() {
        const ordersCount = document.getElementById('ordersCount');
        const wishlistCount = document.getElementById('wishlistCount');

        if (ordersCount && userOrders.length > 0) {
            ordersCount.textContent = userOrders.length;
            ordersCount.style.display = 'inline-flex';
        }

        if (wishlistCount && userWishlist.length > 0) {
            wishlistCount.textContent = userWishlist.length;
            wishlistCount.style.display = 'inline-flex';
        }

        // Update stats
        document.getElementById('statOrders').textContent = userOrders.length;
        document.getElementById('statWishlist').textContent = userWishlist.length;
    }

    function updateProfileBanner() {
        const avatar = document.getElementById('profileAvatar');
        const name = document.getElementById('profileName');
        const email = document.getElementById('profileEmail');
        const since = document.getElementById('profileSince');

        if (user) {
            // Set avatar initials
            const initials = (user.name || user.email || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            avatar.innerHTML = initials;

            name.textContent = user.name || 'Usuario';
            email.textContent = user.email || '';

            // Member since
            const createdAt = userProfile?.createdAt || user.createdAt;
            if (createdAt) {
                const date = new Date(createdAt);
                since.textContent = date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
            } else {
                since.textContent = 'Recientemente';
            }
        }
    }

    // ==========================================
    // NAVIGATION
    // ==========================================

    function setupNavigation() {
        document.querySelectorAll('.cuenta-nav-link[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                if (section) {
                    setActiveNav(link);
                    loadSection(section);
                }
            });
        });

        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
            if (typeof showNotification === 'function') {
                showNotification('Sesión cerrada', 'info');
            }
            setTimeout(() => window.location.href = '../home.html', 500);
        });
    }

    function setActiveNav(activeLink) {
        document.querySelectorAll('.cuenta-nav-link').forEach(l => l.classList.remove('active'));
        activeLink.classList.add('active');
    }

    function loadSection(section) {
        currentSection = section;

        switch (section) {
            case 'profile':
                renderProfileSection();
                break;
            case 'orders':
                renderOrdersSection();
                break;
            case 'wishlist':
                renderWishlistSection();
                break;
            case 'addresses':
                renderAddressesSection();
                break;
            case 'security':
                renderSecuritySection();
                break;
            default:
                renderProfileSection();
        }
    }

    // ==========================================
    // PROFILE SECTION
    // ==========================================

    function renderProfileSection() {
        content.innerHTML = `
            <div class="cuenta-section">
                <div class="cuenta-section-header">
                    <h2 class="cuenta-section-title">Mis Datos Personales</h2>
                </div>
                <div class="cuenta-section-body">
                    <form class="profile-form" id="profileForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Nombre completo</label>
                                <input type="text" class="form-input" name="name" value="${user?.name || ''}" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-input" name="email" value="${user?.email || ''}" disabled>
                                <small style="color: var(--color-text-light); font-size: 12px;">El email no se puede cambiar</small>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Teléfono</label>
                                <input type="tel" class="form-input" name="phone" value="${userProfile?.phone || user?.phone || ''}" placeholder="+56 9 1234 5678">
                            </div>
                            <div class="form-group">
                                <label class="form-label">RUT</label>
                                <input type="text" class="form-input" name="rut" value="${userProfile?.rut || ''}" placeholder="12.345.678-9">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Dirección</label>
                            <input type="text" class="form-input" name="address" value="${userProfile?.address || user?.address || ''}" placeholder="Calle, número, depto">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Ciudad</label>
                                <input type="text" class="form-input" name="city" value="${userProfile?.city || user?.city || ''}" placeholder="Santiago">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Región</label>
                                <select class="form-input" name="region">
                                    <option value="">Seleccionar región</option>
                                    <option value="Arica y Parinacota" ${userProfile?.region === 'Arica y Parinacota' ? 'selected' : ''}>Arica y Parinacota</option>
                                    <option value="Tarapacá" ${userProfile?.region === 'Tarapacá' ? 'selected' : ''}>Tarapacá</option>
                                    <option value="Antofagasta" ${userProfile?.region === 'Antofagasta' ? 'selected' : ''}>Antofagasta</option>
                                    <option value="Atacama" ${userProfile?.region === 'Atacama' ? 'selected' : ''}>Atacama</option>
                                    <option value="Coquimbo" ${userProfile?.region === 'Coquimbo' ? 'selected' : ''}>Coquimbo</option>
                                    <option value="Valparaíso" ${userProfile?.region === 'Valparaíso' ? 'selected' : ''}>Valparaíso</option>
                                    <option value="Metropolitana" ${userProfile?.region === 'Metropolitana' ? 'selected' : ''}>Metropolitana</option>
                                    <option value="O'Higgins" ${userProfile?.region === "O'Higgins" ? 'selected' : ''}>O'Higgins</option>
                                    <option value="Maule" ${userProfile?.region === 'Maule' ? 'selected' : ''}>Maule</option>
                                    <option value="Ñuble" ${userProfile?.region === 'Ñuble' ? 'selected' : ''}>Ñuble</option>
                                    <option value="Biobío" ${userProfile?.region === 'Biobío' ? 'selected' : ''}>Biobío</option>
                                    <option value="La Araucanía" ${userProfile?.region === 'La Araucanía' ? 'selected' : ''}>La Araucanía</option>
                                    <option value="Los Ríos" ${userProfile?.region === 'Los Ríos' ? 'selected' : ''}>Los Ríos</option>
                                    <option value="Los Lagos" ${userProfile?.region === 'Los Lagos' ? 'selected' : ''}>Los Lagos</option>
                                    <option value="Aysén" ${userProfile?.region === 'Aysén' ? 'selected' : ''}>Aysén</option>
                                    <option value="Magallanes" ${userProfile?.region === 'Magallanes' ? 'selected' : ''}>Magallanes</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Guardar cambios</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('profileForm').addEventListener('submit', handleProfileSubmit);
    }

    async function handleProfileSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        const data = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            rut: formData.get('rut'),
            address: formData.get('address'),
            city: formData.get('city'),
            region: formData.get('region')
        };

        try {
            await api.updateUserProfile(data);

            // Update local storage
            const updatedUser = { ...user, name: data.name };
            localStorage.setItem('user_data', JSON.stringify(updatedUser));

            updateProfileBanner();
            showNotification('Datos actualizados correctamente', 'success');
        } catch (error) {
            showNotification(error.message || 'Error al actualizar datos', 'error');
        }
    }

    // ==========================================
    // ORDERS SECTION
    // ==========================================

    async function renderOrdersSection() {
        content.innerHTML = `
            <div class="cuenta-section">
                <div class="cuenta-section-header">
                    <h2 class="cuenta-section-title">Mis Pedidos</h2>
                </div>
                <div class="cuenta-section-body">
                    <div class="loading"><div class="spinner"></div></div>
                </div>
            </div>
        `;

        try {
            const result = await api.getMyTransactions();
            userOrders = result.transactions || [];

            const body = content.querySelector('.cuenta-section-body');

            if (userOrders.length === 0) {
                body.innerHTML = `
                    <div class="cuenta-empty">
                        <div class="cuenta-empty-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <path d="M16 10a4 4 0 0 1-8 0"></path>
                            </svg>
                        </div>
                        <h3 class="cuenta-empty-title">Sin pedidos aún</h3>
                        <p class="cuenta-empty-text">Cuando realices una compra, aparecerá aquí</p>
                        <a href="productos.html" class="btn btn-primary">Explorar productos</a>
                    </div>
                `;
                return;
            }

            body.innerHTML = `
                <div class="orders-list">
                    ${userOrders.map(order => renderOrderCard(order)).join('')}
                </div>
            `;
        } catch (error) {
            content.querySelector('.cuenta-section-body').innerHTML = `
                <div class="cuenta-empty">
                    <div class="cuenta-empty-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <h3 class="cuenta-empty-title">Error al cargar pedidos</h3>
                    <p class="cuenta-empty-text">Intenta nuevamente más tarde</p>
                </div>
            `;
        }
    }

    function renderOrderCard(order) {
        const statusMap = {
            'pending': 'pending',
            'pendiente': 'pending',
            'processing': 'processing',
            'procesando': 'processing',
            'shipped': 'shipped',
            'enviado': 'shipped',
            'delivered': 'delivered',
            'entregado': 'delivered',
            'cancelled': 'cancelled',
            'cancelado': 'cancelled'
        };

        const statusClass = statusMap[order.status?.toLowerCase()] || 'pending';
        const date = new Date(order.createdAt || order.created_at);
        const formattedDate = date.toLocaleDateString('es-CL', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });

        return `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <div class="order-id">Pedido #${order.order_id || order.id}</div>
                        <div class="order-date">${formattedDate}</div>
                    </div>
                    <span class="order-status ${statusClass}">${order.status || 'Pendiente'}</span>
                </div>
                <div class="order-items">
                    ${(order.items || []).slice(0, 4).map(item => `
                        <div class="order-item-thumb">
                            ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}">` : ''}
                        </div>
                    `).join('')}
                    ${(order.items || []).length > 4 ? `<span style="color:var(--color-text-light);">+${order.items.length - 4} más</span>` : ''}
                </div>
                <div class="order-footer">
                    <span class="order-total">${typeof formatPrice === 'function' ? formatPrice(order.amount || order.total_amount) : '$' + (order.amount || order.total_amount)}</span>
                    <button class="btn btn-outline btn-sm" onclick="viewOrderDetails('${order.order_id || order.id}')">Ver detalles</button>
                </div>
            </div>
        `;
    }

    // ==========================================
    // WISHLIST SECTION
    // ==========================================

    async function renderWishlistSection() {
        userWishlist = await loadWishlistData();

        content.innerHTML = `
            <div class="cuenta-section">
                <div class="cuenta-section-header">
                    <h2 class="cuenta-section-title">Lista de Deseos</h2>
                </div>
                <div class="cuenta-section-body">
                    ${userWishlist.length === 0 ? `
                        <div class="cuenta-empty">
                            <div class="cuenta-empty-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                            </div>
                            <h3 class="cuenta-empty-title">Tu lista está vacía</h3>
                            <p class="cuenta-empty-text">Guarda tus productos favoritos para comprarlos después</p>
                            <a href="productos.html" class="btn btn-primary">Explorar productos</a>
                        </div>
                    ` : `
                        <div class="wishlist-grid">
                            ${userWishlist.map(item => renderWishlistItem(item)).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    function renderWishlistItem(item) {
        // Normalize field names (wishlist.js uses nombre/precio, cuenta.js expects name/price)
        const name = item.name || item.nombre || 'Producto';
        const price = item.price || item.precio || 0;
        const image = item.image_url || item.imagen || item.image || '';

        return `
            <div class="wishlist-item" data-id="${item.id || item.product_id}">
                <div class="wishlist-item-image">
                    ${image ? `<img src="${image}" alt="${name}">` : ''}
                    <button class="wishlist-item-remove" onclick="removeFromWishlistUI('${item.id || item.product_id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="wishlist-item-body">
                    <h4 class="wishlist-item-name">${name}</h4>
                    <div class="wishlist-item-price">${typeof formatPrice === 'function' ? formatPrice(price) : '$' + price.toLocaleString('es-CL')}</div>
                </div>
                <div class="wishlist-item-actions">
                    <button class="btn btn-primary btn-sm" onclick="addToCartFromWishlist('${item.id || item.product_id}')">
                        Agregar al carrito
                    </button>
                </div>
            </div>
        `;
    }

    // Global functions for wishlist actions
    window.removeFromWishlistUI = function (productId) {
        if (typeof removeFromWishlist === 'function') {
            removeFromWishlist(productId);
        } else {
            let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
            wishlist = wishlist.filter(item => (item.id || item.product_id) != productId);
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
        }
        renderWishlistSection();
        updateBadges();
        showNotification('Producto eliminado de favoritos', 'info');
    };

    window.addToCartFromWishlist = function (productId) {
        const item = userWishlist.find(i => (i.id || i.product_id) == productId);
        if (item && typeof addToCart === 'function') {
            addToCart(item);
            showNotification('Producto agregado al carrito', 'success');
        }
    };

    // ==========================================
    // ADDRESSES SECTION
    // ==========================================

    async function renderAddressesSection() {
        content.innerHTML = `
            <div class="cuenta-section">
                <div class="cuenta-section-header">
                    <h2 class="cuenta-section-title">Mis Direcciones</h2>
                    <button class="btn btn-primary btn-sm" onclick="openAddressModal()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Nueva dirección
                    </button>
                </div>
                <div class="cuenta-section-body">
                    <div class="loading"><div class="spinner"></div></div>
                </div>
            </div>
        `;

        try {
            userAddresses = await api.getUserAddresses().catch(() => []);
            renderAddressList();
        } catch (error) {
            userAddresses = [];
            renderAddressList();
        }
    }

    function renderAddressList() {
        const body = content.querySelector('.cuenta-section-body');

        if (userAddresses.length === 0) {
            body.innerHTML = `
                <div class="addresses-grid">
                    <div class="address-card add-new" onclick="openAddressModal()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        <span>Agregar dirección</span>
                    </div>
                </div>
            `;
            return;
        }

        body.innerHTML = `
            <div class="addresses-grid">
                ${userAddresses.map(addr => renderAddressCard(addr)).join('')}
                <div class="address-card add-new" onclick="openAddressModal()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    <span>Agregar dirección</span>
                </div>
            </div>
        `;
    }

    function renderAddressCard(address) {
        return `
            <div class="address-card ${address.isPrimary ? 'primary' : ''}">
                ${address.isPrimary ? '<span class="address-badge">Principal</span>' : ''}
                <h4 class="address-name">${address.name || 'Mi dirección'}</h4>
                <p class="address-details">
                    ${address.street}<br>
                    ${address.city}, ${address.region}<br>
                    ${address.postalCode || ''}
                </p>
                <div class="address-actions">
                    <button class="btn btn-outline btn-sm" onclick="editAddress('${address.id}')">Editar</button>
                    ${!address.isPrimary ? `<button class="btn btn-ghost btn-sm" onclick="deleteAddress('${address.id}')">Eliminar</button>` : ''}
                </div>
            </div>
        `;
    }

    window.openAddressModal = function (address = null) {
        const isEdit = !!address;
        const modalHTML = `
            <div class="modal-overlay" id="addressModal">
                <div class="modal" style="max-width:500px;">
                    <div class="modal-header">
                        <h3>${isEdit ? 'Editar dirección' : 'Nueva dirección'}</h3>
                        <button class="modal-close" onclick="closeAddressModal()">&times;</button>
                    </div>
                    <form id="addressForm" class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Nombre de la dirección</label>
                            <input type="text" class="form-input" name="name" value="${address?.name || ''}" placeholder="Ej: Casa, Trabajo" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Dirección</label>
                            <input type="text" class="form-input" name="street" value="${address?.street || ''}" placeholder="Calle, número, depto" required>
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                            <div class="form-group">
                                <label class="form-label">Ciudad</label>
                                <input type="text" class="form-input" name="city" value="${address?.city || ''}" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Región</label>
                                <input type="text" class="form-input" name="region" value="${address?.region || ''}" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Código postal (opcional)</label>
                            <input type="text" class="form-input" name="postalCode" value="${address?.postalCode || ''}">
                        </div>
                        <label style="display:flex;align-items:center;gap:8px;margin-top:16px;">
                            <input type="checkbox" name="isPrimary" ${address?.isPrimary ? 'checked' : ''}>
                            Usar como dirección principal
                        </label>
                    </form>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="closeAddressModal()">Cancelar</button>
                        <button class="btn btn-primary" onclick="saveAddress('${address?.id || ''}')">${isEdit ? 'Guardar' : 'Agregar'}</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    };

    window.closeAddressModal = function () {
        document.getElementById('addressModal')?.remove();
    };

    window.saveAddress = async function (addressId) {
        const form = document.getElementById('addressForm');
        const formData = new FormData(form);

        const data = {
            name: formData.get('name'),
            street: formData.get('street'),
            city: formData.get('city'),
            region: formData.get('region'),
            postalCode: formData.get('postalCode'),
            isPrimary: form.querySelector('[name="isPrimary"]').checked
        };

        try {
            if (addressId) {
                await api.updateUserAddress(addressId, data);
            } else {
                await api.createUserAddress(data);
            }
            closeAddressModal();
            showNotification('Dirección guardada', 'success');
            renderAddressesSection();
        } catch (error) {
            showNotification(error.message || 'Error al guardar dirección', 'error');
        }
    };

    window.editAddress = function (addressId) {
        const address = userAddresses.find(a => a.id === addressId);
        if (address) {
            openAddressModal(address);
        }
    };

    window.deleteAddress = async function (addressId) {
        if (!confirm('¿Eliminar esta dirección?')) return;

        try {
            await api.deleteUserAddress(addressId);
            showNotification('Dirección eliminada', 'success');
            renderAddressesSection();
        } catch (error) {
            showNotification(error.message || 'Error al eliminar dirección', 'error');
        }
    };

    // ==========================================
    // SECURITY SECTION
    // ==========================================

    function renderSecuritySection() {
        content.innerHTML = `
            <div class="cuenta-section">
                <div class="cuenta-section-header">
                    <h2 class="cuenta-section-title">Seguridad</h2>
                </div>
                <div class="cuenta-section-body">
                    <div class="security-item">
                        <div class="security-info">
                            <div class="security-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                            </div>
                            <div>
                                <h4 class="security-title">Contraseña</h4>
                                <p class="security-desc">Última actualización: hace más de 30 días</p>
                            </div>
                        </div>
                        <button class="btn btn-outline btn-sm" onclick="showPasswordForm()">Cambiar</button>
                    </div>
                    
                    <div class="security-item">
                        <div class="security-info">
                            <div class="security-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                            </div>
                            <div>
                                <h4 class="security-title">Email</h4>
                                <p class="security-desc">${user?.email || 'No configurado'}</p>
                            </div>
                        </div>
                        <span class="badge" style="background:var(--color-success);color:white;padding:4px 12px;border-radius:20px;font-size:12px;">Verificado</span>
                    </div>
                    
                    <div id="passwordFormContainer" style="display:none;margin-top:24px;padding-top:24px;border-top:1px solid var(--color-border);">
                        <h3 style="margin-bottom:16px;">Cambiar contraseña</h3>
                        <form id="passwordForm" style="max-width:400px;">
                            <div class="form-group">
                                <label class="form-label">Contraseña actual</label>
                                <input type="password" class="form-input" name="currentPassword" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Nueva contraseña</label>
                                <input type="password" class="form-input" name="newPassword" required minlength="6">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Confirmar nueva contraseña</label>
                                <input type="password" class="form-input" name="confirmPassword" required>
                            </div>
                            <div style="display:flex;gap:12px;">
                                <button type="submit" class="btn btn-primary">Cambiar contraseña</button>
                                <button type="button" class="btn btn-outline" onclick="hidePasswordForm()">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('passwordForm')?.addEventListener('submit', handlePasswordChange);
    }

    window.showPasswordForm = function () {
        document.getElementById('passwordFormContainer').style.display = 'block';
    };

    window.hidePasswordForm = function () {
        document.getElementById('passwordFormContainer').style.display = 'none';
        document.getElementById('passwordForm').reset();
    };

    async function handlePasswordChange(e) {
        e.preventDefault();
        const form = e.target;
        const currentPassword = form.currentPassword.value;
        const newPassword = form.newPassword.value;
        const confirmPassword = form.confirmPassword.value;

        if (newPassword !== confirmPassword) {
            showNotification('Las contraseñas no coinciden', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        try {
            await api.changePassword(currentPassword, newPassword);
            showNotification('Contraseña actualizada correctamente', 'success');
            hidePasswordForm();
        } catch (error) {
            showNotification(error.message || 'Error al cambiar contraseña', 'error');
        }
    }

    // ==========================================
    // VIEW ORDER DETAILS
    // ==========================================

    window.viewOrderDetails = function (orderId) {
        const order = userOrders.find(o => (o.order_id || o.id) == orderId);
        if (!order) return;

        const date = new Date(order.createdAt || order.created_at);
        const formattedDate = date.toLocaleDateString('es-CL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const modalHTML = `
            <div class="modal-overlay" id="orderModal">
                <div class="modal" style="max-width:600px;">
                    <div class="modal-header">
                        <h3>Pedido #${order.order_id || order.id}</h3>
                        <button class="modal-close" onclick="document.getElementById('orderModal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p style="color:var(--color-text-light);margin-bottom:16px;">${formattedDate}</p>
                        
                        <div style="margin-bottom:24px;">
                            ${(order.items || []).map(item => `
                                <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--color-border);">
                                    <div style="width:60px;height:60px;border-radius:8px;background:var(--color-background-alt);overflow:hidden;">
                                        ${item.image_url ? `<img src="${item.image_url}" alt="" style="width:100%;height:100%;object-fit:cover;">` : ''}
                                    </div>
                                    <div style="flex:1;">
                                        <div style="font-weight:500;">${item.name}</div>
                                        <div style="font-size:14px;color:var(--color-text-light);">Cantidad: ${item.quantity || 1}</div>
                                    </div>
                                    <div style="font-weight:600;">${typeof formatPrice === 'function' ? formatPrice(item.price * (item.quantity || 1)) : '$' + (item.price * (item.quantity || 1))}</div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:600;padding-top:16px;border-top:2px solid var(--color-border);">
                            <span>Total</span>
                            <span style="color:var(--color-primary);">${typeof formatPrice === 'function' ? formatPrice(order.amount || order.total_amount) : '$' + (order.amount || order.total_amount)}</span>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="document.getElementById('orderModal').remove()">Cerrar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
