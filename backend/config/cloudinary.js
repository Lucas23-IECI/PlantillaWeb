const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadImage(file, options = {}) {
    const defaultOptions = {
        folder: 'productos',
        transformation: [
            { width: 800, height: 800, crop: 'limit' },
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

async function deleteImage(publicId) {
    return cloudinary.uploader.destroy(publicId);
}

module.exports = {
    cloudinary,
    uploadImage,
    deleteImage
};
