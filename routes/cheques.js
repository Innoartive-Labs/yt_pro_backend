const express = require('express');
const router = express.Router();
const chequesController = require('../controllers/chequesController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// Create cheque
router.post('/', chequesController.createCheque);

// Get all cheques (with optional company filter)
router.get('/', chequesController.getAllCheques);

// Get cheque by ID
router.get('/:id', chequesController.getChequeById);

// Update cheque
router.put('/:id', chequesController.updateCheque);

// Delete cheque (soft delete)
router.delete('/:id', chequesController.deleteCheque);

// Get cheques by company
router.get('/company/:companyId', chequesController.getChequesByCompany);

// Get cheques by status
router.get('/status/filter', chequesController.getChequesByStatus);

module.exports = router; 