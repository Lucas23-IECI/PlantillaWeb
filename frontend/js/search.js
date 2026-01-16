/**
 * Global Search System
 * Provides search functionality with autocomplete across the site
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        minChars: 2,
        debounceTime: 300,
        maxResults: 8,
        maxRecentSearches: 5
    };

    // State
    let products = [];
    let recentSearches = [];
    let searchTimeout = null;
    let currentFocus = -1;

    /**
     * Initialize search system
     */
    function init() {
        loadProducts();
        loadRecentSearches();
        initSearchInputs();
        createSearchModal();
    }

    /**
     * Load products for search
     */
    async function loadProducts() {
        try {
            if (typeof api !== 'undefined') {
                const result = await api.getProducts();
                products = Array.isArray(result) ? result : (result.products || []);
            }
        } catch (error) {
            console.debug('Search: Could not load products', error.message);
        }
    }

    /**
     * Load recent searches from localStorage
     */
    function loadRecentSearches() {
        try {
            const stored = localStorage.getItem('recent_searches');
            recentSearches = stored ? JSON.parse(stored) : [];
        } catch (e) {
            recentSearches = [];
        }
    }

    /**
     * Save recent searches
     */
    function saveRecentSearches() {
        try {
            localStorage.setItem('recent_searches', JSON.stringify(recentSearches.slice(0, CONFIG.maxRecentSearches)));
        } catch (e) {
            // Ignore
        }
    }

    /**
     * Add to recent searches
     */
    function addToRecentSearches(query) {
        if (!query || query.length < CONFIG.minChars) return;
        
        recentSearches = recentSearches.filter(s => s.toLowerCase() !== query.toLowerCase());
        recentSearches.unshift(query);
        recentSearches = recentSearches.slice(0, CONFIG.maxRecentSearches);
        saveRecentSearches();
    }

    /**
     * Initialize search inputs
     */
    function initSearchInputs() {
        // Header search inputs
        document.querySelectorAll('.header-search input, #searchProducts').forEach(input => {
            setupSearchInput(input);
        });

        // Search icon buttons
        document.querySelectorAll('.search-icon, .header-search button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                openSearchModal();
            });
        });

        // Global keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                openSearchModal();
            }
            if (e.key === 'Escape') {
                closeSearchModal();
            }
        });
    }

    /**
     * Setup individual search input
     */
    function setupSearchInput(input) {
        if (!input) return;

        // Create autocomplete container
        const wrapper = input.parentElement;
        wrapper.style.position = 'relative';
        
        let autocomplete = wrapper.querySelector('.search-autocomplete');
        if (!autocomplete) {
            autocomplete = document.createElement('div');
            autocomplete.className = 'search-autocomplete';
            wrapper.appendChild(autocomplete);
        }

        // Input events
        input.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                handleSearchInput(input, autocomplete);
            }, CONFIG.debounceTime);
        });

        input.addEventListener('focus', () => {
            if (input.value.length >= CONFIG.minChars) {
                handleSearchInput(input, autocomplete);
            } else if (recentSearches.length > 0) {
                showRecentSearches(autocomplete, input);
            }
        });

        input.addEventListener('keydown', (e) => {
            handleKeyboardNavigation(e, autocomplete, input);
        });

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                autocomplete.classList.remove('active');
            }
        });

        // Form submission
        const form = input.closest('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                performSearch(input.value);
            });
        }

        // Enter key
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const activeItem = autocomplete.querySelector('.autocomplete-item.active');
                if (activeItem) {
                    activeItem.click();
                } else {
                    performSearch(input.value);
                }
            }
        });
    }

    /**
     * Handle search input
     */
    function handleSearchInput(input, autocomplete) {
        const query = input.value.trim().toLowerCase();
        
        if (query.length < CONFIG.minChars) {
            if (recentSearches.length > 0) {
                showRecentSearches(autocomplete, input);
            } else {
                autocomplete.classList.remove('active');
            }
            return;
        }

        const results = searchProducts(query);
        renderAutocomplete(results, query, autocomplete, input);
    }

    /**
     * Search products
     */
    function searchProducts(query) {
        if (!products.length) return [];

        const queryLower = query.toLowerCase();
        const words = queryLower.split(/\s+/);

        return products
            .map(product => {
                const name = (product.name || product.nombre || '').toLowerCase();
                const category = (product.category || product.categoria || '').toLowerCase();
                const brand = (product.brand || product.marca || '').toLowerCase();
                const description = (product.description || product.descripcion || '').toLowerCase();

                let score = 0;

                // Exact match in name
                if (name === queryLower) score += 100;
                // Starts with query
                else if (name.startsWith(queryLower)) score += 50;
                // Contains query
                else if (name.includes(queryLower)) score += 30;

                // Match each word
                words.forEach(word => {
                    if (name.includes(word)) score += 10;
                    if (category.includes(word)) score += 5;
                    if (brand.includes(word)) score += 5;
                    if (description.includes(word)) score += 2;
                });

                return { product, score };
            })
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, CONFIG.maxResults)
            .map(item => item.product);
    }

    /**
     * Render autocomplete dropdown
     */
    function renderAutocomplete(results, query, autocomplete, input) {
        if (results.length === 0) {
            autocomplete.innerHTML = `
                <div class="autocomplete-empty">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <span>No se encontraron resultados para "${escapeHtml(query)}"</span>
                </div>
            `;
            autocomplete.classList.add('active');
            return;
        }

        autocomplete.innerHTML = `
            <div class="autocomplete-header">
                <span>Productos</span>
                <a href="productos.html?search=${encodeURIComponent(query)}">Ver todos</a>
            </div>
            ${results.map((product, index) => {
                const name = product.name || product.nombre || 'Producto';
                const image = product.image_url || product.imagen || '/images/products/placeholder.png';
                const price = product.price || product.precio || 0;
                const category = product.category || product.categoria || '';
                const id = product.id || product.product_id;

                return `
                    <div class="autocomplete-item" data-index="${index}" data-id="${id}">
                        <div class="item-image">
                            <img src="${image}" alt="${escapeHtml(name)}" loading="lazy">
                        </div>
                        <div class="item-info">
                            <div class="item-name">${highlightMatch(name, query)}</div>
                            <div class="item-category">${escapeHtml(category)}</div>
                        </div>
                        <div class="item-price">${formatPrice(price)}</div>
                    </div>
                `;
            }).join('')}
            <div class="autocomplete-footer">
                <button type="button" class="search-all-btn" data-query="${escapeHtml(query)}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    Buscar "${escapeHtml(query)}"
                </button>
            </div>
        `;

        // Bind click events
        autocomplete.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                addToRecentSearches(query);
                window.location.href = `producto.html?id=${id}`;
            });

            item.addEventListener('mouseenter', () => {
                autocomplete.querySelectorAll('.autocomplete-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                currentFocus = parseInt(item.dataset.index);
            });
        });

        autocomplete.querySelector('.search-all-btn')?.addEventListener('click', () => {
            performSearch(query);
        });

        autocomplete.classList.add('active');
        currentFocus = -1;
    }

    /**
     * Show recent searches
     */
    function showRecentSearches(autocomplete, input) {
        if (recentSearches.length === 0) return;

        autocomplete.innerHTML = `
            <div class="autocomplete-header">
                <span>Búsquedas recientes</span>
                <button type="button" class="clear-recent">Limpiar</button>
            </div>
            ${recentSearches.map((search, index) => `
                <div class="autocomplete-item recent" data-index="${index}" data-query="${escapeHtml(search)}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>${escapeHtml(search)}</span>
                </div>
            `).join('')}
        `;

        // Bind events
        autocomplete.querySelectorAll('.autocomplete-item.recent').forEach(item => {
            item.addEventListener('click', () => {
                const query = item.dataset.query;
                input.value = query;
                performSearch(query);
            });
        });

        autocomplete.querySelector('.clear-recent')?.addEventListener('click', (e) => {
            e.stopPropagation();
            recentSearches = [];
            saveRecentSearches();
            autocomplete.classList.remove('active');
        });

        autocomplete.classList.add('active');
    }

    /**
     * Handle keyboard navigation
     */
    function handleKeyboardNavigation(e, autocomplete, input) {
        const items = autocomplete.querySelectorAll('.autocomplete-item');
        if (!items.length) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentFocus++;
            if (currentFocus >= items.length) currentFocus = 0;
            setActiveItem(items, currentFocus);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentFocus--;
            if (currentFocus < 0) currentFocus = items.length - 1;
            setActiveItem(items, currentFocus);
        } else if (e.key === 'Escape') {
            autocomplete.classList.remove('active');
            input.blur();
        }
    }

    /**
     * Set active item
     */
    function setActiveItem(items, index) {
        items.forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
    }

    /**
     * Perform search - redirect to products page
     */
    function performSearch(query) {
        if (!query || query.trim().length < CONFIG.minChars) return;
        
        addToRecentSearches(query.trim());
        
        // Determine base path
        const isInPages = window.location.pathname.includes('/pages/');
        const basePath = isInPages ? '' : 'pages/';
        
        window.location.href = `${basePath}productos.html?search=${encodeURIComponent(query.trim())}`;
    }

    /**
     * Create search modal for mobile/keyboard shortcut
     */
    function createSearchModal() {
        if (document.getElementById('searchModal')) return;

        const modal = document.createElement('div');
        modal.id = 'searchModal';
        modal.className = 'search-modal';
        modal.innerHTML = `
            <div class="search-modal-backdrop"></div>
            <div class="search-modal-content">
                <div class="search-modal-header">
                    <div class="search-modal-input-wrapper">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input type="text" id="modalSearchInput" placeholder="Buscar productos..." autocomplete="off">
                        <kbd>ESC</kbd>
                    </div>
                </div>
                <div class="search-modal-results" id="modalSearchResults">
                    <div class="search-modal-empty">
                        <p>Escribe para buscar productos</p>
                        <span class="shortcut-hint">
                            <kbd>Ctrl</kbd> + <kbd>K</kbd> para abrir la búsqueda
                        </span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Bind events
        modal.querySelector('.search-modal-backdrop').addEventListener('click', closeSearchModal);
        
        const modalInput = document.getElementById('modalSearchInput');
        const modalResults = document.getElementById('modalSearchResults');

        modalInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = modalInput.value.trim().toLowerCase();
                if (query.length < CONFIG.minChars) {
                    modalResults.innerHTML = `
                        <div class="search-modal-empty">
                            <p>Escribe para buscar productos</p>
                        </div>
                    `;
                    return;
                }
                const results = searchProducts(query);
                renderModalResults(results, query, modalResults);
            }, CONFIG.debounceTime);
        });

        modalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const activeItem = modalResults.querySelector('.modal-result-item.active');
                if (activeItem) {
                    activeItem.click();
                } else {
                    performSearch(modalInput.value);
                    closeSearchModal();
                }
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const items = modalResults.querySelectorAll('.modal-result-item');
                if (!items.length) return;

                if (e.key === 'ArrowDown') {
                    currentFocus++;
                    if (currentFocus >= items.length) currentFocus = 0;
                } else {
                    currentFocus--;
                    if (currentFocus < 0) currentFocus = items.length - 1;
                }
                setActiveItem(items, currentFocus);
            }
        });
    }

    /**
     * Render modal results
     */
    function renderModalResults(results, query, container) {
        if (results.length === 0) {
            container.innerHTML = `
                <div class="search-modal-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <p>No se encontraron resultados para "${escapeHtml(query)}"</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="modal-results-header">
                <span>Resultados para "${escapeHtml(query)}"</span>
            </div>
            <div class="modal-results-list">
                ${results.map((product, index) => {
                    const name = product.name || product.nombre || 'Producto';
                    const image = product.image_url || product.imagen || '/images/products/placeholder.png';
                    const price = product.price || product.precio || 0;
                    const category = product.category || product.categoria || '';
                    const id = product.id || product.product_id;

                    return `
                        <a href="producto.html?id=${id}" class="modal-result-item" data-index="${index}">
                            <div class="result-image">
                                <img src="${image}" alt="${escapeHtml(name)}" loading="lazy">
                            </div>
                            <div class="result-info">
                                <div class="result-name">${highlightMatch(name, query)}</div>
                                <div class="result-category">${escapeHtml(category)}</div>
                            </div>
                            <div class="result-price">${formatPrice(price)}</div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </a>
                    `;
                }).join('')}
            </div>
            <div class="modal-results-footer">
                <button type="button" class="view-all-results" onclick="window.location.href='productos.html?search=${encodeURIComponent(query)}'">
                    Ver todos los resultados
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </button>
            </div>
        `;

        container.querySelectorAll('.modal-result-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                container.querySelectorAll('.modal-result-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                currentFocus = parseInt(item.dataset.index);
            });
            item.addEventListener('click', () => {
                addToRecentSearches(query);
                closeSearchModal();
            });
        });

        currentFocus = -1;
    }

    /**
     * Open search modal
     */
    function openSearchModal() {
        const modal = document.getElementById('searchModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
                document.getElementById('modalSearchInput')?.focus();
            }, 100);
        }
    }

    /**
     * Close search modal
     */
    function closeSearchModal() {
        const modal = document.getElementById('searchModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    /**
     * Highlight matching text
     */
    function highlightMatch(text, query) {
        if (!query) return escapeHtml(text);
        
        const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
        return escapeHtml(text).replace(regex, '<mark>$1</mark>');
    }

    /**
     * Escape regex special characters
     */
    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Format price
     */
    function formatPrice(price) {
        return '$' + new Intl.NumberFormat('es-CL', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
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

    // Expose for external use
    window.globalSearch = {
        open: openSearchModal,
        close: closeSearchModal,
        search: performSearch
    };

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
