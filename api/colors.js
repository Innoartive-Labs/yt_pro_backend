const express = require('express');
const router = express.Router();
const colorsController = require('../controllers/colorsController');

router.post('/', colorsController.createColors);
router.get('/', colorsController.getAllColorss);
router.get('/:id', colorsController.getColorsById);
router.put('/:id', colorsController.updateColors);
router.delete('/:id', colorsController.deleteColors);

module.exports = router;