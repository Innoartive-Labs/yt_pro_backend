const fs = require('fs');
const path = require('path');

// List of routes that need Cloudinary integration
const routesWithImages = [
    'products', 'customers', 'suppliers', 'vehicles', 
    'received_products', 'received_purchases', 'returned_products'
];

// List of simple routes (no image upload)
const simpleRoutes = [
    'users', 'roles', 'my_companies', 'accessible_modules', 'user_companies',
    'companies', 'categories', 'finishes', 'woods', 'thicknesses', 'units',
    'colors', 'warehouses', 'product_types', 'product_dimensions', 'product_stocks',
    'product_prices', 'purchase_prices', 'product_sides', 'drivers', 'payment_terms',
    'banks', 'bank_accounts', 'expense_types', 'expenses', 'purchase_orders',
    'sales_orders', 'sales_invoices', 'sales_warehouse_movements', 'cut_pieces',
    'daily_counter', 'daily_counter_details', 'payment_in', 'payment_out', 'cheques'
];

// Create API directory if it doesn't exist
const apiDir = path.join(__dirname, '../api');
if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
}

// Function to create simple route file
function createSimpleRoute(routeName) {
    const content = `const express = require('express');
const router = express.Router();
const ${routeName}Controller = require('../controllers/${routeName}Controller');

router.post('/', ${routeName}Controller.create${routeName.charAt(0).toUpperCase() + routeName.slice(1)});
router.get('/', ${routeName}Controller.getAll${routeName.charAt(0).toUpperCase() + routeName.slice(1)}s);
router.get('/:id', ${routeName}Controller.get${routeName.charAt(0).toUpperCase() + routeName.slice(1)}ById);
router.put('/:id', ${routeName}Controller.update${routeName.charAt(0).toUpperCase() + routeName.slice(1)});
router.delete('/:id', ${routeName}Controller.delete${routeName.charAt(0).toUpperCase() + routeName.slice(1)});

module.exports = router;`;

    const filePath = path.join(apiDir, `${routeName}.js`);
    fs.writeFileSync(filePath, content);
    console.log(`Created: ${filePath}`);
}

// Function to create route file with Cloudinary integration
function createCloudinaryRoute(routeName) {
    const fieldName = routeName === 'products' ? 'product_image' : 
                     routeName === 'customers' ? 'customer_image' :
                     routeName === 'suppliers' ? 'supplier_image' :
                     routeName === 'vehicles' ? 'vehicle_image' :
                     routeName === 'received_products' ? 'received_product_image' :
                     routeName === 'received_purchases' ? 'received_purchase_image' :
                     routeName === 'returned_products' ? 'returned_product_image' : 'image';

    const content = `const express = require('express');
const router = express.Router();
const ${routeName}Controller = require('../controllers/${routeName}Controller');
const { getUploader, cleanupTempFiles } = require('../utils/upload');
const { uploadImage, deleteImage } = require('../utils/cloudinary');

const upload = getUploader('${routeName}', '${fieldName}');

// Create ${routeName} with Cloudinary upload
router.post('/', upload, async (req, res) => {
    try {
        // Upload image to Cloudinary if provided
        if (req.file) {
            const uploadResult = await uploadImage(req.file, '${routeName}');
            if (uploadResult.success) {
                req.body.${fieldName} = uploadResult.url;
                req.body.cloudinary_public_id = uploadResult.public_id;
            } else {
                return res.status(400).json({ error: 'Image upload failed', details: uploadResult.error });
            }
        }
        
        const result = await ${routeName}Controller.create${routeName.charAt(0).toUpperCase() + routeName.slice(1)}(req, res);
        
        // Clean up temp files
        if (req.file) {
            cleanupTempFiles(req.file);
        }
        
        return result;
    } catch (error) {
        // Clean up temp files on error
        if (req.file) {
            cleanupTempFiles(req.file);
        }
        throw error;
    }
});

// Get all ${routeName}s
router.get('/', ${routeName}Controller.getAll${routeName.charAt(0).toUpperCase() + routeName.slice(1)}s);

// Get ${routeName} by ID
router.get('/:id', ${routeName}Controller.get${routeName.charAt(0).toUpperCase() + routeName.slice(1)}ById);

// Update ${routeName} with Cloudinary upload
router.put('/:id', upload, async (req, res) => {
    try {
        // Get existing ${routeName} to check for old image
        const existing${routeName.charAt(0).toUpperCase() + routeName.slice(1)} = await ${routeName}Controller.get${routeName.charAt(0).toUpperCase() + routeName.slice(1)}ById(req, res, true);
        
        // Upload new image to Cloudinary if provided
        if (req.file) {
            const uploadResult = await uploadImage(req.file, '${routeName}');
            if (uploadResult.success) {
                req.body.${fieldName} = uploadResult.url;
                req.body.cloudinary_public_id = uploadResult.public_id;
                
                // Delete old image from Cloudinary if exists
                if (existing${routeName.charAt(0).toUpperCase() + routeName.slice(1)} && existing${routeName.charAt(0).toUpperCase() + routeName.slice(1)}.cloudinary_public_id) {
                    await deleteImage(existing${routeName.charAt(0).toUpperCase() + routeName.slice(1)}.cloudinary_public_id);
                }
            } else {
                return res.status(400).json({ error: 'Image upload failed', details: uploadResult.error });
            }
        }
        
        const result = await ${routeName}Controller.update${routeName.charAt(0).toUpperCase() + routeName.slice(1)}(req, res);
        
        // Clean up temp files
        if (req.file) {
            cleanupTempFiles(req.file);
        }
        
        return result;
    } catch (error) {
        // Clean up temp files on error
        if (req.file) {
            cleanupTempFiles(req.file);
        }
        throw error;
    }
});

// Delete ${routeName} with Cloudinary cleanup
router.delete('/:id', async (req, res) => {
    try {
        // Get ${routeName} to check for image
        const ${routeName} = await ${routeName}Controller.get${routeName.charAt(0).toUpperCase() + routeName.slice(1)}ById(req, res, true);
        
        // Delete image from Cloudinary if exists
        if (${routeName} && ${routeName}.cloudinary_public_id) {
            await deleteImage(${routeName}.cloudinary_public_id);
        }
        
        return await ${routeName}Controller.delete${routeName.charAt(0).toUpperCase() + routeName.slice(1)}(req, res);
    } catch (error) {
        throw error;
    }
});

module.exports = router;`;

    const filePath = path.join(apiDir, `${routeName}.js`);
    fs.writeFileSync(filePath, content);
    console.log(`Created: ${filePath}`);
}

// Create all route files
console.log('Creating serverless route files...');

// Create simple routes
simpleRoutes.forEach(route => {
    createSimpleRoute(route);
});

// Create routes with Cloudinary integration
routesWithImages.forEach(route => {
    createCloudinaryRoute(route);
});

console.log('All serverless route files created successfully!');
