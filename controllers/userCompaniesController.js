const db = require('../utils/db');

exports.createUserCompany = (req, res) => {
    const { user_id, company_id } = req.body;
    db.query('INSERT INTO user_companies (user_id, company_id) VALUES (?, ?)', [user_id, company_id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ id: result.insertId });
    });
};

exports.getAllUserCompanies = (req, res) => {
    db.query('SELECT * FROM user_companies WHERE is_deleted = 0', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getUserCompanyById = (req, res) => {
    db.query('SELECT * FROM user_companies WHERE id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'User-Company not found' });
        res.json(results[0]);
    });
};

exports.updateUserCompany = (req, res) => {
    const { user_id, company_id } = req.body;
    db.query('UPDATE user_companies SET user_id=?, company_id=? WHERE id=? AND is_deleted=0', [user_id, company_id, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'User-Company updated' });
    });
};

exports.deleteUserCompany = (req, res) => {
    db.query('UPDATE user_companies SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'User-Company deleted (soft)' });
    });
}; 