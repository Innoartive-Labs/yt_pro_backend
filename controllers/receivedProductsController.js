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

// Helper function to update product stocks for quantity changes in same warehouse
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

// Helper function to handle purchase_prices
function handlePurchasePrices(product_id, supplier_id, rate_received, db, callback, created_by = 1) {
    if (!supplier_id) {
        // If no supplier_id, skip purchase_prices handling
        return callback(null);
    }
    
    // Check if purchase_prices record already exists for this product and supplier
    db.query(
        'SELECT id FROM purchase_prices WHERE product_id = ? AND supplier_id = ? AND is_deleted = 0',
        [product_id, supplier_id],
        (err, purchasePriceResult) => {
            if (err) return callback(err);
            
            if (purchasePriceResult.length > 0) {
                // Update existing purchase_prices record
                db.query(
                    'UPDATE purchase_prices SET price = ? WHERE product_id = ? AND supplier_id = ? AND is_deleted = 0',
                    [rate_received, product_id, supplier_id],
                    (err) => {
                        if (err) return callback(err);
                        callback(null);
                    }
                );
            } else {
                // Insert new purchase_prices record
                db.query(
                    'INSERT INTO purchase_prices (product_id, supplier_id, price, created_by) VALUES (?, ?, ?, ?)',
                    [product_id, supplier_id, rate_received, created_by],
                    (err) => {
                        if (err) return callback(err);
                        callback(null);
                    }
                );
            }
        }
    );
}

exports.createReceivedProduct = (req, res) => {
    const { 
        purchase_order_id, 
        received_purchase_id, 
        company_id, 
        product_id, 
        quantity, 
        warehouse_id
    } = req.body;
    
    const created_by = req.user.id;
    
    // First check if warehouse has enough capacity
    db.query('SELECT capacity_left FROM warehouses WHERE id = ? AND is_deleted = 0', [warehouse_id], (err, warehouseResult) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (warehouseResult.length === 0) return res.status(404).json({ message: 'Warehouse not found' });
        
        const warehouse = warehouseResult[0];
        if (warehouse.capacity_left < quantity) {
            return res.status(400).json({ 
                message: 'Insufficient warehouse capacity', 
                available: warehouse.capacity_left, 
                requested: quantity 
            });
        }
        
        // Start transaction
        db.beginTransaction((err) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            
            // Insert received product
            db.query(
                'INSERT INTO received_products (purchase_order_id, received_purchase_id, company_id, product_id, quantity, warehouse_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [purchase_order_id, received_purchase_id, company_id, product_id, quantity, warehouse_id, created_by],
                (err, result) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ message: 'Database error', error: err });
                        });
                    }
                    
                    // Update warehouse capacity
                    db.query(
                        'UPDATE warehouses SET capacity_left = capacity_left - ? WHERE id = ?',
                        [quantity, warehouse_id],
                        (err, updateResult) => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).json({ message: 'Database error', error: err });
                                });
                            }
                            
                            // Check if product stock exists for this product-warehouse combination
                            db.query(
                                'SELECT id, quantity FROM product_stocks WHERE product_id = ? AND warehouse_id = ? AND is_deleted = 0',
                                [product_id, warehouse_id],
                                (err, stockResult) => {
                                    if (err) {
                                        return db.rollback(() => {
                                            res.status(500).json({ message: 'Database error', error: err });
                                        });
                                    }
                                    
                                    if (stockResult.length > 0) {
                                        // Update existing stock
                                        const currentStock = stockResult[0];
                                        db.query(
                                            'UPDATE product_stocks SET quantity = quantity + ? WHERE id = ?',
                                            [quantity, currentStock.id],
                                            (err, stockUpdateResult) => {
                                                if (err) {
                                                    return db.rollback(() => {
                                                        res.status(500).json({ message: 'Database error', error: err });
                                                    });
                                                }
                                                
                                                // Update purchase order status if purchase_order_id exists
                                                if (purchase_order_id) {
                                                    updatePurchaseOrderStatus(purchase_order_id, product_id, quantity, (err) => {
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
                                                            res.status(201).json({ id: result.insertId, message: 'Received product created successfully' });
                                                        });
                                                    });
                                                } else {
                                                    // Commit transaction
                                                    db.commit((err) => {
                                                        if (err) {
                                                            return db.rollback(() => {
                                                                res.status(500).json({ message: 'Database error', error: err });
                                                            });
                                                        }
                                                        res.status(201).json({ id: result.insertId, message: 'Received product created successfully' });
                                                    });
                                                }
                                            }
                                        );
                                    } else {
                                        // Create new stock record
                                        db.query(
                                            'INSERT INTO product_stocks (product_id, warehouse_id, quantity) VALUES (?, ?, ?)',
                                            [product_id, warehouse_id, quantity],
                                            (err, stockInsertResult) => {
                                                if (err) {
                                                    return db.rollback(() => {
                                                        res.status(500).json({ message: 'Database error', error: err });
                                                    });
                                                }
                                                
                                                // Update purchase order status if purchase_order_id exists
                                                if (purchase_order_id) {
                                                    updatePurchaseOrderStatus(purchase_order_id, product_id, quantity, (err) => {
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
                                                            res.status(201).json({ id: result.insertId, message: 'Received product created successfully' });
                                                        });
                                                    });
                                                } else {
                                                    // Commit transaction
                                                    db.commit((err) => {
                                                        if (err) {
                                                            return db.rollback(() => {
                                                                res.status(500).json({ message: 'Database error', error: err });
                                                            });
                                                        }
                                                        res.status(201).json({ id: result.insertId, message: 'Received product created successfully' });
                                                    });
                                                }
                                            }
                                        );
                                    }
                                }
                            );
                        }
                    );
                }
            );
        });
    });
};

