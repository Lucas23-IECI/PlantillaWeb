/**
 * Image Manager - Gestor de Imágenes para Admin
 * Funcionalidades: Galería, Upload, Editor, Selector
 */

// Verificar autenticación admin
if (typeof requireAdmin === 'function' && !requireAdmin()) {
    // Redirigido
}

// ==========================================
// STATE
// ==========================================
const ImageManager = {
    images: [],
    folders: [],
    selectedImages: new Set(),
    currentFolder: '',
    searchQuery: '',
    nextCursor: null,
    viewMode: 'grid',
    isSelectMode: false,
    isLoading: false,
    currentImage: null, // Para preview/editor
    pendingUploads: [], // Archivos pendientes de subir
};

// ==========================================
// ELEMENTS
// ==========================================
const elements = {
    // Grid and states
    imagesGrid: document.getElementById('imagesGrid'),
    emptyState: document.getElementById('emptyState'),
    loadMore: document.getElementById('loadMore'),
    btnLoadMore: document.getElementById('btnLoadMore'),

    // Toolbar
    folderFilter: document.getElementById('folderFilter'),
    searchInput: document.getElementById('searchInput'),
    selectionActions: document.getElementById('selectionActions'),
    viewToggle: document.querySelectorAll('.view-btn'),

    // Buttons
    btnUpload: document.getElementById('btnUpload'),
    btnSelectMode: document.getElementById('btnSelectMode'),
    btnMoveSelected: document.getElementById('btnMoveSelected'),
    btnDeleteSelected: document.getElementById('btnDeleteSelected'),
    btnCancelSelection: document.getElementById('btnCancelSelection'),

    // Drop zone
    dropZone: document.getElementById('dropZone'),
    fileInput: document.getElementById('fileInput'),

    // Upload progress
    uploadProgress: document.getElementById('uploadProgress'),

    // Preview modal
    previewModal: document.getElementById('previewModal'),
    previewImage: document.getElementById('previewImage'),
    previewFilename: document.getElementById('previewFilename'),
    previewDimensions: document.getElementById('previewDimensions'),
    previewSize: document.getElementById('previewSize'),
    previewFormat: document.getElementById('previewFormat'),
    previewFolder: document.getElementById('previewFolder'),
    previewDate: document.getElementById('previewDate'),
    urlOriginal: document.getElementById('urlOriginal'),
    urlThumbnail: document.getElementById('urlThumbnail'),
    urlMedium: document.getElementById('urlMedium'),

    // Editor modal
    editorModal: document.getElementById('editorModal'),
    editorImage: document.getElementById('editorImage'),
    editorWidth: document.getElementById('editorWidth'),
    editorHeight: document.getElementById('editorHeight'),
    editorKeepRatio: document.getElementById('editorKeepRatio'),
    editorCrop: document.getElementById('editorCrop'),
    editorGravity: document.getElementById('editorGravity'),
    editorQuality: document.getElementById('editorQuality'),
    editorFormat: document.getElementById('editorFormat'),
    generatedUrlContainer: document.getElementById('generatedUrlContainer'),
    generatedUrl: document.getElementById('generatedUrl'),

    // Move modal
    moveModal: document.getElementById('moveModal'),
    moveFolderList: document.getElementById('moveFolderList'),
    newFolderName: document.getElementById('newFolderName'),

    // Upload modal
    uploadModal: document.getElementById('uploadModal'),
    uploadFolder: document.getElementById('uploadFolder'),
    uploadDropArea: document.getElementById('uploadDropArea'),
    uploadFileInput: document.getElementById('uploadFileInput'),
    uploadPreviewList: document.getElementById('uploadPreviewList'),
    btnStartUpload: document.getElementById('btnStartUpload'),
};

// ==========================================
// INITIALIZATION
// ==========================================
async function init() {
    await loadFolders();
    await loadImages();
    setupEventListeners();
}

