const express = require('express');
const router = express.Router();
const finishesController = require('../controllers/finishesController');

router.post('/', finishesController.createFinishes);
router.get('/', finishesController.getAllFinishess);
router.get('/:id', finishesController.getFinishesById);
router.put('/:id', finishesController.updateFinishes);
router.delete('/:id', finishesController.deleteFinishes);

module.exports = router;