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
}

const api = new APIClient();
