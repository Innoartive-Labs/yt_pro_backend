const db = require('../utils/db');

exports.createCategory = (req, res) => {
    const { category_name } = req.body;
    db.query('INSERT INTO categories (category_name) VALUES (?)', [category_name], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ id: result.insertId });
    });
};

exports.getAllCategories = (req, res) => {
    db.query('SELECT * FROM categories WHERE is_deleted = 0', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getCategoryById = (req, res) => {
    db.query('SELECT * FROM categories WHERE id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Category not found' });
        res.json(results[0]);
    });
};

exports.updateCategory = (req, res) => {
    const { category_name } = req.body;
    db.query('UPDATE categories SET category_name=? WHERE id=? AND is_deleted=0', [category_name, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Category updated' });
    });
};

exports.deleteCategory = (req, res) => {
    db.query('UPDATE categories SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Category deleted (soft)' });
    });
}; 