const db = require('../utils/db');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

exports.createPurchaseOrder = (req, res) => {
    const {
        purchase_order_number,
        purchase_order_date,
        company_id,
        product_id,
        quantity,
        priority
    } = req.body;

    const created_by = req.user.id;

    // Validate priority
    const validPriorities = ['low', 'medium', 'high'];
    const finalPriority = priority && validPriorities.includes(priority) ? priority : 'low';

    db.query(
        'INSERT INTO purchase_orders (purchase_order_number, purchase_order_date, company_id, product_id, quantity, priority, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [purchase_order_number, purchase_order_date, company_id, product_id, quantity, finalPriority, created_by],
        (err, result) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            res.status(201).json({ id: result.insertId, message: 'Purchase order created successfully' });
        }
    );
};

exports.getAllPurchaseOrders = (req, res) => {
    const sql = `
        SELECT po.*, s.supplier_name, c.company_name, p.product_name, u.user_name as created_by_name
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        LEFT JOIN my_companies c ON po.company_id = c.id
        LEFT JOIN products p ON po.product_id = p.id
        LEFT JOIN users u ON po.created_by = u.id
        WHERE po.is_deleted = 0
        ORDER BY po.created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        const purchaseOrders = results.map(purchaseOrder => ({
            ...purchaseOrder,
            purchase_order_date: dayjs(purchaseOrder.purchase_order_date).tz('Asia/Karachi').format('YYYY-MM-DD')
        }));
        res.json(purchaseOrders);
    });

};

exports.getPurchaseOrderById = (req, res) => {
    const sql = `
        SELECT po.*, s.supplier_name, c.company_name, p.product_name, u.user_name as created_by_name
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        LEFT JOIN my_companies c ON po.company_id = c.id
        LEFT JOIN products p ON po.product_id = p.id
        LEFT JOIN users u ON po.created_by = u.id
        WHERE po.id = ? AND po.is_deleted = 0
    `;

    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Purchase order not found' });
        res.json(results[0]);
    });
};

exports.updatePurchaseOrder = (req, res) => {
    const {
        purchase_order_number,
        purchase_order_date,
        supplier_id,        
        company_id,
        product_id,
        rate_given,
        priority,
        quantity,
        purchase_order_status
    } = req.body;

    // Validate priority
    const validPriorities = ['low', 'medium', 'high'];
    const validStatuses = ['pending', 'approved', 'partial-approved', 'rejected', 'partial-received', 'received'];
    const finalStatus = purchase_order_status && validStatuses.includes(purchase_order_status) ? purchase_order_status : 'pending';
    const finalPriority = priority && validPriorities.includes(priority) ? priority : 'low';

    db.query(
        'UPDATE purchase_orders SET purchase_order_number=?, purchase_order_date=?, supplier_id=?, company_id=?, product_id=?, rate_given=?, quantity=?, priority=?, purchase_order_status=? WHERE id=? AND is_deleted=0',
        [purchase_order_number, purchase_order_date, supplier_id, company_id, product_id, rate_given, quantity, finalPriority, finalStatus, req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Purchase order not found' });
            res.json({ message: 'Purchase order updated successfully' });
        }
    );
};

exports.reviewPurchaseOrder = (req, res) => {
    const {
        supplier_id,        
        rate_given,
        quantity,
        purchase_order_status
    } = req.body;

    const validStatuses = ['pending', 'approved', 'partial-approved', 'rejected', 'partial-received', 'received'];
    const finalStatus = purchase_order_status && validStatuses.includes(purchase_order_status) ? purchase_order_status : 'pending';

    db.query(
        'UPDATE purchase_orders SET supplier_id=?, rate_given=?, quantity=?, purchase_order_status=? WHERE id=? AND is_deleted=0',
        [supplier_id, rate_given, quantity, finalStatus, req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Purchase order not found' });
            res.json({ message: 'Purchase order reviewed successfully' });
        }
    );
};

exports.updatePurchaseOrderStatus = (req, res) => {
    const { purchase_order_status } = req.body;

    const validStatuses = ['pending', 'approved', 'partial-approved', 'rejected', 'partial-received', 'received'];
    if (!validStatuses.includes(purchase_order_status)) {
        return res.status(400).json({ message: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
    }

    db.query(
        'UPDATE purchase_orders SET purchase_order_status=? WHERE id=? AND is_deleted=0',
        [purchase_order_status, req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Purchase order not found' });
            res.json({ message: 'Purchase order status updated successfully' });
        }
    );
};

exports.deletePurchaseOrder = (req, res) => {
    db.query('UPDATE purchase_orders SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Purchase order not found' });
        res.json({ message: 'Purchase order deleted successfully' });
    });
};

exports.getPurchaseOrdersByStatus = (req, res) => {
    const { status } = req.params;
    const validStatuses = ['pending', 'approved', 'partial-approved', 'rejected', 'partial-received', 'received'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
    }

    const sql = `
        SELECT po.*, s.supplier_name, c.company_name, p.product_name, u.user_name as created_by_name
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        LEFT JOIN my_companies c ON po.company_id = c.id
        LEFT JOIN products p ON po.product_id = p.id
        LEFT JOIN users u ON po.created_by = u.id
        WHERE po.purchase_order_status = ? AND po.is_deleted = 0
        ORDER BY po.created_at DESC
    `;

    db.query(sql, [status], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.updatePurchaseOrderPriority = (req, res) => {
    const { priority } = req.body;

    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
        return res.status(400).json({ message: 'Invalid priority. Must be one of: ' + validPriorities.join(', ') });
    }

    db.query(
        'UPDATE purchase_orders SET priority=? WHERE id=? AND is_deleted=0',
        [priority, req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Purchase order not found' });
            res.json({ message: 'Purchase order priority updated successfully' });
        }
    );
};

exports.getPurchaseOrdersByPriority = (req, res) => {
    const { priority } = req.params;
    const validPriorities = ['low', 'medium', 'high'];

    if (!validPriorities.includes(priority)) {
        return res.status(400).json({ message: 'Invalid priority. Must be one of: ' + validPriorities.join(', ') });
    }

    const sql = `
        SELECT po.*, s.supplier_name, c.company_name, p.product_name, u.user_name as created_by_name
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        LEFT JOIN my_companies c ON po.company_id = c.id
        LEFT JOIN products p ON po.product_id = p.id
        LEFT JOIN users u ON po.created_by = u.id
        WHERE po.priority = ? AND po.is_deleted = 0
        ORDER BY po.created_at DESC
    `;

    db.query(sql, [priority], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
}; 