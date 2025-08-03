const db = require('../utils/db');

exports.createSalesWarehouseMovement = (req, res) => {
    const { 
        sales_order_id, 
        warehouse_id, 
        manager_id, 
        order_product_id, 
        buying_product_id, 
        order_quantity, 
        buying_quantity, 
        remarks 
    } = req.body;
    
    const created_by = req.user.id;
    
    // Start a transaction
    db.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        
        // Insert the sales warehouse movement
        db.query(
            'INSERT INTO sales_warehouse_movements (sales_order_id, warehouse_id, manager_id, order_product_id, buying_product_id, order_quantity, buying_quantity, remarks, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [sales_order_id, warehouse_id, manager_id, order_product_id, buying_product_id, order_quantity, buying_quantity, remarks, created_by],
            (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ message: 'Database error', error: err });
                    });
                }
                
                // Update the sales order status to 'partial-sold'
                db.query(
                    'UPDATE sales_orders SET sales_order_status = ? WHERE id = ? AND is_deleted = 0',
                    ['partial-sold', sales_order_id],
                    (err, updateResult) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ message: 'Database error', error: err });
                            });
                        }
                        
                        // Commit the transaction
                        db.commit((err) => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).json({ message: 'Database error', error: err });
                                });
                            }
                            
                            res.status(201).json({ 
                                id: result.insertId, 
                                message: 'Sales warehouse movement created successfully and sales order status updated to partial-sold' 
                            });
                        });
                    }
                );
            }
        );
    });
};

exports.getAllSalesWarehouseMovements = (req, res) => {
    const sql = `
        SELECT swm.*, so.sales_order_number, w.warehouse_name, m.user_name as manager_name, 
               op.product_name as order_product_name, bp.product_name as buying_product_name, u.user_name as created_by_name
        FROM sales_warehouse_movements swm
        LEFT JOIN sales_orders so ON swm.sales_order_id = so.id
        LEFT JOIN warehouses w ON swm.warehouse_id = w.id
        LEFT JOIN users m ON swm.manager_id = m.id
        LEFT JOIN products op ON swm.order_product_id = op.id
        LEFT JOIN products bp ON swm.buying_product_id = bp.id
        LEFT JOIN users u ON swm.created_by = u.id
        WHERE swm.is_deleted = 0
        ORDER BY swm.created_at DESC
    `;
    
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getSalesWarehouseMovementById = (req, res) => {
    const sql = `
        SELECT swm.*, so.sales_order_number, w.warehouse_name, m.user_name as manager_name, 
               op.product_name as order_product_name, bp.product_name as buying_product_name, u.user_name as created_by_name
        FROM sales_warehouse_movements swm
        LEFT JOIN sales_orders so ON swm.sales_order_id = so.id
        LEFT JOIN warehouses w ON swm.warehouse_id = w.id
        LEFT JOIN users m ON swm.manager_id = m.id
        LEFT JOIN products op ON swm.order_product_id = op.id
        LEFT JOIN products bp ON swm.buying_product_id = bp.id
        LEFT JOIN users u ON swm.created_by = u.id
        WHERE swm.id = ? AND swm.is_deleted = 0
    `;
    
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Sales warehouse movement not found' });
        res.json(results[0]);
    });
};

exports.updateSalesWarehouseMovement = (req, res) => {
    const { 
        sales_order_id, 
        warehouse_id, 
        manager_id, 
        order_product_id, 
        buying_product_id, 
        order_quantity, 
        buying_quantity, 
        remarks 
    } = req.body;
    
    db.query(
        'UPDATE sales_warehouse_movements SET sales_order_id=?, warehouse_id=?, manager_id=?, order_product_id=?, buying_product_id=?, order_quantity=?, buying_quantity=?, remarks=? WHERE id=? AND is_deleted=0',
        [sales_order_id, warehouse_id, manager_id, order_product_id, buying_product_id, order_quantity, buying_quantity, remarks, req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Sales warehouse movement not found' });
            res.json({ message: 'Sales warehouse movement updated successfully' });
        }
    );
};

exports.deleteSalesWarehouseMovement = (req, res) => {
    db.query('UPDATE sales_warehouse_movements SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Sales warehouse movement not found' });
        res.json({ message: 'Sales warehouse movement deleted successfully' });
    });
};

exports.getSalesWarehouseMovementsBySalesOrder = (req, res) => {
    const { sales_order_id } = req.params;
    
    const sql = `
        SELECT swm.*, so.sales_order_number, w.warehouse_name, m.user_name as manager_name, 
               op.product_name as order_product_name, bp.product_name as buying_product_name, u.user_name as created_by_name
        FROM sales_warehouse_movements swm
        LEFT JOIN sales_orders so ON swm.sales_order_id = so.id
        LEFT JOIN warehouses w ON swm.warehouse_id = w.id
        LEFT JOIN users m ON swm.manager_id = m.id
        LEFT JOIN products op ON swm.order_product_id = op.id
        LEFT JOIN products bp ON swm.buying_product_id = bp.id
        LEFT JOIN users u ON swm.created_by = u.id
        WHERE swm.sales_order_id = ? AND swm.is_deleted = 0
        ORDER BY swm.created_at DESC
    `;
    
    db.query(sql, [sales_order_id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getSalesWarehouseMovementsByWarehouse = (req, res) => {
    const { warehouse_id } = req.params;
    
    const sql = `
        SELECT swm.*, so.sales_order_number, w.warehouse_name, m.user_name as manager_name, 
               op.product_name as order_product_name, bp.product_name as buying_product_name, u.user_name as created_by_name
        FROM sales_warehouse_movements swm
        LEFT JOIN sales_orders so ON swm.sales_order_id = so.id
        LEFT JOIN warehouses w ON swm.warehouse_id = w.id
        LEFT JOIN users m ON swm.manager_id = m.id
        LEFT JOIN products op ON swm.order_product_id = op.id
        LEFT JOIN products bp ON swm.buying_product_id = bp.id
        LEFT JOIN users u ON swm.created_by = u.id
        WHERE swm.warehouse_id = ? AND swm.is_deleted = 0
        ORDER BY swm.created_at DESC
    `;
    
    db.query(sql, [warehouse_id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
}; 