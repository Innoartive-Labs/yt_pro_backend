const db = require('../utils/db');

exports.createBankAccount = (req, res) => {
    const { bank_id, account_number, iban_number, account_title, account_balance } = req.body;
    db.query('INSERT INTO bank_accounts (bank_id, account_number, iban_number, account_title, account_balance) VALUES (?, ?, ?, ?, ?)', [bank_id, account_number, iban_number, account_title, account_balance], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ id: result.insertId });
    });
};

exports.getAllBankAccounts = (req, res) => {
    db.query('SELECT * FROM bank_accounts WHERE is_deleted = 0', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getBankAccountById = (req, res) => {
    db.query('SELECT * FROM bank_accounts WHERE id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Bank account not found' });
        res.json(results[0]);
    });
};

exports.updateBankAccount = (req, res) => {
    const { bank_id, account_number, iban_number, account_title, account_balance } = req.body;
    db.query('UPDATE bank_accounts SET bank_id=?, account_number=?, iban_number=?, account_title=?, account_balance=? WHERE id=? AND is_deleted=0', [bank_id, account_number, iban_number, account_title, account_balance, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Bank account updated' });
    });
};

exports.deleteBankAccount = (req, res) => {
    db.query('UPDATE bank_accounts SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Bank account deleted (soft)' });
    });
}; 