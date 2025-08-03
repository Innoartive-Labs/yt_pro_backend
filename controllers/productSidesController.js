const db = require('../utils/db');

exports.createProductSide = (req, res) => {
    const { product_id, side_name, color_id, wood_id, finish_id } = req.body;
    db.query('INSERT INTO product_sides (product_id, side_name, color_id, wood_id, finish_id) VALUES (?, ?, ?, ?, ?)', [product_id, side_name, color_id, wood_id, finish_id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ id: result.insertId });
    });
};

exports.getAllProductSides = (req, res) => {
    db.query('SELECT * FROM product_sides WHERE is_deleted = 0', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getProductSideById = (req, res) => {
    db.query('SELECT * FROM product_sides WHERE id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Product side not found' });
        res.json(results[0]);
    });
};

exports.updateProductSide = (req, res) => {
    const { product_id, side_name, color_id, wood_id, finish_id } = req.body;
    db.query('UPDATE product_sides SET product_id=?, side_name=?, color_id=?, wood_id=?, finish_id=? WHERE id=? AND is_deleted=0', [product_id, side_name, color_id, wood_id, finish_id, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Product side updated' });
    });
};

exports.deleteProductSide = (req, res) => {
    db.query('UPDATE product_sides SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Product side deleted (soft)' });
    });
}; 