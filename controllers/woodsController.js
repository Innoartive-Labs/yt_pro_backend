const db = require('../utils/db');

exports.createWood = (req, res) => {
    const { wood_name } = req.body;
    db.query('INSERT INTO woods (wood_name) VALUES (?)', [wood_name], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ id: result.insertId });
    });
};

exports.getAllWoods = (req, res) => {
    db.query('SELECT * FROM woods WHERE is_deleted = 0', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getWoodById = (req, res) => {
    db.query('SELECT * FROM woods WHERE id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Wood not found' });
        res.json(results[0]);
    });
};

exports.updateWood = (req, res) => {
    const { wood_name } = req.body;
    db.query('UPDATE woods SET wood_name=? WHERE id=? AND is_deleted=0', [wood_name, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Wood updated' });
    });
};

exports.deleteWood = (req, res) => {
    db.query('UPDATE woods SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Wood deleted (soft)' });
    });
}; 