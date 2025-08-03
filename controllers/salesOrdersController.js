const db = require('../utils/db');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

exports.createSalesOrder = (req, res) => {
    const { 
        sales_order_number, 
        sales_order_date, 
        customer_id, 
        company_id, 
        product_id, 
        warehouse_id, 
        manager_id, 
        quantity, 
        rate_given,
        delivery_date,
        delivery_charges,
        // Cut pieces information
        is_cut_required = false,
        original_length,
        original_width,
        cut_length,
        cut_width,
        remaining_length,
        remaining_width,
        cut_quantity,
        remaining_quantity,
        cut_warehouse_id = 1
    } = req.body;
    
    const created_by = req.user.id;
    
    // Start a transaction
    db.beginTransaction((err) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        
        // Insert sales order
        db.query(
            'INSERT INTO sales_orders (sales_order_number, sales_order_date, customer_id, company_id, product_id, warehouse_id, manager_id, quantity, rate_given, delivery_date, delivery_charges, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [sales_order_number, sales_order_date, customer_id, company_id, product_id, warehouse_id, manager_id, quantity, rate_given, delivery_date, delivery_charges || 0.00, created_by],
            (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ message: 'Database error', error: err });
                    });
                }
                
                const sales_order_id = result.insertId;
                
                // If cutting is required, create cut piece record
                if (is_cut_required && original_length && original_width && cut_length && cut_width) {
                    db.query(
                        'INSERT INTO cut_pieces (sales_order_id, original_product_id, cut_warehouse_id, original_length, original_width, cut_length, cut_width, remaining_length, remaining_width, cut_quantity, remaining_quantity, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [sales_order_id, product_id, cut_warehouse_id, original_length, original_width, cut_length, cut_width, remaining_length, remaining_width, cut_quantity, remaining_quantity, created_by],
                        (err, cutResult) => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).json({ message: 'Database error', error: err });
                                });
                            }
                            
                            // Commit transaction
                            db.commit((err) => {
                                if (err) {
                                    return db.rollback(() => {
                                        res.status(500).json({ message: 'Database error', error: err });
                                    });
                                }
                                res.status(201).json({ 
                                    id: sales_order_id, 
                                    cut_piece_id: cutResult.insertId,
                                    message: 'Sales order with cut piece created successfully' 
                                });
                            });
                        }
                    );
                } else {
                    // Commit transaction without cut piece
                    db.commit((err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ message: 'Database error', error: err });
                            });
                        }
                        res.status(201).json({ 
                            id: sales_order_id, 
                            message: 'Sales order created successfully' 
                        });
                    });
                }
            }
        );
    });
};

exports.getAllSalesOrders = (req, res) => {
    const sql = `
        SELECT so.*, c.customer_name, mc.company_name, p.product_name, w.warehouse_name, m.user_name as manager_name, u.user_name as created_by_name,
               cp.id as cut_piece_id, cp.original_length, cp.original_width, cp.cut_length, cp.cut_width, cp.remaining_length, cp.remaining_width, cp.cut_quantity, cp.remaining_quantity
        FROM sales_orders so
        LEFT JOIN customers c ON so.customer_id = c.id
        LEFT JOIN my_companies mc ON so.company_id = mc.id
        LEFT JOIN products p ON so.product_id = p.id
        LEFT JOIN warehouses w ON so.warehouse_id = w.id
        LEFT JOIN users m ON so.manager_id = m.id
        LEFT JOIN users u ON so.created_by = u.id
        LEFT JOIN cut_pieces cp ON so.id = cp.sales_order_id AND cp.is_deleted = 0
        WHERE so.is_deleted = 0
        ORDER BY so.created_at DESC
    `;
    
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        const salesOrders = results.map(salesOrder => ({
            ...salesOrder,
            sales_order_date: dayjs(salesOrder.sales_order_date).tz('Asia/Karachi').format('YYYY-MM-DD'),
            delivery_date: salesOrder.delivery_date ? dayjs(salesOrder.delivery_date).tz('Asia/Karachi').format('YYYY-MM-DD') : null,
            is_cut_required: !!salesOrder.cut_piece_id
        }));
        res.json(salesOrders);
    });
};

