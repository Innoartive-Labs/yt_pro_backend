const express = require('express');
const router = express.Router();
const expense_typesController = require('../controllers/expense_typesController');

router.post('/', expense_typesController.createExpense_types);
router.get('/', expense_typesController.getAllExpense_typess);
router.get('/:id', expense_typesController.getExpense_typesById);
router.put('/:id', expense_typesController.updateExpense_types);
router.delete('/:id', expense_typesController.deleteExpense_types);

module.exports = router;