const db = require('../utils/db');

exports.createThickness = (req, res) => {
    const { thickness_value } = req.body;
    db.query('INSERT INTO thicknesses (thickness_value) VALUES (?)', [thickness_value], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ id: result.insertId });
    });
};

exports.getAllThicknesses = (req, res) => {
    db.query('SELECT * FROM thicknesses WHERE is_deleted = 0', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getThicknessById = (req, res) => {
    db.query('SELECT * FROM thicknesses WHERE id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Thickness not found' });
        res.json(results[0]);
    });
};

exports.updateThickness = (req, res) => {
    const { thickness_value } = req.body;
    db.query('UPDATE thicknesses SET thickness_value=? WHERE id=? AND is_deleted=0', [thickness_value, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Thickness updated' });
    });
};

exports.deleteThickness = (req, res) => {
    db.query('UPDATE thicknesses SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Thickness deleted (soft)' });
    });
}; 