require('dotenv').config();
const bcrypt = require('bcryptjs');
const { getDb } = require('../config/firebaseAdmin');

const USERS_COLLECTION = 'users';
const PRODUCTS_COLLECTION = 'products';
const CATEGORIES_COLLECTION = 'categories';

// Comprehensive demo products with realistic data
const demoProducts = [
    // Electrónica
    {
        name: 'Audífonos Bluetooth Premium',
        description: 'Audífonos inalámbricos con cancelación de ruido activa, 30 horas de batería y sonido Hi-Fi. Incluye estuche de carga y cable USB-C. Perfectos para viajes, trabajo y entretenimiento.',
        price: 89990,
        comparePrice: 129990,
        category: 'Electrónica',
        brand: 'SoundMax',
        stock: 45,
        active: true,
        featured: true,
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        tags: ['audio', 'bluetooth', 'wireless', 'premium']
    },
    {
        name: 'Smartwatch Deportivo Pro',
        description: 'Reloj inteligente con GPS integrado, monitor cardíaco, SpO2 y más de 100 modos deportivos. Resistente al agua 5ATM. Batería de 14 días.',
        price: 149990,
        comparePrice: 199990,
        category: 'Electrónica',
        brand: 'FitTech',
        stock: 30,
        active: true,
        featured: true,
        image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
        tags: ['smartwatch', 'fitness', 'GPS', 'deportes']
    },
    {
        name: 'Cargador Inalámbrico 3 en 1',
        description: 'Estación de carga para smartphone, smartwatch y auriculares. Carga rápida 15W. Compatible con iPhone, Samsung y más.',
        price: 34990,
        category: 'Electrónica',
        brand: 'ChargePro',
        stock: 80,
        active: true,
        featured: false,
        image_url: 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e3?w=500',
        tags: ['cargador', 'wireless', 'accesorio']
    },
    {
        name: 'Parlante Bluetooth Portátil',
        description: 'Parlante con sonido 360° y graves potentes. 24 horas de reproducción, resistente al agua IPX7. Ideal para exteriores.',
        price: 59990,
        comparePrice: 79990,
        category: 'Electrónica',
        brand: 'SoundMax',
        stock: 55,
        active: true,
        featured: true,
        image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500',
        tags: ['audio', 'bluetooth', 'portátil', 'outdoor']
    },
    
    // Hogar
    {
        name: 'Lámpara LED Inteligente RGB',
        description: 'Lámpara de escritorio con 16 millones de colores, control por app y compatible con Alexa/Google Home. Brillo regulable y timer programable.',
        price: 29990,
        category: 'Hogar',
        brand: 'SmartHome',
        stock: 100,
        active: true,
        featured: false,
        image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500',
        tags: ['iluminación', 'smart home', 'RGB', 'LED']
    },
    {
        name: 'Difusor de Aromas Premium',
        description: 'Difusor ultrasónico de 500ml con luz LED ambiental de 7 colores. Incluye 3 aceites esenciales de regalo. Silencioso, ideal para dormitorios.',
        price: 24990,
        comparePrice: 34990,
        category: 'Hogar',
        brand: 'Aromix',
        stock: 65,
        active: true,
        featured: true,
        image_url: 'https://images.unsplash.com/photo-1602928298849-325cec8771c0?w=500',
        tags: ['difusor', 'aromaterapia', 'relax', 'hogar']
    },
    {
        name: 'Organizador de Escritorio',
        description: 'Organizador modular de bambú con cargador inalámbrico integrado. Compartimentos para celular, lápices, notas y accesorios.',
        price: 39990,
        category: 'Hogar',
        brand: 'EcoDesk',
        stock: 40,
        active: true,
        featured: false,
        image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500',
        tags: ['organización', 'escritorio', 'bambú', 'ecológico']
    },
    {
        name: 'Set de Plantas Suculentas',
        description: 'Set de 6 suculentas variadas en macetas de cerámica minimalistas. Incluye guía de cuidados. Perfectas para decoración.',
        price: 19990,
        category: 'Hogar',
        brand: 'GreenLife',
        stock: 35,
        active: true,
        featured: false,
        image_url: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=500',
        tags: ['plantas', 'decoración', 'suculentas', 'interior']
    },
    
    // Moda
    {
        name: 'Mochila Urban Tech',
        description: 'Mochila con compartimento acolchado para laptop 15.6", puerto USB externo, impermeable y con sistema antirrobo. Ideal para trabajo y viajes.',
        price: 54990,
        comparePrice: 69990,
        category: 'Moda',
        brand: 'TravelPro',
        stock: 50,
        active: true,
        featured: true,
        image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
        tags: ['mochila', 'laptop', 'viaje', 'antirrobo']
    },
    {
        name: 'Lentes de Sol Polarizados',
        description: 'Lentes con protección UV400 y lentes polarizados para mayor claridad. Marco ligero de aluminio. Incluye estuche y paño limpiador.',
        price: 45990,
        category: 'Moda',
        brand: 'SunVision',
        stock: 70,
        active: true,
        featured: false,
        image_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500',
        tags: ['lentes', 'sol', 'UV', 'polarizado']
    },
    {
        name: 'Billetera de Cuero RFID',
        description: 'Billetera de cuero genuino con bloqueo RFID para proteger tus tarjetas. Diseño slim con capacidad para 8 tarjetas y billetes.',
        price: 32990,
        category: 'Moda',
        brand: 'LeatherCraft',
        stock: 85,
        active: true,
        featured: false,
        image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500',
        tags: ['billetera', 'cuero', 'RFID', 'seguridad']
    },
    {
        name: 'Cinturón Reversible Premium',
        description: 'Cinturón de cuero italiano reversible negro/café. Hebilla ajustable de acero inoxidable. Talla única recortable.',
        price: 27990,
        comparePrice: 39990,
        category: 'Moda',
        brand: 'LeatherCraft',
        stock: 60,
        active: true,
        featured: false,
        image_url: 'https://images.unsplash.com/photo-1624222247344-8f27d01c8dc5?w=500',
        tags: ['cinturón', 'cuero', 'reversible', 'elegante']
    },
    
    // Deportes
    {
        name: 'Botella Térmica 1L',
        description: 'Botella de acero inoxidable que mantiene bebidas frías 24h o calientes 12h. Tapa hermética antigoteo. Libre de BPA.',
        price: 22990,
        category: 'Deportes',
        brand: 'HydroMax',
        stock: 120,
        active: true,
        featured: false,
        image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500',
        tags: ['botella', 'térmica', 'deportes', 'hidratación']
    },
    {
        name: 'Mat de Yoga Premium',
        description: 'Mat de yoga antideslizante de 6mm con líneas de alineación. Material TPE ecológico y biodegradable. Incluye correa de transporte.',
        price: 34990,
        comparePrice: 44990,
        category: 'Deportes',
        brand: 'ZenFit',
        stock: 45,
        active: true,
        featured: true,
        image_url: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500',
        tags: ['yoga', 'fitness', 'mat', 'ecológico']
    },
    {
        name: 'Bandas de Resistencia Set',
        description: 'Set de 5 bandas con diferentes niveles de resistencia. Incluye anclaje de puerta, agarres y bolsa de transporte. Ideal para ejercicio en casa.',
        price: 19990,
        category: 'Deportes',
        brand: 'FlexPro',
        stock: 90,
        active: true,
        featured: false,
        image_url: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=500',
        tags: ['fitness', 'bandas', 'ejercicio', 'home workout']
    },
    {
        name: 'Guantes de Ciclismo',
        description: 'Guantes con palma acolchada y tecnología antitranspirante. Dedos con touch screen. Disponible en tallas S, M, L, XL.',
        price: 15990,
        category: 'Deportes',
        brand: 'CyclePro',
        stock: 75,
        active: true,
        featured: false,
        image_url: 'https://images.unsplash.com/photo-1557803175-2f1d2c8a8f0b?w=500',
        tags: ['ciclismo', 'guantes', 'bicicleta', 'accesorio']
    },
    
    // Tecnología
    {
        name: 'Hub USB-C 7 en 1',
        description: 'Hub multipuerto con HDMI 4K, 3 USB 3.0, lector SD/MicroSD y carga PD 100W. Compatible con MacBook, iPad Pro y laptops USB-C.',
        price: 49990,
        category: 'Tecnología',
        brand: 'TechHub',
        stock: 55,
        active: true,
        featured: true,
        image_url: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=500',
        tags: ['USB-C', 'hub', 'laptop', 'accesorio']
    },
    {
        name: 'Webcam Full HD con Micrófono',
        description: 'Cámara web 1080p/30fps con enfoque automático y micrófono dual con reducción de ruido. Tapa de privacidad incluida.',
        price: 39990,
        comparePrice: 54990,
        category: 'Tecnología',
        brand: 'StreamPro',
        stock: 40,
        active: true,
        featured: false,
        image_url: 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=500',
        tags: ['webcam', 'streaming', 'videollamadas', 'trabajo remoto']
    },
    {
        name: 'Soporte Monitor Ajustable',
        description: 'Soporte ergonómico con altura ajustable, rotación 360° e inclinación. Para monitores de 17-32". Base con organizador de cables.',
        price: 44990,
        category: 'Tecnología',
        brand: 'ErgoDesk',
        stock: 35,
        active: true,
        featured: false,
        image_url: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500',
        tags: ['monitor', 'ergonomía', 'escritorio', 'productividad']
    },
    {
        name: 'Teclado Mecánico RGB',
        description: 'Teclado gaming con switches mecánicos, retroiluminación RGB personalizable y reposamuñecas magnético. Formato TKL compacto.',
        price: 74990,
        comparePrice: 99990,
        category: 'Tecnología',
        brand: 'GamePro',
        stock: 25,
        active: true,
        featured: true,
        image_url: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500',
        tags: ['teclado', 'mecánico', 'gaming', 'RGB']
    }
];

