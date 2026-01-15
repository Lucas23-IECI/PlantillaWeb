/**
 * Script para asignar rol de administrador a un usuario
 * Uso: node scripts/setAdmin.js usuario@email.com
 */

require('dotenv').config();
const { getDb } = require('../config/firebaseAdmin');

const USERS_COLLECTION = 'users';

async function setAdmin() {
    const email = process.argv[2];

    if (!email) {
        console.error('❌ Uso: node scripts/setAdmin.js usuario@email.com');
        process.exit(1);
    }

    try {
        const db = getDb();
        const emailLower = email.toLowerCase().trim();

        const snapshot = await db.collection(USERS_COLLECTION)
            .where('email', '==', emailLower)
            .limit(1)
            .get();

        if (snapshot.empty) {
            console.error(`❌ Usuario no encontrado: ${emailLower}`);
            process.exit(1);
        }

        const userDoc = snapshot.docs[0];
        await db.collection(USERS_COLLECTION).doc(userDoc.id).update({
            admin: true,
            updatedAt: new Date()
        });

        console.log(`✅ Usuario ${emailLower} ahora es administrador`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

setAdmin();
