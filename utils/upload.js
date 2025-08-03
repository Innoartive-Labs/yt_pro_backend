const multer = require('multer');
const path = require('path');
const fs = require('fs');

function getStorage(folder) {
    return multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadPath = path.join(__dirname, '../uploads', folder);
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
        },
        filename: function (req, file, cb) {
            const ext = path.extname(file.originalname);
            const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
            cb(null, uniqueName);
        }
    });
}

function getUploader(folder, fieldName) {
    if (Array.isArray(fieldName)) {
        // Multiple fields
        return multer({ storage: getStorage(folder) }).fields(fieldName.map(name => ({ name, maxCount: 1 })));
    } else {
        // Single field
        return multer({ storage: getStorage(folder) }).single(fieldName);
    }
}

module.exports = getUploader; 