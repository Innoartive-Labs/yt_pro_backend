const db = require('../utils/db');

exports.createProductDimension = (req, res) => {
    const { product_id, thickness, width, length, height, unit } = req.body;
    db.query('INSERT INTO product_dimensions (product_id, thickness, width, length, height, unit) VALUES (?, ?, ?, ?, ?, ?)', [product_id, thickness, width, length, height, unit], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ id: result.insertId });
    });
};

exports.getAllProductDimensions = (req, res) => {
    db.query('SELECT * FROM product_dimensions WHERE is_deleted = 0', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getProductDimensionById = (req, res) => {
    db.query('SELECT * FROM product_dimensions WHERE id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Product dimension not found' });
        res.json(results[0]);
    });
};

exports.updateProductDimension = (req, res) => {
    const { thickness, width, length, height, unit } = req.body;
    db.query('UPDATE product_dimensions SET thickness=?, width=?, length=?, height=?, unit=? WHERE product_id=? AND is_deleted=0', [thickness, width, length, height, unit, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Product dimension updated' });
    });
};

exports.deleteProductDimension = (req, res) => {
    db.query('UPDATE product_dimensions SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Product dimension deleted (soft)' });
    });
}; 