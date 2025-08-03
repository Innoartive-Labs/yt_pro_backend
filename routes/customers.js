const express = require('express');
const router = express.Router();
const customersController = require('../controllers/customersController');
const getUploader = require('../utils/upload');

const upload = getUploader('customers', 'customer_image');

router.post('/', upload, customersController.createCustomer);
router.get('/', customersController.getAllCustomers);
router.get('/:id', customersController.getCustomerById);
router.put('/:id', upload, customersController.updateCustomer);
router.delete('/:id', customersController.deleteCustomer);

module.exports = router; 