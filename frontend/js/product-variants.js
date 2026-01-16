/**
 * Product Variants UI Component
 * Handles variant selection (color, size, etc.) on product pages
 */

(function() {
    'use strict';

    /**
     * Initialize variants for a product
     * @param {Object} product - Product data with variants
     * @param {string} containerId - ID of container element
     */
    window.initProductVariants = function(product, containerId = 'variantsContainer') {
        const container = document.getElementById(containerId);
        if (!container || !product) return;

        const variants = product.variants || [];
        const variantTypes = extractVariantTypes(variants);

        if (Object.keys(variantTypes).length === 0) {
            container.style.display = 'none';
            return;
        }

        container.innerHTML = renderVariantSelectors(variantTypes, variants);
        bindVariantEvents(container, variants, product);
    };

    /**
     * Extract unique variant types and values
     */
    function extractVariantTypes(variants) {
        const types = {};

        variants.forEach(variant => {
            if (variant.color) {
                if (!types.color) types.color = { label: 'Color', values: new Map() };
                types.color.values.set(variant.color, {
                    value: variant.color,
                    hex: variant.color_hex || getColorHex(variant.color),
                    image: variant.image_url
                });
            }
            if (variant.size) {
                if (!types.size) types.size = { label: 'Talla', values: new Map() };
                types.size.values.set(variant.size, {
                    value: variant.size,
                    stock: variant.stock
                });
            }
            if (variant.material) {
                if (!types.material) types.material = { label: 'Material', values: new Map() };
                types.material.values.set(variant.material, {
                    value: variant.material
                });
            }
            // Add more variant types as needed
        });

        return types;
    }

    /**
     * Render variant selectors HTML
     */
    function renderVariantSelectors(variantTypes, variants) {
        let html = '<div class="variants-wrapper">';

        for (const [type, data] of Object.entries(variantTypes)) {
            const values = Array.from(data.values.values());

            if (type === 'color') {
                html += `
                    <div class="variant-group" data-type="color">
                        <label class="variant-label">
                            ${data.label}: <span class="selected-value" id="selectedColor"></span>
                        </label>
                        <div class="color-options">
                            ${values.map((opt, i) => `
                                <button type="button" 
                                        class="color-option ${i === 0 ? 'selected' : ''}" 
                                        data-value="${escapeHtml(opt.value)}"
                                        data-hex="${opt.hex}"
                                        ${opt.image ? `data-image="${opt.image}"` : ''}
                                        title="${escapeHtml(opt.value)}"
                                        aria-label="Color ${opt.value}">
                                    <span class="color-swatch" style="background-color: ${opt.hex}"></span>
                                    <span class="color-check">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                            <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                    </span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `;
            } else if (type === 'size') {
                html += `
                    <div class="variant-group" data-type="size">
                        <div class="variant-header">
                            <label class="variant-label">
                                ${data.label}: <span class="selected-value" id="selectedSize"></span>
                            </label>
                            <button type="button" class="size-guide-btn" id="sizeGuideBtn">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                    <line x1="16" y1="13" x2="8" y2="13"/>
                                    <line x1="16" y1="17" x2="8" y2="17"/>
                                </svg>
                                Guía de tallas
                            </button>
                        </div>
                        <div class="size-options">
                            ${values.map((opt, i) => {
                                const isOutOfStock = opt.stock !== undefined && opt.stock <= 0;
                                return `
                                    <button type="button" 
                                            class="size-option ${i === 0 && !isOutOfStock ? 'selected' : ''} ${isOutOfStock ? 'out-of-stock' : ''}" 
                                            data-value="${escapeHtml(opt.value)}"
                                            ${isOutOfStock ? 'disabled' : ''}
                                            aria-label="Talla ${opt.value}${isOutOfStock ? ' (Agotado)' : ''}">
                                        ${escapeHtml(opt.value)}
                                        ${isOutOfStock ? '<span class="stock-badge">Agotado</span>' : ''}
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            } else {
                // Generic dropdown for other types
                html += `
                    <div class="variant-group" data-type="${type}">
                        <label class="variant-label" for="variant-${type}">${data.label}</label>
                        <select class="variant-select" id="variant-${type}" data-type="${type}">
                            ${values.map((opt, i) => `
                                <option value="${escapeHtml(opt.value)}" ${i === 0 ? 'selected' : ''}>
                                    ${escapeHtml(opt.value)}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                `;
            }
        }

        html += '</div>';
        return html;
    }

    /**
     * Bind variant selection events
     */
    function bindVariantEvents(container, variants, product) {
        // Color options
        container.querySelectorAll('.color-option').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.color-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                
                // Update selected text
                const selectedText = container.querySelector('#selectedColor');
                if (selectedText) selectedText.textContent = btn.dataset.value;

                // Update product image if variant has one
                if (btn.dataset.image) {
                    updateProductImage(btn.dataset.image);
                }

                updateSelectedVariant(container, variants, product);
            });
        });

        // Size options
        container.querySelectorAll('.size-option').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.disabled) return;
                
                container.querySelectorAll('.size-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');

                // Update selected text
                const selectedText = container.querySelector('#selectedSize');
                if (selectedText) selectedText.textContent = btn.dataset.value;

                updateSelectedVariant(container, variants, product);
            });
        });

        // Generic selects
        container.querySelectorAll('.variant-select').forEach(select => {
            select.addEventListener('change', () => {
                updateSelectedVariant(container, variants, product);
            });
        });

        // Size guide button
        container.querySelector('#sizeGuideBtn')?.addEventListener('click', showSizeGuide);

        // Initialize selected values display
        const colorBtn = container.querySelector('.color-option.selected');
        if (colorBtn) {
            const selectedText = container.querySelector('#selectedColor');
            if (selectedText) selectedText.textContent = colorBtn.dataset.value;
        }

        const sizeBtn = container.querySelector('.size-option.selected');
        if (sizeBtn) {
            const selectedText = container.querySelector('#selectedSize');
            if (selectedText) selectedText.textContent = sizeBtn.dataset.value;
        }
    }

    /**
     * Update selected variant and check availability
     */
    function updateSelectedVariant(container, variants, product) {
        const selectedColor = container.querySelector('.color-option.selected')?.dataset.value;
        const selectedSize = container.querySelector('.size-option.selected')?.dataset.value;

        // Find matching variant
        const selectedVariant = variants.find(v => {
            let matches = true;
            if (selectedColor && v.color !== selectedColor) matches = false;
            if (selectedSize && v.size !== selectedSize) matches = false;
            return matches;
        });

        // Update price if variant has different price
        if (selectedVariant && selectedVariant.price) {
            updateProductPrice(selectedVariant.price, selectedVariant.comparePrice);
        }

        // Update stock status
        if (selectedVariant) {
            updateStockStatus(selectedVariant.stock);
        }

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('variantSelected', {
            detail: {
                product,
                variant: selectedVariant,
                color: selectedColor,
                size: selectedSize
            }
        }));
    }

    /**
     * Update product image
     */
    function updateProductImage(imageUrl) {
        const mainImage = document.querySelector('.producto-imagen img, .product-main-image img');
        if (mainImage && imageUrl) {
            mainImage.style.opacity = '0';
            setTimeout(() => {
                mainImage.src = imageUrl;
                mainImage.style.opacity = '1';
            }, 150);
        }
    }

    /**
     * Update product price display
     */
    function updateProductPrice(price, comparePrice) {
        const priceEl = document.querySelector('.producto-precio-actual, .product-price-current');
        const comparePriceEl = document.querySelector('.producto-precio-anterior, .product-price-compare');

        if (priceEl) {
            priceEl.textContent = formatPrice(price);
        }

        if (comparePriceEl && comparePrice) {
            comparePriceEl.textContent = formatPrice(comparePrice);
            comparePriceEl.style.display = 'inline';
        } else if (comparePriceEl) {
            comparePriceEl.style.display = 'none';
        }
    }

    /**
     * Update stock status
     */
    function updateStockStatus(stock) {
        const stockEl = document.querySelector('.stock-status, .producto-stock');
        const addToCartBtn = document.querySelector('.btn-agregar-carrito, .btn-add-to-cart');

        if (stock === undefined) return;

        if (stockEl) {
            if (stock > 10) {
                stockEl.innerHTML = '<span class="stock-available">✓ En stock</span>';
            } else if (stock > 0) {
                stockEl.innerHTML = `<span class="stock-low">⚠ Solo quedan ${stock} unidades</span>`;
            } else {
                stockEl.innerHTML = '<span class="stock-out">✗ Agotado</span>';
            }
        }

        if (addToCartBtn) {
            addToCartBtn.disabled = stock <= 0;
            if (stock <= 0) {
                addToCartBtn.textContent = 'Agotado';
            } else {
                addToCartBtn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    Agregar al Carrito
                `;
            }
        }
    }

    /**
     * Show size guide modal
     */
    function showSizeGuide() {
        let modal = document.getElementById('sizeGuideModal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'sizeGuideModal';
            modal.className = 'size-guide-modal';
            modal.innerHTML = `
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Guía de Tallas</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Mide tu cuerpo y compara con la tabla para encontrar tu talla ideal.</p>
                        <table class="size-table">
                            <thead>
                                <tr>
                                    <th>Talla</th>
                                    <th>Pecho (cm)</th>
                                    <th>Cintura (cm)</th>
                                    <th>Cadera (cm)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>XS</td><td>82-86</td><td>62-66</td><td>88-92</td></tr>
                                <tr><td>S</td><td>86-90</td><td>66-70</td><td>92-96</td></tr>
                                <tr><td>M</td><td>90-94</td><td>70-74</td><td>96-100</td></tr>
                                <tr><td>L</td><td>94-98</td><td>74-78</td><td>100-104</td></tr>
                                <tr><td>XL</td><td>98-102</td><td>78-82</td><td>104-108</td></tr>
                                <tr><td>XXL</td><td>102-106</td><td>82-86</td><td>108-112</td></tr>
                            </tbody>
                        </table>
                        <div class="size-tips">
                            <h4>Consejos para medir</h4>
                            <ul>
                                <li><strong>Pecho:</strong> Mide la parte más ancha del pecho</li>
                                <li><strong>Cintura:</strong> Mide la parte más estrecha de la cintura</li>
                                <li><strong>Cadera:</strong> Mide la parte más ancha de la cadera</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('.modal-close').addEventListener('click', closeSizeGuide);
            modal.querySelector('.modal-backdrop').addEventListener('click', closeSizeGuide);
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeSizeGuide() {
        const modal = document.getElementById('sizeGuideModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    /**
     * Get color hex from name
     */
    function getColorHex(colorName) {
        const colors = {
            'negro': '#000000',
            'blanco': '#ffffff',
            'rojo': '#e94560',
            'azul': '#667eea',
            'verde': '#28a745',
            'amarillo': '#ffc107',
            'naranja': '#fd7e14',
            'rosa': '#e83e8c',
            'morado': '#6f42c1',
            'gris': '#6c757d',
            'café': '#795548',
            'beige': '#d4c5a9',
            'navy': '#001f3f',
            'celeste': '#87ceeb',
            'dorado': '#ffd700',
            'plateado': '#c0c0c0',
            // English colors
            'black': '#000000',
            'white': '#ffffff',
            'red': '#e94560',
            'blue': '#667eea',
            'green': '#28a745',
            'yellow': '#ffc107',
            'orange': '#fd7e14',
            'pink': '#e83e8c',
            'purple': '#6f42c1',
            'gray': '#6c757d',
            'grey': '#6c757d',
            'brown': '#795548',
            'gold': '#ffd700',
            'silver': '#c0c0c0'
        };
        return colors[colorName.toLowerCase()] || '#cccccc';
    }

    /**
     * Format price
     */
    function formatPrice(price) {
        return '$' + new Intl.NumberFormat('es-CL').format(price);
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

    // Add CSS styles
    addVariantStyles();

    function addVariantStyles() {
        if (document.getElementById('variantStyles')) return;

        const style = document.createElement('style');
        style.id = 'variantStyles';
        style.textContent = `
            .variants-wrapper {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-lg);
                margin: var(--spacing-lg) 0;
            }

            .variant-group {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-sm);
            }

            .variant-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .variant-label {
                font-size: var(--font-size-sm);
                font-weight: var(--font-weight-medium);
                color: var(--color-text);
            }

            .selected-value {
                font-weight: var(--font-weight-semibold);
                color: var(--color-accent);
            }

            /* Color Options */
            .color-options {
                display: flex;
                gap: var(--spacing-sm);
                flex-wrap: wrap;
            }

            .color-option {
                position: relative;
                width: 40px;
                height: 40px;
                border-radius: var(--radius-full);
                border: 2px solid transparent;
                background: transparent;
                padding: 3px;
                cursor: pointer;
                transition: all var(--transition-fast);
            }

            .color-option:hover {
                transform: scale(1.1);
            }

            .color-option.selected {
                border-color: var(--color-accent);
            }

            .color-swatch {
                display: block;
                width: 100%;
                height: 100%;
                border-radius: var(--radius-full);
                box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1);
            }

            .color-check {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                opacity: 0;
                transition: opacity var(--transition-fast);
            }

            .color-option.selected .color-check {
                opacity: 1;
            }

            /* Size Options */
            .size-options {
                display: flex;
                gap: var(--spacing-sm);
                flex-wrap: wrap;
            }

            .size-option {
                min-width: 48px;
                height: 44px;
                padding: 0 var(--spacing-md);
                border: 2px solid var(--color-border);
                border-radius: var(--radius-md);
                background: var(--color-surface);
                color: var(--color-text);
                font-size: var(--font-size-sm);
                font-weight: var(--font-weight-medium);
                cursor: pointer;
                transition: all var(--transition-fast);
                position: relative;
            }

            .size-option:hover:not(:disabled) {
                border-color: var(--color-accent);
            }

            .size-option.selected {
                border-color: var(--color-accent);
                background: var(--color-accent);
                color: white;
            }

            .size-option.out-of-stock {
                opacity: 0.5;
                cursor: not-allowed;
                text-decoration: line-through;
            }

            .stock-badge {
                position: absolute;
                top: -8px;
                right: -8px;
                font-size: 9px;
                padding: 2px 4px;
                background: var(--color-error);
                color: white;
                border-radius: 4px;
                text-decoration: none;
            }

            /* Size Guide Button */
            .size-guide-btn {
                display: inline-flex;
                align-items: center;
                gap: var(--spacing-xs);
                background: none;
                border: none;
                color: var(--color-text-muted);
                font-size: var(--font-size-xs);
                cursor: pointer;
                text-decoration: underline;
            }

            .size-guide-btn:hover {
                color: var(--color-accent);
            }

            /* Generic Select */
            .variant-select {
                padding: var(--spacing-sm) var(--spacing-md);
                border: 1px solid var(--color-border);
                border-radius: var(--radius-md);
                background: var(--color-surface);
                color: var(--color-text);
                font-size: var(--font-size-base);
                cursor: pointer;
            }

            /* Stock Status */
            .stock-available { color: var(--color-success); }
            .stock-low { color: #ffc107; }
            .stock-out { color: var(--color-error); }

            /* Size Guide Modal */
            .size-guide-modal {
                position: fixed;
                inset: 0;
                z-index: var(--z-modal);
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: all var(--transition-fast);
            }

            .size-guide-modal.active {
                opacity: 1;
                visibility: visible;
            }

            .size-guide-modal .modal-backdrop {
                position: absolute;
                inset: 0;
                background: rgba(0,0,0,0.5);
                backdrop-filter: blur(4px);
            }

            .size-guide-modal .modal-content {
                position: relative;
                background: var(--color-surface);
                border-radius: var(--radius-xl);
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow: auto;
            }

            .size-guide-modal .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--spacing-lg);
                border-bottom: 1px solid var(--color-border);
            }

            .size-guide-modal .modal-header h3 { margin: 0; }

            .size-guide-modal .modal-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: var(--color-text-muted);
            }

            .size-guide-modal .modal-body {
                padding: var(--spacing-lg);
            }

            .size-table {
                width: 100%;
                border-collapse: collapse;
                margin: var(--spacing-md) 0;
            }

            .size-table th, .size-table td {
                padding: var(--spacing-sm);
                text-align: center;
                border: 1px solid var(--color-border);
            }

            .size-table th {
                background: var(--color-background-alt);
                font-weight: var(--font-weight-semibold);
            }

            .size-tips {
                margin-top: var(--spacing-lg);
                padding: var(--spacing-md);
                background: var(--color-background-alt);
                border-radius: var(--radius-md);
            }

            .size-tips h4 {
                margin: 0 0 var(--spacing-sm);
            }

            .size-tips ul {
                margin: 0;
                padding-left: var(--spacing-lg);
            }

            .size-tips li {
                margin-bottom: var(--spacing-xs);
                font-size: var(--font-size-sm);
            }
        `;
        document.head.appendChild(style);
    }

})();
