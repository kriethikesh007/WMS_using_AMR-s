const API_BASE = 'http://localhost:8080';

export const AUTH_TOKEN_KEY = 'nexora_jwt_token';
export const AUTH_USER_KEY = 'nexora_jwt_user';

export function getAuthToken() {
    try {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch (_) {
        return null;
    }
}

export function setAuthSession(token, user) {
    try {
        if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
        if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        window.dispatchEvent(new CustomEvent('auth:change', { detail: { token, user } }));
    } catch (_) {}
}

export function clearAuthSession() {
    try {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        window.dispatchEvent(new CustomEvent('auth:change', { detail: { token: null, user: null } }));
    } catch (_) {}
}

export function getAuthUser() {
    try {
        const raw = localStorage.getItem(AUTH_USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (_) {
        return null;
    }
}

async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = { 'Content-Type': 'application/json', ...options.headers };

    // Attach JWT Bearer token if present
    const token = getAuthToken();
    if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };
    if (!config.body) {
        delete config.headers['Content-Type'];
    }
    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }
    const response = await fetch(url, config);

    if (response.status === 401) {
        clearAuthSession();
        window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { endpoint } }));
    }

    if (response.status === 204) return null;
    const contentType = response.headers.get('Content-Type') || '';
    if (response.ok) {
        if (contentType.includes('application/json')) return await response.json();
        return await response.text() || null;
    }
    let errorMessage;
    let validationErrors = null;
    if (contentType.includes('application/json')) {
        const errorData = await response.json();
        if (typeof errorData === 'object' && !Array.isArray(errorData)) {
            validationErrors = errorData;
            errorMessage = Object.values(errorData).join(', ');
        } else {
            errorMessage = JSON.stringify(errorData);
        }
    } else {
        errorMessage = await response.text();
    }
    const error = new Error(errorMessage || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.validationErrors = validationErrors;
    throw error;
}

const api = {
    get: (e, opts) => request(e, { method: 'GET', ...opts }),
    post: (e, b, opts) => request(e, { method: 'POST', body: b, ...opts }),
    put: (e, b, opts) => request(e, { method: 'PUT', body: b, ...opts }),
    delete: (e, opts) => request(e, { method: 'DELETE', ...opts }),
};

api.auth = {
    login: (creds) => api.post('/api/auth/login', creds),
    register: (userData) => api.post('/api/auth/register', userData),
    me: () => api.get('/api/auth/me'),
};

api.warehouses = {
    list: () => api.get('/warehouses'),
    get: (id) => api.get(`/warehouses/${id}`),
    create: (d) => api.post('/warehouses', d),
    update: (id, d) => api.put(`/warehouses/${id}`, d),
    delete: (id) => api.delete(`/warehouses/${id}`),
};

api.bins = {
    list: () => api.get('/bins'),
    get: (id) => api.get(`/bins/${id}`),
    create: (d) => api.post('/bins', d),
    update: (id, d) => api.put(`/bins/${id}`, d),
    delete: (id) => api.delete(`/bins/${id}`),
};

api.products = {
    list: () => api.get('/products'),
    get: (id) => api.get(`/products/${id}`),
    create: (d) => api.post('/products', d),
    update: (id, d) => api.put(`/products/${id}`, d),
    delete: (id) => api.delete(`/products/${id}`),
};

api.inventory = {
    list: () => api.get('/inventory/getAllInventory'),
    get: (id) => api.get(`/inventory/getInventoryById/${id}`),
    create: (d) => api.post('/inventory/createInventory', d),
    update: (id, d) => api.put(`/inventory/updateInventory/${id}`, d),
    delete: (id) => api.delete(`/inventory/deleteInventory/${id}`),
};

api.amrs = {
    list: () => api.get('/amrs'),
    get: (id) => api.get(`/amrs/${id}`),
    create: (d) => api.post('/amrs', d),
    update: (id, d) => api.put(`/amrs/${id}`, d),
    delete: (id) => api.delete(`/amrs/${id}`),
};

api.merchants = {
    list: () => api.get('/merchants'),
    get: (id) => api.get(`/merchants/${id}`),
    create: (d) => api.post('/merchants', d),
    update: (id, d) => api.put(`/merchants/${id}`, d),
    delete: (id) => api.delete(`/merchants/${id}`),
};

api.orders = {
    list: () => api.get('/orders'),
    get: (id) => api.get(`/orders/${id}`),
    create: (d) => api.post('/orders', d),
    update: (id, d) => api.put(`/orders/${id}`, d),
    delete: (id) => api.delete(`/orders/${id}`),
    pick: (id) => api.put(`/orders/${id}/pick`),
    checkInventory: (id) => api.put(`/orders/${id}/check-inventory`),
    reserveInventory: (id) => api.put(`/orders/${id}/reserve-inventory`),
};

api.picks = {
    list: () => api.get('/fulfillment/picks'),
    get: (id) => api.get(`/fulfillment/picks/${id}`),
    byStatus: (s) => api.get(`/fulfillment/picks/status/${s}`),
    create: (orderId) => api.post(`/fulfillment/picks?orderId=${orderId}`),
    assignAMR: (pickId, amrId) => api.post(`/fulfillment/picks/${pickId}/assign?amrId=${amrId}`),
    start: (pickId) => api.post(`/fulfillment/picks/${pickId}/start`),
    complete: (pickId) => api.post(`/fulfillment/picks/${pickId}/complete`),
    fail: (pickId) => api.post(`/fulfillment/picks/${pickId}/fail`),
};

api.invoices = {
    list: () => api.get('/invoices'),
    get: (id) => api.get(`/invoices/${id}`),
    byOrder: (orderId) => api.get(`/invoices/order/${orderId}`),
    create: (orderId) => api.post(`/invoices?orderId=${orderId}`),
    pay: (id) => api.put(`/invoices/${id}/pay`),
    cancel: (id) => api.put(`/invoices/${id}/cancel`),
};

api.budgets = {
    list: () => api.get('/budgets'),
    get: (id) => api.get(`/budgets/${id}`),
    create: (d) => api.post('/budgets', d),
    update: (id, d) => api.put(`/budgets/${id}`, d),
    delete: (id) => api.delete(`/budgets/${id}`),
};

export default api;
