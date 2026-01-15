const admin = require('firebase-admin');
const fs = require('fs');

/**
 * Obtiene las credenciales de Firebase desde variables de entorno
 * Soporta: JSON directo, Base64, o path a archivo
 */
function getServiceAccount() {
    const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

    if (path) {
        try {
            const json = fs.readFileSync(path, 'utf8');
            return JSON.parse(json);
        } catch (e) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH no se pudo leer/parsear');
        }
    }

    if (raw) {
        try {
            return JSON.parse(raw);
        } catch (e) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON no es JSON válido');
        }
    }

    if (b64) {
        try {
            const json = Buffer.from(b64, 'base64').toString('utf8');
            return JSON.parse(json);
        } catch (e) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 no es válido');
        }
    }

    return null;
}

/**
 * Inicializa Firebase Admin SDK
 */
function initFirebaseAdmin() {
    if (admin.apps.length) return admin;

    const serviceAccount = getServiceAccount();
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const useStorage = String(process.env.FIREBASE_USE_STORAGE || '').toLowerCase() === 'true';
    const storageBucketRaw = process.env.FIREBASE_STORAGE_BUCKET;
    const storageBucket = storageBucketRaw?.startsWith('gs://')
        ? storageBucketRaw.slice('gs://'.length)
        : storageBucketRaw;

    if (!serviceAccount) {
        throw new Error('Falta FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_BASE64 o FIREBASE_SERVICE_ACCOUNT_PATH');
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projectId || serviceAccount.project_id,
        ...(useStorage && storageBucket ? { storageBucket } : {})
    });

    return admin;
}

/**
 * Obtiene instancia de Firestore
 */
function getDb() {
    const firebase = initFirebaseAdmin();
    return firebase.firestore();
}

module.exports = {
    admin,
    initFirebaseAdmin,
    getDb
};
