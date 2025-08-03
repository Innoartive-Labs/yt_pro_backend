const db = require('../utils/db');

exports.createSupplier = (req, res) => {
    const { supplier_name, supplier_phone, supplier_phone_2, supplier_phone_3, supplier_phone_4, supplier_address, supplier_cnic, supplier_email, opening_balance, payment_terms } = req.body;
    let supplier_image = req.file ? req.file.filename : null;
    db.query('INSERT INTO suppliers (supplier_name, supplier_phone, supplier_phone_2, supplier_phone_3, supplier_phone_4, supplier_address, supplier_cnic, supplier_email, supplier_image, opening_balance, payment_terms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [supplier_name, supplier_phone, supplier_phone_2, supplier_phone_3, supplier_phone_4, supplier_address, supplier_cnic, supplier_email, supplier_image, opening_balance, payment_terms], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ id: result.insertId });
    });
};

exports.getAllSuppliers = (req, res) => {
    db.query('SELECT * FROM suppliers WHERE is_deleted = 0', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getSupplierById = (req, res) => {
    db.query('SELECT * FROM suppliers WHERE id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Supplier not found' });
        res.json(results[0]);
    });
};

exports.updateSupplier = (req, res) => {
    const { supplier_name, supplier_phone, supplier_phone_2, supplier_phone_3, supplier_phone_4, supplier_address, supplier_cnic, supplier_email, opening_balance, payment_terms } = req.body;
    let supplier_image = req.file ? req.file.filename : req.body.supplier_image;
    db.query('UPDATE suppliers SET supplier_name=?, supplier_phone=?, supplier_phone_2=?, supplier_phone_3=?, supplier_phone_4=?, supplier_address=?, supplier_cnic=?, supplier_email=?, supplier_image=?, opening_balance=?, payment_terms=? WHERE id=? AND is_deleted=0', [supplier_name, supplier_phone, supplier_phone_2, supplier_phone_3, supplier_phone_4, supplier_address, supplier_cnic, supplier_email, supplier_image, opening_balance, payment_terms, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Supplier updated' });
    });
};

exports.deleteSupplier = (req, res) => {
    db.query('UPDATE suppliers SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Supplier deleted (soft)' });
    });
}; 