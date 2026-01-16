/**
 * Import/Export Controller
 * Importar y exportar productos
 */

exports.exportProducts = async (req, res) => {
    try {
        const { format = 'csv', ids, fields } = req.query;
        
        // In real app, would fetch products from database
        const products = [
            { id: '1', sku: 'LAP-001', name: 'Laptop Pro 15"', price: 899000, stock: 25, category: 'Electrónica' },
            { id: '2', sku: 'AUD-002', name: 'Audífonos Bluetooth', price: 59000, stock: 50, category: 'Electrónica' }
        ];

        // Generate CSV
        const headers = fields ? fields.split(',') : Object.keys(products[0]);
        const csvContent = [
            headers.join(','),
            ...products.map(p => headers.map(h => p[h] || '').join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=productos.csv');
        res.send(csvContent);
    } catch (error) {
        console.error('Error exporting products:', error);
        res.status(500).json({ error: 'Error al exportar productos' });
    }
};

exports.importProducts = async (req, res) => {
    try {
        const file = req.file;
        const { updateExisting } = req.body;
        
        if (!file) {
            return res.status(400).json({ error: 'Archivo requerido' });
        }

        // Parse CSV
        const content = file.buffer.toString('utf-8');
        const lines = content.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const products = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const product = {};
            headers.forEach((header, index) => {
                product[header] = values[index];
            });
            products.push(product);
        }

        // In real app, would create/update products in database
        const created = products.length;

        res.json({
            success: true,
            created,
            updated: 0,
            total: products.length
        });
    } catch (error) {
        console.error('Error importing products:', error);
        res.status(500).json({ error: 'Error al importar productos' });
    }
};

exports.getImportTemplate = async (req, res) => {
    try {
        const headers = ['sku', 'name', 'description', 'price', 'comparePrice', 'stock', 'category', 'image_url'];
        const example = ['SKU-001', 'Producto Ejemplo', 'Descripción del producto', '29990', '39990', '100', 'Electrónica', 'https://ejemplo.com/imagen.jpg'];
        
        const csvContent = [
            headers.join(','),
            example.join(',')
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=plantilla_productos.csv');
        res.send(csvContent);
    } catch (error) {
        console.error('Error generating template:', error);
        res.status(500).json({ error: 'Error al generar plantilla' });
    }
};
