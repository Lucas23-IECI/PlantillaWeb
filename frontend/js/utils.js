/**
 * FUNCIONES UTILITARIAS
 * Helpers reutilizables en todo el sitio
 */

/**
 * Formatear precio según la configuración de moneda
 * @param {number} price - Precio a formatear
 * @returns {string} - Precio formateado
 */
function formatPrice(price) {
    const locale = window.CONFIG?.CURRENCY_LOCALE || 'es-CL';
    const currency = window.CONFIG?.CURRENCY || 'CLP';

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
}

/**
 * Escapar HTML para prevenir XSS
 * @param {string} str - String a escapar
 * @returns {string} - String escapado
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Mostrar notificación toast
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo: 'success' | 'error' | 'warning' | 'info'
 * @param {number} duration - Duración en ms (default: 3000)
 */
function showNotification(message, type = 'info', duration = 3000) {
    // Remover notificación existente
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `notification-toast notification-${type}`;
    toast.innerHTML = `
        <span class="notification-message">${escapeHtml(message)}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Auto-remove
    if (duration > 0) {
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

/**
 * Generar ID de orden único
 * @returns {string} - ID de orden
 */
function generateOrderId() {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 8);
    return `ORD-${ts}-${rand}`.toUpperCase();
}

/**
 * Debounce para limitar llamadas frecuentes
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} - Función con debounce
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle para limitar frecuencia de ejecución
 * @param {Function} func - Función a ejecutar
 * @param {number} limit - Tiempo mínimo entre ejecuciones en ms
 * @returns {Function} - Función con throttle
 */
function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Validar email
 * @param {string} email - Email a validar
 * @returns {boolean} - true si es válido
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validar teléfono chileno
 * @param {string} phone - Teléfono a validar
 * @returns {boolean} - true si es válido
 */
function isValidPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 8 && cleaned.length <= 12;
}

/**
 * Formatear fecha
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Formatear fecha y hora
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} - Fecha y hora formateada
 */
function formatDateTime(date) {
    const d = new Date(date);
    return d.toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Obtener parámetros de URL
 * @param {string} param - Nombre del parámetro
 * @returns {string|null} - Valor del parámetro
 */
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

/**
 * Scroll suave a elemento
 * @param {string} selector - Selector del elemento
 * @param {number} offset - Offset adicional (default: header height)
 */
function scrollToElement(selector, offset = 80) {
    const element = document.querySelector(selector);
    if (element) {
        const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
    }
}

/**
 * Copiar texto al portapapeles
 * @param {string} text - Texto a copiar
 * @returns {Promise<boolean>} - true si se copió exitosamente
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Fallback para navegadores antiguos
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return true;
    }
}

/**
 * Cargar imagen de forma lazy
 * @param {HTMLImageElement} img - Elemento imagen
 */
function lazyLoadImage(img) {
    if ('loading' in HTMLImageElement.prototype) {
        img.loading = 'lazy';
    } else {
        // Fallback IntersectionObserver
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const lazyImg = entry.target;
                    lazyImg.src = lazyImg.dataset.src;
                    observer.unobserve(lazyImg);
                }
            });
        });
        observer.observe(img);
    }
}

// Exportar para uso en módulos (opcional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatPrice,
        escapeHtml,
        showNotification,
        generateOrderId,
        debounce,
        throttle,
        isValidEmail,
        isValidPhone,
        formatDate,
        formatDateTime,
        getUrlParam,
        scrollToElement,
        copyToClipboard,
        lazyLoadImage
    };
}