function setupEventListeners() {
    // Folder filter
    elements.folderFilter.addEventListener('change', (e) => {
        ImageManager.currentFolder = e.target.value;
        ImageManager.nextCursor = null;
        loadImages(true);
    });

    // Search
    let searchTimeout;
    elements.searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            ImageManager.searchQuery = e.target.value;
            ImageManager.nextCursor = null;
            loadImages(true);
        }, 300);
    });

    // View toggle
    elements.viewToggle.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            setViewMode(view);
        });
    });

    // Select mode
    elements.btnSelectMode.addEventListener('click', toggleSelectMode);
    elements.btnCancelSelection.addEventListener('click', () => {
        ImageManager.selectedImages.clear();
        toggleSelectMode(false);
        updateSelectionUI();
    });

    // Selection actions
    elements.btnMoveSelected.addEventListener('click', () => openMoveModal());
    elements.btnDeleteSelected.addEventListener('click', deleteSelectedImages);

    // Upload button
    elements.btnUpload.addEventListener('click', openUploadModal);

    // Drop zone
    setupDropZone(elements.dropZone, elements.fileInput);

    // Load more
    elements.btnLoadMore.addEventListener('click', () => loadImages(false));

    // Preview modal
    document.getElementById('closePreview').addEventListener('click', closePreviewModal);
    document.getElementById('btnEditImage').addEventListener('click', openEditorFromPreview);
    document.getElementById('btnMoveImage').addEventListener('click', () => openMoveModal(ImageManager.currentImage));
    document.getElementById('btnDeleteImage').addEventListener('click', () => deleteImage(ImageManager.currentImage));

    // Editor modal
    document.getElementById('closeEditor').addEventListener('click', closeEditorModal);
    document.getElementById('btnGenerateUrl').addEventListener('click', generateTransformUrl);
    elements.editorWidth.addEventListener('input', onEditorSizeChange);
    elements.editorHeight.addEventListener('input', onEditorSizeChange);

    // Move modal
    document.getElementById('closeMove').addEventListener('click', closeMoveModal);
    document.getElementById('btnCancelMove').addEventListener('click', closeMoveModal);
    document.getElementById('btnConfirmMove').addEventListener('click', confirmMove);
    document.getElementById('btnCreateFolder').addEventListener('click', createNewFolder);

    // Upload modal
    document.getElementById('closeUpload').addEventListener('click', closeUploadModal);
    document.getElementById('btnCancelUpload').addEventListener('click', closeUploadModal);
    document.getElementById('btnSelectFiles').addEventListener('click', () => elements.uploadFileInput.click());
    elements.uploadFileInput.addEventListener('change', handleUploadFileSelect);
    setupDropZone(elements.uploadDropArea, elements.uploadFileInput);
    elements.btnStartUpload.addEventListener('click', startUpload);

    // Copy buttons
    document.querySelectorAll('.btn-copy').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            copyToClipboard(input.value);
            btn.textContent = '✓';
            setTimeout(() => btn.textContent = 'Copiar', 1500);
        });
    });

    // Modal overlays
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', () => {
            closeAllModals();
        });
    });
}

// ==========================================
// DATA LOADING
// ==========================================
async function loadFolders() {
    try {
        const response = await api.getImageFolders();
        if (response.success) {
            ImageManager.folders = response.data;
            renderFolderOptions();
        }
    } catch (error) {
        console.error('Error loading folders:', error);
    }
}

async function loadImages(reset = false) {
    if (ImageManager.isLoading) return;

    ImageManager.isLoading = true;

    if (reset) {
        ImageManager.images = [];
        ImageManager.nextCursor = null;
        elements.imagesGrid.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Cargando imágenes...</p></div>';
    }

    try {
        const params = {
            limit: 30,
        };

        if (ImageManager.currentFolder) {
            params.folder = ImageManager.currentFolder;
        }

        if (ImageManager.searchQuery) {
            params.search = ImageManager.searchQuery;
        }

        if (ImageManager.nextCursor) {
            params.cursor = ImageManager.nextCursor;
        }

        const response = await api.getImages(params);

        if (response.success) {
            if (reset) {
                ImageManager.images = response.data;
            } else {
                ImageManager.images = [...ImageManager.images, ...response.data];
            }

            ImageManager.nextCursor = response.pagination.nextCursor;
            renderImages();
            updateLoadMoreButton(response.pagination.hasMore);
        }
    } catch (error) {
        console.error('Error loading images:', error);
        if (reset) {
            elements.imagesGrid.innerHTML = '<div class="empty-state"><p>Error al cargar imágenes</p></div>';
        }
    } finally {
        ImageManager.isLoading = false;
    }
}

