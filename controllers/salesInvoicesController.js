const db = require('../utils/db');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { processSalesInvoiceForDailyCounter, reverseSalesInvoiceForDailyCounter } = require('../utils/dailyCounterUtils');

dayjs.extend(utc);
dayjs.extend(timezone);

exports.createSalesInvoice = (req, res) => {
    const { 
        sales_order_number, 
        invoice_number, 
        invoice_date, 
        customer_id, 
        company_id, 
        total_amount, 
        paid_amount, 
        due_amount,
        payment_method,
        cheque_number,
        bank_id,
        bank_account_id,
        account_title,
        cheque_date
    } = req.body;
    
    const created_by = req.user.id;
    
    db.query(
        'INSERT INTO sales_invoices (sales_order_number, invoice_number, invoice_date, customer_id, company_id, total_amount, paid_amount, due_amount, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [sales_order_number, invoice_number, invoice_date, customer_id, company_id, total_amount, paid_amount, due_amount, created_by],
        async (err, result) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            
            const salesInvoiceId = result.insertId;
            
            // Process daily counter updates if paid amount exists
            if (paid_amount && parseFloat(paid_amount) > 0 && company_id) {
                try {
                    await processSalesInvoiceForDailyCounter(company_id, paid_amount, invoice_date);
                } catch (counterError) {
                    console.error('Error processing daily counter for sales invoice:', counterError);
                }
            }
            
            // Update customer's opening balance with due amount (regardless of payment method)
            console.log('DEBUG - Customer balance update check:', { 
                due_amount, 
                due_amount_type: typeof due_amount,
                due_amount_parsed: parseFloat(due_amount || 0),
                customer_id, 
                customer_id_type: typeof customer_id,
                condition_1: due_amount && parseFloat(due_amount) > 0,
                condition_2: !!customer_id,
                should_update: due_amount && parseFloat(due_amount) > 0 && customer_id
            });
            
            if (due_amount && parseFloat(due_amount) > 0 && customer_id) {
                console.log('Attempting to update customer balance:', { customer_id, due_amount, paid_amount });
                
                try {
                    // Use a promise to handle the async operation properly
                    await new Promise((resolve, reject) => {
                        // First check if customer exists and get current balance
                        db.query('SELECT id, opening_balance FROM customers WHERE id = ?', [customer_id], (checkErr, checkResult) => {
                            if (checkErr) {
                                console.error('Error checking customer:', checkErr);
                                reject(checkErr);
                                return;
                            }
                            
                            if (checkResult.length === 0) {
                                console.error('Customer not found with ID:', customer_id);
                                reject(new Error('Customer not found'));
                                return;
                            }
                            
                            const currentBalance = parseFloat(checkResult[0].opening_balance) || 0;
                            const newBalance = currentBalance + parseFloat(due_amount);
                            
                            console.log('Customer balance update:', {
                                customer_id,
                                current_balance: currentBalance,
                                due_amount: parseFloat(due_amount || 0),
                                paid_amount: parseFloat(paid_amount || 0),
                                new_balance: newBalance
                            });
                            
                            // Update the customer's opening balance
                            db.query(
                                'UPDATE customers SET opening_balance = ? WHERE id = ?',
                                [newBalance, customer_id],
                                (balanceErr, balanceResult) => {
                                    if (balanceErr) {
                                        console.error('Error updating customer opening balance:', balanceErr);
                                        reject(balanceErr);
                                    } else {
                                        console.log('Customer opening balance updated successfully. Rows affected:', balanceResult.affectedRows);
                                        if (balanceResult.affectedRows === 0) {
                                            console.error('No rows were updated for customer ID:', customer_id);
                                            reject(new Error('No rows updated'));
                                        } else {
                                            resolve(balanceResult);
                                        }
                                    }
                                }
                            );
                        });
                    });
                } catch (balanceError) {
                    console.error('Error updating customer opening balance:', balanceError);
                }
            } else {
                console.log('Skipping customer balance update:', { 
                    due_amount, 
                    paid_amount,
                    customer_id, 
                    has_due_amount: due_amount && parseFloat(due_amount) > 0,
                    has_customer_id: !!customer_id 
                });
            }
            
            // Create cheque record if payment method is cheque
            if (payment_method === 'cheque' && paid_amount && parseFloat(paid_amount) > 0) {
                try {
                    const chequeSql = `
                        INSERT INTO cheques (
                            company_id, cheque_number, bank_id, bank_account_id,
                            given_by_customer, given_to_customer, cheque_date, cheque_amount, 
                            cheque_status, created_by
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    
                    const chequeParams = [
                        company_id,
                        cheque_number,
                        bank_id,
                        bank_account_id,
                        customer_id, // given_by_customer (customer is giving the cheque)
                        null, // given_to_customer (not applicable for sales invoice)
                        cheque_date || invoice_date,
                        paid_amount,
                        'pending', // default status
                        created_by
                    ];
                    
                    // Note: account_title is not stored in cheques table as per schema
                    // It's typically stored in bank_accounts table
                    console.log('Account Title provided:', account_title);
                    
                    db.query(chequeSql, chequeParams, (chequeErr, chequeResult) => {
                        if (chequeErr) {
                            console.error('Error creating cheque record:', chequeErr);
                        } else {
                            console.log('Cheque record created successfully with ID:', chequeResult.insertId);
                        }
                    });
                } catch (chequeError) {
                    console.error('Error creating cheque record:', chequeError);
                }
            }
            
            // Update bank account balance if payment method is bank_transfer or online
            if ((payment_method === 'bank_transfer' || payment_method === 'online') && paid_amount && parseFloat(paid_amount) > 0 && bank_account_id) {
                console.log('Attempting to update bank account balance:', { 
                    payment_method, 
                    bank_account_id, 
                    paid_amount 
                });
                
                try {
                    await new Promise((resolve, reject) => {
                        // First check if bank account exists and get current balance
                        db.query('SELECT id, account_balance FROM bank_accounts WHERE id = ?', [bank_account_id], (checkErr, checkResult) => {
                            if (checkErr) {
                                console.error('Error checking bank account:', checkErr);
                                reject(checkErr);
                                return;
                            }
                            
                            if (checkResult.length === 0) {
                                console.error('Bank account not found with ID:', bank_account_id);
                                reject(new Error('Bank account not found'));
                                return;
                            }
                            
                            const currentBalance = parseFloat(checkResult[0].account_balance) || 0;
                            const newBalance = currentBalance + parseFloat(paid_amount);
                            
                            console.log('Bank account balance update:', {
                                bank_account_id,
                                current_balance: currentBalance,
                                paid_amount: parseFloat(paid_amount),
                                new_balance: newBalance
                            });
                            
                            // Update the bank account balance
                            db.query(
                                'UPDATE bank_accounts SET account_balance = ? WHERE id = ?',
                                [newBalance, bank_account_id],
                                (balanceErr, balanceResult) => {
                                    if (balanceErr) {
                                        console.error('Error updating bank account balance:', balanceErr);
                                        reject(balanceErr);
                                    } else {
                                        console.log('Bank account balance updated successfully. Rows affected:', balanceResult.affectedRows);
                                        if (balanceResult.affectedRows === 0) {
                                            console.error('No rows were updated for bank account ID:', bank_account_id);
                                            reject(new Error('No rows updated'));
                                        } else {
                                            resolve(balanceResult);
                                        }
                                    }
                                }
                            );
                        });
                    });
                } catch (balanceError) {
                    console.error('Error updating bank account balance:', balanceError);
                }
            } else {
                console.log('Skipping bank account balance update:', { 
                    payment_method, 
                    paid_amount,
                    bank_account_id, 
                    should_update: (payment_method === 'bank_transfer' || payment_method === 'online') && paid_amount && parseFloat(paid_amount) > 0 && bank_account_id
                });
            }
            
            res.status(201).json({ 
                id: salesInvoiceId, 
                message: 'Sales invoice created successfully',
                cheque_created: payment_method === 'cheque' ? true : false
            });
        }
    );
};

exports.getAllSalesInvoices = (req, res) => {
    const sql = `
        SELECT si.*, si.sales_order_number, c.customer_name, mc.company_name, u.user_name as created_by_name
        FROM sales_invoices si
        LEFT JOIN sales_orders so ON si.sales_order_number = so.id
        LEFT JOIN customers c ON si.customer_id = c.id
        LEFT JOIN my_companies mc ON si.company_id = mc.id
        LEFT JOIN users u ON si.created_by = u.id
        WHERE si.is_deleted = 0
        ORDER BY si.created_at DESC
    `;
    
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        results.forEach(result => {
            result.invoice_date = dayjs(result.invoice_date).tz('Asia/Karachi').format('YYYY-MM-DD');
        });
        res.json(results);
    });
};

exports.getSalesInvoiceById = (req, res) => {
    const sql = `
        SELECT si.*, si.sales_order_number, c.customer_name, mc.company_name, u.user_name as created_by_name
        FROM sales_invoices si
        LEFT JOIN sales_orders so ON si.sales_order_number = so.id
        LEFT JOIN customers c ON si.customer_id = c.id
        LEFT JOIN my_companies mc ON si.company_id = mc.id
        LEFT JOIN users u ON si.created_by = u.id
        WHERE si.id = ? AND si.is_deleted = 0
    `;
    
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Sales invoice not found' });
        results[0].invoice_date = dayjs(results[0].invoice_date).tz('Asia/Karachi').format('YYYY-MM-DD');
        res.json(results[0]);
    });
};

exports.updateSalesInvoice = (req, res) => {
    const { 
        sales_order_number, 
        invoice_number, 
        invoice_date, 
        customer_id, 
        company_id, 
        total_amount, 
        paid_amount, 
        due_amount,
        payment_method,
        cheque_number,
        bank_id,
        bank_account_id,
        account_title,
        cheque_date
    } = req.body;
    
    // First get the current paid amount and due amount to calculate the differences
    db.query('SELECT paid_amount, due_amount, company_id, customer_id FROM sales_invoices WHERE id = ? AND is_deleted = 0', [req.params.id], (err, currentResults) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (currentResults.length === 0) return res.status(404).json({ message: 'Sales invoice not found' });
        
        const currentPaidAmount = parseFloat(currentResults[0].paid_amount) || 0;
        const currentDueAmount = parseFloat(currentResults[0].due_amount) || 0;
        const newPaidAmount = parseFloat(paid_amount) || 0;
        const newDueAmount = parseFloat(due_amount) || 0;
        const paidAmountDifference = newPaidAmount - currentPaidAmount;
        
        // Calculate due amount difference
        const dueAmountDifference = newDueAmount - currentDueAmount;
        
        db.query(
            'UPDATE sales_invoices SET sales_order_number=?, invoice_number=?, invoice_date=?, customer_id=?, company_id=?, total_amount=?, paid_amount=?, due_amount=? WHERE id=? AND is_deleted=0',
            [sales_order_number, invoice_number, invoice_date, customer_id, company_id, total_amount, paid_amount, due_amount, req.params.id],
            async (err, result) => {
                if (err) return res.status(500).json({ message: 'Database error', error: err });
                if (result.affectedRows === 0) return res.status(404).json({ message: 'Sales invoice not found' });
                
                // Process daily counter updates if paid amount changed
                if (paidAmountDifference !== 0 && company_id) {
                    try {
                        const amountToProcess = Math.abs(paidAmountDifference);
                        const amountType = paidAmountDifference > 0 ? 'income' : 'expense';
                        
                        const dailyCounter = await require('../utils/dailyCounterUtils').getOrCreateDailyCounter(company_id);
                        const formattedDate = dayjs(invoice_date).tz('Asia/Karachi').format('YYYY-MM-DD');
                        
                        // Update daily counter amount
                        await require('../utils/dailyCounterUtils').updateDailyCounterAmount(dailyCounter.id, paidAmountDifference);
                        
                        // Insert/update daily counter detail
                        await require('../utils/dailyCounterUtils').insertOrUpdateDailyCounterDetail(dailyCounter.id, formattedDate, amountToProcess, amountType);
                        
                    } catch (counterError) {
                        console.error('Error processing daily counter for sales invoice update:', counterError);
                    }
                }
                
                // Update customer's opening balance if due amount changed
                if (dueAmountDifference !== 0 && customer_id) {
                    console.log('Attempting to update customer balance on edit:', { 
                        customer_id, 
                        currentDueAmount,
                        newDueAmount,
                        dueAmountDifference
                    });
                    
                    try {
                        // Use a promise to handle the async operation properly
                        await new Promise((resolve, reject) => {
                            // First check if customer exists and get current balance
                            db.query('SELECT id, opening_balance FROM customers WHERE id = ?', [customer_id], (checkErr, checkResult) => {
                                if (checkErr) {
                                    console.error('Error checking customer:', checkErr);
                                    reject(checkErr);
                                    return;
                                }
                                
                                if (checkResult.length === 0) {
                                    console.error('Customer not found with ID:', customer_id);
                                    reject(new Error('Customer not found'));
                                    return;
                                }
                                
                                const currentBalance = parseFloat(checkResult[0].opening_balance) || 0;
                                const newBalance = currentBalance + dueAmountDifference;
                                
                                console.log('Customer balance update on edit:', {
                                    customer_id,
                                    current_balance: currentBalance,
                                    current_due_amount: currentDueAmount,
                                    new_due_amount: newDueAmount,
                                    due_amount_difference: dueAmountDifference,
                                    new_balance: newBalance
                                });
                                
                                // Update the customer's opening balance
                                db.query(
                                    'UPDATE customers SET opening_balance = ? WHERE id = ?',
                                    [newBalance, customer_id],
                                    (balanceErr, balanceResult) => {
                                        if (balanceErr) {
                                            console.error('Error updating customer opening balance:', balanceErr);
                                            reject(balanceErr);
                                        } else {
                                            console.log('Customer opening balance updated successfully on edit. Rows affected:', balanceResult.affectedRows);
                                            if (balanceResult.affectedRows === 0) {
                                                console.error('No rows were updated for customer ID:', customer_id);
                                                reject(new Error('No rows updated'));
                                            } else {
                                                resolve(balanceResult);
                                            }
                                        }
                                    }
                                );
                            });
                        });
                    } catch (balanceError) {
                        console.error('Error updating customer opening balance:', balanceError);
                    }
                } else {
                    console.log('Skipping customer balance update on edit:', { 
                        dueAmountDifference, 
                        customer_id, 
                        has_difference: dueAmountDifference !== 0,
                        has_customer_id: !!customer_id 
                    });
                }
                
                // Create cheque record if payment method is cheque and there's a paid amount
                if (payment_method === 'cheque' && paid_amount && parseFloat(paid_amount) > 0) {
                    try {
                        const chequeSql = `
                            INSERT INTO cheques (
                                company_id, cheque_number, bank_id, bank_account_id,
                                given_by_customer, given_to_customer, cheque_date, cheque_amount, 
                                cheque_status, created_by
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `;
                        
                        const chequeParams = [
                            company_id,
                            cheque_number,
                            bank_id,
                            bank_account_id,
                            customer_id, // given_by_customer (customer is giving the cheque)
                            null, // given_to_customer (not applicable for sales invoice)
                            cheque_date || invoice_date,
                            paid_amount,
                            'pending', // default status
                            req.user.id
                        ];
                        
                        // Note: account_title is not stored in cheques table as per schema
                        // It's typically stored in bank_accounts table
                        console.log('Account Title provided:', account_title);
                        
                        db.query(chequeSql, chequeParams, (chequeErr, chequeResult) => {
                            if (chequeErr) {
                                console.error('Error creating cheque record:', chequeErr);
                            } else {
                                console.log('Cheque record created successfully with ID:', chequeResult.insertId);
                            }
                        });
                    } catch (chequeError) {
                        console.error('Error creating cheque record:', chequeError);
                    }
                }
                
                // Update bank account balance if payment method is bank_transfer or online
                if ((payment_method === 'bank_transfer' || payment_method === 'online') && paidAmountDifference > 0 && bank_account_id) {
                    console.log('Attempting to update bank account balance on edit:', { 
                        payment_method, 
                        bank_account_id, 
                        paidAmountDifference
                    });
                    
                    try {
                        await new Promise((resolve, reject) => {
                            // First check if bank account exists and get current balance
                            db.query('SELECT id, account_balance FROM bank_accounts WHERE id = ?', [bank_account_id], (checkErr, checkResult) => {
                                if (checkErr) {
                                    console.error('Error checking bank account:', checkErr);
                                    reject(checkErr);
                                    return;
                                }
                                
                                if (checkResult.length === 0) {
                                    console.error('Bank account not found with ID:', bank_account_id);
                                    reject(new Error('Bank account not found'));
                                    return;
                                }
                                
                                const currentBalance = parseFloat(checkResult[0].account_balance) || 0;
                                const newBalance = currentBalance + paidAmountDifference;
                                
                                console.log('Bank account balance update on edit:', {
                                    bank_account_id,
                                    current_balance: currentBalance,
                                    paid_amount_difference: paidAmountDifference,
                                    new_balance: newBalance
                                });
                                
                                // Update the bank account balance
                                db.query(
                                    'UPDATE bank_accounts SET account_balance = ? WHERE id = ?',
                                    [newBalance, bank_account_id],
                                    (balanceErr, balanceResult) => {
                                        if (balanceErr) {
                                            console.error('Error updating bank account balance:', balanceErr);
                                            reject(balanceErr);
                                        } else {
                                            console.log('Bank account balance updated successfully on edit. Rows affected:', balanceResult.affectedRows);
                                            if (balanceResult.affectedRows === 0) {
                                                console.error('No rows were updated for bank account ID:', bank_account_id);
                                                reject(new Error('No rows updated'));
                                            } else {
                                                resolve(balanceResult);
                                            }
                                        }
                                    }
                                );
                            });
                        });
                    } catch (balanceError) {
                        console.error('Error updating bank account balance:', balanceError);
                    }
                } else {
                    console.log('Skipping bank account balance update on edit:', { 
                        payment_method, 
                        paidAmountDifference,
                        bank_account_id, 
                        should_update: (payment_method === 'bank_transfer' || payment_method === 'online') && paidAmountDifference > 0 && bank_account_id
                    });
                }
                
                res.json({ 
                    message: 'Sales invoice updated successfully',
                    cheque_created: payment_method === 'cheque' ? true : false
                });
            }
        );
    });
};

exports.deleteSalesInvoice = (req, res) => {
    // First get the sales invoice details to reverse daily counter updates, customer balance, and bank account balance
    db.query('SELECT paid_amount, due_amount, invoice_date, company_id, customer_id, payment_method, bank_account_id FROM sales_invoices WHERE id = ? AND is_deleted = 0', [req.params.id], (err, currentResults) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (currentResults.length === 0) return res.status(404).json({ message: 'Sales invoice not found' });
        
        const salesInvoice = currentResults[0];
        
        db.query('UPDATE sales_invoices SET is_deleted=1 WHERE id=?', [req.params.id], async (err, result) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Sales invoice not found' });
            
            // Reverse daily counter updates if paid amount exists
            if (salesInvoice.paid_amount && parseFloat(salesInvoice.paid_amount) > 0 && salesInvoice.company_id) {
                try {
                    await reverseSalesInvoiceForDailyCounter(salesInvoice.company_id, salesInvoice.paid_amount, salesInvoice.invoice_date);
                } catch (counterError) {
                    console.error('Error reversing daily counter for sales invoice deletion:', counterError);
                }
            }
            
            // Reverse customer's opening balance if due amount exists
            if (salesInvoice.due_amount && parseFloat(salesInvoice.due_amount) > 0 && salesInvoice.customer_id) {
                console.log('Reversing customer balance on delete:', { 
                    customer_id: salesInvoice.customer_id, 
                    due_amount: salesInvoice.due_amount,
                    paid_amount: salesInvoice.paid_amount
                });
                
                try {
                    db.query(
                        'UPDATE customers SET opening_balance = opening_balance - ? WHERE id = ?',
                        [salesInvoice.due_amount, salesInvoice.customer_id],
                        (balanceErr, balanceResult) => {
                            if (balanceErr) {
                                console.error('Error reversing customer opening balance:', balanceErr);
                            } else {
                                console.log('Customer opening balance reversed successfully. Rows affected:', balanceResult.affectedRows);
                                if (balanceResult.affectedRows === 0) {
                                    console.error('No rows were updated for customer ID:', salesInvoice.customer_id);
                                }
                            }
                        }
                    );
                } catch (balanceError) {
                    console.error('Error reversing customer opening balance:', balanceError);
                }
            } else {
                console.log('Skipping customer balance reversal on delete:', { 
                    due_amount: salesInvoice.due_amount,
                    paid_amount: salesInvoice.paid_amount,
                    customer_id: salesInvoice.customer_id
                });
            }
            
            // Reverse bank account balance if payment method was bank_transfer or online
            if ((salesInvoice.payment_method === 'bank_transfer' || salesInvoice.payment_method === 'online') && salesInvoice.paid_amount && parseFloat(salesInvoice.paid_amount) > 0 && salesInvoice.bank_account_id) {
                console.log('Reversing bank account balance on delete:', { 
                    payment_method: salesInvoice.payment_method,
                    bank_account_id: salesInvoice.bank_account_id, 
                    paid_amount: salesInvoice.paid_amount
                });
                
                try {
                    db.query(
                        'UPDATE bank_accounts SET account_balance = account_balance - ? WHERE id = ?',
                        [salesInvoice.paid_amount, salesInvoice.bank_account_id],
                        (balanceErr, balanceResult) => {
                            if (balanceErr) {
                                console.error('Error reversing bank account balance:', balanceErr);
                            } else {
                                console.log('Bank account balance reversed successfully. Rows affected:', balanceResult.affectedRows);
                                if (balanceResult.affectedRows === 0) {
                                    console.error('No rows were updated for bank account ID:', salesInvoice.bank_account_id);
                                }
                            }
                        }
                    );
                } catch (balanceError) {
                    console.error('Error reversing bank account balance:', balanceError);
                }
            } else {
                console.log('Skipping bank account balance reversal on delete:', { 
                    payment_method: salesInvoice.payment_method,
                    paid_amount: salesInvoice.paid_amount,
                    bank_account_id: salesInvoice.bank_account_id
                });
            }
            
            res.json({ message: 'Sales invoice deleted successfully' });
        });
    });
};

exports.getSalesInvoicesBySalesOrder = (req, res) => {
    const { sales_order_number } = req.params;
    
    const sql = `
        SELECT si.*, so.sales_order_number, c.customer_name, mc.company_name, u.user_name as created_by_name
        FROM sales_invoices si
        LEFT JOIN sales_orders so ON si.sales_order_number = so.sales_order_number
        LEFT JOIN customers c ON si.customer_id = c.id
        LEFT JOIN my_companies mc ON si.company_id = mc.id
        LEFT JOIN users u ON si.created_by = u.id
        WHERE si.sales_order_number = ? AND si.is_deleted = 0
        ORDER BY si.created_at DESC
    `;
    
    db.query(sql, [sales_order_number], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getSalesInvoicesByCustomer = (req, res) => {
    const { customer_id } = req.params;
    
    const sql = `
        SELECT si.*, so.sales_order_number, c.customer_name, mc.company_name, u.user_name as created_by_name
        FROM sales_invoices si
        LEFT JOIN sales_orders so ON si.sales_order_number = so.id
        LEFT JOIN customers c ON si.customer_id = c.id
        LEFT JOIN my_companies mc ON si.company_id = mc.id
        LEFT JOIN users u ON si.created_by = u.id
        WHERE si.customer_id = ? AND si.is_deleted = 0
        ORDER BY si.created_at DESC
    `;
    
    db.query(sql, [customer_id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        results.forEach(result => {
            result.invoice_date = dayjs(result.invoice_date).tz('Asia/Karachi').format('YYYY-MM-DD');
        });
        res.json(results);
    });
};

exports.getOrdersWithMovementsBySalesOrderNumber = (req, res) => {
    const { sale_order_number } = req.params;
    
    // First, get all sales orders with the specified sales order number
    const salesOrdersSql = `
        SELECT so.*, c.customer_name, c.opening_balance, mc.company_name, p.product_name, w.warehouse_name, m.user_name as manager_name, u.user_name as created_by_name
        FROM sales_orders so
        LEFT JOIN customers c ON so.customer_id = c.id
        LEFT JOIN my_companies mc ON so.company_id = mc.id
        LEFT JOIN products p ON so.product_id = p.id
        LEFT JOIN warehouses w ON so.warehouse_id = w.id
        LEFT JOIN users m ON so.manager_id = m.id
        LEFT JOIN users u ON so.created_by = u.id
        WHERE so.sales_order_number = ? AND so.is_deleted = 0
        ORDER BY so.created_at DESC
    `;
    
    db.query(salesOrdersSql, [sale_order_number], (err, salesOrders) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        
        if (salesOrders.length === 0) {
            return res.status(404).json({ message: 'No sales orders found with this sales order number' });
        }
        
        // Get the IDs of all sales orders found
        const salesOrderIds = salesOrders.map(order => order.id);
        
        // Get all sales warehouse movements for these sales orders
        const movementsSql = `
            SELECT swm.*, so.sales_order_number, w.warehouse_name, m.user_name as manager_name, 
                   op.product_name as order_product_name, bp.product_name as buying_product_name, u.user_name as created_by_name
            FROM sales_warehouse_movements swm
            LEFT JOIN sales_orders so ON swm.sales_order_id = so.id
            LEFT JOIN warehouses w ON swm.warehouse_id = w.id
            LEFT JOIN users m ON swm.manager_id = m.id
            LEFT JOIN products op ON swm.order_product_id = op.id
            LEFT JOIN products bp ON swm.buying_product_id = bp.id
            LEFT JOIN users u ON swm.created_by = u.id
            WHERE swm.sales_order_id IN (${salesOrderIds.map(() => '?').join(',')}) AND swm.is_deleted = 0
            ORDER BY swm.created_at DESC
        `;
        
        db.query(movementsSql, salesOrderIds, (err, movements) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            
            // Format the response
            const response = {
                sales_order_number: sale_order_number,
                sales_orders: salesOrders,
                sales_warehouse_movements: movements,
                total_orders: salesOrders.length,
                total_movements: movements.length
            };
            
            res.json(response);
        });
    });
}; 

exports.testCustomerBalance = (req, res) => {
    const { customer_id } = req.params;
    
    console.log('Testing customer balance for ID:', customer_id);
    
    // First check if customer exists
    db.query('SELECT id, customer_name, opening_balance FROM customers WHERE id = ?', [customer_id], (err, results) => {
        if (err) {
            console.error('Error checking customer:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        
        const customer = results[0];
        console.log('Customer found:', customer);
        
        // Test updating the balance
        const testAmount = 100.00;
        const newBalance = parseFloat(customer.opening_balance) + testAmount;
        
        console.log('Test balance update:', {
            customer_id,
            current_balance: customer.opening_balance,
            test_amount: testAmount,
            new_balance: newBalance
        });
        
        db.query(
            'UPDATE customers SET opening_balance = ? WHERE id = ?',
            [newBalance, customer_id],
            (updateErr, updateResult) => {
                if (updateErr) {
                    console.error('Error updating customer balance:', updateErr);
                    return res.status(500).json({ message: 'Update error', error: updateErr });
                }
                
                console.log('Update result:', updateResult);
                
                // Verify the update
                db.query('SELECT opening_balance FROM customers WHERE id = ?', [customer_id], (verifyErr, verifyResults) => {
                    if (verifyErr) {
                        console.error('Error verifying update:', verifyErr);
                        return res.status(500).json({ message: 'Verification error', error: verifyErr });
                    }
                    
                    const updatedBalance = verifyResults[0].opening_balance;
                    console.log('Updated balance:', updatedBalance);
                    
                    res.json({
                        message: 'Test completed',
                        customer_id,
                        original_balance: customer.opening_balance,
                        test_amount: testAmount,
                        new_balance: updatedBalance,
                        rows_affected: updateResult.affectedRows
                    });
                });
            }
        );
    });
};

// Add a new test function to simulate sales invoice creation
exports.testSalesInvoiceCreation = (req, res) => {
    const { customer_id, due_amount, paid_amount, payment_method } = req.body;
    
    console.log('Testing sales invoice creation simulation:', { customer_id, due_amount, paid_amount, payment_method });
    
    // Simulate the customer balance update logic
    if (due_amount && parseFloat(due_amount) > 0 && customer_id) {
        console.log('Attempting to update customer balance in test:', { customer_id, due_amount, paid_amount });
        
        // First check if customer exists and get current balance
        db.query('SELECT id, opening_balance FROM customers WHERE id = ?', [customer_id], (checkErr, checkResult) => {
            if (checkErr) {
                console.error('Error checking customer:', checkErr);
                return res.status(500).json({ message: 'Database error', error: checkErr });
            }
            
            if (checkResult.length === 0) {
                console.error('Customer not found with ID:', customer_id);
                return res.status(404).json({ message: 'Customer not found' });
            }
            
            const currentBalance = parseFloat(checkResult[0].opening_balance) || 0;
            const newBalance = currentBalance + parseFloat(due_amount);
            
            console.log('Customer balance update in test:', {
                customer_id,
                current_balance: currentBalance,
                due_amount: parseFloat(due_amount || 0),
                paid_amount: parseFloat(paid_amount || 0),
                new_balance: newBalance
            });
            
            // Update the customer's opening balance
            db.query(
                'UPDATE customers SET opening_balance = ? WHERE id = ?',
                [newBalance, customer_id],
                (balanceErr, balanceResult) => {
                    if (balanceErr) {
                        console.error('Error updating customer opening balance:', balanceErr);
                        return res.status(500).json({ message: 'Update error', error: balanceErr });
                    } else {
                        console.log('Customer opening balance updated successfully in test. Rows affected:', balanceResult.affectedRows);
                        
                        // Verify the update
                        db.query('SELECT opening_balance FROM customers WHERE id = ?', [customer_id], (verifyErr, verifyResults) => {
                            if (verifyErr) {
                                console.error('Error verifying update:', verifyErr);
                                return res.status(500).json({ message: 'Verification error', error: verifyErr });
                            }
                            
                            const updatedBalance = verifyResults[0].opening_balance;
                            console.log('Updated balance in test:', updatedBalance);
                            
                            res.json({
                                message: 'Test sales invoice creation completed',
                                customer_id,
                                original_balance: currentBalance,
                                due_amount: parseFloat(due_amount),
                                paid_amount: parseFloat(paid_amount || 0),
                                new_balance: updatedBalance,
                                rows_affected: balanceResult.affectedRows
                            });
                        });
                    }
                }
            );
        });
    } else {
        console.log('Skipping customer balance update in test:', { 
            due_amount, 
            paid_amount,
            customer_id, 
            has_due_amount: due_amount && parseFloat(due_amount) > 0,
            has_customer_id: !!customer_id 
        });
        res.json({
            message: 'Test skipped - conditions not met',
            due_amount,
            paid_amount,
            customer_id
        });
    }
}; 