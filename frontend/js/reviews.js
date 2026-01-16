/**
 * Product Reviews System
 * Handles display and submission of product reviews
 */

(function() {
    'use strict';

    // State
    let currentProductId = null;
    let currentPage = 1;
    let currentSort = 'recent';
    let reviewsData = null;

    /**
     * Initialize reviews for a product
     */
    window.initProductReviews = function(productId, containerId = 'reviewsContainer') {
        currentProductId = productId;
        const container = document.getElementById(containerId);
        
        if (!container) {
            console.warn('Reviews container not found');
            return;
        }

        renderReviewsSection(container);
        loadReviews();
    };

    /**
     * Render the reviews section HTML
     */
    function renderReviewsSection(container) {
        container.innerHTML = `
            <div class="reviews-section">
                <div class="reviews-header">
                    <h2 class="reviews-title">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        Reseñas de Clientes
                    </h2>
                    <button class="btn-write-review" id="btnWriteReview">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Escribir Reseña
                    </button>
                </div>

                <!-- Reviews Summary -->
                <div class="reviews-summary" id="reviewsSummary">
                    <div class="summary-loading">
                        <div class="skeleton skeleton-text"></div>
                    </div>
                </div>

                <!-- Review Form (hidden by default) -->
                <div class="review-form-container" id="reviewFormContainer" style="display: none;">
                    <form id="reviewForm" class="review-form">
                        <h3>Tu Opinión</h3>
                        
                        <div class="form-group">
                            <label>Calificación *</label>
                            <div class="star-rating-input" id="starRatingInput">
                                ${[1, 2, 3, 4, 5].map(i => `
                                    <button type="button" class="star-btn" data-rating="${i}">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                        </svg>
                                    </button>
                                `).join('')}
                            </div>
                            <input type="hidden" id="reviewRating" name="rating" required>
                        </div>

                        <div class="form-group">
                            <label for="reviewTitle">Título (opcional)</label>
                            <input type="text" id="reviewTitle" name="title" placeholder="Resume tu experiencia en pocas palabras" maxlength="100">
                        </div>

                        <div class="form-group">
                            <label for="reviewComment">Tu Reseña *</label>
                            <textarea id="reviewComment" name="comment" rows="4" required minlength="10" maxlength="1000" placeholder="Cuéntanos qué te pareció el producto..."></textarea>
                            <span class="char-count"><span id="charCount">0</span>/1000</span>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-cancel" id="cancelReview">Cancelar</button>
                            <button type="submit" class="btn-submit-review">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="22" y1="2" x2="11" y2="13"/>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                </svg>
                                Enviar Reseña
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Reviews List -->
                <div class="reviews-controls">
                    <div class="reviews-sort">
                        <label for="reviewSort">Ordenar por:</label>
                        <select id="reviewSort">
                            <option value="recent">Más recientes</option>
                            <option value="rating_high">Mayor calificación</option>
                            <option value="rating_low">Menor calificación</option>
                            <option value="helpful">Más útiles</option>
                        </select>
                    </div>
                </div>

                <div class="reviews-list" id="reviewsList">
                    <div class="reviews-loading">
                        <div class="spinner"></div>
                        <p>Cargando reseñas...</p>
                    </div>
                </div>

                <div class="reviews-pagination" id="reviewsPagination" style="display: none;">
                    <button class="btn-page btn-prev" id="prevPage" disabled>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                        Anterior
                    </button>
                    <span class="page-info" id="pageInfo">Página 1 de 1</span>
                    <button class="btn-page btn-next" id="nextPage" disabled>
                        Siguiente
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        bindEvents();
    }

    /**
     * Bind event listeners
     */
    function bindEvents() {
        // Write review button
        document.getElementById('btnWriteReview')?.addEventListener('click', toggleReviewForm);
        document.getElementById('cancelReview')?.addEventListener('click', toggleReviewForm);

        // Star rating
        document.querySelectorAll('.star-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                selectRating(parseInt(btn.dataset.rating));
            });
            btn.addEventListener('mouseenter', () => highlightStars(parseInt(btn.dataset.rating)));
        });

        document.getElementById('starRatingInput')?.addEventListener('mouseleave', () => {
            const currentRating = parseInt(document.getElementById('reviewRating').value) || 0;
            highlightStars(currentRating);
        });

        // Character count
        document.getElementById('reviewComment')?.addEventListener('input', (e) => {
            document.getElementById('charCount').textContent = e.target.value.length;
        });

        // Form submission
        document.getElementById('reviewForm')?.addEventListener('submit', handleSubmitReview);

        // Sort change
        document.getElementById('reviewSort')?.addEventListener('change', (e) => {
            currentSort = e.target.value;
            currentPage = 1;
            loadReviews();
        });

        // Pagination
        document.getElementById('prevPage')?.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadReviews();
            }
        });

        document.getElementById('nextPage')?.addEventListener('click', () => {
            if (reviewsData && currentPage < reviewsData.pagination.pages) {
                currentPage++;
                loadReviews();
            }
        });
    }

    /**
     * Toggle review form visibility
     */
    function toggleReviewForm() {
        const container = document.getElementById('reviewFormContainer');
        const isVisible = container.style.display !== 'none';
        container.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            // Check if user is logged in
            if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
                showNotification('Debes iniciar sesión para escribir una reseña', 'warning');
                container.style.display = 'none';
                return;
            }
            container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * Select rating
     */
    function selectRating(rating) {
        document.getElementById('reviewRating').value = rating;
        highlightStars(rating);
    }

    /**
     * Highlight stars
     */
    function highlightStars(rating) {
        document.querySelectorAll('.star-btn').forEach((btn, index) => {
            const isActive = index < rating;
            btn.classList.toggle('active', isActive);
            btn.querySelector('svg').setAttribute('fill', isActive ? 'currentColor' : 'none');
        });
    }

    /**
     * Load reviews from API
     */
    async function loadReviews() {
        const listContainer = document.getElementById('reviewsList');
        
        listContainer.innerHTML = `
            <div class="reviews-loading">
                <div class="spinner"></div>
                <p>Cargando reseñas...</p>
            </div>
        `;

        try {
            const response = await fetch(
                `${window.CONFIG?.API_URL || '/api'}/reviews/product/${currentProductId}?page=${currentPage}&sort=${currentSort}`
            );

            if (!response.ok) throw new Error('Error loading reviews');

            reviewsData = await response.json();
            renderReviewsSummary(reviewsData.stats);
            renderReviewsList(reviewsData.reviews);
            updatePagination(reviewsData.pagination);

        } catch (error) {
            console.error('Error loading reviews:', error);
            listContainer.innerHTML = `
                <div class="reviews-empty">
                    <p>No se pudieron cargar las reseñas</p>
                    <button class="btn-retry" onclick="loadReviews()">Reintentar</button>
                </div>
            `;
        }
    }

    /**
     * Render reviews summary
     */
    function renderReviewsSummary(stats) {
        const container = document.getElementById('reviewsSummary');
        if (!container) return;

        if (stats.total_reviews === 0) {
            container.innerHTML = `
                <div class="summary-empty">
                    <p>Este producto aún no tiene reseñas. ¡Sé el primero en opinar!</p>
                </div>
            `;
            return;
        }

        const distribution = stats.rating_distribution;
        const maxCount = Math.max(...Object.values(distribution));

        container.innerHTML = `
            <div class="summary-main">
                <div class="summary-average">
                    <span class="average-number">${stats.average_rating}</span>
                    <div class="average-stars">${renderStars(stats.average_rating)}</div>
                    <span class="average-count">${stats.total_reviews} reseña${stats.total_reviews !== 1 ? 's' : ''}</span>
                </div>
                <div class="summary-distribution">
                    ${[5, 4, 3, 2, 1].map(rating => {
                        const count = distribution[rating] || 0;
                        const percentage = maxCount > 0 ? (count / stats.total_reviews) * 100 : 0;
                        return `
                            <div class="dist-row">
                                <span class="dist-label">${rating} ★</span>
                                <div class="dist-bar">
                                    <div class="dist-fill" style="width: ${percentage}%"></div>
                                </div>
                                <span class="dist-count">${count}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render reviews list
     */
    function renderReviewsList(reviews) {
        const container = document.getElementById('reviewsList');
        if (!container) return;

        if (!reviews || reviews.length === 0) {
            container.innerHTML = `
                <div class="reviews-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    <p>No hay reseñas aún</p>
                </div>
            `;
            return;
        }

        container.innerHTML = reviews.map(review => `
            <article class="review-card">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-avatar">${getInitials(review.user_name)}</div>
                        <div class="reviewer-details">
                            <span class="reviewer-name">${escapeHtml(review.user_name)}</span>
                            <span class="review-date">${formatDate(review.createdAt)}</span>
                        </div>
                    </div>
                    <div class="review-rating">
                        ${renderStars(review.rating)}
                    </div>
                </div>
                ${review.title ? `<h4 class="review-title">${escapeHtml(review.title)}</h4>` : ''}
                <p class="review-comment">${escapeHtml(review.comment)}</p>
                <div class="review-footer">
                    <button class="btn-helpful ${review.marked_helpful ? 'active' : ''}" data-review-id="${review.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                        </svg>
                        <span>Útil (${review.helpful_count || 0})</span>
                    </button>
                </div>
            </article>
        `).join('');

        // Bind helpful buttons
        container.querySelectorAll('.btn-helpful').forEach(btn => {
            btn.addEventListener('click', () => markHelpful(btn.dataset.reviewId, btn));
        });
    }

    /**
     * Update pagination controls
     */
    function updatePagination(pagination) {
        const container = document.getElementById('reviewsPagination');
        if (!container || !pagination) return;

        const { page, pages, total } = pagination;

        if (total <= 10) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';
        document.getElementById('pageInfo').textContent = `Página ${page} de ${pages}`;
        document.getElementById('prevPage').disabled = page <= 1;
        document.getElementById('nextPage').disabled = page >= pages;
    }

    /**
     * Handle review submission
     */
    async function handleSubmitReview(e) {
        e.preventDefault();

        const rating = document.getElementById('reviewRating').value;
        const title = document.getElementById('reviewTitle').value.trim();
        const comment = document.getElementById('reviewComment').value.trim();

        if (!rating) {
            showNotification('Por favor selecciona una calificación', 'error');
            return;
        }

        if (comment.length < 10) {
            showNotification('El comentario debe tener al menos 10 caracteres', 'error');
            return;
        }

        const submitBtn = e.target.querySelector('.btn-submit-review');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-sm"></span> Enviando...';

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                showNotification('Debes iniciar sesión para escribir una reseña', 'warning');
                return;
            }

            const response = await fetch(
                `${window.CONFIG?.API_URL || '/api'}/reviews/product/${currentProductId}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ rating: parseInt(rating), title, comment })
                }
            );

            const result = await response.json();

            if (response.ok) {
                showNotification(result.message || 'Reseña enviada exitosamente', 'success');
                document.getElementById('reviewFormContainer').style.display = 'none';
                document.getElementById('reviewForm').reset();
                selectRating(0);
                document.getElementById('charCount').textContent = '0';
                // Reload reviews
                loadReviews();
            } else {
                showNotification(result.message || 'Error al enviar reseña', 'error');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            showNotification('Error al enviar reseña', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Enviar Reseña
            `;
        }
    }

    /**
     * Mark review as helpful
     */
    async function markHelpful(reviewId, btn) {
        try {
            const response = await fetch(
                `${window.CONFIG?.API_URL || '/api'}/reviews/${reviewId}/helpful`,
                { method: 'POST' }
            );

            const result = await response.json();

            if (response.ok) {
                btn.classList.add('active');
                btn.querySelector('span').textContent = `Útil (${result.helpful_count})`;
            } else {
                showNotification(result.message || 'Ya marcaste esta reseña', 'info');
            }
        } catch (error) {
            console.error('Error marking helpful:', error);
        }
    }

    /**
     * Render star icons
     */
    function renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.5;
        let stars = '';

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars += '<svg class="star filled" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
            } else if (i === fullStars && hasHalf) {
                stars += '<svg class="star half" width="16" height="16" viewBox="0 0 24 24"><defs><linearGradient id="halfGrad"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="url(#halfGrad)" stroke="currentColor" stroke-width="2"/></svg>';
            } else {
                stars += '<svg class="star empty" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
            }
        }

        return stars;
    }

    /**
     * Get initials from name
     */
    function getInitials(name) {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    /**
     * Format date
     */
    function formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    /**
     * Escape HTML
     */
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Show notification
     */
    function showNotification(message, type = 'info') {
        if (typeof window.showWishlistNotification === 'function') {
            window.showWishlistNotification(message, type);
        } else {
            alert(message);
        }
    }

})();
