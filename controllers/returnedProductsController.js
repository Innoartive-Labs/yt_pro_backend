const db = require('../utils/db');

// Helper function to update product stocks for warehouse changes
function updateProductStocksForWarehouseChange(oldWarehouseId, newWarehouseId, productId, oldQuantity, newQuantity, db, callback) {
    // Remove quantity from old warehouse stock
    db.query(
        'SELECT id, quantity FROM product_stocks WHERE product_id = ? AND warehouse_id = ? AND is_deleted = 0',
        [productId, oldWarehouseId],
        (err, oldStockResult) => {
            if (err) return callback(err);
            
            if (oldStockResult.length > 0) {
                const oldStock = oldStockResult[0];
                const newOldQuantity = Math.max(0, oldStock.quantity - oldQuantity);
                
                if (newOldQuantity === 0) {
                    // Delete the stock record if quantity becomes 0
                    db.query('UPDATE product_stocks SET is_deleted = 1 WHERE id = ?', [oldStock.id], (err) => {
                        if (err) return callback(err);
                        addQuantityToNewWarehouse();
                    });
                } else {
                    // Update the stock record
                    db.query('UPDATE product_stocks SET quantity = ? WHERE id = ?', [newOldQuantity, oldStock.id], (err) => {
                        if (err) return callback(err);
                        addQuantityToNewWarehouse();
                    });
                }
            } else {
                addQuantityToNewWarehouse();
            }
        }
    );
    
    function addQuantityToNewWarehouse() {
        // Add quantity to new warehouse stock
        db.query(
            'SELECT id, quantity FROM product_stocks WHERE product_id = ? AND warehouse_id = ? AND is_deleted = 0',
            [productId, newWarehouseId],
            (err, newStockResult) => {
                if (err) return callback(err);
                
                if (newStockResult.length > 0) {
                    // Update existing stock
                    const newStock = newStockResult[0];
                    db.query('UPDATE product_stocks SET quantity = quantity + ? WHERE id = ?', [newQuantity, newStock.id], (err) => {
                        if (err) return callback(err);
                        callback(null);
                    });
                } else {
                    // Create new stock record
                    db.query('INSERT INTO product_stocks (product_id, warehouse_id, quantity) VALUES (?, ?, ?)', [productId, newWarehouseId, newQuantity], (err) => {
                        if (err) return callback(err);
                        callback(null);
                    });
                }
            }
        );
    }
}

// Helper function to update product stocks for quantity changes
function updateProductStocksForQuantityChange(warehouseId, productId, quantityDifference, db, callback) {
    db.query(
        'SELECT id, quantity FROM product_stocks WHERE product_id = ? AND warehouse_id = ? AND is_deleted = 0',
        [productId, warehouseId],
        (err, stockResult) => {
            if (err) return callback(err);
            
            if (stockResult.length > 0) {
                const stock = stockResult[0];
                const newQuantity = Math.max(0, stock.quantity + quantityDifference);
                
                if (newQuantity === 0) {
                    // Delete the stock record if quantity becomes 0
                    db.query('UPDATE product_stocks SET is_deleted = 1 WHERE id = ?', [stock.id], (err) => {
                        if (err) return callback(err);
                        callback(null);
                    });
                } else {
                    // Update the stock record
                    db.query('UPDATE product_stocks SET quantity = ? WHERE id = ?', [newQuantity, stock.id], (err) => {
                        if (err) return callback(err);
                        callback(null);
                    });
                }
            } else if (quantityDifference > 0) {
                // Create new stock record for positive quantity difference
                db.query('INSERT INTO product_stocks (product_id, warehouse_id, quantity) VALUES (?, ?, ?)', [productId, warehouseId, quantityDifference], (err) => {
                    if (err) return callback(err);
                    callback(null);
                });
            } else {
                callback(null);
            }
        }
    );
}

