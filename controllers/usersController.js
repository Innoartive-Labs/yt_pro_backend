const db = require('../utils/db');
const bcrypt = require('bcrypt');

exports.createUser = (req, res) => {
    const { first_name, last_name, user_name, password, email, phone, role_id, date_of_joining, salary } = req.body;
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return res.status(500).json({ message: 'Error hashing password', error: err });
        db.query('INSERT INTO users (first_name, last_name, user_name, password, email, phone, role_id, date_of_joining, salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [first_name, last_name, user_name, hashedPassword, email, phone, role_id, date_of_joining || null, salary || null],
            (err, result) => {
                if (err) return res.status(500).json({ message: 'Database error', error: err });
                res.status(201).json({ id: result.insertId });
            });
    });
};

exports.getAllUsers = (req, res) => {
    db.query('SELECT * FROM users WHERE is_deleted = 0', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getUserById = (req, res) => {
    db.query('SELECT * FROM users WHERE id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(results[0]);
    });
};

exports.updateUser = (req, res) => {
    const { first_name, last_name, user_name, password, email, phone, role_id, date_of_joining, salary } = req.body;
    db.query('UPDATE users SET first_name=?, last_name=?, user_name=?, password=?, email=?, phone=?, role_id=?, date_of_joining=?, salary=? WHERE id=? AND is_deleted=0',
        [first_name, last_name, user_name, password, email, phone, role_id, date_of_joining || null, salary || null, req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            res.json({ message: 'User updated' });
        });
};

exports.deleteUser = (req, res) => {
    db.query('UPDATE users SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'User deleted (soft)' });
    });
}; 