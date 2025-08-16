const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Create temporary storage for serverless environment
function getStorage(folder) {
    return multer.diskStorage({
        destination: function (req, file, cb) {
            // Use system temp directory for serverless
            const tempDir = path.join(os.tmpdir(), 'uploads', folder);
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            cb(null, tempDir);
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
        
        const upload = multer({ 
            storage: getStorage(folder),
            fileFilter: (req, file, cb) => {
                console.log('Processing file for field:', file.fieldname);
                console.log('Expected fields:', fieldName);
                
                // Accept all files for now
                console.log('Field accepted:', file.fieldname);
                cb(null, true);
            }
        }).fields(fieldsConfig);
        
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

// Clean up temporary files
const cleanupTempFiles = (files) => {
    if (!files) return;
    
    const fileArray = Array.isArray(files) ? files : [files];
    fileArray.forEach(file => {
        if (file && file.path && fs.existsSync(file.path)) {
            try {
                fs.unlinkSync(file.path);
                console.log('Cleaned up temp file:', file.path);
            } catch (error) {
                console.error('Error cleaning up temp file:', error);
            }
        }
    });
};

module.exports = { getUploader, cleanupTempFiles }; 