exports.getSalesOrderById = (req, res) => {
    const sql = `
        SELECT so.*, c.customer_name, mc.company_name, p.product_name, w.warehouse_name, m.user_name as manager_name, u.user_name as created_by_name,
               cp.id as cut_piece_id, cp.original_length, cp.original_width, cp.cut_length, cp.cut_width, cp.remaining_length, cp.remaining_width, cp.cut_quantity, cp.remaining_quantity, cp.cut_warehouse_id
        FROM sales_orders so
        LEFT JOIN customers c ON so.customer_id = c.id
        LEFT JOIN my_companies mc ON so.company_id = mc.id
        LEFT JOIN products p ON so.product_id = p.id
        LEFT JOIN warehouses w ON so.warehouse_id = w.id
        LEFT JOIN users m ON so.manager_id = m.id
        LEFT JOIN users u ON so.created_by = u.id
        LEFT JOIN cut_pieces cp ON so.id = cp.sales_order_id AND cp.is_deleted = 0
        WHERE so.id = ? AND so.is_deleted = 0
    `;
    
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Sales order not found' });
        const salesOrder = results[0];
        salesOrder.sales_order_date = dayjs(salesOrder.sales_order_date).tz('Asia/Karachi').format('YYYY-MM-DD');
        salesOrder.delivery_date = salesOrder.delivery_date ? dayjs(salesOrder.delivery_date).tz('Asia/Karachi').format('YYYY-MM-DD') : null;
        salesOrder.is_cut_required = !!salesOrder.cut_piece_id;
        res.json(salesOrder);
    });
};

exports.updateSalesOrder = (req, res) => {
    const { 
        sales_order_number, 
        sales_order_date, 
        customer_id, 
        company_id, 
        product_id, 
        warehouse_id, 
        manager_id, 
        quantity, 
        rate_given,
        delivery_date,
        delivery_charges,
        // Cut pieces information
        is_cut_required = false,
        original_length,
        original_width,
        cut_length,
        cut_width,
        remaining_length,
        remaining_width,
        cut_quantity,
        remaining_quantity,
        cut_warehouse_id = 1
    } = req.body;
    
    const sales_order_id = req.params.id;
    const created_by = req.user.id;
    
    // Start a transaction
    db.beginTransaction((err) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        
        // Update sales order
        db.query(
            'UPDATE sales_orders SET sales_order_number=?, sales_order_date=?, customer_id=?, company_id=?, product_id=?, warehouse_id=?, manager_id=?, quantity=?, rate_given=?, delivery_date=?, delivery_charges=? WHERE id=? AND is_deleted=0',
            [sales_order_number, sales_order_date, customer_id, company_id, product_id, warehouse_id, manager_id, quantity, rate_given, delivery_date, delivery_charges || 0.00, sales_order_id],
            (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ message: 'Database error', error: err });
                    });
                }
                if (result.affectedRows === 0) {
                    return db.rollback(() => {
                        res.status(404).json({ message: 'Sales order not found' });
                    });
                }
                
                // Handle cut pieces
                if (is_cut_required && original_length && original_width && cut_length && cut_width) {
                    // Check if cut piece already exists
                    db.query(
                        'SELECT id FROM cut_pieces WHERE sales_order_id = ? AND is_deleted = 0',
                        [sales_order_id],
                        (err, existingCut) => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).json({ message: 'Database error', error: err });
                                });
                            }
                            
                            if (existingCut.length > 0) {
                                // Update existing cut piece
                                db.query(
                                    'UPDATE cut_pieces SET original_product_id=?, cut_warehouse_id=?, original_length=?, original_width=?, cut_length=?, cut_width=?, remaining_length=?, remaining_width=?, cut_quantity=?, remaining_quantity=? WHERE sales_order_id=? AND is_deleted=0',
                                    [product_id, cut_warehouse_id, original_length, original_width, cut_length, cut_width, remaining_length, remaining_width, cut_quantity, remaining_quantity, sales_order_id],
                                    (err, updateResult) => {
                                        if (err) {
                                            return db.rollback(() => {
                                                res.status(500).json({ message: 'Database error', error: err });
                                            });
                                        }
                                        
                                        db.commit((err) => {
                                            if (err) {
                                                return db.rollback(() => {
                                                    res.status(500).json({ message: 'Database error', error: err });
                                                });
                                            }
                                            res.json({ message: 'Sales order with cut piece updated successfully' });
                                        });
                                    }
                                );
                            } else {
                                // Create new cut piece
                                db.query(
                                    'INSERT INTO cut_pieces (sales_order_id, original_product_id, cut_warehouse_id, original_length, original_width, cut_length, cut_width, remaining_length, remaining_width, cut_quantity, remaining_quantity, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                                    [sales_order_id, product_id, cut_warehouse_id, original_length, original_width, cut_length, cut_width, remaining_length, remaining_width, cut_quantity, remaining_quantity, created_by],
                                    (err, cutResult) => {
                                        if (err) {
                                            return db.rollback(() => {
                                                res.status(500).json({ message: 'Database error', error: err });
                                            });
                                        }
                                        
                                        db.commit((err) => {
                                            if (err) {
                                                return db.rollback(() => {
                                                    res.status(500).json({ message: 'Database error', error: err });
                                                });
                                            }
                                            res.json({ 
                                                cut_piece_id: cutResult.insertId,
                                                message: 'Sales order with cut piece updated successfully' 
                                            });
                                        });
                                    }
                                );
                            }
                        }
                    );
                } else {
                    // Remove cut piece if it exists and cutting is not required
                    db.query(
                        'UPDATE cut_pieces SET is_deleted=1 WHERE sales_order_id=? AND is_deleted=0',
                        [sales_order_id],
                        (err) => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).json({ message: 'Database error', error: err });
                                });
                            }
                            
                            db.commit((err) => {
                                if (err) {
                                    return db.rollback(() => {
                                        res.status(500).json({ message: 'Database error', error: err });
                                    });
                                }
                                res.json({ message: 'Sales order updated successfully' });
                            });
                        }
                    );
                }
            }
        );
    });
};

