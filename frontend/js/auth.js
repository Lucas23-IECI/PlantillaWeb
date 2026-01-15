/**
 * AUTENTICACIÓN
 * Maneja login, logout, tokens JWT y estado de sesión
 */

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

/**
 * Verificar si el usuario está logueado
 * @returns {boolean}
 */
function isLoggedIn() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return false;

    // Verificar si el token ha expirado
    try {
        const payload = decodeJwtPayload(token);
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            handleLogout();
            return false;
        }
        return true;
    } catch {
        return false;
    }
}

/**
 * Obtener token de autenticación
 * @returns {string|null}
 */
function getAuthToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Obtener usuario almacenado
 * @returns {Object|null}
 */
function getStoredUser() {
    try {
        const user = localStorage.getItem(AUTH_USER_KEY);
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
}

/**
 * Decodificar payload de JWT
 * @param {string} token - Token JWT
 * @returns {Object} - Payload decodificado
 */
function decodeJwtPayload(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return {};
    }
}

/**
 * Verificar si el usuario es admin
 * @returns {boolean}
 */
function isAdminUser() {
    const token = getAuthToken();
    if (!token) return false;

    try {
        const payload = decodeJwtPayload(token);
        return !!payload.admin;
    } catch {
        return false;
    }
}

/**
 * Guardar sesión de autenticación
 * @param {string} token - Token JWT
 * @param {Object} user - Datos del usuario
 */
function saveAuthSession(token, user) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    updateAuthLinks();
}

/**
 * Cerrar sesión
 */
function handleLogout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    updateAuthLinks();

    // Redirigir si está en página protegida
    const protectedPages = ['cuenta.html', 'admin'];
    const currentPage = window.location.pathname;

    if (protectedPages.some(page => currentPage.includes(page))) {
        window.location.href = currentPage.includes('pages/') ? 'login.html' : 'pages/login.html';
    }
}

/**
 * Actualizar links de navegación según estado de autenticación
 */
function updateAuthLinks() {
    const isLogged = isLoggedIn();
    const isAdmin = isAdminUser();
    const user = getStoredUser();

    // Links de login/cuenta
    document.querySelectorAll('.nav-login-link').forEach(link => {
        if (isLogged) {
            link.textContent = user?.name || 'Mi Cuenta';
            link.href = link.dataset.loggedHref || 'cuenta.html';
        } else {
            link.textContent = 'Ingresar';
            link.href = link.dataset.loginHref || 'login.html';
        }
    });

    // Mostrar/ocultar elementos según auth
    document.querySelectorAll('[data-auth-show]').forEach(el => {
        el.style.display = isLogged ? '' : 'none';
    });

    document.querySelectorAll('[data-auth-hide]').forEach(el => {
        el.style.display = isLogged ? 'none' : '';
    });

    // Mostrar/ocultar elementos de admin
    document.querySelectorAll('[data-admin-show]').forEach(el => {
        el.style.display = isAdmin ? '' : 'none';
    });
}

/**
 * Verificar token y redirigir si es necesario
 * Usar en páginas protegidas
 */
function requireAuth() {
    if (!isLoggedIn()) {
        const currentPage = window.location.pathname;
        const loginUrl = currentPage.includes('pages/') ? 'login.html' : 'pages/login.html';
        window.location.href = loginUrl;
        return false;
    }
    return true;
}

/**
 * Verificar admin y redirigir si es necesario
 * Usar en páginas de admin
 */
function requireAdmin() {
    if (!isLoggedIn() || !isAdminUser()) {
        const currentPage = window.location.pathname;
        const homeUrl = currentPage.includes('pages/') ? '../index.html' : 'index.html';
        window.location.href = homeUrl;
        return false;
    }
    return true;
}

// Actualizar links al cargar la página
document.addEventListener('DOMContentLoaded', updateAuthLinks);
