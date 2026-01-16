/**
 * Admin Panel - Categories Module
 * Gestión de categorías y subcategorías
 */

const AdminCategorias = (function() {
    'use strict';

    let categories = [];
    let expandedIds = new Set();

    async function load(container) {
        container.innerHTML = `
            <div class="admin-page-header">
                <div class="page-title-group">
                    <h1 class="page-title">Categorías</h1>
                    <p class="page-description">Organiza tus productos en categorías y subcategorías</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-primary" onclick="AdminCategorias.createCategory()">
                        ${AdminUtils.Icons.plus}
                        Nueva categoría
                    </button>
                </div>
            </div>

            <div class="admin-content" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg);">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Árbol de categorías</h3>
                        <button class="btn btn-ghost btn-sm" onclick="AdminCategorias.expandAll()">
                            Expandir todo
                        </button>
                    </div>
                    <div class="card-body" id="categoryTree">
                        <div class="loading-overlay">
                            <div class="loader"></div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Estadísticas</h3>
                    </div>
                    <div class="card-body" id="categoryStats">
                        <div class="loading-overlay">
                            <div class="loader"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        await loadCategories();
    }

    async function loadCategories() {
        try {
            const response = await api.adminGetCategories?.() || { categories: getMockCategories() };
            categories = response.categories || response || getMockCategories();
            renderTree();
            renderStats();
        } catch (error) {
            console.error('Error loading categories:', error);
            categories = getMockCategories();
            renderTree();
            renderStats();
        }
    }

    function renderTree() {
        const container = document.getElementById('categoryTree');
        
        if (categories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                        </svg>
                    </div>
                    <h3 class="empty-state-title">Sin categorías</h3>
                    <p class="empty-state-message">Crea tu primera categoría para organizar productos</p>
                    <button class="btn btn-primary" onclick="AdminCategorias.createCategory()">
                        ${AdminUtils.Icons.plus} Crear categoría
                    </button>
                </div>
            `;
            return;
        }

        const rootCategories = categories.filter(c => !c.parentId);
        container.innerHTML = `<div class="category-tree">${renderCategoryItems(rootCategories, 0)}</div>`;
    }

    function renderCategoryItems(items, level) {
        return items.map(category => {
            const children = categories.filter(c => c.parentId === category.id);
            const hasChildren = children.length > 0;
            const isExpanded = expandedIds.has(category.id);
            const productCount = category.productCount || 0;

            return `
                <div class="category-item" data-id="${category.id}" style="margin-left: ${level * 20}px;">
                    <div class="category-item-row">
                        ${hasChildren ? `
                            <button class="category-expand-btn ${isExpanded ? 'expanded' : ''}" onclick="AdminCategorias.toggleExpand('${category.id}')">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="16" height="16">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                                </svg>
                            </button>
                        ` : '<span style="width:24px;"></span>'}
                        
                        <div class="category-icon" style="background: ${category.color || 'var(--admin-surface-hover)'};">
                            ${category.icon || '📁'}
                        </div>
                        
                        <div class="category-info">
                            <span class="category-name">${category.name}</span>
                            <span class="category-count">${productCount} productos</span>
                        </div>
                        
                        <div class="category-actions">
                            <button class="btn btn-ghost btn-icon btn-sm" onclick="AdminCategorias.createCategory('${category.id}')" title="Agregar subcategoría">
                                ${AdminUtils.Icons.plus}
                            </button>
                            <button class="btn btn-ghost btn-icon btn-sm" onclick="AdminCategorias.editCategory('${category.id}')" title="Editar">
                                ${AdminUtils.Icons.edit}
                            </button>
                            <button class="btn btn-ghost btn-icon btn-sm" onclick="AdminCategorias.deleteCategory('${category.id}')" title="Eliminar">
                                ${AdminUtils.Icons.trash}
                            </button>
                        </div>
                    </div>
                    ${hasChildren && isExpanded ? `<div class="category-children">${renderCategoryItems(children, level + 1)}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    function renderStats() {
        const container = document.getElementById('categoryStats');
        
        const totalCategories = categories.length;
        const rootCategories = categories.filter(c => !c.parentId).length;
        const subcategories = totalCategories - rootCategories;
        const totalProducts = categories.reduce((sum, c) => sum + (c.productCount || 0), 0);

        const topCategories = [...categories]
            .sort((a, b) => (b.productCount || 0) - (a.productCount || 0))
            .slice(0, 5);

        container.innerHTML = `
            <div class="stats-grid" style="grid-template-columns: repeat(2, 1fr); margin-bottom: var(--spacing-lg);">
                <div class="stat-card">
                    <div class="stat-card-title">Total categorías</div>
                    <div class="stat-card-value">${totalCategories}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-title">Categorías raíz</div>
                    <div class="stat-card-value">${rootCategories}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-title">Subcategorías</div>
                    <div class="stat-card-value">${subcategories}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-title">Productos total</div>
                    <div class="stat-card-value">${totalProducts}</div>
                </div>
            </div>

            <h4 style="margin-bottom: var(--spacing-md); font-size: var(--font-size-sm); color: var(--admin-text-secondary);">Top categorías por productos</h4>
            <div class="bar-chart">
                ${topCategories.map(cat => {
                    const maxCount = topCategories[0]?.productCount || 1;
                    const percent = ((cat.productCount || 0) / maxCount) * 100;
                    return `
                        <div class="bar-item">
                            <span class="bar-label">${cat.name}</span>
                            <div class="bar-track">
                                <div class="bar-fill" style="width: ${percent}%;">
                                    <span class="bar-value">${cat.productCount || 0}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function toggleExpand(categoryId) {
        if (expandedIds.has(categoryId)) {
            expandedIds.delete(categoryId);
        } else {
            expandedIds.add(categoryId);
        }
        renderTree();
    }

    function expandAll() {
        categories.forEach(c => {
            const hasChildren = categories.some(child => child.parentId === c.id);
            if (hasChildren) {
                expandedIds.add(c.id);
            }
        });
        renderTree();
    }

    function createCategory(parentId = null) {
        const parent = parentId ? categories.find(c => c.id === parentId) : null;
        const title = parent ? `Nueva subcategoría de "${parent.name}"` : 'Nueva categoría';

        const body = `
            <form id="categoryForm">
                ${parent ? `<input type="hidden" name="parentId" value="${parentId}">` : ''}
                
                <div class="form-group">
                    <label class="form-label required">Nombre</label>
                    <input type="text" class="form-input" name="name" required placeholder="Nombre de la categoría">
                </div>

                <div class="form-group">
                    <label class="form-label">Descripción</label>
                    <textarea class="form-textarea" name="description" rows="2" placeholder="Descripción opcional"></textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Icono</label>
                        <input type="text" class="form-input" name="icon" value="📁" placeholder="Emoji">
                        <span class="form-hint">Usa un emoji como icono</span>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Color</label>
                        <input type="color" class="form-input" name="color" value="#e94560" style="height: 42px; padding: 4px;">
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Imagen</label>
                    <input type="url" class="form-input" name="image" placeholder="https://...">
                </div>
            </form>
        `;

        AdminUtils.openModal({
            title,
            body,
            footer: `
                <button class="btn btn-outline" onclick="AdminUtils.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="AdminCategorias.saveCategory()">Crear categoría</button>
            `
        });
    }

    function editCategory(categoryId) {
        const category = categories.find(c => c.id === categoryId);
        if (!category) return;

        const body = `
            <form id="categoryForm">
                <input type="hidden" name="id" value="${categoryId}">
                
                <div class="form-group">
                    <label class="form-label required">Nombre</label>
                    <input type="text" class="form-input" name="name" value="${category.name}" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Descripción</label>
                    <textarea class="form-textarea" name="description" rows="2">${category.description || ''}</textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Icono</label>
                        <input type="text" class="form-input" name="icon" value="${category.icon || '📁'}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Color</label>
                        <input type="color" class="form-input" name="color" value="${category.color || '#e94560'}" style="height: 42px; padding: 4px;">
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Imagen</label>
                    <input type="url" class="form-input" name="image" value="${category.image || ''}" placeholder="https://...">
                </div>
            </form>
        `;

        AdminUtils.openModal({
            title: 'Editar categoría',
            body,
            footer: `
                <button class="btn btn-outline" onclick="AdminUtils.closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="AdminCategorias.saveCategory('${categoryId}')">Guardar cambios</button>
            `
        });
    }

    async function saveCategory(categoryId = null) {
        const form = document.getElementById('categoryForm');
        if (!form) return;

        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            description: formData.get('description'),
            icon: formData.get('icon'),
            color: formData.get('color'),
            image: formData.get('image'),
            parentId: formData.get('parentId') || null
        };

        if (!data.name) {
            AdminUtils.showToast('error', 'El nombre es obligatorio');
            return;
        }

        try {
            if (categoryId) {
                await api.adminUpdateCategory?.(categoryId, data);
                AdminUtils.showToast('success', 'Categoría actualizada');
            } else {
                await api.adminCreateCategory?.(data);
                AdminUtils.showToast('success', 'Categoría creada');
            }
            AdminUtils.closeModal();
            await loadCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            AdminUtils.showToast('error', error.message || 'Error al guardar');
        }
    }

    async function deleteCategory(categoryId) {
        const category = categories.find(c => c.id === categoryId);
        if (!category) return;

        const hasChildren = categories.some(c => c.parentId === categoryId);
        const hasProducts = (category.productCount || 0) > 0;

        let message = `¿Eliminar la categoría "${category.name}"?`;
        if (hasChildren) {
            message += '\n\nEsta categoría tiene subcategorías que también serán eliminadas.';
        }
        if (hasProducts) {
            message += `\n\nHay ${category.productCount} productos en esta categoría que quedarán sin categoría.`;
        }

        const confirmed = await AdminUtils.confirm(message, 'Eliminar categoría');
        if (!confirmed) return;

        try {
            await api.adminDeleteCategory?.(categoryId);
            AdminUtils.showToast('success', 'Categoría eliminada');
            await loadCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            AdminUtils.showToast('error', error.message || 'Error al eliminar');
        }
    }

    function getMockCategories() {
        return [
            { id: '1', name: 'Electrónica', icon: '📱', color: '#3b82f6', productCount: 45, parentId: null },
            { id: '1.1', name: 'Smartphones', icon: '📱', color: '#60a5fa', productCount: 20, parentId: '1' },
            { id: '1.2', name: 'Laptops', icon: '💻', color: '#60a5fa', productCount: 15, parentId: '1' },
            { id: '1.3', name: 'Accesorios', icon: '🎧', color: '#60a5fa', productCount: 10, parentId: '1' },
            { id: '2', name: 'Ropa', icon: '👕', color: '#ec4899', productCount: 30, parentId: null },
            { id: '2.1', name: 'Hombre', icon: '👔', color: '#f472b6', productCount: 15, parentId: '2' },
            { id: '2.2', name: 'Mujer', icon: '👗', color: '#f472b6', productCount: 15, parentId: '2' },
            { id: '3', name: 'Hogar', icon: '🏠', color: '#22c55e', productCount: 25, parentId: null },
            { id: '4', name: 'Deportes', icon: '⚽', color: '#f59e0b', productCount: 18, parentId: null }
        ];
    }

    // Add CSS for category tree
    if (!document.getElementById('admin-categories-styles')) {
        const style = document.createElement('style');
        style.id = 'admin-categories-styles';
        style.textContent = `
            .category-tree {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .category-item-row {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                padding: var(--spacing-sm);
                border-radius: var(--radius-md);
                transition: background var(--transition-fast);
            }
            .category-item-row:hover {
                background: var(--admin-surface-hover);
            }
            .category-expand-btn {
                width: 24px;
                height: 24px;
                border: none;
                background: transparent;
                color: var(--admin-text-muted);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: var(--radius-sm);
                transition: all var(--transition-fast);
            }
            .category-expand-btn:hover {
                background: var(--admin-surface-active);
                color: var(--admin-text);
            }
            .category-expand-btn svg {
                transition: transform var(--transition-fast);
            }
            .category-expand-btn.expanded svg {
                transform: rotate(90deg);
            }
            .category-icon {
                width: 32px;
                height: 32px;
                border-radius: var(--radius-md);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                flex-shrink: 0;
            }
            .category-info {
                flex: 1;
                min-width: 0;
            }
            .category-name {
                font-weight: var(--font-weight-medium);
                color: var(--admin-text);
                display: block;
            }
            .category-count {
                font-size: var(--font-size-xs);
                color: var(--admin-text-muted);
            }
            .category-actions {
                display: flex;
                gap: 2px;
                opacity: 0;
                transition: opacity var(--transition-fast);
            }
            .category-item-row:hover .category-actions {
                opacity: 1;
            }
            .category-children {
                margin-top: 4px;
            }
        `;
        document.head.appendChild(style);
    }

    return {
        load,
        toggleExpand,
        expandAll,
        createCategory,
        editCategory,
        saveCategory,
        deleteCategory
    };

})();