exports.updateSalesOrderStatus = (req, res) => {
    const { sales_order_status } = req.body;
    
    const validStatuses = ['pending', 'partial-sold', 'sold', 'paid', 'partial-paid', 'returned', 'partial-returned'];
    if (!validStatuses.includes(sales_order_status)) {
        return res.status(400).json({ message: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
    }
    
    db.query(
        'UPDATE sales_orders SET sales_order_status=? WHERE id=? AND is_deleted=0',
        [sales_order_status, req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Sales order not found' });
            res.json({ message: 'Sales order status updated successfully' });
        }
    );
};

exports.deleteSalesOrder = (req, res) => {
    db.query('UPDATE sales_orders SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Sales order not found' });
        res.json({ message: 'Sales order deleted successfully' });
    });
};

exports.getSalesOrdersByStatus = (req, res) => {
    const { status } = req.params;
    const validStatuses = ['pending', 'partial-sold', 'sold', 'paid', 'partial-paid', 'returned', 'partial-returned'];
    
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
    }
    
    const sql = `
        SELECT so.*, c.customer_name, mc.company_name, p.product_name, w.warehouse_name, m.user_name as manager_name, u.user_name as created_by_name,
               cp.id as cut_piece_id, cp.original_length, cp.original_width, cp.cut_length, cp.cut_width, cp.remaining_length, cp.remaining_width, cp.cut_quantity, cp.remaining_quantity
        FROM sales_orders so
        LEFT JOIN customers c ON so.customer_id = c.id
        LEFT JOIN my_companies mc ON so.company_id = mc.id
        LEFT JOIN products p ON so.product_id = p.id
        LEFT JOIN warehouses w ON so.warehouse_id = w.id
        LEFT JOIN users m ON so.manager_id = m.id
        LEFT JOIN users u ON so.created_by = u.id
        LEFT JOIN cut_pieces cp ON so.id = cp.sales_order_id AND cp.is_deleted = 0
        WHERE so.sales_order_status = ? AND so.is_deleted = 0
        ORDER BY so.created_at DESC
    `;
    
    db.query(sql, [status], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        const salesOrders = results.map(salesOrder => ({
            ...salesOrder,
            sales_order_date: dayjs(salesOrder.sales_order_date).tz('Asia/Karachi').format('YYYY-MM-DD'),
            delivery_date: salesOrder.delivery_date ? dayjs(salesOrder.delivery_date).tz('Asia/Karachi').format('YYYY-MM-DD') : null,
            is_cut_required: !!salesOrder.cut_piece_id
        }));
        res.json(salesOrders);
    });
};