exports.createReturnedProduct = (req, res) => {
    const { 
        received_purchase_id, 
        product_id, 
        quantity, 
        warehouse_id, 
        remarks, 
        returned_date 
    } = req.body;
    
    const created_by = req.user.id;
    const returned_image = req.file ? req.file.filename : null;
    
    // Start transaction
    db.beginTransaction((err) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        
        // Insert returned product
        db.query(
            'INSERT INTO returned_products (received_purchase_id, product_id, quantity, warehouse_id, remarks, returned_image, returned_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [received_purchase_id, product_id, quantity, warehouse_id, remarks, returned_image, returned_date, created_by],
            (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ message: 'Database error', error: err });
                    });
                }
                
                // Update warehouse capacity (increase since items are being returned)
                db.query(
                    'UPDATE warehouses SET capacity_left = capacity_left + ? WHERE id = ?',
                    [quantity, warehouse_id],
                    (err, updateResult) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ message: 'Database error', error: err });
                            });
                        }
                        
                        // Update product stocks (increase since items are being returned)
                        updateProductStocksForQuantityChange(warehouse_id, product_id, quantity, db, (err) => {
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
                                res.status(201).json({ id: result.insertId, message: 'Returned product created successfully' });
                            });
                        });
                    }
                );
            }
        );
    });
};

exports.getAllReturnedProducts = (req, res) => {
    const sql = `
        SELECT rp.*, rcp.received_date, p.product_name, w.warehouse_name, u.user_name as created_by_name
        FROM returned_products rp
        LEFT JOIN received_purchases rcp ON rp.received_purchase_id = rcp.id
        LEFT JOIN products p ON rp.product_id = p.id
        LEFT JOIN warehouses w ON rp.warehouse_id = w.id
        LEFT JOIN users u ON rp.created_by = u.id
        WHERE rp.is_deleted = 0
        ORDER BY rp.created_at DESC
    `;
    
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getReturnedProductById = (req, res) => {
    const sql = `
        SELECT rp.*, rcp.received_date, p.product_name, w.warehouse_name, u.user_name as created_by_name
        FROM returned_products rp
        LEFT JOIN received_purchases rcp ON rp.received_purchase_id = rcp.id
        LEFT JOIN products p ON rp.product_id = p.id
        LEFT JOIN warehouses w ON rp.warehouse_id = w.id
        LEFT JOIN users u ON rp.created_by = u.id
        WHERE rp.id = ? AND rp.is_deleted = 0
    `;
    
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Returned product not found' });
        res.json(results[0]);
    });
};

