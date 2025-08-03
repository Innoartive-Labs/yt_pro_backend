const express = require('express');
const router = express.Router();
const colorsController = require('../controllers/colorsController');

router.post('/', colorsController.createColor);
router.get('/', colorsController.getAllColors);
router.get('/:id', colorsController.getColorById);
router.put('/:id', colorsController.updateColor);
router.delete('/:id', colorsController.deleteColor);

module.exports = router; 