/**
 * Alert Controller
 * Gestión de alertas de stock
 */

// In-memory store for development
let alerts = [
    { id: '1', productId: 'p1', productName: 'Laptop Pro 15"', sku: 'LAP-001', currentStock: 3, threshold: 10, supplierName: 'TechSupply Co.', createdAt: new Date() },
    { id: '2', productId: 'p2', productName: 'Audífonos Bluetooth', sku: 'AUD-002', currentStock: 0, threshold: 10, supplierName: 'TechSupply Co.', createdAt: new Date() },
    { id: '3', productId: 'p3', productName: 'Mouse Inalámbrico', sku: 'MOU-003', currentStock: 5, threshold: 15, supplierName: 'Distribuidora Global', createdAt: new Date() }
];

let settings = {
    globalThreshold: 10,
    emailNotifications: true
};

exports.getAlerts = async (req, res) => {
    try {
        res.json({ alerts, settings });
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ error: 'Error al obtener alertas' });
    }
};

exports.dismissAlert = async (req, res) => {
    try {
        const { id } = req.params;
        alerts = alerts.filter(a => a.id !== id);
        res.json({ success: true, message: 'Alerta descartada' });
    } catch (error) {
        console.error('Error dismissing alert:', error);
        res.status(500).json({ error: 'Error al descartar alerta' });
    }
};

exports.updateStockThreshold = async (req, res) => {
    try {
        const { globalThreshold, emailNotifications } = req.body;
        
        if (globalThreshold !== undefined) {
            settings.globalThreshold = parseInt(globalThreshold);
        }
        if (emailNotifications !== undefined) {
            settings.emailNotifications = emailNotifications;
        }
        
        res.json({ success: true, settings });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Error al actualizar configuración' });
    }
};

exports.restockProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity, notes } = req.body;
        
        if (!quantity || quantity <= 0) {
            return res.status(400).json({ error: 'Cantidad inválida' });
        }

        // In real app, would update product stock and create inventory movement
        // Remove alert if stock is now above threshold
        const alertIndex = alerts.findIndex(a => a.productId === productId);
        if (alertIndex !== -1) {
            alerts[alertIndex].currentStock += parseInt(quantity);
            if (alerts[alertIndex].currentStock > alerts[alertIndex].threshold) {
                alerts.splice(alertIndex, 1);
            }
        }

        res.json({ 
            success: true, 
            message: `Stock actualizado (+${quantity})`,
            notes
        });
    } catch (error) {
        console.error('Error restocking product:', error);
        res.status(500).json({ error: 'Error al actualizar stock' });
    }
};
