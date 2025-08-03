const express = require('express');
const router = express.Router();
const suppliersController = require('../controllers/suppliersController');
const getUploader = require('../utils/upload');

const upload = getUploader('suppliers', 'supplier_image');

router.post('/', upload, suppliersController.createSupplier);
router.get('/', suppliersController.getAllSuppliers);
router.get('/:id', suppliersController.getSupplierById);
router.put('/:id', upload, suppliersController.updateSupplier);
router.delete('/:id', suppliersController.deleteSupplier);

module.exports = router; 