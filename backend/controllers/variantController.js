/**
 * Variant Controller
 * Gestión de variantes de productos
 */

// In-memory store for development
let variants = {};

exports.getVariants = async (req, res) => {
    try {
        const { productId } = req.params;
        const productVariants = variants[productId] || [];
        res.json({ variants: productVariants });
    } catch (error) {
        console.error('Error fetching variants:', error);
        res.status(500).json({ error: 'Error al obtener variantes' });
    }
};

exports.createVariant = async (req, res) => {
    try {
        const { productId } = req.params;
        const { name, sku, priceModifier, stock } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'El nombre es obligatorio' });
        }

        const variant = {
            id: Date.now().toString(),
            productId,
            name,
            sku: sku || '',
            priceModifier: parseFloat(priceModifier) || 0,
            stock: parseInt(stock) || 0,
            createdAt: new Date().toISOString()
        };

        if (!variants[productId]) {
            variants[productId] = [];
        }
        variants[productId].push(variant);

        res.status(201).json(variant);
    } catch (error) {
        console.error('Error creating variant:', error);
        res.status(500).json({ error: 'Error al crear variante' });
    }
};

exports.updateVariant = async (req, res) => {
    try {
        const { productId, variantId } = req.params;
        const updates = req.body;
        
        const productVariants = variants[productId];
        if (!productVariants) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const index = productVariants.findIndex(v => v.id === variantId);
        if (index === -1) {
            return res.status(404).json({ error: 'Variante no encontrada' });
        }

        productVariants[index] = {
            ...productVariants[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        res.json(productVariants[index]);
    } catch (error) {
        console.error('Error updating variant:', error);
        res.status(500).json({ error: 'Error al actualizar variante' });
    }
};

exports.deleteVariant = async (req, res) => {
    try {
        const { productId, variantId } = req.params;
        
        if (variants[productId]) {
            variants[productId] = variants[productId].filter(v => v.id !== variantId);
        }
        
        res.json({ success: true, message: 'Variante eliminada' });
    } catch (error) {
        console.error('Error deleting variant:', error);
        res.status(500).json({ error: 'Error al eliminar variante' });
    }
};
