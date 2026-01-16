class APIClient {
    constructor(baseURL) {
        this._customBaseURL = baseURL;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000;
    }

    get baseURL() {
        if (this._customBaseURL) return this._customBaseURL;
        return (typeof window !== 'undefined' && window.CONFIG?.API_URL) || '/api';
    }

    getAuthHeaders() {
        const token = localStorage.getItem('auth_token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders(),
            ...options.headers
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Error ${response.status}`);
            }

            return data;
        } catch (error) {
            console.debug(`API [${endpoint}]:`, error.message);
            throw error;
        }
    }

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async patch(endpoint, data) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    async requestForm(endpoint, formData) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = this.getAuthHeaders();

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Error ${response.status}`);
        }

        return data;
    }

    async register(email, name, password, phone = '', address = '', city = '') {
        return this.post('/auth/register', { email, name, password, phone, address, city });
    }

    async login(email, password) {
        return this.post('/auth/login', { email, password });
    }

    async requestPasswordReset(email) {
        return this.post('/auth/password-reset', { email });
    }

    async changePassword(currentPassword, newPassword) {
        return this.post('/auth/change-password', { currentPassword, newPassword });
    }

    async getProducts(forceRefresh = false) {
        const cacheKey = 'products';

        if (!forceRefresh && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        const data = await this.get('/products');
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
    }

    async getProductById(id) {
        return this.get(`/products/${id}`);
    }

    async getHomeFeaturedProducts() {
        return this.get('/products/home-featured');
    }

    async createTransaction(transactionData) {
        return this.post('/transactions', transactionData);
    }

    async getTransaction(orderId) {
        return this.get(`/transactions/${orderId}`);
    }

    async getMyTransactions() {
        return this.get('/transactions/my');
    }

    async updateTransactionStatus(orderId, status) {
        return this.patch(`/transactions/${orderId}/status`, { status });
    }

    async webpayCreate(orderId) {
        return this.post('/webpay/create', { order_id: orderId });
    }

    async webpayCommit(token, orderId) {
        return this.post('/webpay/commit', { token_ws: token, order_id: orderId });
    }

    async getActiveNotices() {
        return this.get('/notices/active');
    }

    async validateDiscountCode(code) {
        return this.get(`/discount-codes/validate?code=${encodeURIComponent(code)}`);
    }

    async getAdminOrders() {
        return this.get('/admin/orders');
    }

    async adminUpdateOrderStatus(orderId, status) {
        return this.patch(`/admin/orders/${orderId}/status`, { status });
    }

    async adminDeleteOrder(orderId) {
        return this.delete(`/admin/orders/${orderId}`);
    }

    async getAdminProducts() {
        return this.get('/admin/products');
    }

    async adminCreateProduct(product) {
        return this.post('/admin/products', product);
    }

    async adminUpdateProduct(productId, patch) {
        return this.patch(`/admin/products/${productId}`, patch);
    }

    async adminDeleteProduct(productId) {
        return this.delete(`/admin/products/${productId}`);
    }

    async adminUploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);
        return this.requestForm('/admin/upload', formData);
    }

    async adminGetHomeFeaturedProductIds() {
        return this.get('/admin/home-featured-products');
    }

    async adminSetHomeFeaturedProductIds(ids) {
        return this.put('/admin/home-featured-products', { featured_product_ids: ids });
    }

    async adminGetCatalogProductOrderIds() {
        return this.get('/admin/catalog-product-order');
    }

    async adminSetCatalogProductOrderIds(ids) {
        return this.put('/admin/catalog-product-order', { catalog_product_ids: ids });
    }

    async adminListNotices() {
        return this.get('/admin/notices');
    }

    async adminCreateNotice(notice) {
        return this.post('/admin/notices', notice);
    }

    async adminUpdateNotice(noticeId, patch) {
        return this.patch(`/admin/notices/${noticeId}`, patch);
    }

    async adminDeleteNotice(noticeId) {
        return this.delete(`/admin/notices/${noticeId}`);
    }

    async adminListDiscountCodes() {
        return this.get('/admin/discount-codes');
    }

    async adminCreateDiscountCode(payload) {
        return this.post('/admin/discount-codes', payload);
    }

    async adminUpdateDiscountCode(code, patch) {
        return this.patch(`/admin/discount-codes/${code}`, patch);
    }

    async adminDeleteDiscountCode(code) {
        return this.delete(`/admin/discount-codes/${code}`);
    }

    // ==========================================
    // ALIAS METHODS FOR ADMIN PANEL
    // ==========================================

    // Products aliases
    async createProduct(product) {
        return this.adminCreateProduct(product);
    }

    async updateProduct(productId, patch) {
        return this.adminUpdateProduct(productId, patch);
    }

    async deleteProduct(productId) {
        return this.adminDeleteProduct(productId);
    }

    // Discount codes aliases
    async getDiscountCodes() {
        return this.adminListDiscountCodes();
    }

    async createDiscountCode(payload) {
        return this.adminCreateDiscountCode(payload);
    }

    async updateDiscountCode(code, patch) {
        return this.adminUpdateDiscountCode(code, patch);
    }

    async deleteDiscountCode(code) {
        return this.adminDeleteDiscountCode(code);
    }

    // Notices aliases
    async getNotices() {
        return this.adminListNotices();
    }

    async createNotice(notice) {
        return this.adminCreateNotice(notice);
    }

    async updateNotice(noticeId, patch) {
        return this.adminUpdateNotice(noticeId, patch);
    }

    async deleteNotice(noticeId) {
        return this.adminDeleteNotice(noticeId);
    }

    // Admin stats endpoint
    async getAdminStats() {
        return this.get('/admin/stats');
    }

    // ==========================================
    // CATEGORIES
    // ==========================================
    async adminGetCategories() {
        return this.get('/admin/categories');
    }

    async adminCreateCategory(data) {
        return this.post('/admin/categories', data);
    }

    async adminUpdateCategory(id, data) {
        return this.patch(`/admin/categories/${id}`, data);
    }

    async adminDeleteCategory(id) {
        return this.delete(`/admin/categories/${id}`);
    }

    async adminReorderCategories(order) {
        return this.put('/admin/categories/reorder', { order });
    }

    // ==========================================
    // SUPPLIERS
    // ==========================================
    async adminGetSuppliers() {
        return this.get('/admin/suppliers');
    }

    async adminCreateSupplier(data) {
        return this.post('/admin/suppliers', data);
    }

    async adminUpdateSupplier(id, data) {
        return this.patch(`/admin/suppliers/${id}`, data);
    }

    async adminDeleteSupplier(id) {
        return this.delete(`/admin/suppliers/${id}`);
    }

    // ==========================================
    // INVENTORY HISTORY
    // ==========================================
    async adminGetInventoryHistory(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/admin/inventory-history${query ? `?${query}` : ''}`);
    }

    async adminCreateInventoryMovement(data) {
        return this.post('/admin/inventory-history', data);
    }

    // ==========================================
    // STOCK ALERTS
    // ==========================================
    async adminGetStockAlerts() {
        return this.get('/admin/alerts');
    }

    async adminDismissAlert(id) {
        return this.patch(`/admin/alerts/${id}/dismiss`, {});
    }

    async adminUpdateAlertSettings(settings) {
        return this.put('/admin/settings/stock-threshold', settings);
    }

    async adminRestockProduct(productId, data) {
        return this.post(`/admin/products/${productId}/restock`, data);
    }

    // ==========================================
    // PRODUCT VARIANTS
    // ==========================================
    async adminGetProductVariants(productId) {
        return this.get(`/admin/products/${productId}/variants`);
    }

    async adminCreateVariant(productId, data) {
        return this.post(`/admin/products/${productId}/variants`, data);
    }

    async adminUpdateVariant(productId, variantId, data) {
        return this.patch(`/admin/products/${productId}/variants/${variantId}`, data);
    }

    async adminDeleteVariant(productId, variantId) {
        return this.delete(`/admin/products/${productId}/variants/${variantId}`);
    }

    // ==========================================
    // BULK OPERATIONS
    // ==========================================
    async adminBulkUpdateProducts(ids, updates) {
        return this.post('/admin/products/bulk-update', { ids, updates });
    }

    async adminBulkDeleteProducts(ids) {
        return this.post('/admin/products/bulk-delete', { ids });
    }

    async adminBulkCreateProducts(products, options = {}) {
        const query = options.updateExisting ? '?updateExisting=true' : '';
        return this.post(`/admin/products/bulk-create${query}`, { products });
    }

    // ==========================================
    // IMPORT/EXPORT
    // ==========================================
    async adminExportProducts(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/admin/products/export${query ? `?${query}` : ''}`);
    }

    async adminImportProducts(file, options = {}) {
        const formData = new FormData();
        formData.append('file', file);
        if (options.updateExisting) {
            formData.append('updateExisting', 'true');
        }
        return this.requestForm('/admin/products/import', formData);
    }

    async adminGetImportTemplate() {
        return this.get('/admin/products/import-template');
    }

    // ==========================================
    // USER PROFILE & ADDRESSES
    // ==========================================
    async getUserProfile() {
        return this.get('/user/profile');
    }

    async updateUserProfile(data) {
        return this.put('/user/profile', data);
    }

    async getUserAddresses() {
        return this.get('/user/addresses');
    }

    async createUserAddress(data) {
        return this.post('/user/addresses', data);
    }

    async updateUserAddress(addressId, data) {
        return this.put(`/user/addresses/${addressId}`, data);
    }

    async deleteUserAddress(addressId) {
        return this.delete(`/user/addresses/${addressId}`);
    }
}

const api = new APIClient();
