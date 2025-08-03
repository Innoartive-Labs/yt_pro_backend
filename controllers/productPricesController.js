const db = require('../utils/db');

exports.createProductPrice = (req, res) => {
    const { product_id, purchase_price, selling_price, expected_selling_price } = req.body;
    db.query('INSERT INTO product_prices (product_id, purchase_price, selling_price, expected_selling_price) VALUES (?, ?, ?, ?)', [product_id, purchase_price, selling_price, expected_selling_price], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ id: result.insertId });  
    });
};

exports.getAllProductPrices = (req, res) => {
    db.query('SELECT * FROM product_prices WHERE is_deleted = 0', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getProductPriceById = (req, res) => {
    db.query('SELECT * FROM product_prices WHERE id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Product price not found' });
        res.json(results[0]);
    });
};

exports.updateProductPrice = (req, res) => {
    const { product_id, purchase_price, selling_price, expected_selling_price } = req.body;
    db.query('UPDATE product_prices SET product_id=?, purchase_price=?, selling_price=?, expected_selling_price=? WHERE id=? AND is_deleted=0', [product_id, purchase_price, selling_price, expected_selling_price, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Product price updated' });
    });
};

exports.deleteProductPrice = (req, res) => {
    db.query('UPDATE product_prices SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Product price deleted (soft)' });
    });
}; 