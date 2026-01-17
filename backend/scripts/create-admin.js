/**
 * Script para crear un usuario admin de prueba
 * Ejecutar: node scripts/create-admin.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { getDb } = require('../config/firebaseAdmin');

async function createAdminUser() {
    try {
        const db = getDb();

        const adminEmail = 'admin@test.com';
        const adminPassword = 'admin123';

        // Verificar si ya existe
        const existing = await db.collection('users')
            .where('email', '==', adminEmail)
            .limit(1)
            .get();

        if (!existing.empty) {
            console.log('⚠️ El usuario admin ya existe');
            console.log('📧 Email:', adminEmail);
            console.log('🔑 Password:', adminPassword);
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const userData = {
            email: adminEmail,
            name: 'Admin Test',
            password: hashedPassword,
            phone: '+56912345678',
            address: 'Dirección de prueba',
            city: 'Santiago',
            admin: true,
            createdAt: new Date()
        };

        const docRef = await db.collection('users').add(userData);

        console.log('✅ Usuario admin creado exitosamente!');
        console.log('📧 Email:', adminEmail);
        console.log('🔑 Password:', adminPassword);
        console.log('🆔 ID:', docRef.id);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createAdminUser();
