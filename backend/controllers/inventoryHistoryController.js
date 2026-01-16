/**
 * Inventory History Controller
 * Registro de movimientos de inventario
 */

// In-memory store for development
let movements = [];

// Generate initial mock data
const now = Date.now();
movements = [
    { id: '1', date: new Date(now - 3600000), type: 'venta', productId: 'p1', productName: 'Laptop Pro 15"', sku: 'LAP-001', quantity: -1, previousStock: 25, newStock: 24, userName: 'Sistema' },
    { id: '2', date: new Date(now - 7200000), type: 'entrada', productId: 'p2', productName: 'Audífonos Bluetooth', sku: 'AUD-002', quantity: 50, previousStock: 10, newStock: 60, userName: 'Admin', notes: 'Reposición mensual' },
    { id: '3', date: new Date(now - 86400000), type: 'ajuste', productId: 'p3', productName: 'Smartwatch Fitness', sku: 'SWT-003', quantity: -2, previousStock: 17, newStock: 15, userName: 'Admin', notes: 'Ajuste por conteo físico' },
    { id: '4', date: new Date(now - 172800000), type: 'venta', productId: 'p4', productName: 'Cámara Digital', sku: 'CAM-004', quantity: -1, previousStock: 8, newStock: 7, userName: 'Sistema' }
];

exports.getHistory = async (req, res) => {
    try {
        const { type, productId, from, to, limit = 50, page = 1 } = req.query;
        
        let filtered = [...movements];
        
        // Apply filters
        if (type) {
            filtered = filtered.filter(m => m.type === type);
        }
        if (productId) {
            filtered = filtered.filter(m => m.productId === productId);
        }
        if (from) {
            filtered = filtered.filter(m => new Date(m.date) >= new Date(from));
        }
        if (to) {
            filtered = filtered.filter(m => new Date(m.date) <= new Date(to));
        }
        
        // Sort by date descending
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Pagination
        const total = filtered.length;
        const start = (parseInt(page) - 1) * parseInt(limit);
        const paginated = filtered.slice(start, start + parseInt(limit));
        
        res.json({
            movements: paginated,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching inventory history:', error);
        res.status(500).json({ error: 'Error al obtener historial' });
    }
};

exports.createMovement = async (req, res) => {
    try {
        const { type, productId, productName, sku, quantity, notes } = req.body;
        
        if (!type || !productName || quantity === undefined) {
            return res.status(400).json({ error: 'Tipo, producto y cantidad son obligatorios' });
        }

        // Calculate stock (in real app, would fetch from database)
        const previousStock = 0; // Would be fetched from product
        const newStock = previousStock + quantity;

        const movement = {
            id: Date.now().toString(),
            date: new Date(),
            type,
            productId: productId || 'unknown',
            productName,
            sku,
            quantity: parseInt(quantity),
            previousStock,
            newStock,
            userName: req.user?.name || 'Admin',
            notes
        };

        movements.unshift(movement);
        res.status(201).json(movement);
    } catch (error) {
        console.error('Error creating movement:', error);
        res.status(500).json({ error: 'Error al registrar movimiento' });
    }
};
