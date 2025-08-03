const db = require('../utils/db');

exports.createProductStock = (req, res) => {
    const { product_id, warehouse_id, quantity } = req.body;
    db.query('INSERT INTO product_stocks (product_id, warehouse_id, quantity) VALUES (?, ?, ?)', [product_id, warehouse_id, quantity], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ id: result.insertId });
    });
};

exports.getAllProductStocks = (req, res) => {
    db.query('SELECT * FROM product_stocks WHERE is_deleted = 0', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getProductStockById = (req, res) => {
    db.query('SELECT * FROM product_stocks WHERE id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Product stock not found' });
        res.json(results[0]);
    });
};

exports.updateProductStock = (req, res) => {
    const { product_id, warehouse_id, quantity } = req.body;
    db.query('UPDATE product_stocks SET product_id=?, warehouse_id=?, quantity=? WHERE id=? AND is_deleted=0', [product_id, warehouse_id, quantity, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Product stock updated' });
    });
};

exports.deleteProductStock = (req, res) => {
    db.query('UPDATE product_stocks SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Product stock deleted (soft)' });
    });
};

exports.getWarehouseStock = (req, res) => {
    const warehouseId = req.params.warehouse_id;
    db.query('SELECT * FROM product_stocks WHERE warehouse_id = ? AND is_deleted = 0', [warehouseId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.addProductToWarehouse = (req, res) => {
    const { product_id, warehouse_id, quantity } = req.body;
    // Check warehouse capacity
    db.query('SELECT capacity, capacity_left FROM warehouses WHERE id = ? AND is_deleted = 0', [warehouse_id], (err, warehouseResults) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (warehouseResults.length === 0) return res.status(404).json({ message: 'Warehouse not found' });
        const { capacity_left } = warehouseResults[0];
        if (quantity > capacity_left) {
            return res.status(400).json({ message: 'Warehouse does not have enough capacity left' });
        }
        // Add stock
        db.query('INSERT INTO product_stocks (product_id, warehouse_id, quantity) VALUES (?, ?, ?)', [product_id, warehouse_id, quantity], (err, result) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            // Update warehouse capacity_left
            db.query('UPDATE warehouses SET capacity_left = capacity_left - ? WHERE id = ?', [quantity, warehouse_id], (err2) => {
                if (err2) return res.status(500).json({ message: 'Stock added but failed to update warehouse capacity', error: err2 });
                res.status(201).json({ id: result.insertId, message: 'Product added to warehouse' });
            });
        });
    });
};

exports.moveProductBetweenWarehouses = (req, res) => {
    const { product_id, from_warehouse_id, to_warehouse_id, quantity } = req.body;
    // Check from_warehouse has enough stock
    db.query('SELECT quantity FROM product_stocks WHERE product_id = ? AND warehouse_id = ? AND is_deleted = 0', [product_id, from_warehouse_id], (err, fromResults) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (fromResults.length === 0 || fromResults[0].quantity < quantity) {
            return res.status(400).json({ message: 'Not enough stock in source warehouse' });
        }
        // Check to_warehouse has enough capacity
        db.query('SELECT capacity_left FROM warehouses WHERE id = ? AND is_deleted = 0', [to_warehouse_id], (err, toResults) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            if (toResults.length === 0) return res.status(404).json({ message: 'Destination warehouse not found' });
            if (toResults[0].capacity_left < quantity) {
                return res.status(400).json({ message: 'Destination warehouse does not have enough capacity left' });
            }
            // Deduct from source
            db.query('UPDATE product_stocks SET quantity = quantity - ? WHERE product_id = ? AND warehouse_id = ? AND is_deleted = 0', [quantity, product_id, from_warehouse_id], (err2) => {
                if (err2) return res.status(500).json({ message: 'Database error', error: err2 });
                // Add to destination
                db.query('INSERT INTO product_stocks (product_id, warehouse_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)', [product_id, to_warehouse_id, quantity], (err3) => {
                    if (err3) return res.status(500).json({ message: 'Database error', error: err3 });
                    // Update capacity_left for both warehouses
                    db.query('UPDATE warehouses SET capacity_left = capacity_left + ? WHERE id = ?', [quantity, from_warehouse_id], (err4) => {
                        if (err4) return res.status(500).json({ message: 'Error updating source warehouse capacity', error: err4 });
                        db.query('UPDATE warehouses SET capacity_left = capacity_left - ? WHERE id = ?', [quantity, to_warehouse_id], (err5) => {
                            if (err5) return res.status(500).json({ message: 'Error updating destination warehouse capacity', error: err5 });
                            res.json({ message: 'Product moved between warehouses' });
                        });
                    });
                });
            });
        });
    });
}; 