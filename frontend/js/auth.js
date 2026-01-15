const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

function isLoggedIn() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return false;

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

function getAuthToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

function getStoredUser() {
    try {
        const user = localStorage.getItem(AUTH_USER_KEY);
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
}

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

function saveAuthSession(token, user) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    updateAuthLinks();
}

function handleLogout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    updateAuthLinks();

    const protectedPages = ['cuenta.html', 'admin'];
    const currentPage = window.location.pathname;

    if (protectedPages.some(page => currentPage.includes(page))) {
        window.location.href = currentPage.includes('pages/') ? 'login.html' : 'pages/login.html';
    }
}

function updateAuthLinks() {
    const isLogged = isLoggedIn();
    const isAdmin = isAdminUser();
    const user = getStoredUser();

    document.querySelectorAll('.nav-login-link').forEach(link => {
        if (isLogged) {
            link.textContent = user?.name || 'Mi Cuenta';
            link.href = link.dataset.loggedHref || 'cuenta.html';
        } else {
            link.textContent = 'Ingresar';
            link.href = link.dataset.loginHref || 'login.html';
        }
    });

    document.querySelectorAll('[data-auth-show]').forEach(el => {
        el.style.display = isLogged ? '' : 'none';
    });

    document.querySelectorAll('[data-auth-hide]').forEach(el => {
        el.style.display = isLogged ? 'none' : '';
    });

    document.querySelectorAll('[data-admin-show]').forEach(el => {
        el.style.display = isAdmin ? '' : 'none';
    });
}

function requireAuth() {
    if (!isLoggedIn()) {
        const currentPage = window.location.pathname;
        const loginUrl = currentPage.includes('pages/') ? 'login.html' : 'pages/login.html';
        window.location.href = loginUrl;
        return false;
    }
    return true;
}

function requireAdmin() {
    if (!isLoggedIn() || !isAdminUser()) {
        const currentPage = window.location.pathname;
        const homeUrl = currentPage.includes('pages/') ? '../index.html' : 'index.html';
        window.location.href = homeUrl;
        return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', updateAuthLinks);
