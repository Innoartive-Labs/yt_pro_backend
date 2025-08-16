const express = require('express');
const router = express.Router();
const unitsController = require('../controllers/unitsController');

router.post('/', unitsController.createUnits);
router.get('/', unitsController.getAllUnitss);
router.get('/:id', unitsController.getUnitsById);
router.put('/:id', unitsController.updateUnits);
router.delete('/:id', unitsController.deleteUnits);

module.exports = router;