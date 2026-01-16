const { getDb } = require('../config/firebaseAdmin');

const USERS_COLLECTION = 'users';
const ADDRESSES_COLLECTION = 'user_addresses';

// ==========================================
// PROFILE ENDPOINTS
// ==========================================

async function getProfile(req, res) {
    try {
        const userId = req.user.uid;
        const db = getDb();
        
        const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();
        
        if (!userDoc.exists) {
            return res.json({
                uid: userId,
                email: req.user.email,
                name: req.user.name || ''
            });
        }

        const userData = userDoc.data();
        res.json({
            uid: userId,
            email: req.user.email,
            ...userData,
            createdAt: userData.createdAt?.toDate?.() || userData.createdAt
        });
    } catch (error) {
        console.error('Error en getProfile:', error);
        res.status(500).json({ error: 'Error al obtener perfil' });
    }
}

async function updateProfile(req, res) {
    try {
        const userId = req.user.uid;
        const { name, phone, rut, address, city, region } = req.body;

        const db = getDb();
        const userRef = db.collection(USERS_COLLECTION).doc(userId);
        
        const updateData = {
            updatedAt: new Date()
        };

        if (name !== undefined) updateData.name = name.trim();
        if (phone !== undefined) updateData.phone = phone.trim();
        if (rut !== undefined) updateData.rut = rut.trim();
        if (address !== undefined) updateData.address = address.trim();
        if (city !== undefined) updateData.city = city.trim();
        if (region !== undefined) updateData.region = region.trim();

        await userRef.set(updateData, { merge: true });

        res.json({ 
            message: 'Perfil actualizado correctamente',
            ...updateData
        });
    } catch (error) {
        console.error('Error en updateProfile:', error);
        res.status(500).json({ error: 'Error al actualizar perfil' });
    }
}

// ==========================================
// ADDRESSES ENDPOINTS
// ==========================================

async function getAddresses(req, res) {
    try {
        const userId = req.user.uid;
        const db = getDb();
        
        const snapshot = await db.collection(ADDRESSES_COLLECTION)
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        const addresses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
        }));

        res.json(addresses);
    } catch (error) {
        console.error('Error en getAddresses:', error);
        res.status(500).json({ error: 'Error al obtener direcciones' });
    }
}

async function createAddress(req, res) {
    try {
        const userId = req.user.uid;
        const { name, street, city, region, postalCode, isPrimary } = req.body;

        if (!street || !city || !region) {
            return res.status(400).json({ error: 'Dirección, ciudad y región son requeridos' });
        }

        const db = getDb();
        
        // If this is primary, unset other primary addresses
        if (isPrimary) {
            const existingPrimary = await db.collection(ADDRESSES_COLLECTION)
                .where('userId', '==', userId)
                .where('isPrimary', '==', true)
                .get();
            
            const batch = db.batch();
            existingPrimary.docs.forEach(doc => {
                batch.update(doc.ref, { isPrimary: false });
            });
            await batch.commit();
        }

        const addressData = {
            userId,
            name: (name || 'Mi dirección').trim(),
            street: street.trim(),
            city: city.trim(),
            region: region.trim(),
            postalCode: (postalCode || '').trim(),
            isPrimary: isPrimary === true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const docRef = await db.collection(ADDRESSES_COLLECTION).add(addressData);

        res.status(201).json({
            message: 'Dirección creada correctamente',
            id: docRef.id,
            ...addressData
        });
    } catch (error) {
        console.error('Error en createAddress:', error);
        res.status(500).json({ error: 'Error al crear dirección' });
    }
}

async function updateAddress(req, res) {
    try {
        const userId = req.user.uid;
        const { addressId } = req.params;
        const { name, street, city, region, postalCode, isPrimary } = req.body;

        const db = getDb();
        const addressRef = db.collection(ADDRESSES_COLLECTION).doc(addressId);
        const addressDoc = await addressRef.get();

        if (!addressDoc.exists) {
            return res.status(404).json({ error: 'Dirección no encontrada' });
        }

        if (addressDoc.data().userId !== userId) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        // If setting as primary, unset other primary addresses
        if (isPrimary && !addressDoc.data().isPrimary) {
            const existingPrimary = await db.collection(ADDRESSES_COLLECTION)
                .where('userId', '==', userId)
                .where('isPrimary', '==', true)
                .get();
            
            const batch = db.batch();
            existingPrimary.docs.forEach(doc => {
                if (doc.id !== addressId) {
                    batch.update(doc.ref, { isPrimary: false });
                }
            });
            await batch.commit();
        }

        const updateData = {
            updatedAt: new Date()
        };

        if (name !== undefined) updateData.name = name.trim();
        if (street !== undefined) updateData.street = street.trim();
        if (city !== undefined) updateData.city = city.trim();
        if (region !== undefined) updateData.region = region.trim();
        if (postalCode !== undefined) updateData.postalCode = postalCode.trim();
        if (isPrimary !== undefined) updateData.isPrimary = isPrimary;

        await addressRef.update(updateData);

        res.json({ 
            message: 'Dirección actualizada correctamente',
            id: addressId,
            ...updateData
        });
    } catch (error) {
        console.error('Error en updateAddress:', error);
        res.status(500).json({ error: 'Error al actualizar dirección' });
    }
}

async function deleteAddress(req, res) {
    try {
        const userId = req.user.uid;
        const { addressId } = req.params;

        const db = getDb();
        const addressRef = db.collection(ADDRESSES_COLLECTION).doc(addressId);
        const addressDoc = await addressRef.get();

        if (!addressDoc.exists) {
            return res.status(404).json({ error: 'Dirección no encontrada' });
        }

        if (addressDoc.data().userId !== userId) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        await addressRef.delete();

        res.json({ message: 'Dirección eliminada correctamente' });
    } catch (error) {
        console.error('Error en deleteAddress:', error);
        res.status(500).json({ error: 'Error al eliminar dirección' });
    }
}

module.exports = {
    getProfile,
    updateProfile,
    getAddresses,
    createAddress,
    updateAddress,
    deleteAddress
};