exports.getSalesOrdersByCustomer = (req, res) => {
    const { customer_id } = req.params;
    
    const sql = `
        SELECT so.*, c.customer_name, mc.company_name, p.product_name, w.warehouse_name, m.user_name as manager_name, u.user_name as created_by_name,
               cp.id as cut_piece_id, cp.original_length, cp.original_width, cp.cut_length, cp.cut_width, cp.remaining_length, cp.remaining_width, cp.cut_quantity, cp.remaining_quantity
        FROM sales_orders so
        LEFT JOIN customers c ON so.customer_id = c.id
        LEFT JOIN my_companies mc ON so.company_id = mc.id
        LEFT JOIN products p ON so.product_id = p.id
        LEFT JOIN warehouses w ON so.warehouse_id = w.id
        LEFT JOIN users m ON so.manager_id = m.id
        LEFT JOIN users u ON so.created_by = u.id
        LEFT JOIN cut_pieces cp ON so.id = cp.sales_order_id AND cp.is_deleted = 0
        WHERE so.customer_id = ? AND so.is_deleted = 0
        ORDER BY so.created_at DESC
    `;
    
    db.query(sql, [customer_id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        const salesOrders = results.map(salesOrder => ({
            ...salesOrder,
            sales_order_date: dayjs(salesOrder.sales_order_date).tz('Asia/Karachi').format('YYYY-MM-DD'),
            delivery_date: salesOrder.delivery_date ? dayjs(salesOrder.delivery_date).tz('Asia/Karachi').format('YYYY-MM-DD') : null,
            is_cut_required: !!salesOrder.cut_piece_id
        }));
        res.json(salesOrders);
    });
}; 



exports.getSalesOrdersWithDeliveryInfo = (req, res) => {
    const sql = `
        SELECT so.*, c.customer_name, mc.company_name, p.product_name, w.warehouse_name, m.user_name as manager_name, u.user_name as created_by_name,
               cp.id as cut_piece_id, cp.original_length, cp.original_width, cp.cut_length, cp.cut_width, cp.remaining_length, cp.remaining_width, cp.cut_quantity, cp.remaining_quantity
        FROM sales_orders so
        LEFT JOIN customers c ON so.customer_id = c.id
        LEFT JOIN my_companies mc ON so.company_id = mc.id
        LEFT JOIN products p ON so.product_id = p.id
        LEFT JOIN warehouses w ON so.warehouse_id = w.id
        LEFT JOIN users m ON so.manager_id = m.id
        LEFT JOIN users u ON so.created_by = u.id
        LEFT JOIN cut_pieces cp ON so.id = cp.sales_order_id AND cp.is_deleted = 0
        WHERE so.is_deleted = 0 AND so.delivery_date IS NOT NULL
        ORDER BY so.delivery_date ASC, so.created_at DESC
    `;
    
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        const salesOrders = results.map(salesOrder => ({
            ...salesOrder,
            sales_order_date: dayjs(salesOrder.sales_order_date).tz('Asia/Karachi').format('YYYY-MM-DD'),
            delivery_date: salesOrder.delivery_date ? dayjs(salesOrder.delivery_date).tz('Asia/Karachi').format('YYYY-MM-DD') : null,
            is_cut_required: !!salesOrder.cut_piece_id
        }));
        res.json(salesOrders);
    });
}; 