// ==========================================
// RENDERING
// ==========================================
function renderFolderOptions() {
    const options = ['<option value="">Todas las carpetas</option>'];

    ImageManager.folders.forEach(folder => {
        const label = folder.name.charAt(0).toUpperCase() + folder.name.slice(1);
        options.push(`<option value="${folder.path}">${label}</option>`);
    });

    elements.folderFilter.innerHTML = options.join('');

    // Also update upload folder select
    const uploadOptions = ImageManager.folders
        .filter(f => f.isPredefined !== false)
        .map(folder => {
            const label = folder.name.charAt(0).toUpperCase() + folder.name.slice(1);
            return `<option value="${folder.path}">${label}</option>`;
        });

    elements.uploadFolder.innerHTML = uploadOptions.join('');
}

function renderImages() {
    if (ImageManager.images.length === 0) {
        elements.imagesGrid.innerHTML = '';
        elements.emptyState.style.display = 'flex';
        return;
    }

    elements.emptyState.style.display = 'none';

    const html = ImageManager.images.map(image => {
        const isSelected = ImageManager.selectedImages.has(image.publicId);
        const thumbnail = image.variants?.thumbnail || image.url;
        const filename = image.filename || image.publicId.split('/').pop();
        const size = formatFileSize(image.bytes);

        return `
            <div class="image-card ${isSelected ? 'selected' : ''}" 
                 data-public-id="${escapeHtml(image.publicId)}"
                 onclick="handleImageClick(event, '${escapeHtml(image.publicId)}')">
                <div class="image-card-checkbox"></div>
                <img src="${thumbnail}" alt="${escapeHtml(filename)}" loading="lazy">
                <div class="image-card-overlay">
                    <span class="image-card-name">${escapeHtml(filename)}</span>
                    <span class="image-card-size">${size}</span>
                </div>
            </div>
        `;
    }).join('');

    elements.imagesGrid.innerHTML = html;

    // Apply view mode class
    if (ImageManager.viewMode === 'list') {
        elements.imagesGrid.classList.add('list-view');
    } else {
        elements.imagesGrid.classList.remove('list-view');
    }

    // Apply select mode class
    if (ImageManager.isSelectMode) {
        elements.imagesGrid.classList.add('select-mode');
    } else {
        elements.imagesGrid.classList.remove('select-mode');
    }
}

function updateLoadMoreButton(hasMore) {
    elements.loadMore.style.display = hasMore ? 'block' : 'none';
}

function updateSelectionUI() {
    const count = ImageManager.selectedImages.size;
    const countText = elements.selectionActions.querySelector('.selection-count');
    countText.textContent = `${count} seleccionada${count !== 1 ? 's' : ''}`;

    // Update card selection visual
    document.querySelectorAll('.image-card').forEach(card => {
        const publicId = card.dataset.publicId;
        if (ImageManager.selectedImages.has(publicId)) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
}

// ==========================================
// IMAGE ACTIONS
// ==========================================
function handleImageClick(event, publicId) {
    event.stopPropagation();

    if (ImageManager.isSelectMode) {
        toggleImageSelection(publicId);
    } else {
        openPreviewModal(publicId);
    }
}

function toggleImageSelection(publicId) {
    if (ImageManager.selectedImages.has(publicId)) {
        ImageManager.selectedImages.delete(publicId);
    } else {
        ImageManager.selectedImages.add(publicId);
    }
    updateSelectionUI();
}

function toggleSelectMode(forceState) {
    ImageManager.isSelectMode = typeof forceState === 'boolean' ? forceState : !ImageManager.isSelectMode;

    if (ImageManager.isSelectMode) {
        elements.btnSelectMode.classList.add('active');
        elements.selectionActions.style.display = 'flex';
        elements.imagesGrid.classList.add('select-mode');
    } else {
        elements.btnSelectMode.classList.remove('active');
        elements.selectionActions.style.display = 'none';
        elements.imagesGrid.classList.remove('select-mode');
        ImageManager.selectedImages.clear();
        updateSelectionUI();
    }
}

function setViewMode(mode) {
    ImageManager.viewMode = mode;

    elements.viewToggle.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === mode);
    });

    if (mode === 'list') {
        elements.imagesGrid.classList.add('list-view');
    } else {
        elements.imagesGrid.classList.remove('list-view');
    }
}

