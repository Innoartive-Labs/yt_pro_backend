const express = require('express');
const router = express.Router();
const finishesController = require('../controllers/finishesController');

router.post('/', finishesController.createFinish);
router.get('/', finishesController.getAllFinishes);
router.get('/:id', finishesController.getFinishById);
router.put('/:id', finishesController.updateFinish);
router.delete('/:id', finishesController.deleteFinish);

module.exports = router; 