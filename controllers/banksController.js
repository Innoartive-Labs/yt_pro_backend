const db = require('../utils/db');

exports.createBank = (req, res) => {
    const { bank_name } = req.body;
    db.query('INSERT INTO banks (bank_name) VALUES (?)', [bank_name], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ id: result.insertId });
    });
};

exports.getAllBanks = (req, res) => {
    db.query('SELECT * FROM banks WHERE is_deleted = 0', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getBankById = (req, res) => {
    db.query('SELECT * FROM banks WHERE id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Bank not found' });
        res.json(results[0]);
    });
};

exports.updateBank = (req, res) => {
    const { bank_name } = req.body;
    db.query('UPDATE banks SET bank_name=? WHERE id=? AND is_deleted=0', [bank_name, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Bank updated' });
    });
};

exports.deleteBank = (req, res) => {
    db.query('UPDATE banks SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Bank deleted (soft)' });
    });
}; 