async function deleteImage(image) {
    if (!image) return;

    if (!confirm(`¿Eliminar la imagen "${image.filename || image.publicId}"?`)) {
        return;
    }

    try {
        const response = await api.deleteImage(image.publicId);
        if (response.success) {
            showNotification('Imagen eliminada', 'success');
            closePreviewModal();
            loadImages(true);
        }
    } catch (error) {
        showNotification(error.message || 'Error al eliminar', 'error');
    }
}

async function deleteSelectedImages() {
    const count = ImageManager.selectedImages.size;
    if (count === 0) return;

    if (!confirm(`¿Eliminar ${count} imagen${count !== 1 ? 'es' : ''}?`)) {
        return;
    }

    try {
        const publicIds = Array.from(ImageManager.selectedImages);
        const response = await api.bulkDeleteImages(publicIds);

        if (response.success) {
            showNotification(response.message, 'success');
            ImageManager.selectedImages.clear();
            toggleSelectMode(false);
            loadImages(true);
        }
    } catch (error) {
        showNotification(error.message || 'Error al eliminar', 'error');
    }
}

// ==========================================
// PREVIEW MODAL
// ==========================================
function openPreviewModal(publicId) {
    const image = ImageManager.images.find(img => img.publicId === publicId);
    if (!image) return;

    ImageManager.currentImage = image;

    // Set image
    elements.previewImage.src = image.variants?.large || image.url;

    // Set details
    elements.previewFilename.textContent = image.filename || image.publicId.split('/').pop();
    elements.previewDimensions.textContent = `${image.width} × ${image.height} px`;
    elements.previewSize.textContent = formatFileSize(image.bytes);
    elements.previewFormat.textContent = (image.format || 'unknown').toUpperCase();
    elements.previewFolder.textContent = image.folder || 'Sin carpeta';
    elements.previewDate.textContent = image.createdAt ? new Date(image.createdAt).toLocaleDateString('es-CL') : '-';

    // Set URLs
    elements.urlOriginal.value = image.variants?.original || image.url;
    elements.urlThumbnail.value = image.variants?.thumbnail || image.url;
    elements.urlMedium.value = image.variants?.medium || image.url;

    elements.previewModal.classList.add('active');
}

function closePreviewModal() {
    elements.previewModal.classList.remove('active');
    ImageManager.currentImage = null;
}

// ==========================================
// EDITOR MODAL
// ==========================================
function openEditorFromPreview() {
    if (!ImageManager.currentImage) return;

    const image = ImageManager.currentImage;

    elements.editorImage.src = image.variants?.medium || image.url;
    elements.editorWidth.value = image.width || 800;
    elements.editorHeight.value = image.height || 800;
    elements.generatedUrlContainer.style.display = 'none';

    closePreviewModal();
    elements.editorModal.classList.add('active');
}

function closeEditorModal() {
    elements.editorModal.classList.remove('active');
}

let originalRatio = 1;
function onEditorSizeChange(e) {
    if (!elements.editorKeepRatio.checked) return;

    const image = ImageManager.currentImage;
    if (!image) return;

    originalRatio = image.width / image.height;

    if (e.target === elements.editorWidth) {
        const width = parseInt(elements.editorWidth.value) || 800;
        elements.editorHeight.value = Math.round(width / originalRatio);
    } else {
        const height = parseInt(elements.editorHeight.value) || 800;
        elements.editorWidth.value = Math.round(height * originalRatio);
    }
}

async function generateTransformUrl() {
    if (!ImageManager.currentImage) return;

    try {
        const response = await api.transformImage(ImageManager.currentImage.publicId, {
            width: parseInt(elements.editorWidth.value) || undefined,
            height: parseInt(elements.editorHeight.value) || undefined,
            crop: elements.editorCrop.value,
            gravity: elements.editorGravity.value,
            quality: elements.editorQuality.value,
            format: elements.editorFormat.value,
        });

        if (response.success) {
            elements.generatedUrl.value = response.data.url;
            elements.generatedUrlContainer.style.display = 'block';

            // Update preview
            elements.editorImage.src = response.data.url;
        }
    } catch (error) {
        showNotification(error.message || 'Error al generar URL', 'error');
    }
}

