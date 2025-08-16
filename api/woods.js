const express = require('express');
const router = express.Router();
const woodsController = require('../controllers/woodsController');

router.post('/', woodsController.createWoods);
router.get('/', woodsController.getAllWoodss);
router.get('/:id', woodsController.getWoodsById);
router.put('/:id', woodsController.updateWoods);
router.delete('/:id', woodsController.deleteWoods);

module.exports = router;