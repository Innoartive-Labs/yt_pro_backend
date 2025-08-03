    const db = require('../utils/db');

    exports.createColor = (req, res) => {
        const { my_color, company_color, company_id } = req.body;
        db.query('INSERT INTO colors (my_color, company_color, company_id) VALUES (?, ?, ?)', [my_color, company_color, company_id], (err, result) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            res.status(201).json({ id: result.insertId });
        });
    };

    exports.getAllColors = (req, res) => {
        db.query('SELECT * FROM colors WHERE is_deleted = 0', (err, results) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            res.json(results);
        });
    };

    exports.getColorById = (req, res) => {
        db.query('SELECT * FROM colors WHERE id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            if (results.length === 0) return res.status(404).json({ message: 'Color not found' });
            res.json(results[0]);
        });
    };

    exports.updateColor = (req, res) => {
        const { my_color, company_color, company_id } = req.body;
        db.query('UPDATE colors SET my_color=?, company_color=?, company_id=? WHERE id=? AND is_deleted=0', [my_color, company_color, company_id, req.params.id], (err, result) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            res.json({ message: 'Color updated' });
        });
    };

    exports.deleteColor = (req, res) => {
        db.query('UPDATE colors SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            res.json({ message: 'Color deleted (soft)' });
        });
    }; 