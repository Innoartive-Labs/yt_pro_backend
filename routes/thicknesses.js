const express = require('express');
const router = express.Router();
const thicknessesController = require('../controllers/thicknessesController');

router.post('/', thicknessesController.createThickness);
router.get('/', thicknessesController.getAllThicknesses);
router.get('/:id', thicknessesController.getThicknessById);
router.put('/:id', thicknessesController.updateThickness);
router.delete('/:id', thicknessesController.deleteThickness);

module.exports = router; 