// ==========================================
// MOVE MODAL
// ==========================================
function openMoveModal(singleImage = null) {
    // Render folder list
    const html = ImageManager.folders.map(folder => `
        <div class="folder-item" data-folder="${folder.path}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>${folder.name.charAt(0).toUpperCase() + folder.name.slice(1)}</span>
        </div>
    `).join('');

    elements.moveFolderList.innerHTML = html;

    // Add click handlers
    elements.moveFolderList.querySelectorAll('.folder-item').forEach(item => {
        item.addEventListener('click', () => {
            elements.moveFolderList.querySelectorAll('.folder-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
        });
    });

    // Store reference to single image if provided
    ImageManager.moveTarget = singleImage ? [singleImage.publicId] : Array.from(ImageManager.selectedImages);

    elements.moveModal.classList.add('active');
}

function closeMoveModal() {
    elements.moveModal.classList.remove('active');
    elements.newFolderName.value = '';
}

async function confirmMove() {
    const selectedFolder = elements.moveFolderList.querySelector('.folder-item.selected');
    if (!selectedFolder) {
        showNotification('Selecciona una carpeta', 'warning');
        return;
    }

    const folder = selectedFolder.dataset.folder;
    const targets = ImageManager.moveTarget || [];

    if (targets.length === 0) {
        showNotification('No hay imágenes seleccionadas', 'warning');
        return;
    }

    try {
        // Move images one by one
        for (const publicId of targets) {
            await api.moveImage(publicId, folder);
        }

        showNotification(`${targets.length} imagen${targets.length !== 1 ? 'es' : ''} movida${targets.length !== 1 ? 's' : ''}`, 'success');
        closeMoveModal();
        closePreviewModal();
        ImageManager.selectedImages.clear();
        toggleSelectMode(false);
        loadImages(true);
    } catch (error) {
        showNotification(error.message || 'Error al mover', 'error');
    }
}

async function createNewFolder() {
    const name = elements.newFolderName.value.trim();
    if (!name) {
        showNotification('Ingresa un nombre para la carpeta', 'warning');
        return;
    }

    try {
        const response = await api.createImageFolder(name);
        if (response.success) {
            showNotification('Carpeta creada', 'success');
            await loadFolders();
            elements.newFolderName.value = '';

            // Re-render folder list in move modal
            openMoveModal();
        }
    } catch (error) {
        showNotification(error.message || 'Error al crear carpeta', 'error');
    }
}

// ==========================================
// UPLOAD MODAL & FUNCTIONALITY
// ==========================================
function openUploadModal() {
    ImageManager.pendingUploads = [];
    elements.uploadPreviewList.innerHTML = '';
    elements.btnStartUpload.disabled = true;
    elements.btnStartUpload.textContent = 'Subir (0)';
    elements.uploadModal.classList.add('active');
}

function closeUploadModal() {
    elements.uploadModal.classList.remove('active');
    ImageManager.pendingUploads = [];
}

function handleUploadFileSelect(e) {
    const files = Array.from(e.target.files);
    addFilesToUpload(files);
    e.target.value = ''; // Reset input
}

function addFilesToUpload(files) {
    files.forEach(file => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showNotification(`${file.name} no es una imagen válida`, 'warning');
            return;
        }

        // Validate size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            showNotification(`${file.name} excede 10MB`, 'warning');
            return;
        }

        // Check if already added
        if (ImageManager.pendingUploads.some(f => f.name === file.name && f.size === file.size)) {
            return;
        }

        ImageManager.pendingUploads.push(file);
    });

    renderUploadPreviews();
}

function renderUploadPreviews() {
    const html = ImageManager.pendingUploads.map((file, index) => {
        const previewUrl = URL.createObjectURL(file);
        return `
            <div class="upload-preview-item" data-index="${index}">
                <img src="${previewUrl}" alt="${escapeHtml(file.name)}">
                <div class="upload-preview-info">
                    <div class="upload-preview-name">${escapeHtml(file.name)}</div>
                    <div class="upload-preview-size">${formatFileSize(file.size)}</div>
                </div>
                <button class="upload-preview-remove" onclick="removeUploadFile(${index})">✕</button>
            </div>
        `;
    }).join('');

    elements.uploadPreviewList.innerHTML = html;

    const count = ImageManager.pendingUploads.length;
    elements.btnStartUpload.disabled = count === 0;
    elements.btnStartUpload.textContent = `Subir (${count})`;
}

