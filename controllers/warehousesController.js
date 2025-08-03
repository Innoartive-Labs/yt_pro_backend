const db = require('../utils/db');

exports.createWarehouse = (req, res) => {
    const { warehouse_name, warehouse_address, capacity, capacity_left } = req.body;
    db.query('INSERT INTO warehouses (warehouse_name, warehouse_address, capacity, capacity_left) VALUES (?, ?, ?, ?)', [warehouse_name, warehouse_address, capacity, capacity_left], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ id: result.insertId });
    });
};

exports.getAllWarehouses = (req, res) => {
    db.query('SELECT * FROM warehouses WHERE is_deleted = 0', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getWarehouseById = (req, res) => {
    db.query('SELECT * FROM warehouses WHERE id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Warehouse not found' });
        res.json(results[0]);
    });
};

exports.updateWarehouse = (req, res) => {
    const { warehouse_name, warehouse_address, capacity, capacity_left } = req.body;
    db.query('UPDATE warehouses SET warehouse_name=?, warehouse_address=?, capacity=?, capacity_left=? WHERE id=? AND is_deleted=0', [warehouse_name, warehouse_address, capacity, capacity_left, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Warehouse updated' });
    });
};

exports.deleteWarehouse = (req, res) => {
    db.query('UPDATE warehouses SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Warehouse deleted (soft)' });
    });
}; 