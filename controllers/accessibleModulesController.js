const db = require('../utils/db');

exports.createModule = (req, res) => {
    const { module_name } = req.body;
    db.query('INSERT INTO accessible_modules (module_name) VALUES (?)', [module_name], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ id: result.insertId });
    });
};

exports.getAllModules = (req, res) => {
    db.query('SELECT * FROM accessible_modules WHERE is_deleted = 0', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getModuleById = (req, res) => {
    db.query('SELECT * FROM accessible_modules WHERE id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Module not found' });
        res.json(results[0]);
    });
};

exports.updateModule = (req, res) => {
    const { module_name } = req.body;
    db.query('UPDATE accessible_modules SET module_name=? WHERE id=? AND is_deleted=0', [module_name, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Module updated' });
    });
};

exports.deleteModule = (req, res) => {
    db.query('UPDATE accessible_modules SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Module deleted (soft)' });
    });
}; 