document.addEventListener('DOMContentLoaded', function () {
    initNosotrosPage();
});

function initNosotrosPage() {
    initScrollAnimations();
    initStatsCounter();
    initTeamCarousel();
    initTestimonials();
}

function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.2
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                if (entry.target.classList.contains('stat-item')) {
                    animateCounter(entry.target);
                }
            }
        });
    }, observerOptions);

    document.querySelectorAll('.mission-content h2, .timeline-item, .value-card, .stat-item').forEach(el => {
        observer.observe(el);
    });

    document.querySelectorAll('.value-card').forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
}

function initStatsCounter() {
}

function animateCounter(statItem) {
    const counterEl = statItem.querySelector('.counter');
    if (!counterEl || counterEl.dataset.animated) return;

    counterEl.dataset.animated = 'true';
    const target = parseInt(counterEl.dataset.target) || 0;
    const duration = 2000;
    const startTime = performance.now();

    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(target * easeOut);

        counterEl.textContent = formatNumber(current);

        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            counterEl.textContent = formatNumber(target);
        }
    }

    requestAnimationFrame(updateCounter);
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return num.toLocaleString('es-CL');
    }
    return num.toString();
}

function initTeamCarousel() {
    const carousel = document.querySelector('.team-carousel');
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const nextBtn = document.querySelector('.carousel-btn.next');

    if (!carousel) return;

    const scrollAmount = 304;

    prevBtn?.addEventListener('click', () => {
        carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    nextBtn?.addEventListener('click', () => {
        carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });

    let autoScroll;
    function startAutoScroll() {
        autoScroll = setInterval(() => {
            if (carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth) {
                carousel.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }, 4000);
    }

    function stopAutoScroll() {
        clearInterval(autoScroll);
    }

    carousel.addEventListener('mouseenter', stopAutoScroll);
    carousel.addEventListener('mouseleave', startAutoScroll);

    startAutoScroll();
}

function initTestimonials() {
    const testimonials = document.querySelectorAll('.testimonial');
    const dots = document.querySelectorAll('.testimonial-dot');

    if (testimonials.length === 0) return;

    let currentIndex = 0;
    let autoRotate;

    function showTestimonial(index) {
        testimonials.forEach(t => t.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));

        testimonials[index]?.classList.add('active');
        dots[index]?.classList.add('active');
        currentIndex = index;
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showTestimonial(index);
            resetAutoRotate();
        });
    });

    function nextTestimonial() {
        const nextIndex = (currentIndex + 1) % testimonials.length;
        showTestimonial(nextIndex);
    }

    function startAutoRotate() {
        autoRotate = setInterval(nextTestimonial, 5000);
    }

    function resetAutoRotate() {
        clearInterval(autoRotate);
        startAutoRotate();
    }

    showTestimonial(0);
    startAutoRotate();
}

function initParallax() {
    const hero = document.querySelector('.nosotros-hero');

    if (!hero) return;

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * 0.5;
        hero.style.backgroundPositionY = `${rate}px`;
    });
}
