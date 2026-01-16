const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Carpetas predefinidas para organización
const FOLDERS = {
    PRODUCTOS: 'productos',
    BANNERS: 'banners',
    CATEGORIAS: 'categorias',
    GENERAL: 'general'
};

/**
 * Subir imagen a Cloudinary
 */
async function uploadImage(file, options = {}) {
    const defaultOptions = {
        folder: FOLDERS.PRODUCTOS,
        transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
        ]
    };

    return new Promise((resolve, reject) => {
        const uploadOptions = { ...defaultOptions, ...options };

        if (Buffer.isBuffer(file)) {
            cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }).end(file);
        } else {
            cloudinary.uploader.upload(file, uploadOptions, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
        }
    });
}

/**
 * Eliminar imagen de Cloudinary
 */
async function deleteImage(publicId) {
    return cloudinary.uploader.destroy(publicId);
}

/**
 * Listar imágenes con filtros opcionales
 * @param {Object} options - Opciones de filtrado
 * @param {string} options.folder - Carpeta a filtrar
 * @param {number} options.maxResults - Máximo de resultados (default 30)
 * @param {string} options.nextCursor - Cursor para paginación
 */
async function listImages(options = {}) {
    const { folder, maxResults = 30, nextCursor } = options;

    const searchOptions = {
        type: 'upload',
        max_results: maxResults,
        resource_type: 'image'
    };

    if (nextCursor) {
        searchOptions.next_cursor = nextCursor;
    }

    // Si hay carpeta, usar search con expression
    if (folder) {
        const expression = `folder:${folder}/*`;
        const result = await cloudinary.search
            .expression(expression)
            .sort_by('created_at', 'desc')
            .max_results(maxResults)
            .next_cursor(nextCursor || undefined)
            .execute();

        return {
            images: result.resources.map(formatImageResource),
            nextCursor: result.next_cursor || null,
            totalCount: result.total_count
        };
    }

    // Sin carpeta, listar todas
    const result = await cloudinary.api.resources(searchOptions);

    return {
        images: result.resources.map(formatImageResource),
        nextCursor: result.next_cursor || null,
        totalCount: result.resources.length
    };
}

/**
 * Buscar imágenes por nombre o tag
 */
async function searchImages(query, options = {}) {
    const { maxResults = 30, folder } = options;

    let expression = `filename:*${query}* OR tags:${query}`;
    if (folder) {
        expression = `folder:${folder}/* AND (${expression})`;
    }

    const result = await cloudinary.search
        .expression(expression)
        .sort_by('created_at', 'desc')
        .max_results(maxResults)
        .execute();

    return {
        images: result.resources.map(formatImageResource),
        totalCount: result.total_count
    };
}

/**
 * Obtener carpetas disponibles
 */
async function getFolders() {
    try {
        const result = await cloudinary.api.root_folders();
        const existingFolders = result.folders.map(f => f.name);

        // Combinar con carpetas predefinidas
        const allFolders = [...new Set([...Object.values(FOLDERS), ...existingFolders])];

        return allFolders.map(name => ({
            name,
            path: name,
            isPredefined: Object.values(FOLDERS).includes(name)
        }));
    } catch (error) {
        // Si falla, devolver solo las predefinidas
        return Object.values(FOLDERS).map(name => ({
            name,
            path: name,
            isPredefined: true
        }));
    }
}

/**
 * Crear una nueva carpeta
 */
async function createFolder(folderName) {
    return cloudinary.api.create_folder(folderName);
}

/**
 * Obtener detalles de una imagen específica
 */
async function getImageDetails(publicId) {
    const result = await cloudinary.api.resource(publicId, {
        image_metadata: true,
        colors: true
    });

    return formatImageResource(result);
}

/**
 * Generar URL con transformaciones
 * @param {string} publicId - ID público de la imagen
 * @param {Object} transformations - Transformaciones a aplicar
 */
function generateTransformUrl(publicId, transformations = {}) {
    const {
        width,
        height,
        crop = 'fill',
        quality = 'auto',
        format = 'auto',
        gravity = 'auto'
    } = transformations;

    const options = {
        quality,
        fetch_format: format,
        secure: true
    };

    if (width) options.width = width;
    if (height) options.height = height;
    if (width || height) {
        options.crop = crop;
        options.gravity = gravity;
    }

    return cloudinary.url(publicId, options);
}

/**
 * Generar múltiples variantes de una imagen
 */
function generateImageVariants(publicId) {
    return {
        thumbnail: generateTransformUrl(publicId, { width: 150, height: 150, crop: 'fill' }),
        small: generateTransformUrl(publicId, { width: 300, height: 300, crop: 'limit' }),
        medium: generateTransformUrl(publicId, { width: 600, height: 600, crop: 'limit' }),
        large: generateTransformUrl(publicId, { width: 1200, height: 1200, crop: 'limit' }),
        original: generateTransformUrl(publicId, {})
    };
}

/**
 * Formatear recurso de imagen para respuesta consistente
 */
function formatImageResource(resource) {
    return {
        publicId: resource.public_id,
        url: resource.secure_url,
        width: resource.width,
        height: resource.height,
        format: resource.format,
        bytes: resource.bytes,
        folder: resource.folder || extractFolder(resource.public_id),
        filename: extractFilename(resource.public_id),
        createdAt: resource.created_at,
        variants: generateImageVariants(resource.public_id)
    };
}

/**
 * Extraer nombre de carpeta del public_id
 */
function extractFolder(publicId) {
    const parts = publicId.split('/');
    return parts.length > 1 ? parts.slice(0, -1).join('/') : '';
}

/**
 * Extraer nombre de archivo del public_id
 */
function extractFilename(publicId) {
    const parts = publicId.split('/');
    return parts[parts.length - 1];
}

/**
 * Renombrar/mover imagen a otra carpeta
 */
async function moveImage(publicId, newFolder) {
    const filename = extractFilename(publicId);
    const newPublicId = `${newFolder}/${filename}`;

    const result = await cloudinary.uploader.rename(publicId, newPublicId);
    return formatImageResource(result);
}

/**
 * Añadir tags a una imagen
 */
async function addTags(publicId, tags) {
    return cloudinary.uploader.add_tag(tags, [publicId]);
}

/**
 * Eliminar tags de una imagen
 */
async function removeTags(publicId, tags) {
    return cloudinary.uploader.remove_tag(tags, [publicId]);
}

module.exports = {
    cloudinary,
    FOLDERS,
    uploadImage,
    deleteImage,
    listImages,
    searchImages,
    getFolders,
    createFolder,
    getImageDetails,
    generateTransformUrl,
    generateImageVariants,
    moveImage,
    addTags,
    removeTags
};
