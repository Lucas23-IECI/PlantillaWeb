document.addEventListener('DOMContentLoaded', function () {
    initContactPage();
});

function initContactPage() {
    initScrollAnimations();
    initSubjectTabs();
    initFormValidation();
    initCharCounter();
    initFaqAccordion();
    initChatWidget();
    updateBusinessStatus();
}

function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, { threshold: 0.2 });

    document.querySelectorAll('.channel-card, .faq-item, .info-card').forEach((el, index) => {
        el.style.animationDelay = `${index * 0.1}s`;
        observer.observe(el);
    });
}

function initSubjectTabs() {
    const tabs = document.querySelectorAll('.subject-tab');
    const subjectInput = document.getElementById('asunto');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            if (subjectInput) {
                subjectInput.value = tab.dataset.subject || '';
            }
        });
    });
}

function initFormValidation() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const inputs = form.querySelectorAll('input, textarea');

    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
            if (input.classList.contains('invalid')) {
                validateField(input);
            }
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        let isValid = true;
        inputs.forEach(input => {
            if (!validateField(input)) {
                isValid = false;
            }
        });

        if (!isValid) return;

        const submitBtn = form.querySelector('.submit-btn');
        submitBtn.classList.add('loading');

        await new Promise(resolve => setTimeout(resolve, 2000));

        submitBtn.classList.remove('loading');

        form.style.display = 'none';
        document.querySelector('.form-success').classList.add('show');
    });
}

function validateField(input) {
    const formGroup = input.closest('.form-group');
    const errorMsg = formGroup?.querySelector('.error-message');

    let isValid = true;
    let message = '';

    if (input.required && !input.value.trim()) {
        isValid = false;
        message = 'Este campo es requerido';
    } else if (input.type === 'email' && input.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.value)) {
            isValid = false;
            message = 'Ingresa un email válido';
        }
    } else if (input.type === 'tel' && input.value) {
        const phoneRegex = /^[\d\s+()-]{8,}$/;
        if (!phoneRegex.test(input.value)) {
            isValid = false;
            message = 'Ingresa un teléfono válido';
        }
    }

    input.classList.toggle('valid', isValid && input.value);
    input.classList.toggle('invalid', !isValid);
    formGroup?.classList.toggle('has-error', !isValid);

    if (errorMsg) {
        errorMsg.textContent = message;
    }

    return isValid;
}

function initCharCounter() {
    const textarea = document.getElementById('mensaje');
    const counter = document.querySelector('.char-counter');

    if (!textarea || !counter) return;

    const maxLength = 1000;
    textarea.setAttribute('maxlength', maxLength);

    textarea.addEventListener('input', () => {
        const remaining = maxLength - textarea.value.length;
        counter.textContent = `${textarea.value.length}/${maxLength}`;
        counter.style.color = remaining < 50 ? '#ef4444' : '';
    });
}

function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            faqItems.forEach(i => i.classList.remove('active'));

            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

function initChatWidget() {
    const widget = document.querySelector('.chat-widget');
    const bubble = widget?.querySelector('.chat-bubble');

    if (!bubble) return;

    bubble.addEventListener('click', () => {
        widget.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (!widget.contains(e.target)) {
            widget.classList.remove('open');
        }
    });

    const options = document.querySelectorAll('.chat-option');
    options.forEach(option => {
        option.addEventListener('click', () => {
            const subject = option.dataset.subject;
            if (subject) {
                widget.classList.remove('open');
                const form = document.getElementById('contactForm');
                if (form) {
                    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    const asuntoInput = document.getElementById('asunto');
                    if (asuntoInput) {
                        asuntoInput.value = subject;
                    }
                }
            }
        });
    });
}

function updateBusinessStatus() {
    const statusBadge = document.querySelector('.status-badge');
    if (!statusBadge) return;

    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();

    const isOpen = day >= 1 && day <= 5 && hour >= 9 && hour < 18;

    statusBadge.classList.toggle('open', isOpen);
    statusBadge.classList.toggle('closed', !isOpen);
    statusBadge.innerHTML = `<span></span>${isOpen ? 'Abierto ahora' : 'Cerrado'}`;
}
