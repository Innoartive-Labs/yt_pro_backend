const db = require('../utils/db');

exports.createFinish = (req, res) => {
    const { finish_name } = req.body;
    db.query('INSERT INTO finishes (finish_name) VALUES (?)', [finish_name], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ id: result.insertId });
    });
};

exports.getAllFinishes = (req, res) => {
    db.query('SELECT * FROM finishes WHERE is_deleted = 0', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getFinishById = (req, res) => {
    db.query('SELECT * FROM finishes WHERE id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Finish not found' });
        res.json(results[0]);
    });
};

exports.updateFinish = (req, res) => {
    const { finish_name } = req.body;
    db.query('UPDATE finishes SET finish_name=? WHERE id=? AND is_deleted=0', [finish_name, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Finish updated' });
    });
};

exports.deleteFinish = (req, res) => {
    db.query('UPDATE finishes SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Finish deleted (soft)' });
    });
}; 