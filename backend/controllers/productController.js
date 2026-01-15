const { getDb } = require('../config/firebaseAdmin');
const { uploadImage, deleteImage } = require('../config/cloudinary');

const PRODUCTS_COLLECTION = 'products';
const SETTINGS_COLLECTION = 'settings';

/**
 * Obtener todos los productos (público)
 */
async function getProducts(req, res) {
    try {
        const db = getDb();
        const snapshot = await db.collection(PRODUCTS_COLLECTION)
            .where('active', '==', true)
            .orderBy('createdAt', 'desc')
            .get();

        const products = snapshot.docs.map(doc => ({
            product_id: doc.id,
            ...doc.data()
        }));

        res.json(products);
    } catch (error) {
        console.error('Error en getProducts:', error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
}

/**
 * Obtener producto por ID (público)
 */
async function getProductById(req, res) {
    try {
        const { id } = req.params;
        const db = getDb();
        const doc = await db.collection(PRODUCTS_COLLECTION).doc(id).get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({
            product_id: doc.id,
            ...doc.data()
        });
    } catch (error) {
        console.error('Error en getProductById:', error);
        res.status(500).json({ error: 'Error al obtener producto' });
    }
}

/**
 * Obtener productos destacados para el home (público)
 */
async function getHomeFeaturedProducts(req, res) {
    try {
        const db = getDb();

        // Obtener IDs de productos destacados
        const settingsDoc = await db.collection(SETTINGS_COLLECTION).doc('home').get();
        const featuredIds = settingsDoc.exists
            ? (settingsDoc.data().featured_product_ids || [])
            : [];

        if (!featuredIds.length) {
            // Si no hay destacados, retornar los últimos 5 productos
            const snapshot = await db.collection(PRODUCTS_COLLECTION)
                .where('active', '==', true)
                .orderBy('createdAt', 'desc')
                .limit(5)
                .get();

            const products = snapshot.docs.map(doc => ({
                product_id: doc.id,
                ...doc.data()
            }));

            return res.json(products);
        }

        // Obtener productos por IDs
        const products = [];
        for (const id of featuredIds.slice(0, 5)) {
            const doc = await db.collection(PRODUCTS_COLLECTION).doc(id).get();
            if (doc.exists && doc.data().active) {
                products.push({
                    product_id: doc.id,
                    ...doc.data()
                });
            }
        }

        res.json(products);
    } catch (error) {
        console.error('Error en getHomeFeaturedProducts:', error);
        res.status(500).json({ error: 'Error al obtener productos destacados' });
    }
}

/**
 * Crear producto (admin)
 */
async function createProduct(req, res) {
    try {
        const { name, description, price, image_url, category = '', stock = 0 } = req.body;

        if (!name || !price) {
            return res.status(400).json({ error: 'Nombre y precio son requeridos' });
        }

        const db = getDb();
        const productData = {
            name: name.trim(),
            description: (description || '').trim(),
            price: Number(price),
            image_url: image_url || '',
            category: category.trim(),
            stock: Number(stock),
            active: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const docRef = await db.collection(PRODUCTS_COLLECTION).add(productData);

        res.status(201).json({
            message: 'Producto creado exitosamente',
            product_id: docRef.id,
            ...productData
        });
    } catch (error) {
        console.error('Error en createProduct:', error);
        res.status(500).json({ error: 'Error al crear producto' });
    }
}

/**
 * Actualizar producto (admin)
 */
async function updateProduct(req, res) {
    try {
        const { productId } = req.params;
        const updates = req.body;

        const db = getDb();
        const docRef = db.collection(PRODUCTS_COLLECTION).doc(productId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Filtrar campos permitidos
        const allowedFields = ['name', 'description', 'price', 'image_url', 'category', 'stock', 'active'];
        const filteredUpdates = {};
        for (const key of allowedFields) {
            if (updates[key] !== undefined) {
                filteredUpdates[key] = updates[key];
            }
        }

        filteredUpdates.updatedAt = new Date();

        await docRef.update(filteredUpdates);

        res.json({ message: 'Producto actualizado exitosamente' });
    } catch (error) {
        console.error('Error en updateProduct:', error);
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
}

/**
 * Eliminar producto (admin)
 */
async function deleteProduct(req, res) {
    try {
        const { productId } = req.params;

        const db = getDb();
        const docRef = db.collection(PRODUCTS_COLLECTION).doc(productId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        await docRef.delete();

        res.json({ message: 'Producto eliminado exitosamente' });
    } catch (error) {
        console.error('Error en deleteProduct:', error);
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
}

/**
 * Subir imagen (admin)
 */
async function uploadProductImage(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó imagen' });
        }

        const result = await uploadImage(req.file.buffer, { folder: 'productos' });

        res.json({
            url: result.secure_url,
            public_id: result.public_id
        });
    } catch (error) {
        console.error('Error en uploadImage:', error);
        res.status(500).json({ error: 'Error al subir imagen' });
    }
}

/**
 * Obtener IDs de productos destacados (admin)
 */
async function getHomeFeaturedProductIds(req, res) {
    try {
        const db = getDb();
        const doc = await db.collection(SETTINGS_COLLECTION).doc('home').get();

        const featuredIds = doc.exists
            ? (doc.data().featured_product_ids || [])
            : [];

        res.json({ featured_product_ids: featuredIds });
    } catch (error) {
        console.error('Error en getHomeFeaturedProductIds:', error);
        res.status(500).json({ error: 'Error al obtener productos destacados' });
    }
}

/**
 * Establecer productos destacados (admin)
 */
async function setHomeFeaturedProducts(req, res) {
    try {
        const { featured_product_ids } = req.body;

        if (!Array.isArray(featured_product_ids)) {
            return res.status(400).json({ error: 'featured_product_ids debe ser un array' });
        }

        const db = getDb();
        await db.collection(SETTINGS_COLLECTION).doc('home').set({
            featured_product_ids: featured_product_ids.slice(0, 10)
        }, { merge: true });

        res.json({ message: 'Productos destacados actualizados' });
    } catch (error) {
        console.error('Error en setHomeFeaturedProducts:', error);
        res.status(500).json({ error: 'Error al actualizar productos destacados' });
    }
}

/**
 * Obtener orden del catálogo (admin)
 */
async function getCatalogProductOrder(req, res) {
    try {
        const db = getDb();
        const doc = await db.collection(SETTINGS_COLLECTION).doc('catalog').get();

        const catalogIds = doc.exists
            ? (doc.data().catalog_product_ids || [])
            : [];

        res.json({ catalog_product_ids: catalogIds });
    } catch (error) {
        console.error('Error en getCatalogProductOrder:', error);
        res.status(500).json({ error: 'Error al obtener orden del catálogo' });
    }
}

/**
 * Establecer orden del catálogo (admin)
 */
async function setCatalogProductOrder(req, res) {
    try {
        const { catalog_product_ids } = req.body;

        if (!Array.isArray(catalog_product_ids)) {
            return res.status(400).json({ error: 'catalog_product_ids debe ser un array' });
        }

        const db = getDb();
        await db.collection(SETTINGS_COLLECTION).doc('catalog').set({
            catalog_product_ids
        }, { merge: true });

        res.json({ message: 'Orden del catálogo actualizado' });
    } catch (error) {
        console.error('Error en setCatalogProductOrder:', error);
        res.status(500).json({ error: 'Error al actualizar orden del catálogo' });
    }
}

module.exports = {
    getProducts,
    getProductById,
    getHomeFeaturedProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadImage: uploadProductImage,
    getHomeFeaturedProductIds,
    setHomeFeaturedProducts,
    getCatalogProductOrder,
    setCatalogProductOrder
};