const demoCategories = [
    { name: 'Electrónica', description: 'Gadgets, audio y dispositivos electrónicos', order: 1, active: true },
    { name: 'Hogar', description: 'Artículos para el hogar y decoración', order: 2, active: true },
    { name: 'Moda', description: 'Accesorios y artículos de moda', order: 3, active: true },
    { name: 'Deportes', description: 'Equipamiento y accesorios deportivos', order: 4, active: true },
    { name: 'Tecnología', description: 'Accesorios y periféricos tech', order: 5, active: true }
];

async function seedData() {
    try {
        const db = getDb();
        console.log('🌱 Iniciando seed de datos profesionales...\n');

        // Create admin user
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
                phone: '+56 9 1234 5678',
                address: 'Av. Principal 123',
                city: 'Santiago',
                admin: true,
                createdAt: new Date()
            });
            console.log(`✅ Usuario admin creado: ${adminEmail} / Admin123!`);
        } else {
            console.log('ℹ️  Usuario admin ya existe');
        }

        // Create demo user
        const demoEmail = 'demo@tienda.com';
        const existingDemo = await db.collection(USERS_COLLECTION)
            .where('email', '==', demoEmail)
            .limit(1)
            .get();

        if (existingDemo.empty) {
            const hashedPassword = await bcrypt.hash('Demo1234!', 10);
            await db.collection(USERS_COLLECTION).add({
                email: demoEmail,
                name: 'Usuario Demo',
                password: hashedPassword,
                phone: '+56 9 8765 4321',
                address: 'Calle Demo 456',
                city: 'Providencia',
                admin: false,
                createdAt: new Date()
            });
            console.log(`✅ Usuario demo creado: ${demoEmail} / Demo1234!`);
        } else {
            console.log('ℹ️  Usuario demo ya existe');
        }

        // Create categories
        const existingCategories = await db.collection(CATEGORIES_COLLECTION).limit(1).get();

        if (existingCategories.empty) {
            for (const category of demoCategories) {
                await db.collection(CATEGORIES_COLLECTION).add({
                    ...category,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
            console.log(`✅ ${demoCategories.length} categorías creadas`);
        } else {
            console.log('ℹ️  Ya existen categorías en la base de datos');
        }

        // Create products
        const existingProducts = await db.collection(PRODUCTS_COLLECTION).limit(1).get();

        if (existingProducts.empty) {
            for (const product of demoProducts) {
                await db.collection(PRODUCTS_COLLECTION).add({
                    ...product,
                    rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
                    reviews_count: Math.floor(Math.random() * 100) + 5,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
            console.log(`✅ ${demoProducts.length} productos profesionales creados`);
        } else {
            console.log('ℹ️  Ya existen productos en la base de datos');
        }

        console.log('\n🎉 Seed completado exitosamente!\n');
        console.log('📝 Credenciales de prueba:');
        console.log('   ─────────────────────────────');
        console.log(`   Admin:  ${adminEmail} / Admin123!`);
        console.log(`   Demo:   ${demoEmail} / Demo1234!`);
        console.log('   ─────────────────────────────\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error en seed:', error.message);
        process.exit(1);
    }
}

seedData();
