const express = require('express');
const router = express.Router();
const thicknessesController = require('../controllers/thicknessesController');

router.post('/', thicknessesController.createThicknesses);
router.get('/', thicknessesController.getAllThicknessess);
router.get('/:id', thicknessesController.getThicknessesById);
router.put('/:id', thicknessesController.updateThicknesses);
router.delete('/:id', thicknessesController.deleteThicknesses);

module.exports = router;