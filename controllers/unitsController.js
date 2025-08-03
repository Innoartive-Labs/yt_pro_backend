const db = require('../utils/db');

exports.createUnit = (req, res) => {
    const { unit_name, unit_symbol, is_base_unit } = req.body;
    db.query('INSERT INTO units (unit_name, unit_symbol, is_base_unit) VALUES (?, ?, ?)', [unit_name, unit_symbol, is_base_unit || 0], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ id: result.insertId });
    });
};

exports.getAllUnits = (req, res) => {
    db.query('SELECT * FROM units WHERE is_deleted = 0', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getUnitById = (req, res) => {
    db.query('SELECT * FROM units WHERE id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Unit not found' });
        res.json(results[0]);
    });
};

exports.updateUnit = (req, res) => {
    const { unit_name, unit_symbol, is_base_unit } = req.body;
    db.query('UPDATE units SET unit_name=?, unit_symbol=?, is_base_unit=? WHERE id=? AND is_deleted=0', [unit_name, unit_symbol, is_base_unit || 0, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Unit updated' });
    });
};

exports.deleteUnit = (req, res) => {
    db.query('UPDATE units SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Unit deleted (soft)' });
    });
}; 