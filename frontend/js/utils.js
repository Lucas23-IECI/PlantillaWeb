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

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showNotification(message, type = 'info', duration = 3000) {
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `notification-toast notification-${type}`;
    toast.innerHTML = `
        <span class="notification-message">${escapeHtml(message)}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    if (duration > 0) {
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

function generateOrderId() {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 8);
    return `ORD-${ts}-${rand}`.toUpperCase();
}

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

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 8 && cleaned.length <= 12;
}

function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

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

function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function scrollToElement(selector, offset = 80) {
    const element = document.querySelector(selector);
    if (element) {
        const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
    }
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return true;
    }
}

function lazyLoadImage(img) {
    if ('loading' in HTMLImageElement.prototype) {
        img.loading = 'lazy';
    } else {
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
