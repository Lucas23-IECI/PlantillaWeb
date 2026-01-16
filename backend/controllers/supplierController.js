/**
 * Supplier Controller
 * Gestión de proveedores
 */

// In-memory store for development
let suppliers = [
    { 
        id: '1', 
        name: 'TechSupply Co.', 
        email: 'ventas@techsupply.com', 
        phone: '+56 2 1234 5678', 
        address: 'Av. Principal 123, Santiago',
        website: 'https://techsupply.com',
        notes: 'Proveedor principal de electrónica',
        productCount: 45, 
        active: true,
        logo: '🖥️',
        createdAt: new Date().toISOString()
    },
    { 
        id: '2', 
        name: 'ModaExpress', 
        email: 'contacto@modaexpress.cl', 
        phone: '+56 9 8765 4321',
        productCount: 32, 
        active: true,
        logo: '👕',
        createdAt: new Date().toISOString()
    }
];

exports.getSuppliers = async (req, res) => {
    try {
        res.json({ suppliers });
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({ error: 'Error al obtener proveedores' });
    }
};

exports.createSupplier = async (req, res) => {
    try {
        const { name, email, phone, address, website, notes, active } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'El nombre es obligatorio' });
        }

        const newSupplier = {
            id: Date.now().toString(),
            name,
            email,
            phone,
            address,
            website,
            notes,
            active: active !== false,
            productCount: 0,
            logo: '🏭',
            createdAt: new Date().toISOString()
        };

        suppliers.push(newSupplier);
        res.status(201).json(newSupplier);
    } catch (error) {
        console.error('Error creating supplier:', error);
        res.status(500).json({ error: 'Error al crear proveedor' });
    }
};

exports.updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const index = suppliers.findIndex(s => s.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }

        suppliers[index] = {
            ...suppliers[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        res.json(suppliers[index]);
    } catch (error) {
        console.error('Error updating supplier:', error);
        res.status(500).json({ error: 'Error al actualizar proveedor' });
    }
};

exports.deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        
        suppliers = suppliers.filter(s => s.id !== id);
        res.json({ success: true, message: 'Proveedor eliminado' });
    } catch (error) {
        console.error('Error deleting supplier:', error);
        res.status(500).json({ error: 'Error al eliminar proveedor' });
    }
};
