const {
    uploadImage,
    deleteImage,
    listImages,
    searchImages,
    getFolders,
    createFolder,
    getImageDetails,
    generateTransformUrl,
    moveImage,
    addTags,
    removeTags,
    FOLDERS
} = require('../config/cloudinary');

/**
 * Listar imágenes con filtros y paginación
 * GET /api/admin/images
 * Query params: folder, limit, cursor, search
 */
async function getImages(req, res) {
    try {
        const { folder, limit = 30, cursor, search } = req.query;

        let result;

        if (search) {
            result = await searchImages(search, {
                maxResults: parseInt(limit),
                folder
            });
        } else {
            result = await listImages({
                folder,
                maxResults: parseInt(limit),
                nextCursor: cursor
            });
        }

        res.json({
            success: true,
            data: result.images,
            pagination: {
                nextCursor: result.nextCursor,
                totalCount: result.totalCount,
                hasMore: !!result.nextCursor
            }
        });
    } catch (error) {
        console.error('Error en getImages:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener imágenes',
            details: error.message
        });
    }
}

/**
 * Obtener detalles de una imagen específica
 * GET /api/admin/images/:publicId
 */
async function getImage(req, res) {
    try {
        const { publicId } = req.params;
        // El publicId puede contener "/" así que viene codificado
        const decodedId = decodeURIComponent(publicId);

        const image = await getImageDetails(decodedId);

        res.json({
            success: true,
            data: image
        });
    } catch (error) {
        console.error('Error en getImage:', error);
        res.status(404).json({
            success: false,
            error: 'Imagen no encontrada'
        });
    }
}

/**
 * Subir una o múltiples imágenes
 * POST /api/admin/images/upload
 * Body: folder (opcional)
 * Files: image o images (array)
 */
async function uploadImages(req, res) {
    try {
        const files = req.files || (req.file ? [req.file] : []);

        if (!files.length) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionaron imágenes'
            });
        }

        const folder = req.body.folder || FOLDERS.PRODUCTOS;
        const tags = req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : [];

        const uploadPromises = files.map(file =>
            uploadImage(file.buffer, {
                folder,
                tags,
                resource_type: 'image'
            })
        );

        const results = await Promise.all(uploadPromises);

        const uploadedImages = results.map(result => ({
            publicId: result.public_id,
            url: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
            folder
        }));

        res.json({
            success: true,
            data: uploadedImages,
            message: `${uploadedImages.length} imagen(es) subida(s) exitosamente`
        });
    } catch (error) {
        console.error('Error en uploadImages:', error);
        res.status(500).json({
            success: false,
            error: 'Error al subir imágenes',
            details: error.message
        });
    }
}

/**
 * Eliminar una imagen
 * DELETE /api/admin/images/:publicId
 */
async function removeImage(req, res) {
    try {
        const { publicId } = req.params;
        const decodedId = decodeURIComponent(publicId);

        const result = await deleteImage(decodedId);

        if (result.result === 'ok') {
            res.json({
                success: true,
                message: 'Imagen eliminada exitosamente'
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'No se pudo eliminar la imagen',
                details: result
            });
        }
    } catch (error) {
        console.error('Error en removeImage:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar imagen',
            details: error.message
        });
    }
}

/**
 * Eliminar múltiples imágenes
 * POST /api/admin/images/bulk-delete
 * Body: { publicIds: string[] }
 */
async function bulkDeleteImages(req, res) {
    try {
        const { publicIds } = req.body;

        if (!Array.isArray(publicIds) || !publicIds.length) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere un array de publicIds'
            });
        }

        const deletePromises = publicIds.map(id => deleteImage(id));
        const results = await Promise.all(deletePromises);

        const deleted = results.filter(r => r.result === 'ok').length;
        const failed = results.length - deleted;

        res.json({
            success: true,
            message: `${deleted} imagen(es) eliminada(s)${failed > 0 ? `, ${failed} fallaron` : ''}`,
            details: { deleted, failed }
        });
    } catch (error) {
        console.error('Error en bulkDeleteImages:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar imágenes',
            details: error.message
        });
    }
}

