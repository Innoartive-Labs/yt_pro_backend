const express = require('express');
const router = express.Router();
const expenseTypesController = require('../controllers/expenseTypesController');

router.post('/', expenseTypesController.createExpenseType);
router.get('/', expenseTypesController.getAllExpenseTypes);
router.get('/:id', expenseTypesController.getExpenseTypeById);
router.put('/:id', expenseTypesController.updateExpenseType);
router.delete('/:id', expenseTypesController.deleteExpenseType);

module.exports = router; 