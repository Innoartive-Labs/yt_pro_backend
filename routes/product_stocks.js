const express = require('express');
const router = express.Router();
const productStocksController = require('../controllers/productStocksController');

router.post('/', productStocksController.createProductStock);
router.get('/', productStocksController.getAllProductStocks);
router.get('/:id', productStocksController.getProductStockById);
router.put('/:id', productStocksController.updateProductStock);
router.delete('/:id', productStocksController.deleteProductStock);
router.get('/warehouse/:warehouse_id', productStocksController.getWarehouseStock);
router.post('/add-to-warehouse', productStocksController.addProductToWarehouse);
router.post('/move-between-warehouses', productStocksController.moveProductBetweenWarehouses);

module.exports = router; 