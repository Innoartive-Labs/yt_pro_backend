const express = require('express');
const router = express.Router();
const daily_counterController = require('../controllers/daily_counterController');

router.post('/', daily_counterController.createDaily_counter);
router.get('/', daily_counterController.getAllDaily_counters);
router.get('/:id', daily_counterController.getDaily_counterById);
router.put('/:id', daily_counterController.updateDaily_counter);
router.delete('/:id', daily_counterController.deleteDaily_counter);

module.exports = router;