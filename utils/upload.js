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
        // Multiple fields with multiple files per field
        const fieldsConfig = fieldName.map(name => ({ name, maxCount: 10 }));
        console.log('Configuring Multer with fields:', fieldsConfig);
        
        // Create a more robust configuration with better error handling
        const upload = multer({ 
            storage: getStorage(folder),
            fileFilter: (req, file, cb) => {
                console.log('Processing file for field:', file.fieldname);
                console.log('Expected fields:', fieldName);
                
                // Temporarily accept all files to debug
                console.log('Field accepted (temporary):', file.fieldname);
                cb(null, true);
                
                // Original strict checking (commented out for debugging)
                /*
                if (fieldName.includes(file.fieldname)) {
                    console.log('Field accepted:', file.fieldname);
                    cb(null, true);
                } else {
                    console.log('Field rejected:', file.fieldname);
                    cb(new Error(`Unexpected field: ${file.fieldname}. Expected: ${fieldName.join(', ')}`));
                }
                */
            }
        }).fields(fieldsConfig);
        
        // Wrap the upload middleware to provide better error handling
        return (req, res, next) => {
            upload(req, res, (err) => {
                if (err instanceof multer.MulterError) {
                    console.error('Multer error:', err);
                    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                        return res.status(400).json({
                            error: 'Unexpected field',
                            message: `Field '${err.field}' is not expected. Expected fields: ${fieldName.join(', ')}`,
                            expectedFields: fieldName,
                            receivedField: err.field
                        });
                    }
                    return res.status(400).json({
                        error: 'File upload error',
                        message: err.message,
                        code: err.code
                    });
                } else if (err) {
                    console.error('Other error:', err);
                    return res.status(400).json({
                        error: 'Upload error',
                        message: err.message
                    });
                }
                
                // Log what we received for debugging
                console.log('Upload successful - Body fields:', Object.keys(req.body));
                console.log('Upload successful - File fields:', req.files ? Object.keys(req.files) : 'No files');
                
                next();
            });
        };
    } else {
        // Single field
        return multer({ storage: getStorage(folder) }).single(fieldName);
    }
}

module.exports = getUploader; 