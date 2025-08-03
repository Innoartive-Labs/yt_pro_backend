const db = require('../utils/db');

exports.createCompany = (req, res) => {
    const { company_name } = req.body;
    db.query('INSERT INTO companies (company_name) VALUES (?)', [company_name], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ id: result.insertId });
    });
};

exports.getAllCompanies = (req, res) => {
    db.query('SELECT * FROM companies WHERE is_deleted = 0', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getCompanyById = (req, res) => {
    db.query('SELECT * FROM companies WHERE id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Company not found' });
        res.json(results[0]);
    });
};

exports.updateCompany = (req, res) => {
    const { company_name } = req.body;
    db.query('UPDATE companies SET company_name=? WHERE id=? AND is_deleted=0', [company_name, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Company updated' });
    });
};

exports.deleteCompany = (req, res) => {
    db.query('UPDATE companies SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Company deleted (soft)' });
    });
}; 