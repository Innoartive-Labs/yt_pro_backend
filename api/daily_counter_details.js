const express = require('express');
const router = express.Router();
const daily_counter_detailsController = require('../controllers/daily_counter_detailsController');

router.post('/', daily_counter_detailsController.createDaily_counter_details);
router.get('/', daily_counter_detailsController.getAllDaily_counter_detailss);
router.get('/:id', daily_counter_detailsController.getDaily_counter_detailsById);
router.put('/:id', daily_counter_detailsController.updateDaily_counter_details);
router.delete('/:id', daily_counter_detailsController.deleteDaily_counter_details);

module.exports = router;