// Helper function to update purchase order status
const updatePurchaseOrderStatus = (purchaseOrderId, productId, receivedQuantity, callback) => {
    // Get the purchase order details and total ordered quantity for this product
    db.query(
        'SELECT po.id, po.purchase_order_status, po.quantity as ordered_quantity FROM purchase_orders po ' +
        'WHERE po.id = ? AND po.is_deleted = 0',
        [purchaseOrderId],
        (err, poResult) => {
            if (err) return callback(err);
            if (poResult.length === 0) return callback(new Error('Purchase order not found'));
            
            const purchaseOrder = poResult[0];
            const orderedQuantity = purchaseOrder.ordered_quantity;
            
            // Get total received quantity for this product in this purchase order
            // If receivedQuantity is 0, it means we're deleting, so we need to get the current total from DB
            db.query(
                'SELECT COALESCE(SUM(quantity), 0) as total_received FROM received_products ' +
                'WHERE purchase_order_id = ? AND product_id = ? AND is_deleted = 0',
                [purchaseOrderId, productId],
                (err, receivedResult) => {
                    if (err) return callback(err);
                    
                    const totalReceived = receivedResult[0].total_received;
                    let newStatus = purchaseOrder.status;
                    
                    // Determine new status based on received vs ordered quantities
                    if (totalReceived >= orderedQuantity) {
                        newStatus = 'received';
                    } else if (totalReceived > 0) {
                        newStatus = 'partial-received';
                    } else {
                        // No received quantity, reset to original status or 'pending'
                        newStatus = 'pending';
                    }
                    
                    // Update purchase order status if it changed
                    if (newStatus !== purchaseOrder.status) {
                        db.query(
                            'UPDATE purchase_orders SET purchase_order_status = ? WHERE id = ?',
                            [newStatus, purchaseOrderId],
                            (err, updateResult) => {
                                if (err) return callback(err);
                                callback(null);
                            }
                        );
                    } else {
                        callback(null);
                    }
                }
            );
        }
    );
};

