const express = require('express');
const router = express.Router();
const expensesController = require('../controllers/expensesController');

router.post('/', expensesController.createExpenses);
router.get('/', expensesController.getAllExpensess);
router.get('/:id', expensesController.getExpensesById);
router.put('/:id', expensesController.updateExpenses);
router.delete('/:id', expensesController.deleteExpenses);

module.exports = router;