/**
 * Obtener lista de carpetas
 * GET /api/admin/images/folders
 */
async function listFolders(req, res) {
    try {
        const folders = await getFolders();

        res.json({
            success: true,
            data: folders
        });
    } catch (error) {
        console.error('Error en listFolders:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener carpetas',
            details: error.message
        });
    }
}

/**
 * Crear una nueva carpeta
 * POST /api/admin/images/folders
 * Body: { name: string }
 */
async function addFolder(req, res) {
    try {
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                error: 'El nombre de la carpeta es requerido'
            });
        }

        // Sanitizar nombre de carpeta
        const sanitizedName = name.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');

        await createFolder(sanitizedName);

        res.json({
            success: true,
            data: { name: sanitizedName, path: sanitizedName },
            message: 'Carpeta creada exitosamente'
        });
    } catch (error) {
        console.error('Error en addFolder:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear carpeta',
            details: error.message
        });
    }
}

/**
 * Mover imagen a otra carpeta
 * POST /api/admin/images/:publicId/move
 * Body: { folder: string }
 */
async function moveImageToFolder(req, res) {
    try {
        const { publicId } = req.params;
        const { folder } = req.body;
        const decodedId = decodeURIComponent(publicId);

        if (!folder) {
            return res.status(400).json({
                success: false,
                error: 'La carpeta destino es requerida'
            });
        }

        const result = await moveImage(decodedId, folder);

        res.json({
            success: true,
            data: result,
            message: 'Imagen movida exitosamente'
        });
    } catch (error) {
        console.error('Error en moveImageToFolder:', error);
        res.status(500).json({
            success: false,
            error: 'Error al mover imagen',
            details: error.message
        });
    }
}

/**
 * Generar URL con transformaciones
 * POST /api/admin/images/transform
 * Body: { publicId, width, height, crop, quality, format }
 */
async function transformImage(req, res) {
    try {
        const { publicId, width, height, crop, quality, format, gravity } = req.body;

        if (!publicId) {
            return res.status(400).json({
                success: false,
                error: 'El publicId es requerido'
            });
        }

        const url = generateTransformUrl(publicId, {
            width: width ? parseInt(width) : undefined,
            height: height ? parseInt(height) : undefined,
            crop,
            quality,
            format,
            gravity
        });

        res.json({
            success: true,
            data: { url, publicId }
        });
    } catch (error) {
        console.error('Error en transformImage:', error);
        res.status(500).json({
            success: false,
            error: 'Error al generar transformación',
            details: error.message
        });
    }
}

/**
 * Actualizar tags de una imagen
 * PATCH /api/admin/images/:publicId/tags
 * Body: { add: string[], remove: string[] }
 */
async function updateImageTags(req, res) {
    try {
        const { publicId } = req.params;
        const { add = [], remove = [] } = req.body;
        const decodedId = decodeURIComponent(publicId);

        if (remove.length) {
            await removeTags(decodedId, remove);
        }

        if (add.length) {
            await addTags(decodedId, add);
        }

        res.json({
            success: true,
            message: 'Tags actualizados exitosamente'
        });
    } catch (error) {
        console.error('Error en updateImageTags:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar tags',
            details: error.message
        });
    }
}

/**
 * Obtener carpetas predefinidas
 * GET /api/admin/images/predefined-folders
 */
function getPredefinedFolders(req, res) {
    res.json({
        success: true,
        data: Object.entries(FOLDERS).map(([key, value]) => ({
            key,
            name: value,
            label: value.charAt(0).toUpperCase() + value.slice(1)
        }))
    });
}

module.exports = {
    getImages,
    getImage,
    uploadImages,
    removeImage,
    bulkDeleteImages,
    listFolders,
    addFolder,
    moveImageToFolder,
    transformImage,
    updateImageTags,
    getPredefinedFolders
};
