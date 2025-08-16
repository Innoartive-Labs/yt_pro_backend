const express = require('express');
const router = express.Router();
const chequesController = require('../controllers/chequesController');

router.post('/', chequesController.createCheques);
router.get('/', chequesController.getAllChequess);
router.get('/:id', chequesController.getChequesById);
router.put('/:id', chequesController.updateCheques);
router.delete('/:id', chequesController.deleteCheques);

module.exports = router;