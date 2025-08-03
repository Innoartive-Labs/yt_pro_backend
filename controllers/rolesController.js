    const db = require('../utils/db');

    exports.createRole = (req, res) => {
        const { role_name, accessible_modules } = req.body;
        db.query('INSERT INTO roles (role_name, accessible_modules) VALUES (?, ?)', [role_name, JSON.stringify(accessible_modules)], (err, result) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            res.status(201).json({ id: result.insertId });
        });
    };

    exports.getAllRoles = (req, res) => {
        db.query('SELECT * FROM roles WHERE is_deleted = 0', (err, results) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            res.json(results);
        });
    };

    exports.getRoleById = (req, res) => {
        db.query('SELECT * FROM roles WHERE id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            if (results.length === 0) return res.status(404).json({ message: 'Role not found' });
            res.json(results[0]);
        });
    };

    exports.updateRole = (req, res) => {
        const { role_name, accessible_modules } = req.body;
        db.query('UPDATE roles SET role_name=?, accessible_modules=? WHERE id=? AND is_deleted=0', [role_name, JSON.stringify(accessible_modules), req.params.id], (err, result) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            res.json({ message: 'Role updated' });
        });
    };

    exports.deleteRole = (req, res) => {
        db.query('UPDATE roles SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            res.json({ message: 'Role deleted (soft)' });
        });
    }; 