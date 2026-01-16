/**
 * Category Controller
 * Gestión de categorías de productos
 */

// In-memory store for development (replace with database in production)
let categories = [
    { id: '1', name: 'Electrónica', icon: '📱', color: '#3b82f6', parentId: null, order: 0 },
    { id: '1.1', name: 'Smartphones', icon: '📱', color: '#60a5fa', parentId: '1', order: 0 },
    { id: '1.2', name: 'Laptops', icon: '💻', color: '#60a5fa', parentId: '1', order: 1 },
    { id: '2', name: 'Ropa', icon: '👕', color: '#ec4899', parentId: null, order: 1 },
    { id: '3', name: 'Hogar', icon: '🏠', color: '#22c55e', parentId: null, order: 2 }
];

exports.getCategories = async (req, res) => {
    try {
        res.json({ categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, description, icon, color, image, parentId } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'El nombre es obligatorio' });
        }

        const newCategory = {
            id: Date.now().toString(),
            name,
            description,
            icon: icon || '📁',
            color: color || '#6366f1',
            image,
            parentId: parentId || null,
            order: categories.length,
            productCount: 0,
            createdAt: new Date().toISOString()
        };

        categories.push(newCategory);
        res.status(201).json(newCategory);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Error al crear categoría' });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, icon, color, image, parentId } = req.body;
        
        const index = categories.findIndex(c => c.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        categories[index] = {
            ...categories[index],
            name: name || categories[index].name,
            description: description !== undefined ? description : categories[index].description,
            icon: icon || categories[index].icon,
            color: color || categories[index].color,
            image: image !== undefined ? image : categories[index].image,
            parentId: parentId !== undefined ? parentId : categories[index].parentId,
            updatedAt: new Date().toISOString()
        };

        res.json(categories[index]);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Error al actualizar categoría' });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Also delete subcategories
        categories = categories.filter(c => c.id !== id && c.parentId !== id);
        
        res.json({ success: true, message: 'Categoría eliminada' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Error al eliminar categoría' });
    }
};

exports.reorderCategories = async (req, res) => {
    try {
        const { order } = req.body; // Array of { id, order }
        
        if (!Array.isArray(order)) {
            return res.status(400).json({ error: 'Formato inválido' });
        }

        order.forEach(item => {
            const category = categories.find(c => c.id === item.id);
            if (category) {
                category.order = item.order;
            }
        });

        categories.sort((a, b) => a.order - b.order);
        res.json({ success: true, categories });
    } catch (error) {
        console.error('Error reordering categories:', error);
        res.status(500).json({ error: 'Error al reordenar categorías' });
    }
};
