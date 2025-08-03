const db = require('../utils/db');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

exports.createCutPiece = (req, res) => {
    const {
        sales_order_id,
        original_product_id,
        cut_warehouse_id = 1,
        original_length,
        original_width,
        cut_length,
        cut_width,
        remaining_length,
        remaining_width,
        cut_quantity,
        remaining_quantity
    } = req.body;
    
    const created_by = req.user.id;
    
    // Validate that the sales order exists and belongs to the user's company
    db.query(
        'SELECT company_id FROM sales_orders WHERE id = ? AND is_deleted = 0',
        [sales_order_id],
        (err, results) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            if (results.length === 0) return res.status(404).json({ message: 'Sales order not found' });
            
            db.query(
                'INSERT INTO cut_pieces (sales_order_id, original_product_id, cut_warehouse_id, original_length, original_width, cut_length, cut_width, remaining_length, remaining_width, cut_quantity, remaining_quantity, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [sales_order_id, original_product_id, cut_warehouse_id, original_length, original_width, cut_length, cut_width, remaining_length, remaining_width, cut_quantity, remaining_quantity, created_by],
                (err, result) => {
                    if (err) return res.status(500).json({ message: 'Database error', error: err });
                    res.status(201).json({ id: result.insertId, message: 'Cut piece created successfully' });
                }
            );
        }
    );
};

exports.getCutPiecesBySalesOrder = (req, res) => {
    const { sales_order_id } = req.params;
    
    const sql = `
        SELECT cp.*, p.product_name, w.warehouse_name, u.user_name as created_by_name
        FROM cut_pieces cp
        LEFT JOIN products p ON cp.original_product_id = p.id
        LEFT JOIN warehouses w ON cp.cut_warehouse_id = w.id
        LEFT JOIN users u ON cp.created_by = u.id
        WHERE cp.sales_order_id = ? AND cp.is_deleted = 0
        ORDER BY cp.created_at DESC
    `;
    
    db.query(sql, [sales_order_id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getAllCutPieces = (req, res) => {
    const sql = `
        SELECT cp.*, so.sales_order_number, p.product_name, w.warehouse_name, u.user_name as created_by_name
        FROM cut_pieces cp
        LEFT JOIN sales_orders so ON cp.sales_order_id = so.id
        LEFT JOIN products p ON cp.original_product_id = p.id
        LEFT JOIN warehouses w ON cp.cut_warehouse_id = w.id
        LEFT JOIN users u ON cp.created_by = u.id
        WHERE cp.is_deleted = 0
        ORDER BY cp.created_at DESC
    `;
    
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getCutPieceById = (req, res) => {
    const sql = `
        SELECT cp.*, so.sales_order_number, p.product_name, w.warehouse_name, u.user_name as created_by_name
        FROM cut_pieces cp
        LEFT JOIN sales_orders so ON cp.sales_order_id = so.id
        LEFT JOIN products p ON cp.original_product_id = p.id
        LEFT JOIN warehouses w ON cp.cut_warehouse_id = w.id
        LEFT JOIN users u ON cp.created_by = u.id
        WHERE cp.id = ? AND cp.is_deleted = 0
    `;
    
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Cut piece not found' });
        res.json(results[0]);
    });
};

exports.updateCutPiece = (req, res) => {
    const {
        cut_warehouse_id,
        cut_length,
        cut_width,
        remaining_length,
        remaining_width,
        cut_quantity,
        remaining_quantity
    } = req.body;
    
    db.query(
        'UPDATE cut_pieces SET cut_warehouse_id=?, cut_length=?, cut_width=?, remaining_length=?, remaining_width=?, cut_quantity=?, remaining_quantity=? WHERE id=? AND is_deleted=0',
        [cut_warehouse_id, cut_length, cut_width, remaining_length, remaining_width, cut_quantity, remaining_quantity, req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Cut piece not found' });
            res.json({ message: 'Cut piece updated successfully' });
        }
    );
};

exports.deleteCutPiece = (req, res) => {
    db.query('UPDATE cut_pieces SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Cut piece not found' });
        res.json({ message: 'Cut piece deleted successfully' });
    });
};

exports.getCutPiecesByWarehouse = (req, res) => {
    const { warehouse_id } = req.params;
    
    const sql = `
        SELECT cp.*, so.sales_order_number, p.product_name, w.warehouse_name, u.user_name as created_by_name
        FROM cut_pieces cp
        LEFT JOIN sales_orders so ON cp.sales_order_id = so.id
        LEFT JOIN products p ON cp.original_product_id = p.id
        LEFT JOIN warehouses w ON cp.cut_warehouse_id = w.id
        LEFT JOIN users u ON cp.created_by = u.id
        WHERE cp.cut_warehouse_id = ? AND cp.is_deleted = 0
        ORDER BY cp.created_at DESC
    `;
    
    db.query(sql, [warehouse_id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getCutPiecesByProduct = (req, res) => {
    const { product_id } = req.params;
    
    const sql = `
        SELECT cp.*, so.sales_order_number, p.product_name, w.warehouse_name, u.user_name as created_by_name
        FROM cut_pieces cp
        LEFT JOIN sales_orders so ON cp.sales_order_id = so.id
        LEFT JOIN products p ON cp.original_product_id = p.id
        LEFT JOIN warehouses w ON cp.cut_warehouse_id = w.id
        LEFT JOIN users u ON cp.created_by = u.id
        WHERE cp.original_product_id = ? AND cp.is_deleted = 0
        ORDER BY cp.created_at DESC
    `;
    
    db.query(sql, [product_id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
}; 