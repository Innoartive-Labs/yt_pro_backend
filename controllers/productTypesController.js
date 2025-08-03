const db = require('../utils/db');

exports.createProductType = (req, res) => {
    const { type_name } = req.body;
    db.query('INSERT INTO product_types (type_name) VALUES (?)', [type_name], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ id: result.insertId });
    });
};

exports.getAllProductTypes = (req, res) => {
    db.query('SELECT * FROM product_types WHERE is_deleted = 0', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getProductTypeById = (req, res) => {
    db.query('SELECT * FROM product_types WHERE id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Product type not found' });
        res.json(results[0]);
    });
};

exports.updateProductType = (req, res) => {
    const { type_name } = req.body;
    db.query('UPDATE product_types SET type_name=? WHERE id=? AND is_deleted=0', [type_name, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Product type updated' });
    });
};

exports.deleteProductType = (req, res) => {
    db.query('UPDATE product_types SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Product type deleted (soft)' });
    });
}; 