const db = require('../utils/db');

exports.createCustomer = (req, res) => {
    const { customer_name, customer_phone, customer_phone_2, customer_phone_3, customer_phone_4, customer_address, customer_cnic, customer_email, opening_balance, payment_terms } = req.body;
    let customer_image = req.file ? req.file.filename : null;
    db.query('INSERT INTO customers (customer_name, customer_phone, customer_phone_2, customer_phone_3, customer_phone_4, customer_address, customer_cnic, customer_email, customer_image, opening_balance, payment_terms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [customer_name, customer_phone, customer_phone_2, customer_phone_3, customer_phone_4, customer_address, customer_cnic, customer_email, customer_image, opening_balance, payment_terms], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ id: result.insertId });
    });
};

exports.getAllCustomers = (req, res) => {
    db.query('SELECT * FROM customers WHERE is_deleted = 0', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getCustomerById = (req, res) => {
    db.query('SELECT * FROM customers WHERE id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Customer not found' });
        res.json(results[0]);
    });
};

exports.updateCustomer = (req, res) => {
    const { customer_name, customer_phone, customer_phone_2, customer_phone_3, customer_phone_4, customer_address, customer_cnic, customer_email, opening_balance, payment_terms } = req.body;
    let customer_image = req.file ? req.file.filename : req.body.customer_image;
    db.query('UPDATE customers SET customer_name=?, customer_phone=?, customer_phone_2=?, customer_phone_3=?, customer_phone_4=?, customer_address=?, customer_cnic=?, customer_email=?, customer_image=?, opening_balance=?, payment_terms=? WHERE id=? AND is_deleted=0', [customer_name, customer_phone, customer_phone_2, customer_phone_3, customer_phone_4, customer_address, customer_cnic, customer_email, customer_image, opening_balance, payment_terms, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Customer updated' });
    });
};

exports.deleteCustomer = (req, res) => {
    db.query('UPDATE customers SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Customer deleted (soft)' });
    });
}; 