function removeUploadFile(index) {
    ImageManager.pendingUploads.splice(index, 1);
    renderUploadPreviews();
}

async function startUpload() {
    if (ImageManager.pendingUploads.length === 0) return;

    const folder = elements.uploadFolder.value;
    const files = ImageManager.pendingUploads;

    closeUploadModal();

    // Show progress
    elements.uploadProgress.style.display = 'block';
    const progressFill = elements.uploadProgress.querySelector('.progress-fill');
    const progressPercent = elements.uploadProgress.querySelector('.progress-percent');

    try {
        const response = await api.uploadImages(files, { folder }, (percent) => {
            progressFill.style.width = `${percent}%`;
            progressPercent.textContent = `${percent}%`;
        });

        if (response.success) {
            showNotification(response.message, 'success');
            loadImages(true);
        }
    } catch (error) {
        showNotification(error.message || 'Error al subir imágenes', 'error');
    } finally {
        setTimeout(() => {
            elements.uploadProgress.style.display = 'none';
            progressFill.style.width = '0%';
        }, 1000);
    }
}

// ==========================================
// DROP ZONE SETUP
// ==========================================
function setupDropZone(zone, input) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
        zone.addEventListener(event, (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    ['dragenter', 'dragover'].forEach(event => {
        zone.addEventListener(event, () => {
            zone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(event => {
        zone.addEventListener(event, () => {
            zone.classList.remove('dragover');
        });
    });

    zone.addEventListener('drop', (e) => {
        const files = Array.from(e.dataTransfer.files);

        // If this is the main drop zone, open upload modal
        if (zone === elements.dropZone) {
            openUploadModal();
            setTimeout(() => addFilesToUpload(files), 100);
        } else {
            addFilesToUpload(files);
        }
    });

    zone.addEventListener('click', () => {
        if (zone === elements.dropZone) {
            openUploadModal();
        } else {
            input.click();
        }
    });
}

// ==========================================
// UTILITIES
// ==========================================
function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
}

function closeAllModals() {
    elements.previewModal.classList.remove('active');
    elements.editorModal.classList.remove('active');
    elements.moveModal.classList.remove('active');
    elements.uploadModal.classList.remove('active');
}

// Show notification (use existing function or create one)
function showNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        alert(message);
    }
}

// ==========================================
// IMAGE SELECTOR (For external use)
// ==========================================
window.ImageSelector = {
    /**
     * Open image selector modal and return selected image(s)
     * @param {Object} options - { multiple: boolean, folder: string }
     * @returns {Promise<Object|Object[]>} Selected image(s)
     */
    open: function(options = {}) {
        return new Promise((resolve, reject) => {
            // Store callback
            window._imageSelectorCallback = resolve;
            window._imageSelectorOptions = options;

            // Open in select mode
            ImageManager.isSelectMode = true;
            ImageManager.selectedImages.clear();

            // Add temporary select button
            const selectBtn = document.createElement('button');
            selectBtn.className = 'btn btn-primary';
            selectBtn.textContent = 'Seleccionar';
            selectBtn.id = 'btnConfirmImageSelect';
            selectBtn.style.position = 'fixed';
            selectBtn.style.bottom = '20px';
            selectBtn.style.right = '20px';
            selectBtn.style.zIndex = '10000';
            selectBtn.onclick = () => {
                const selected = Array.from(ImageManager.selectedImages)
                    .map(id => ImageManager.images.find(img => img.publicId === id))
                    .filter(Boolean);

                selectBtn.remove();

                if (options.multiple) {
                    resolve(selected);
                } else {
                    resolve(selected[0] || null);
                }

                ImageManager.isSelectMode = false;
                ImageManager.selectedImages.clear();
                updateSelectionUI();
            };

            document.body.appendChild(selectBtn);
        });
    }
};

// Make removeUploadFile global for onclick
window.removeUploadFile = removeUploadFile;
window.handleImageClick = handleImageClick;

// Initialize
init();
