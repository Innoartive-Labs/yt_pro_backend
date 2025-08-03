const db = require('../utils/db');

exports.createProduct = (req, res) => {
    const { product_name, company_id, category_id, product_type_id, grading, product_description, product_unit, mycompany_id } = req.body;
    let product_image = req.file ? req.file.filename : null;
    db.query('INSERT INTO products (product_name, company_id, category_id, product_type_id, grading, product_image, product_description, product_unit, mycompany_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [product_name, company_id, category_id, product_type_id, grading, product_image, product_description, product_unit, mycompany_id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ id: result.insertId });
    });
};

exports.getAllProducts = (req, res) => {
    db.query('SELECT * FROM products WHERE is_deleted = 0', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getProductById = (req, res) => {
    db.query('SELECT * FROM products WHERE id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Product not found' });
        res.json(results[0]);
    });
};

exports.updateProduct = (req, res) => {
    const { product_name, company_id, category_id, product_type_id, grading, product_description, product_unit, mycompany_id } = req.body;
    let product_image = req.file ? req.file.filename : req.body.product_image;
    db.query('UPDATE products SET product_name=?, company_id=?, category_id=?, product_type_id=?, grading=?, product_image=?, product_description=?, product_unit=?, mycompany_id=? WHERE id=? AND is_deleted=0', [product_name, company_id, category_id, product_type_id, grading, product_image, product_description, product_unit, mycompany_id, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Product updated' });
    });
};

exports.deleteProduct = (req, res) => {
    db.query('UPDATE products SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Product deleted (soft)' });
    });
};

exports.getProductFullDetails = (req, res) => {
    const productId = req.params.id;
    const sql = `
        SELECT p.*, c.company_name, cat.category_name, pt.type_name, u.unit_name, mc.company_name AS mycompany_name
        FROM products p
        JOIN companies c ON p.company_id = c.id
        JOIN categories cat ON p.category_id = cat.id
        JOIN product_types pt ON p.product_type_id = pt.id
        JOIN units u ON p.product_unit = u.id
        JOIN my_companies mc ON p.mycompany_id = mc.id
        WHERE p.id = ? AND p.is_deleted = 0
    `;
    db.query(sql, [productId], (err, productResults) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (productResults.length === 0) return res.status(404).json({ message: 'Product not found' });
        const product = productResults[0];
        // Fetch dimensions, prices, stocks, sides
        const queries = [
            new Promise((resolve, reject) => {
                db.query('SELECT * FROM product_dimensions WHERE product_id = ? AND is_deleted = 0', [productId], (err, results) => {
                    if (err) reject(err); else resolve(results);
                });
            }),
            new Promise((resolve, reject) => {
                db.query('SELECT * FROM product_prices WHERE product_id = ? AND is_deleted = 0', [productId], (err, results) => {
                    if (err) reject(err); else resolve(results);
                });
            }),
            new Promise((resolve, reject) => {
                db.query('SELECT * FROM product_stocks WHERE product_id = ? AND is_deleted = 0', [productId], (err, results) => {
                    if (err) reject(err); else resolve(results);
                });
            }),
            new Promise((resolve, reject) => {
                db.query('SELECT ps.*, c.my_color, w.wood_name, f.finish_name FROM product_sides ps LEFT JOIN colors c ON ps.color_id = c.id LEFT JOIN woods w ON ps.wood_id = w.id LEFT JOIN finishes f ON ps.finish_id = f.id WHERE ps.product_id = ? AND ps.is_deleted = 0', [productId], (err, results) => {
                    if (err) reject(err); else resolve(results);
                });
            })
        ];
        Promise.all(queries)
            .then(([dimensions, prices, stocks, sides]) => {
                res.json({ ...product, dimensions, prices, stocks, sides });
            })
            .catch(error => res.status(500).json({ message: 'Database error', error }));
    });
}; 