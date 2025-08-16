const express = require('express');
const router = express.Router();
const cut_piecesController = require('../controllers/cut_piecesController');

router.post('/', cut_piecesController.createCut_pieces);
router.get('/', cut_piecesController.getAllCut_piecess);
router.get('/:id', cut_piecesController.getCut_piecesById);
router.put('/:id', cut_piecesController.updateCut_pieces);
router.delete('/:id', cut_piecesController.deleteCut_pieces);

module.exports = router;