exports.getAllReceivedProducts = (req, res) => {
    const sql = `
        SELECT rp.*, po.purchase_order_number, rcp.received_date, c.company_name, p.product_name, w.warehouse_name, u.user_name as created_by_name
        FROM received_products rp
        LEFT JOIN purchase_orders po ON rp.purchase_order_id = po.id
        LEFT JOIN received_purchases rcp ON rp.received_purchase_id = rcp.id
        LEFT JOIN my_companies c ON rp.company_id = c.id
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

exports.getReceivedProductById = (req, res) => {
    const sql = `
        SELECT rp.*, po.purchase_order_number, rcp.received_date, c.company_name, p.product_name, w.warehouse_name, u.user_name as created_by_name
        FROM received_products rp
        LEFT JOIN purchase_orders po ON rp.purchase_order_id = po.id
        LEFT JOIN received_purchases rcp ON rp.received_purchase_id = rcp.id
        LEFT JOIN my_companies c ON rp.company_id = c.id
        LEFT JOIN products p ON rp.product_id = p.id
        LEFT JOIN warehouses w ON rp.warehouse_id = w.id
        LEFT JOIN users u ON rp.created_by = u.id
        WHERE rp.id = ? AND rp.is_deleted = 0
    `;
    
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Received product not found' });
        res.json(results[0]);
    });
};

exports.updateReceivedProduct = (req, res) => {
    const { 
        purchase_order_id, 
        received_purchase_id, 
        company_id, 
        product_id, 
        quantity, 
        warehouse_id, 
        rate_received 
    } = req.body;
    
    const invoice_image = req.file ? req.file.filename : req.body.invoice_image;
    
    // First get the current received product to calculate capacity changes
    db.query('SELECT quantity, warehouse_id FROM received_products WHERE id = ? AND is_deleted = 0', [req.params.id], (err, currentResult) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (currentResult.length === 0) return res.status(404).json({ message: 'Received product not found' });
        
        const currentProduct = currentResult[0];
        const oldQuantity = currentProduct.quantity;
        const oldWarehouseId = currentProduct.warehouse_id;
        const newQuantity = parseInt(quantity);
        const newWarehouseId = parseInt(warehouse_id);
        
        // Calculate capacity changes
        const quantityDifference = newQuantity - oldQuantity;
        const warehouseChanged = oldWarehouseId !== newWarehouseId;
        
        // If warehouse changed, we need to handle both warehouses
        if (warehouseChanged) {
            // Check if new warehouse has enough capacity
            db.query('SELECT capacity_left FROM warehouses WHERE id = ? AND is_deleted = 0', [newWarehouseId], (err, warehouseResult) => {
                if (err) return res.status(500).json({ message: 'Database error', error: err });
                if (warehouseResult.length === 0) return res.status(404).json({ message: 'New warehouse not found' });
                
                const newWarehouse = warehouseResult[0];
                if (newWarehouse.capacity_left < newQuantity) {
                    return res.status(400).json({ 
                        message: 'Insufficient warehouse capacity in new warehouse', 
                        available: newWarehouse.capacity_left, 
                        requested: newQuantity 
                    });
                }
                
                // Start transaction for warehouse change
                db.beginTransaction((err) => {
                    if (err) return res.status(500).json({ message: 'Database error', error: err });
                    
                    // Update received product
                    db.query(
                        'UPDATE received_products SET purchase_order_id=?, received_purchase_id=?, company_id=?, product_id=?, quantity=?, warehouse_id=?, invoice_image=?, rate_received=? WHERE id=? AND is_deleted=0',
                        [purchase_order_id, received_purchase_id, company_id, product_id, quantity, warehouse_id, invoice_image, rate_received, req.params.id],
                        (err, result) => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).json({ message: 'Database error', error: err });
                                });
                            }
                            
                            // Update old warehouse capacity (add back the old quantity)
                            db.query(
                                'UPDATE warehouses SET capacity_left = capacity_left + ? WHERE id = ?',
                                [oldQuantity, oldWarehouseId],
                                (err, oldWarehouseResult) => {
                                    if (err) {
                                        return db.rollback(() => {
                                            res.status(500).json({ message: 'Database error', error: err });
                                        });
                                    }
                                    
                                    // Update new warehouse capacity (subtract the new quantity)
                                    db.query(
                                        'UPDATE warehouses SET capacity_left = capacity_left - ? WHERE id = ?',
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
                                                
                                                // Update purchase order status if purchase_order_id exists
                                                if (purchase_order_id) {
                                                    updatePurchaseOrderStatus(purchase_order_id, product_id, newQuantity, (err) => {
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
                                                            res.json({ message: 'Received product updated successfully' });
                                                        });
                                                    });
                                                } else {
                                                    // Commit transaction
                                                    db.commit((err) => {
                                                        if (err) {
                                                            return db.rollback(() => {
                                                                res.status(500).json({ message: 'Database error', error: err });
                                                            });
                                                        }
                                                        res.json({ message: 'Received product updated successfully' });
                                                    });
                                                }
                                            });
                                        }
                                    );
                                }
                            );
                        }
                    );
                });
            });
        } else {
            // Same warehouse, just quantity change
            if (quantityDifference !== 0) {
                // Check if warehouse has enough capacity for the increase
                if (quantityDifference > 0) {
                    db.query('SELECT capacity_left FROM warehouses WHERE id = ? AND is_deleted = 0', [newWarehouseId], (err, warehouseResult) => {
                        if (err) return res.status(500).json({ message: 'Database error', error: err });
                        if (warehouseResult.length === 0) return res.status(404).json({ message: 'Warehouse not found' });
                        
                        const warehouse = warehouseResult[0];
                        if (warehouse.capacity_left < quantityDifference) {
                            return res.status(400).json({ 
                                message: 'Insufficient warehouse capacity', 
                                available: warehouse.capacity_left, 
                                requested: quantityDifference 
                            });
                        }
                        
                        // Start transaction for quantity change
                        db.beginTransaction((err) => {
                            if (err) return res.status(500).json({ message: 'Database error', error: err });
                            
                            // Update received product
                            db.query(
                                'UPDATE received_products SET purchase_order_id=?, received_purchase_id=?, company_id=?, product_id=?, quantity=?, warehouse_id=?, invoice_image=?, rate_received=? WHERE id=? AND is_deleted=0',
                                [purchase_order_id, received_purchase_id, company_id, product_id, quantity, warehouse_id, invoice_image, rate_received, req.params.id],
                                (err, result) => {
                                    if (err) {
                                        return db.rollback(() => {
                                            res.status(500).json({ message: 'Database error', error: err });
                                        });
                                    }
                                    
                                    // Update warehouse capacity
                                    db.query(
                                        'UPDATE warehouses SET capacity_left = capacity_left - ? WHERE id = ?',
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
                                                
                                                // Update purchase order status if purchase_order_id exists
                                                if (purchase_order_id) {
                                                    updatePurchaseOrderStatus(purchase_order_id, product_id, newQuantity, (err) => {
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
                                                            res.json({ message: 'Received product updated successfully' });
                                                        });
                                                    });
                                                } else {
                                                    // Commit transaction
                                                    db.commit((err) => {
                                                        if (err) {
                                                            return db.rollback(() => {
                                                                res.status(500).json({ message: 'Database error', error: err });
                                                            });
                                                        }
                                                        res.json({ message: 'Received product updated successfully' });
                                                    });
                                                }
                                            });
                                        }
                                    );
                                }
                            );
                        });
                    });
                } else {
                    // Quantity decreased, no need to check capacity
                    db.beginTransaction((err) => {
                        if (err) return res.status(500).json({ message: 'Database error', error: err });
                        
                        // Update received product
                        db.query(
                            'UPDATE received_products SET purchase_order_id=?, received_purchase_id=?, company_id=?, product_id=?, quantity=?, warehouse_id=?, invoice_image=?, rate_received=? WHERE id=? AND is_deleted=0',
                            [purchase_order_id, received_purchase_id, company_id, product_id, quantity, warehouse_id, invoice_image, rate_received, req.params.id],
                            (err, result) => {
                                if (err) {
                                    return db.rollback(() => {
                                        res.status(500).json({ message: 'Database error', error: err });
                                    });
                                }
                                
                                // Update warehouse capacity (add back the difference since quantity decreased)
                                db.query(
                                    'UPDATE warehouses SET capacity_left = capacity_left + ? WHERE id = ?',
                                    [Math.abs(quantityDifference), newWarehouseId],
                                    (err, updateResult) => {
                                        if (err) {
                                            return db.rollback(() => {
                                                res.status(500).json({ message: 'Database error', error: err });
                                            });
                                        }
                                        
                                        // Update product stocks for quantity change (decrease)
                                        updateProductStocksForQuantityChange(newWarehouseId, product_id, quantityDifference, db, (err) => {
                                            if (err) {
                                                return db.rollback(() => {
                                                    res.status(500).json({ message: 'Database error', error: err });
                                                });
                                            }
                                            
                                            // Update purchase order status if purchase_order_id exists
                                            if (purchase_order_id) {
                                                updatePurchaseOrderStatus(purchase_order_id, product_id, newQuantity, (err) => {
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
                                                        res.json({ message: 'Received product updated successfully' });
                                                    });
                                                });
                                            } else {
                                                // Commit transaction
                                                db.commit((err) => {
                                                    if (err) {
                                                        return db.rollback(() => {
                                                            res.status(500).json({ message: 'Database error', error: err });
                                                        });
                                                    }
                                                    res.json({ message: 'Received product updated successfully' });
                                                });
                                            }
                                        });
                                    }
                                );
                            }
                        );
                    });
                }
            } else {
                // No quantity change, just update the product
                db.query(
                    'UPDATE received_products SET purchase_order_id=?, received_purchase_id=?, company_id=?, product_id=?, quantity=?, warehouse_id=?, invoice_image=?, rate_received=? WHERE id=? AND is_deleted=0',
                    [purchase_order_id, received_purchase_id, company_id, product_id, quantity, warehouse_id, invoice_image, rate_received, req.params.id],
                    (err, result) => {
                        if (err) return res.status(500).json({ message: 'Database error', error: err });
                        if (result.affectedRows === 0) return res.status(404).json({ message: 'Received product not found' });
                        
                        // Update purchase order status if purchase_order_id exists (even if quantity didn't change, product_id might have changed)
                        if (purchase_order_id) {
                            updatePurchaseOrderStatus(purchase_order_id, product_id, quantity, (err) => {
                                if (err) return res.status(500).json({ message: 'Database error', error: err });
                                res.json({ message: 'Received product updated successfully' });
                            });
                        } else {
                            res.json({ message: 'Received product updated successfully' });
                        }
                    }
                );
            }
        }
    });
};

exports.updateReceivedProductWithPricing = (req, res) => {
    const { 
        rate_received,
        sale_price,
        expected_selling_price
    } = req.body;
    
    const created_by = req.user.id;
    
    const invoice_image = req.file ? req.file.filename : req.body.invoice_image;
    const received_product_id = req.params.id;
    
    // Validate required fields
    if (!rate_received || !sale_price || !expected_selling_price) {
        return res.status(400).json({ 
            message: 'rate_received, sale_price, and expected_selling_price are required' 
        });
    }
    
    // Start transaction
    db.beginTransaction((err) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        
        // First get the received product details
        db.query(
            'SELECT rp.*, po.id as purchase_order_id, po.supplier_id FROM received_products rp LEFT JOIN purchase_orders po ON rp.purchase_order_id = po.id WHERE rp.id = ? AND rp.is_deleted = 0',
            [received_product_id],
            (err, receivedProductResult) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ message: 'Database error', error: err });
                    });
                }
                
                if (receivedProductResult.length === 0) {
                    return db.rollback(() => {
                        res.status(404).json({ message: 'Received product not found' });
                    });
                }
                
                const receivedProduct = receivedProductResult[0];
                const product_id = receivedProduct.product_id;
                const purchase_order_id = receivedProduct.purchase_order_id;
                const supplier_id = receivedProduct.supplier_id;
                
                // Update received product with rate_received and invoice_image
                db.query(
                    'UPDATE received_products SET rate_received = ?, invoice_image = ? WHERE id = ? AND is_deleted = 0',
                    [rate_received, invoice_image, received_product_id],
                    (err, updateResult) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ message: 'Database error', error: err });
                            });
                        }
                        
                        // Check if product_prices record already exists for this product
                        db.query(
                            'SELECT id FROM product_prices WHERE product_id = ? AND is_deleted = 0',
                            [product_id],
                            (err, priceResult) => {
                                if (err) {
                                    return db.rollback(() => {
                                        res.status(500).json({ message: 'Database error', error: err });
                                    });
                                }
                                
                                if (priceResult.length > 0) {
                                    // Update existing product_prices record (only selling prices)
                                    db.query(
                                        'UPDATE product_prices SET selling_price = ?, expected_selling_price = ? WHERE product_id = ? AND is_deleted = 0',
                                        [sale_price, expected_selling_price, product_id],
                                        (err, priceUpdateResult) => {
                                            if (err) {
                                                return db.rollback(() => {
                                                    res.status(500).json({ message: 'Database error', error: err });
                                                });
                                            }
                                            
                                            // Handle purchase_prices
                                            handlePurchasePrices(product_id, supplier_id, rate_received, db, (err) => {
                                                if (err) {
                                                    return db.rollback(() => {
                                                        res.status(500).json({ message: 'Database error', error: err });
                                                    });
                                                }
                                                
                                                // Update purchase order status if purchase_order_id exists
                                                if (purchase_order_id) {
                                                    updatePurchaseOrderStatus(purchase_order_id, product_id, receivedProduct.quantity, (err) => {
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
                                                            res.json({ 
                                                                message: 'Received product updated successfully with pricing',
                                                                received_product_id: received_product_id,
                                                                product_id: product_id,
                                                                purchase_order_id: purchase_order_id
                                                            });
                                                        });
                                                    });
                                                } else {
                                                    // Commit transaction
                                                    db.commit((err) => {
                                                        if (err) {
                                                            return db.rollback(() => {
                                                                res.status(500).json({ message: 'Database error', error: err });
                                                            });
                                                        }
                                                        res.json({ 
                                                            message: 'Received product updated successfully with pricing',
                                                            received_product_id: received_product_id,
                                                            product_id: product_id
                                                        });
                                                    });
                                                }
                                            });
                                        }
                                    );
                                } else {
                                    // Insert new product_prices record
                                    db.query(
                                        'INSERT INTO product_prices (product_id, selling_price, expected_selling_price) VALUES (?, ?, ?)',
                                        [product_id, sale_price, expected_selling_price],
                                        (err, priceInsertResult) => {
                                            if (err) {
                                                return db.rollback(() => {
                                                    res.status(500).json({ message: 'Database error', error: err });
                                                });
                                            }
                                            
                                            // Handle purchase_prices
                                            handlePurchasePrices(product_id, supplier_id, rate_received, db, (err) => {
                                                if (err) {
                                                    return db.rollback(() => {
                                                        res.status(500).json({ message: 'Database error', error: err });
                                                    });
                                                }
                                                
                                                // Update purchase order status if purchase_order_id exists
                                                if (purchase_order_id) {
                                                    updatePurchaseOrderStatus(purchase_order_id, product_id, receivedProduct.quantity, (err) => {
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
                                                            res.json({ 
                                                                message: 'Received product updated successfully with pricing',
                                                                received_product_id: received_product_id,
                                                                product_id: product_id,
                                                                purchase_order_id: purchase_order_id
                                                            });
                                                        });
                                                    });
                                                } else {
                                                    // Commit transaction
                                                    db.commit((err) => {
                                                        if (err) {
                                                            return db.rollback(() => {
                                                                res.status(500).json({ message: 'Database error', error: err });
                                                            });
                                                        }
                                                        res.json({ 
                                                            message: 'Received product updated successfully with pricing',
                                                            received_product_id: received_product_id,
                                                            product_id: product_id
                                                        });
                                                    });
                                                }
                                            });
                                        }
                                    );
                                }
                            }
                        );
                    }
                );
            }
        );
    });
};

exports.deleteReceivedProduct = (req, res) => {
    // First get the received product details to restore warehouse capacity
    db.query('SELECT quantity, warehouse_id, product_id, purchase_order_id FROM received_products WHERE id = ? AND is_deleted = 0', [req.params.id], (err, productResult) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (productResult.length === 0) return res.status(404).json({ message: 'Received product not found' });
        
        const product = productResult[0];
        
        // Start transaction
        db.beginTransaction((err) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            
            // Soft delete the received product
            db.query('UPDATE received_products SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ message: 'Database error', error: err });
                    });
                }
                
                // Restore warehouse capacity
                db.query(
                    'UPDATE warehouses SET capacity_left = capacity_left + ? WHERE id = ?',
                    [product.quantity, product.warehouse_id],
                    (err, updateResult) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ message: 'Database error', error: err });
                            });
                        }
                        
                        // Update product stocks (remove quantity)
                        updateProductStocksForQuantityChange(product.warehouse_id, product.product_id, -product.quantity, db, (err) => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).json({ message: 'Database error', error: err });
                                });
                            }
                            
                            // Update purchase order status if purchase_order_id exists
                            if (product.purchase_order_id) {
                                // Since we're deleting, we need to recalculate the total received quantity
                                // We'll pass 0 as the received quantity to trigger a recalculation
                                updatePurchaseOrderStatus(product.purchase_order_id, product.product_id, 0, (err) => {
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
                                        res.json({ message: 'Received product deleted successfully' });
                                    });
                                });
                            } else {
                                // Commit transaction
                                db.commit((err) => {
                                    if (err) {
                                        return db.rollback(() => {
                                            res.status(500).json({ message: 'Database error', error: err });
                                        });
                                    }
                                    res.json({ message: 'Received product deleted successfully' });
                                });
                            }
                        });
                    }
                );
            });
        });
    });
};

exports.getReceivedProductsByPurchaseOrder = (req, res) => {
    const { purchase_order_id } = req.params;
    
    const sql = `
        SELECT rp.*, po.purchase_order_number, rcp.received_date, c.company_name, p.product_name, w.warehouse_name, u.user_name as created_by_name
        FROM received_products rp
        LEFT JOIN purchase_orders po ON rp.purchase_order_id = po.id
        LEFT JOIN received_purchases rcp ON rp.received_purchase_id = rcp.id
        LEFT JOIN my_companies c ON rp.company_id = c.id
        LEFT JOIN products p ON rp.product_id = p.id
        LEFT JOIN warehouses w ON rp.warehouse_id = w.id
        LEFT JOIN users u ON rp.created_by = u.id
        WHERE rp.purchase_order_id = ? AND rp.is_deleted = 0
        ORDER BY rp.created_at DESC
    `;
    
    db.query(sql, [purchase_order_id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getReceivedProductsByReceivedPurchase = (req, res) => {
    const { received_purchase_id } = req.params;
    
    const sql = `
        SELECT rp.*, po.purchase_order_number, rcp.received_date, c.company_name, p.product_name, w.warehouse_name, u.user_name as created_by_name
        FROM received_products rp
        LEFT JOIN purchase_orders po ON rp.purchase_order_id = po.id
        LEFT JOIN received_purchases rcp ON rp.received_purchase_id = rcp.id
        LEFT JOIN my_companies c ON rp.company_id = c.id
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