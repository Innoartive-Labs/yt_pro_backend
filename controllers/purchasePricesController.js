const db = require('../utils/db');

exports.createPurchasePrice = (req, res) => {
    const { product_id, supplier_id, price } = req.body;
    const created_by = req.user.id;
    
    db.query('INSERT INTO purchase_prices (product_id, supplier_id, price, created_by) VALUES (?, ?, ?, ?)', 
        [product_id, supplier_id, price, created_by], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ id: result.insertId });  
    });
};

exports.getAllPurchasePrices = (req, res) => {
    db.query(`
        SELECT pp.*, p.product_name, s.supplier_name 
        FROM purchase_prices pp 
        LEFT JOIN products p ON pp.product_id = p.id 
        LEFT JOIN suppliers s ON pp.supplier_id = s.id 
        WHERE pp.is_deleted = 0
    `, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getPurchasePriceById = (req, res) => {
    db.query(`
        SELECT pp.*, p.product_name, s.supplier_name 
        FROM purchase_prices pp 
        LEFT JOIN products p ON pp.product_id = p.id 
        LEFT JOIN suppliers s ON pp.supplier_id = s.id 
        WHERE pp.id = ? AND pp.is_deleted = 0
    `, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Purchase price not found' });
        res.json(results[0]);
    });
};

exports.getPurchasePricesByProduct = (req, res) => {
    db.query(`
        SELECT pp.*, p.product_name, s.supplier_name 
        FROM purchase_prices pp 
        LEFT JOIN products p ON pp.product_id = p.id 
        LEFT JOIN suppliers s ON pp.supplier_id = s.id 
        WHERE pp.product_id = ? AND pp.is_deleted = 0
    `, [req.params.productId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getPurchasePricesBySupplier = (req, res) => {
    db.query(`
        SELECT pp.*, p.product_name, s.supplier_name 
        FROM purchase_prices pp 
        LEFT JOIN products p ON pp.product_id = p.id 
        LEFT JOIN suppliers s ON pp.supplier_id = s.id 
        WHERE pp.supplier_id = ? AND pp.is_deleted = 0
    `, [req.params.supplierId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.updatePurchasePrice = (req, res) => {
    const { product_id, supplier_id, price } = req.body;
    db.query('UPDATE purchase_prices SET product_id=?, supplier_id=?, price=? WHERE id=? AND is_deleted=0', 
        [product_id, supplier_id, price, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Purchase price not found' });
        res.json({ message: 'Purchase price updated' });
    });
};

exports.deletePurchasePrice = (req, res) => {
    db.query('UPDATE purchase_prices SET is_deleted = 1 WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Purchase price not found' });
        res.json({ message: 'Purchase price deleted' });
    });
};
