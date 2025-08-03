const db = require('../utils/db');

exports.createPaymentTerm = (req, res) => {
    const { payment_term_name, payment_term_days } = req.body;
    db.query('INSERT INTO payment_terms (payment_term_name, payment_term_days) VALUES (?, ?)', [payment_term_name, payment_term_days], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ id: result.insertId });
    });
};

exports.getAllPaymentTerms = (req, res) => {
    db.query('SELECT * FROM payment_terms WHERE is_deleted = 0', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getPaymentTermById = (req, res) => {
    db.query('SELECT * FROM payment_terms WHERE id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Payment term not found' });
        res.json(results[0]);
    });
};

exports.updatePaymentTerm = (req, res) => {
    const { payment_term_name, payment_term_days } = req.body;
    db.query('UPDATE payment_terms SET payment_term_name=?, payment_term_days=? WHERE id=? AND is_deleted=0', [payment_term_name, payment_term_days, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Payment term updated' });
    });
};

exports.deletePaymentTerm = (req, res) => {
    db.query('UPDATE payment_terms SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Payment term deleted (soft)' });
    });
}; 