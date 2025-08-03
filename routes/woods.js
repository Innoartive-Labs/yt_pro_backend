const express = require('express');
const router = express.Router();
const woodsController = require('../controllers/woodsController');

router.post('/', woodsController.createWood);
router.get('/', woodsController.getAllWoods);
router.get('/:id', woodsController.getWoodById);
router.put('/:id', woodsController.updateWood);
router.delete('/:id', woodsController.deleteWood);

module.exports = router; 