exports.updateReturnedProduct = (req, res) => {
    const { 
        received_purchase_id, 
        product_id, 
        quantity, 
        warehouse_id, 
        remarks, 
        returned_date 
    } = req.body;
    
    const returned_image = req.file ? req.file.filename : req.body.returned_image;
    
    // First get the current returned product to calculate capacity changes
    db.query('SELECT quantity, warehouse_id FROM returned_products WHERE id = ? AND is_deleted = 0', [req.params.id], (err, currentResult) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (currentResult.length === 0) return res.status(404).json({ message: 'Returned product not found' });
        
        const currentProduct = currentResult[0];
        const oldQuantity = currentProduct.quantity;
        const oldWarehouseId = currentProduct.warehouse_id;
        const newQuantity = parseInt(quantity);
        const newWarehouseId = parseInt(warehouse_id);
        
        // Calculate capacity changes
        const quantityDifference = newQuantity - oldQuantity;
        const warehouseChanged = oldWarehouseId !== newWarehouseId;
        
        // Start transaction
        db.beginTransaction((err) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            
            // Update returned product
            db.query(
                'UPDATE returned_products SET received_purchase_id=?, product_id=?, quantity=?, warehouse_id=?, remarks=?, returned_image=?, returned_date=? WHERE id=? AND is_deleted=0',
                [received_purchase_id, product_id, quantity, warehouse_id, remarks, returned_image, returned_date, req.params.id],
                (err, result) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ message: 'Database error', error: err });
                        });
                    }
                    
                    // Handle warehouse capacity and product stocks updates
                    if (warehouseChanged) {
                        // Remove quantity from old warehouse
                        db.query(
                            'UPDATE warehouses SET capacity_left = capacity_left - ? WHERE id = ?',
                            [oldQuantity, oldWarehouseId],
                            (err, oldWarehouseResult) => {
                                if (err) {
                                    return db.rollback(() => {
                                        res.status(500).json({ message: 'Database error', error: err });
                                    });
                                }
                                
                                // Add quantity to new warehouse
                                db.query(
                                    'UPDATE warehouses SET capacity_left = capacity_left + ? WHERE id = ?',
                                    [newQuantity, newWarehouseId],
                                    (err, newWarehouseResult) => {
                                        if (err) {
                                            return db.rollback(() => {
                                                res.status(500).json({ message: 'Database error', error: err });
                                            });
                                        }
                                        
                                        // Update product stocks for warehouse change
                                        updateProductStocksForWarehouseChange(oldWarehouseId, newWarehouseId, product_id, oldQuantity, newQuantity, db, (err) => {
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
                                                res.json({ message: 'Returned product updated successfully' });
                                            });
                                        });
                                    }
                                );
                            }
                        );
                    } else {
                        // Same warehouse, just quantity change
                        db.query(
                            'UPDATE warehouses SET capacity_left = capacity_left + ? WHERE id = ?',
                            [quantityDifference, newWarehouseId],
                            (err, updateResult) => {
                                if (err) {
                                    return db.rollback(() => {
                                        res.status(500).json({ message: 'Database error', error: err });
                                    });
                                }
                                
                                // Update product stocks for quantity change
                                updateProductStocksForQuantityChange(newWarehouseId, product_id, quantityDifference, db, (err) => {
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
                                        res.json({ message: 'Returned product updated successfully' });
                                    });
                                });
                            }
                        );
                    }
                }
            );
        });
    });
};

exports.deleteReturnedProduct = (req, res) => {
    // First get the returned product details to restore warehouse capacity
    db.query('SELECT quantity, warehouse_id, product_id FROM returned_products WHERE id = ? AND is_deleted = 0', [req.params.id], (err, productResult) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (productResult.length === 0) return res.status(404).json({ message: 'Returned product not found' });
        
        const product = productResult[0];
        
        // Start transaction
        db.beginTransaction((err) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            
            // Soft delete the returned product
            db.query('UPDATE returned_products SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ message: 'Database error', error: err });
                    });
                }
                
                // Restore warehouse capacity (decrease since returned product is being deleted)
                db.query(
                    'UPDATE warehouses SET capacity_left = capacity_left - ? WHERE id = ?',
                    [product.quantity, product.warehouse_id],
                    (err, updateResult) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ message: 'Database error', error: err });
                            });
                        }
                        
                        // Update product stocks (decrease since returned product is being deleted)
                        updateProductStocksForQuantityChange(product.warehouse_id, product.product_id, -product.quantity, db, (err) => {
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
                                res.json({ message: 'Returned product deleted successfully' });
                            });
                        });
                    }
                );
            });
        });
    });
};

exports.getReturnedProductsByReceivedPurchase = (req, res) => {
    const { received_purchase_id } = req.params;
    
    const sql = `
        SELECT rp.*, rcp.received_date, p.product_name, w.warehouse_name, u.user_name as created_by_name
        FROM returned_products rp
        LEFT JOIN received_purchases rcp ON rp.received_purchase_id = rcp.id
        LEFT JOIN products p ON rp.product_id = p.id
        LEFT JOIN warehouses w ON rp.warehouse_id = w.id
        LEFT JOIN users u ON rp.created_by = u.id
        WHERE rp.received_purchase_id = ? AND rp.is_deleted = 0
        ORDER BY rp.created_at DESC
    `;
    
    db.query(sql, [received_purchase_id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
}; 