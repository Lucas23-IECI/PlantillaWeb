require('dotenv').config();
const bcrypt = require('bcryptjs');
const { getDb } = require('../config/firebaseAdmin');

const USERS_COLLECTION = 'users';
const PRODUCTS_COLLECTION = 'products';

async function seedData() {
    try {
        const db = getDb();
        console.log('🌱 Iniciando seed de datos...');
        const adminEmail = 'admin@tutienda.com';
        const existingAdmin = await db.collection(USERS_COLLECTION)
            .where('email', '==', adminEmail)
            .limit(1)
            .get();

        if (existingAdmin.empty) {
            const hashedPassword = await bcrypt.hash('Admin123!', 10);
            await db.collection(USERS_COLLECTION).add({
                email: adminEmail,
                name: 'Administrador',
                password: hashedPassword,
                phone: '',
                address: '',
                city: '',
                admin: true,
                createdAt: new Date()
            });
            console.log(`✅ Usuario admin creado: ${adminEmail} / Admin123!`);
        } else {
            console.log('ℹ️  Usuario admin ya existe');
        }
        const sampleProducts = [
            {
                name: 'Producto de Ejemplo 1',
                description: 'Este es un producto de ejemplo para demostración. Personaliza este contenido.',
                price: 15000,
                category: 'General',
                stock: 50,
                active: true,
                image_url: ''
            },
            {
                name: 'Producto de Ejemplo 2',
                description: 'Otro producto de ejemplo. Cambia el nombre, precio y descripción según tu negocio.',
                price: 25000,
                category: 'General',
                stock: 30,
                active: true,
                image_url: ''
            },
            {
                name: 'Producto Premium',
                description: 'Producto de ejemplo con precio más alto. Ideal para mostrar variedad de precios.',
                price: 45000,
                category: 'Premium',
                stock: 20,
                active: true,
                image_url: ''
            },
            {
                name: 'Producto Económico',
                description: 'Producto de ejemplo accesible. Perfecto para atraer clientes nuevos.',
                price: 8000,
                category: 'Económico',
                stock: 100,
                active: true,
                image_url: ''
            },
            {
                name: 'Producto Edición Especial',
                description: 'Producto de ejemplo de edición limitada. Ideal para promociones.',
                price: 35000,
                category: 'Especial',
                stock: 10,
                active: true,
                image_url: ''
            }
        ];

        const existingProducts = await db.collection(PRODUCTS_COLLECTION).limit(1).get();

        if (existingProducts.empty) {
            for (const product of sampleProducts) {
                await db.collection(PRODUCTS_COLLECTION).add({
                    ...product,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
            console.log(`✅ ${sampleProducts.length} productos de ejemplo creados`);
        } else {
            console.log('ℹ️  Ya existen productos en la base de datos');
        }

        console.log('\n🎉 Seed completado exitosamente!');
        console.log('\n📝 Credenciales de prueba:');
        console.log(`   Email: ${adminEmail}`);
        console.log('   Password: Admin123!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error en seed:', error.message);
        process.exit(1);
    }
}

seedData();
