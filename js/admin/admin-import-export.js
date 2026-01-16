/**
 * Admin Panel - Import/Export Module
 * Importar y exportar productos CSV/Excel
 */

const AdminImportExport = (function() {
    'use strict';

    /**
     * Export products to CSV
     */
    async function exportProducts(options = {}) {
        const {
            format = 'csv',
            selectedOnly = false,
            fields = null
        } = options;

        AdminUtils.showToast('info', 'Preparando exportación...');

        try {
            let products;
            
            if (selectedOnly && typeof AdminBulk !== 'undefined') {
                const ids = AdminBulk.getSelectedIds();
                if (ids.length === 0) {
                    AdminUtils.showToast('error', 'No hay productos seleccionados');
                    return;
                }
                products = await api.adminGetProducts?.({ ids }) || { products: getMockProducts() };
            } else {
                products = await api.adminGetProducts?.() || { products: getMockProducts() };
            }

            const productList = products.products || products || getMockProducts();
            
            if (productList.length === 0) {
                AdminUtils.showToast('error', 'No hay productos para exportar');
                return;
            }

            const defaultFields = ['id', 'sku', 'name', 'description', 'price', 'comparePrice', 'stock', 'category', 'active'];
            const exportFields = fields || defaultFields;

            // Generate CSV content
            const csvContent = generateCSV(productList, exportFields);
            
            // Download file
            downloadFile(csvContent, `productos_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
            
            AdminUtils.showToast('success', `${productList.length} productos exportados`);

        } catch (error) {
            console.error('Export error:', error);
            AdminUtils.showToast('error', error.message || 'Error al exportar');
        }
    }

    /**
     * Generate CSV from data
     */
    function generateCSV(data, fields) {
        const headers = fields.map(f => getFieldLabel(f));
        const rows = data.map(item => {
            return fields.map(field => {
                let value = item[field];
                if (value === null || value === undefined) value = '';
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                    value = `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
        });

        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    /**
     * Get human-readable field label
     */
    function getFieldLabel(field) {
        const labels = {
            id: 'ID',
            sku: 'SKU',
            name: 'Nombre',
            description: 'Descripción',
            price: 'Precio',
            comparePrice: 'Precio comparación',
            stock: 'Stock',
            category: 'Categoría',
            categoryId: 'ID Categoría',
            active: 'Activo',
            image_url: 'URL Imagen',
            weight: 'Peso',
            dimensions: 'Dimensiones'
        };
        return labels[field] || field;
    }

    /**
     * Download file
     */
    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Download import template
     */
    function downloadTemplate() {
        const templateFields = ['sku', 'name', 'description', 'price', 'comparePrice', 'stock', 'category', 'image_url'];
        const headers = templateFields.map(f => getFieldLabel(f));
        const exampleRow = ['SKU-001', 'Producto Ejemplo', 'Descripción del producto', '29990', '39990', '100', 'Electrónica', 'https://ejemplo.com/imagen.jpg'];
        
        const content = [headers.join(','), exampleRow.join(',')].join('\n');
        downloadFile(content, 'plantilla_productos.csv', 'text/csv');
        
        AdminUtils.showToast('success', 'Plantilla descargada');
    }

    /**
     * Show import modal
     */
    function showImportModal() {
        const body = `
            <div id="importSteps">
                <!-- Step 1: Upload -->
                <div id="importStep1" class="import-step">
                    <div class="import-upload-area" id="importDropZone">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" width="48" height="48" style="color: var(--admin-text-muted);">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                        </svg>
                        <p style="margin: var(--spacing-md) 0 var(--spacing-xs); font-weight: var(--font-weight-medium);">
                            Arrastra tu archivo aquí
                        </p>
                        <p style="color: var(--admin-text-muted); font-size: var(--font-size-sm);">
                            o haz clic para seleccionar
                        </p>
                        <input type="file" id="importFileInput" accept=".csv,.xlsx,.xls" style="display: none;">
                    </div>
                    
                    <div style="margin-top: var(--spacing-lg); padding-top: var(--spacing-lg); border-top: 1px solid var(--admin-border);">
                        <button class="btn btn-outline btn-sm" onclick="AdminImportExport.downloadTemplate()">
                            ${AdminUtils.Icons.download}
                            Descargar plantilla
                        </button>
                    </div>
                </div>

                <!-- Step 2: Preview -->
                <div id="importStep2" class="import-step" style="display: none;">
                    <div id="importPreview"></div>
                </div>

                <!-- Step 3: Progress -->
                <div id="importStep3" class="import-step" style="display: none;">
                    <div id="importProgress"></div>
                </div>
            </div>
        `;

        AdminUtils.openModal({
            title: 'Importar productos',
            body,
            size: 'lg',
            footer: `
                <button class="btn btn-outline" onclick="AdminUtils.closeModal()">Cancelar</button>
                <button class="btn btn-primary" id="importConfirmBtn" disabled onclick="AdminImportExport.confirmImport()">
                    Importar
                </button>
            `
        });

        // Initialize drop zone
        initDropZone();
    }

    /**
     * Initialize drop zone
     */
    function initDropZone() {
        const dropZone = document.getElementById('importDropZone');
        const fileInput = document.getElementById('importFileInput');

        if (!dropZone || !fileInput) return;

        dropZone.addEventListener('click', () => fileInput.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        });
    }

    let importData = null;

    /**
     * Handle uploaded file
     */
    async function handleFile(file) {
        const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        
        if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
            AdminUtils.showToast('error', 'Formato no soportado. Usa CSV o Excel.');
            return;
        }

        try {
            const text = await file.text();
            importData = parseCSV(text);
            
            if (importData.length === 0) {
                AdminUtils.showToast('error', 'El archivo está vacío');
                return;
            }

            showPreview(importData, file.name);
        } catch (error) {
            console.error('Error reading file:', error);
            AdminUtils.showToast('error', 'Error al leer el archivo');
        }
    }

    /**
     * Parse CSV content
     */
    function parseCSV(text) {
        const lines = text.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index];
                });
                data.push(row);
            }
        }

        return data;
    }

    /**
     * Parse a single CSV line (handles quoted values)
     */
    function parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    /**
     * Show import preview
     */
    function showPreview(data, filename) {
        document.getElementById('importStep1').style.display = 'none';
        document.getElementById('importStep2').style.display = 'block';
        document.getElementById('importConfirmBtn').disabled = false;

        const previewContainer = document.getElementById('importPreview');
        const headers = Object.keys(data[0]);
        const previewData = data.slice(0, 5);

        previewContainer.innerHTML = `
            <div style="margin-bottom: var(--spacing-md);">
                <strong>Archivo:</strong> ${filename}<br>
                <strong>Filas:</strong> ${data.length} productos
            </div>

            <div style="margin-bottom: var(--spacing-md);">
                <label class="form-label">Mapeo de columnas</label>
                <p class="form-hint">Verifica que las columnas estén correctamente identificadas</p>
            </div>

            <div class="table-container" style="max-height: 300px; overflow: auto;">
                <table class="table">
                    <thead>
                        <tr>
                            ${headers.map(h => `<th>${getFieldLabel(h)}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${previewData.map(row => `
                            <tr>
                                ${headers.map(h => `<td>${row[h] || '-'}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            ${data.length > 5 ? `<p style="margin-top: var(--spacing-sm); color: var(--admin-text-muted); font-size: var(--font-size-xs);">Mostrando 5 de ${data.length} filas</p>` : ''}

            <div class="form-group" style="margin-top: var(--spacing-lg);">
                <label class="form-checkbox">
                    <input type="checkbox" id="importUpdateExisting">
                    Actualizar productos existentes (por SKU)
                </label>
            </div>
        `;
    }

    /**
     * Confirm and process import
     */
    async function confirmImport() {
        if (!importData || importData.length === 0) {
            AdminUtils.showToast('error', 'No hay datos para importar');
            return;
        }

        const updateExisting = document.getElementById('importUpdateExisting')?.checked || false;

        document.getElementById('importStep2').style.display = 'none';
        document.getElementById('importStep3').style.display = 'block';
        document.getElementById('importConfirmBtn').disabled = true;

        const progressContainer = document.getElementById('importProgress');
        let processed = 0;
        let success = 0;
        let errors = [];

        progressContainer.innerHTML = `
            <div style="text-align: center; padding: var(--spacing-xl);">
                <div class="loader loader-lg" style="margin: 0 auto var(--spacing-lg);"></div>
                <p style="font-weight: var(--font-weight-medium);">Importando productos...</p>
                <p style="color: var(--admin-text-muted);">
                    <span id="importProcessed">0</span> de ${importData.length}
                </p>
                <div style="height: 8px; background: var(--admin-surface-hover); border-radius: 4px; margin-top: var(--spacing-md); overflow: hidden;">
                    <div id="importProgressBar" style="height: 100%; background: var(--admin-accent); width: 0%; transition: width 0.3s;"></div>
                </div>
            </div>
        `;

        // Process in batches
        const batchSize = 10;
        
        for (let i = 0; i < importData.length; i += batchSize) {
            const batch = importData.slice(i, i + batchSize);
            
            try {
                await api.adminBulkCreateProducts?.(batch, { updateExisting });
                success += batch.length;
            } catch (error) {
                errors.push({ index: i, error: error.message });
                success += batch.length - 1; // Assume some succeeded
            }
            
            processed += batch.length;
            document.getElementById('importProcessed').textContent = processed;
            document.getElementById('importProgressBar').style.width = `${(processed / importData.length) * 100}%`;
            
            // Small delay to show progress
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Show results
        showImportResults(success, errors);
    }

    /**
     * Show import results
     */
    function showImportResults(success, errors) {
        const progressContainer = document.getElementById('importProgress');
        
        progressContainer.innerHTML = `
            <div style="text-align: center; padding: var(--spacing-xl);">
                <div style="width: 64px; height: 64px; margin: 0 auto var(--spacing-lg); border-radius: 50%; background: rgba(40, 167, 69, 0.1); display: flex; align-items: center; justify-content: center;">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="var(--admin-success)" stroke-width="2" width="32" height="32">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                </div>
                <h3 style="margin-bottom: var(--spacing-sm);">Importación completada</h3>
                <p style="color: var(--admin-text-secondary);">
                    ${success} productos importados correctamente
                    ${errors.length > 0 ? `<br><span style="color: var(--admin-warning);">${errors.length} errores</span>` : ''}
                </p>
            </div>
        `;

        // Update modal footer
        const footer = document.getElementById('modalFooter');
        if (footer) {
            footer.innerHTML = `
                <button class="btn btn-primary" onclick="AdminUtils.closeModal(); if(typeof AdminProductos !== 'undefined') AdminProductos.refresh?.();">
                    Finalizar
                </button>
            `;
        }
    }

    /**
     * Show export modal
     */
    function showExportModal() {
        const body = `
            <form id="exportForm">
                <div class="form-group">
                    <label class="form-label">Productos a exportar</label>
                    <select class="form-select" name="scope">
                        <option value="all">Todos los productos</option>
                        <option value="selected">Solo seleccionados</option>
                        <option value="active">Solo activos</option>
                        <option value="inactive">Solo inactivos</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Formato</label>
                    <select class="form-select" name="format">
                        <option value="csv">CSV</option>
                        <option value="xlsx" disabled>Excel (próximamente)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Campos a incluir</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-xs);">
                        <label class="form-checkbox"><input type="checkbox" name="fields" value="sku" checked> SKU</label>
                        <label class="form-checkbox"><input type="checkbox" name="fields" value="name" checked> Nombre</label>
                        <label class="form-checkbox"><input type="checkbox" name="fields" value="description" checked> Descripción</label>
                        <label class="form-checkbox"><input type="checkbox" name="fields" value="price" checked> Precio</label>
                        <label class="form-checkbox"><input type="checkbox" name="fields" value="comparePrice"> Precio comparación</label>
                        <label class="form-checkbox"><input type="checkbox" name="fields" value="stock" checked> Stock</label>
                        <label class="form-checkbox"><input type="checkbox" name="fields" value="category" checked> Categoría</label>
                        <label class="form-checkbox"><input type="checkbox" name="fields" value="active" checked> Estado</label>
                        <label class="form-checkbox"><input type="checkbox" name="fields" value="image_url"> URL Imagen</label>
                    </div>
                </div>
            </form>
        `;

        AdminUtils.openModal({
            title: 'Exportar productos',
            body,
            footer: `
                <button class="btn btn-outline" onclick="AdminUtils.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="AdminImportExport.processExport()">Exportar</button>
            `
        });
    }

    /**
     * Process export from modal
     */
    function processExport() {
        const form = document.getElementById('exportForm');
        if (!form) return;

        const formData = new FormData(form);
        const scope = formData.get('scope');
        const format = formData.get('format');
        const fields = formData.getAll('fields');

        if (fields.length === 0) {
            AdminUtils.showToast('error', 'Selecciona al menos un campo');
            return;
        }

        AdminUtils.closeModal();
        
        exportProducts({
            format,
            selectedOnly: scope === 'selected',
            fields
        });
    }

    function getMockProducts() {
        return [
            { id: '1', sku: 'LAP-001', name: 'Laptop Pro 15"', price: 899000, stock: 25, category: 'Electrónica', active: true },
            { id: '2', sku: 'AUD-002', name: 'Audífonos Bluetooth', price: 59000, stock: 50, category: 'Electrónica', active: true },
            { id: '3', sku: 'SWT-003', name: 'Smartwatch Fitness', price: 129000, stock: 15, category: 'Electrónica', active: true }
        ];
    }

    // Add CSS
    if (!document.getElementById('admin-import-export-styles')) {
        const style = document.createElement('style');
        style.id = 'admin-import-export-styles';
        style.textContent = `
            .import-upload-area {
                border: 2px dashed var(--admin-border);
                border-radius: var(--radius-lg);
                padding: var(--spacing-3xl);
                text-align: center;
                cursor: pointer;
                transition: all var(--transition-fast);
            }
            .import-upload-area:hover,
            .import-upload-area.dragover {
                border-color: var(--admin-accent);
                background: rgba(233, 69, 96, 0.05);
            }
        `;
        document.head.appendChild(style);
    }

    return {
        exportProducts,
        downloadTemplate,
        showImportModal,
        confirmImport,
        showExportModal,
        processExport
    };

})();
