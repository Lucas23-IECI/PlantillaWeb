/**
 * Checkout Page Logic
 * Handles multi-step checkout process
 */

(function() {
    'use strict';

    // State
    let currentStep = 1;
    let checkoutData = {
        contact: {},
        shipping: {},
        payment: {}
    };
    let appliedDiscount = null;
    let shippingCost = 3990;

    // Shipping costs
    const SHIPPING_COSTS = {
        standard: 3990,
        express: 6990,
        free: 0
    };
    const FREE_SHIPPING_THRESHOLD = 50000;

    // DOM Elements
    const elements = {};

    /**
     * Initialize checkout
     */
    function init() {
        // Check if cart has items
        if (typeof cart === 'undefined' || cart.getCount() === 0) {
            showEmptyCart();
            return;
        }

        cacheElements();
        bindEvents();
        loadUserData();
        renderOrderSummary();
        updateTotals();
    }

    /**
     * Cache DOM elements
     */
    function cacheElements() {
        elements.steps = document.querySelectorAll('.checkout-section');
        elements.progressSteps = document.querySelectorAll('.progress-step');
        elements.summaryItems = document.getElementById('summaryItems');
        elements.itemCount = document.getElementById('itemCount');
        
        // Forms
        elements.contactForm = document.getElementById('contactForm');
        elements.shippingForm = document.getElementById('shippingForm');
        elements.paymentForm = document.getElementById('paymentForm');
        
        // Totals
        elements.subtotal = document.getElementById('subtotalAmount');
        elements.shipping = document.getElementById('shippingAmount');
        elements.discount = document.getElementById('discountAmount');
        elements.discountRow = document.getElementById('discountRow');
        elements.total = document.getElementById('totalAmount');
        elements.payButtonText = document.getElementById('payButtonText');
        
        // Others
        elements.createAccount = document.getElementById('createAccount');
        elements.passwordFields = document.getElementById('passwordFields');
        elements.savedAddresses = document.getElementById('savedAddresses');
        elements.newAddressForm = document.getElementById('newAddressForm');
        elements.transferDetails = document.getElementById('transferDetails');
        elements.billingAddressForm = document.getElementById('billingAddressForm');
        elements.sameAsShipping = document.getElementById('sameAsShipping');
        elements.freeShippingOption = document.getElementById('freeShippingOption');
        elements.toggleSummary = document.getElementById('toggleSummary');
        elements.orderSummary = document.querySelector('.order-summary');
    }

    /**
     * Bind event listeners
     */
    function bindEvents() {
        // Form submissions
        elements.contactForm?.addEventListener('submit', handleContactSubmit);
        elements.shippingForm?.addEventListener('submit', handleShippingSubmit);
        elements.paymentForm?.addEventListener('submit', handlePaymentSubmit);
        
        // Navigation buttons
        document.getElementById('backToStep1')?.addEventListener('click', () => goToStep(1));
        document.getElementById('backToStep2')?.addEventListener('click', () => goToStep(2));
        
        // Create account toggle
        elements.createAccount?.addEventListener('change', (e) => {
            elements.passwordFields.style.display = e.target.checked ? 'block' : 'none';
        });
        
        // Shipping method change
        document.querySelectorAll('input[name="shippingMethod"]').forEach(radio => {
            radio.addEventListener('change', handleShippingMethodChange);
        });
        
        // Payment method change
        document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
            radio.addEventListener('change', handlePaymentMethodChange);
        });
        
        // Same as shipping toggle
        elements.sameAsShipping?.addEventListener('change', (e) => {
            elements.billingAddressForm.style.display = e.target.checked ? 'none' : 'block';
        });
        
        // Discount code
        document.getElementById('applyDiscount')?.addEventListener('click', applyDiscountCode);
        document.getElementById('removeDiscount')?.addEventListener('click', removeDiscountCode);
        document.getElementById('discountCodeInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyDiscountCode();
            }
        });
        
        // Mobile summary toggle
        elements.toggleSummary?.addEventListener('click', () => {
            elements.orderSummary?.classList.toggle('expanded');
        });
        
        // New address button
        document.getElementById('btnNewAddress')?.addEventListener('click', () => {
            elements.savedAddresses.style.display = 'none';
            elements.newAddressForm.style.display = 'block';
        });
    }

    /**
     * Load user data if logged in
     */
    function loadUserData() {
        if (typeof isLoggedIn === 'function' && isLoggedIn()) {
            const user = getCurrentUser?.();
            if (user) {
                // Prefill contact form
                const emailInput = document.getElementById('email');
                const firstNameInput = document.getElementById('firstName');
                const phoneInput = document.getElementById('phone');
                
                if (emailInput && user.email) emailInput.value = user.email;
                if (firstNameInput && user.name) {
                    const names = user.name.split(' ');
                    firstNameInput.value = names[0] || '';
                    document.getElementById('lastName').value = names.slice(1).join(' ') || '';
                }
                if (phoneInput && user.phone) phoneInput.value = user.phone;
                
                // Load saved addresses
                loadSavedAddresses();
            }
        }
    }

    /**
     * Load saved addresses from API
     */
    async function loadSavedAddresses() {
        try {
            const addresses = await api.getUserAddresses();
            if (addresses && addresses.length > 0) {
                renderSavedAddresses(addresses);
                elements.savedAddresses.style.display = 'block';
                elements.newAddressForm.style.display = 'none';
            }
        } catch (error) {
            console.debug('No saved addresses:', error.message);
        }
    }

    /**
     * Render saved addresses
     */
    function renderSavedAddresses(addresses) {
        const list = document.getElementById('addressesList');
        if (!list) return;
        
        list.innerHTML = addresses.map((addr, index) => `
            <label class="address-card ${index === 0 ? 'selected' : ''}">
                <input type="radio" name="savedAddress" value="${addr.id}" ${index === 0 ? 'checked' : ''}>
                <div class="address-info">
                    <div class="address-name">${escapeHtml(addr.name || 'Mi dirección')}</div>
                    <div class="address-text">
                        ${escapeHtml(addr.address)}<br>
                        ${escapeHtml(addr.city)}, ${escapeHtml(addr.region)}
                    </div>
                </div>
            </label>
        `).join('');
        
        // Bind click events
        list.querySelectorAll('.address-card').forEach(card => {
            card.addEventListener('click', () => {
                list.querySelectorAll('.address-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
            });
        });
    }

    /**
     * Render order summary
     */
    function renderOrderSummary() {
        const items = cart.getAll();
        const count = cart.getCount();
        
        if (elements.itemCount) {
            elements.itemCount.textContent = `${count} producto${count !== 1 ? 's' : ''}`;
        }
        
        if (elements.summaryItems) {
            elements.summaryItems.innerHTML = items.map(item => {
                const name = item.name || item.nombre || 'Producto';
                const price = item.price || item.precio || 0;
                const image = item.image_url || item.imagen || '/images/products/placeholder.png';
                const quantity = item.quantity || 1;
                
                return `
                    <div class="summary-item">
                        <div class="item-image">
                            <img src="${image}" alt="${escapeHtml(name)}" loading="lazy">
                            <span class="item-quantity">${quantity}</span>
                        </div>
                        <div class="item-details">
                            <div class="item-name">${escapeHtml(name)}</div>
                            ${item.variant ? `<div class="item-variant">${escapeHtml(item.variant)}</div>` : ''}
                        </div>
                        <div class="item-price">${formatPrice(price * quantity)}</div>
                    </div>
                `;
            }).join('');
        }
        
        // Check for free shipping
        const subtotal = cart.getSubtotal();
        if (subtotal >= FREE_SHIPPING_THRESHOLD && elements.freeShippingOption) {
            elements.freeShippingOption.style.display = 'block';
            elements.freeShippingOption.querySelector('input').checked = true;
            shippingCost = 0;
        }
    }

    /**
     * Update totals
     */
    function updateTotals() {
        const subtotal = cart.getSubtotal();
        const discount = appliedDiscount ? appliedDiscount.amount : 0;
        const total = subtotal + shippingCost - discount;
        
        if (elements.subtotal) elements.subtotal.textContent = formatPrice(subtotal);
        if (elements.shipping) {
            elements.shipping.textContent = shippingCost === 0 ? 'GRATIS' : formatPrice(shippingCost);
        }
        if (elements.discount) elements.discount.textContent = `-${formatPrice(discount)}`;
        if (elements.discountRow) elements.discountRow.style.display = discount > 0 ? 'flex' : 'none';
        if (elements.total) elements.total.textContent = formatPrice(total);
        if (elements.payButtonText) elements.payButtonText.textContent = `Pagar ${formatPrice(total)}`;
    }

    /**
     * Handle contact form submission
     */
    function handleContactSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        if (!validateForm(form)) return;
        
        checkoutData.contact = {
            email: form.email.value,
            firstName: form.firstName.value,
            lastName: form.lastName.value,
            phone: form.phone.value,
            createAccount: form.createAccount?.checked,
            password: form.password?.value
        };
        
        goToStep(2);
    }

    /**
     * Handle shipping form submission
     */
    function handleShippingSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        
        // Check if using saved address
        const savedAddressInput = form.querySelector('input[name="savedAddress"]:checked');
        
        if (savedAddressInput) {
            checkoutData.shipping = {
                savedAddressId: savedAddressInput.value
            };
        } else {
            if (!validateForm(form)) return;
            
            checkoutData.shipping = {
                address: form.address.value,
                addressExtra: form.addressExtra?.value,
                region: form.region.value,
                city: form.city.value,
                saveAddress: form.saveAddress?.checked
            };
        }
        
        checkoutData.shipping.method = form.querySelector('input[name="shippingMethod"]:checked')?.value || 'standard';
        
        goToStep(3);
    }

    /**
     * Handle payment form submission
     */
    async function handlePaymentSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        if (!form.acceptTerms.checked) {
            showNotification('Debes aceptar los términos y condiciones', 'error');
            return;
        }
        
        const paymentMethod = form.querySelector('input[name="paymentMethod"]:checked')?.value || 'webpay';
        
        checkoutData.payment = {
            method: paymentMethod,
            newsletter: form.newsletter?.checked,
            sameAsShipping: form.sameAsShipping?.checked
        };
        
        if (!form.sameAsShipping?.checked) {
            checkoutData.payment.billingAddress = {
                address: form.billingAddress?.value,
                city: form.billingCity?.value,
                region: form.billingRegion?.value
            };
        }
        
        // Process order
        await processOrder();
    }

    /**
     * Process the order
     */
    async function processOrder() {
        const btn = document.getElementById('btnPay');
        const originalText = btn.innerHTML;
        
        btn.disabled = true;
        btn.innerHTML = `
            <svg class="spinner" width="20" height="20" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="31.4" stroke-dashoffset="10">
                    <animateTransform attributeName="transform" type="rotate" dur="1s" from="0 12 12" to="360 12 12" repeatCount="indefinite"/>
                </circle>
            </svg>
            Procesando...
        `;
        
        try {
            // Prepare order data
            const orderData = {
                items: cart.getAll().map(item => ({
                    product_id: item.product_id || item.id,
                    quantity: item.quantity,
                    price: item.price || item.precio,
                    name: item.name || item.nombre
                })),
                contact: checkoutData.contact,
                shipping: checkoutData.shipping,
                payment: checkoutData.payment,
                subtotal: cart.getSubtotal(),
                shipping_cost: shippingCost,
                discount: appliedDiscount ? appliedDiscount.amount : 0,
                discount_code: appliedDiscount ? appliedDiscount.code : null,
                total: cart.getSubtotal() + shippingCost - (appliedDiscount ? appliedDiscount.amount : 0)
            };
            
            // Create transaction
            const result = await api.createTransaction(orderData);
            
            if (checkoutData.payment.method === 'webpay') {
                // Redirect to Webpay
                const webpayResult = await api.webpayCreate(result.order_id);
                if (webpayResult.url && webpayResult.token) {
                    // Create form and submit
                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.action = webpayResult.url;
                    
                    const tokenInput = document.createElement('input');
                    tokenInput.type = 'hidden';
                    tokenInput.name = 'token_ws';
                    tokenInput.value = webpayResult.token;
                    form.appendChild(tokenInput);
                    
                    document.body.appendChild(form);
                    form.submit();
                }
            } else if (checkoutData.payment.method === 'transfer') {
                // Redirect to success page with transfer instructions
                cart.clear();
                window.location.href = `resultado-pago.html?order=${result.order_id}&method=transfer`;
            }
            
        } catch (error) {
            console.error('Order error:', error);
            showNotification(error.message || 'Error al procesar el pedido', 'error');
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }

    /**
     * Go to specific step
     */
    function goToStep(step) {
        currentStep = step;
        
        // Update sections visibility
        elements.steps.forEach(section => {
            const sectionStep = parseInt(section.dataset.step);
            section.style.display = sectionStep === step ? 'block' : 'none';
        });
        
        // Update progress indicators
        elements.progressSteps.forEach(progressStep => {
            const stepNum = parseInt(progressStep.dataset.step);
            progressStep.classList.remove('active', 'completed');
            
            if (stepNum === step) {
                progressStep.classList.add('active');
            } else if (stepNum < step) {
                progressStep.classList.add('completed');
            }
        });
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Handle shipping method change
     */
    function handleShippingMethodChange(e) {
        const method = e.target.value;
        shippingCost = SHIPPING_COSTS[method] || SHIPPING_COSTS.standard;
        updateTotals();
    }

    /**
     * Handle payment method change
     */
    function handlePaymentMethodChange(e) {
        const method = e.target.value;
        if (elements.transferDetails) {
            elements.transferDetails.style.display = method === 'transfer' ? 'block' : 'none';
        }
    }

    /**
     * Apply discount code
     */
    async function applyDiscountCode() {
        const input = document.getElementById('discountCodeInput');
        const code = input?.value.trim().toUpperCase();
        
        if (!code) {
            showNotification('Ingresa un código de descuento', 'error');
            return;
        }
        
        try {
            const result = await api.validateDiscountCode(code);
            
            if (result.valid) {
                const subtotal = cart.getSubtotal();
                let discountAmount = 0;
                
                if (result.type === 'percentage') {
                    discountAmount = subtotal * (result.value / 100);
                } else {
                    discountAmount = result.value;
                }
                
                appliedDiscount = {
                    code: code,
                    amount: discountAmount,
                    type: result.type,
                    value: result.value
                };
                
                // Update UI
                document.getElementById('discountCodeText').textContent = `${code} (${result.type === 'percentage' ? result.value + '%' : formatPrice(result.value)} off)`;
                document.getElementById('discountApplied').style.display = 'flex';
                input.disabled = true;
                
                updateTotals();
                showNotification('Código aplicado correctamente', 'success');
            } else {
                showNotification(result.message || 'Código inválido', 'error');
            }
        } catch (error) {
            showNotification('Error al validar el código', 'error');
        }
    }

    /**
     * Remove discount code
     */
    function removeDiscountCode() {
        appliedDiscount = null;
        document.getElementById('discountApplied').style.display = 'none';
        document.getElementById('discountCodeInput').value = '';
        document.getElementById('discountCodeInput').disabled = false;
        updateTotals();
    }

    /**
     * Validate form
     */
    function validateForm(form) {
        const inputs = form.querySelectorAll('[required]');
        let valid = true;
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.classList.add('error');
                valid = false;
            } else {
                input.classList.remove('error');
            }
            
            // Email validation
            if (input.type === 'email' && input.value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(input.value)) {
                    input.classList.add('error');
                    valid = false;
                }
            }
        });
        
        // Password validation
        if (form.password && form.passwordConfirm && form.createAccount?.checked) {
            if (form.password.value.length < 8) {
                form.password.classList.add('error');
                showNotification('La contraseña debe tener al menos 8 caracteres', 'error');
                valid = false;
            }
            if (form.password.value !== form.passwordConfirm.value) {
                form.passwordConfirm.classList.add('error');
                showNotification('Las contraseñas no coinciden', 'error');
                valid = false;
            }
        }
        
        if (!valid) {
            showNotification('Por favor completa todos los campos requeridos', 'error');
        }
        
        return valid;
    }

    /**
     * Show empty cart state
     */
    function showEmptyCart() {
        const container = document.querySelector('.checkout-form-container');
        if (container) {
            container.innerHTML = `
                <div class="empty-cart">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="9" cy="21" r="1"/>
                        <circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    <h2>Tu carrito está vacío</h2>
                    <p>Agrega productos antes de continuar con el checkout</p>
                    <a href="productos.html" class="btn-primary">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                            <line x1="3" y1="6" x2="21" y2="6"/>
                            <path d="M16 10a4 4 0 0 1-8 0"/>
                        </svg>
                        Ver Productos
                    </a>
                </div>
            `;
        }
        
        // Hide summary
        const summary = document.querySelector('.order-summary');
        if (summary) summary.style.display = 'none';
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

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
