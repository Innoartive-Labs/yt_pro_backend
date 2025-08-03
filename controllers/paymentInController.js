const db = require('../utils/db');
const { processPaymentInForDailyCounter, reversePaymentInForDailyCounter } = require('../utils/dailyCounterUtils');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const formatDate = (date) => {
    return dayjs.utc(date).tz('Asia/Karachi').format('YYYY-MM-DD');
};

// Helper function to update customer opening balance
const updateCustomerBalance = async (customerId, amount, isReversal = false) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT id, opening_balance FROM customers WHERE id = ?', [customerId], (checkErr, checkResult) => {
            if (checkErr) {
                console.error('Error checking customer:', checkErr);
                reject(checkErr);
                return;
            }
            
            if (checkResult.length === 0) {
                console.error('Customer not found with ID:', customerId);
                reject(new Error('Customer not found'));
                return;
            }
            
            const currentBalance = parseFloat(checkResult[0].opening_balance) || 0;
            const newBalance = isReversal ? currentBalance - amount : currentBalance + amount;
            
            console.log('Customer balance update:', {
                customer_id: customerId,
                current_balance: currentBalance,
                amount: amount,
                new_balance: newBalance,
                is_reversal: isReversal
            });
            
            db.query(
                'UPDATE customers SET opening_balance = ? WHERE id = ?',
                [newBalance, customerId],
                (balanceErr, balanceResult) => {
                    if (balanceErr) {
                        console.error('Error updating customer opening balance:', balanceErr);
                        reject(balanceErr);
                    } else {
                        console.log('Customer opening balance updated successfully. Rows affected:', balanceResult.affectedRows);
                        resolve(balanceResult);
                    }
                }
            );
        });
    });
};

// Helper function to update bank account balance
const updateBankAccountBalance = async (bankAccountId, amount, isReversal = false) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT id, account_balance FROM bank_accounts WHERE id = ?', [bankAccountId], (checkErr, checkResult) => {
            if (checkErr) {
                console.error('Error checking bank account:', checkErr);
                reject(checkErr);
                return;
            }
            
            if (checkResult.length === 0) {
                console.error('Bank account not found with ID:', bankAccountId);
                reject(new Error('Bank account not found'));
                return;
            }
            
            const currentBalance = parseFloat(checkResult[0].account_balance) || 0;
            const newBalance = isReversal ? currentBalance - amount : currentBalance + amount;
            
            console.log('Bank account balance update:', {
                bank_account_id: bankAccountId,
                current_balance: currentBalance,
                amount: amount,
                new_balance: newBalance,
                is_reversal: isReversal
            });
            
            db.query(
                'UPDATE bank_accounts SET account_balance = ? WHERE id = ?',
                [newBalance, bankAccountId],
                (balanceErr, balanceResult) => {
                    if (balanceErr) {
                        console.error('Error updating bank account balance:', balanceErr);
                        reject(balanceErr);
                    } else {
                        console.log('Bank account balance updated successfully. Rows affected:', balanceResult.affectedRows);
                        resolve(balanceResult);
                    }
                }
            );
        });
    });
};

// Helper function to create cheque record
const createChequeRecord = async (paymentData, createdBy) => {
    return new Promise((resolve, reject) => {
        const {
            company_id,
            bank_account_id,
            customer_id,
            payment_amount,
            payment_date,
            cheque_number
        } = paymentData;

        // Get bank_id from bank_account_id
        db.query('SELECT bank_id FROM bank_accounts WHERE id = ?', [bank_account_id], (bankErr, bankResult) => {
            if (bankErr) {
                console.error('Error getting bank_id:', bankErr);
                reject(bankErr);
                return;
            }

            if (bankResult.length === 0) {
                reject(new Error('Bank account not found'));
                return;
            }

            const bank_id = bankResult[0].bank_id;

            const sql = `
                INSERT INTO cheques (
                    company_id, account_title, cheque_number, bank_id, bank_account_id,
                    given_by_customer, given_to_customer, given_by_supplier, given_to_supplier,
                    cheque_date, cheque_amount, cheque_status, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(sql, [
                company_id,
                'Payment In Cheque', // account_title
                cheque_number,
                bank_id,
                bank_account_id,
                customer_id, // given_by_customer
                null, // given_to_customer
                null, // given_by_supplier
                null, // given_to_supplier
                payment_date,
                payment_amount,
                'pending', // cheque_status
                createdBy
            ], (err, result) => {
                if (err) {
                    console.error('Error creating cheque record:', err);
                    reject(err);
                } else {
                    console.log('Cheque record created successfully:', result.insertId);
                    resolve(result);
                }
            });
        });
    });
};

exports.createPaymentIn = (req, res) => {
    const {
        company_id,
        sales_invoice_id,
        customer_id,
        bank_account_id,
        payment_date,
        payment_amount,
        payment_method,
        payment_status,
        cheque_number
    } = req.body;

    const created_by = req.user.id;

    const sql = `
        INSERT INTO payment_in (
            company_id, sales_invoice_id, customer_id, bank_account_id,
            payment_date, payment_amount, payment_method, payment_status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        company_id, sales_invoice_id, customer_id, bank_account_id,
        payment_date, payment_amount, payment_method, payment_status, created_by
    ], async (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }

        try {
            // Update customer opening balance if payment is received
            if (payment_status === 'paid' && customer_id) {
                await updateCustomerBalance(customer_id, parseFloat(payment_amount), true); // Reduce customer balance (reversal)
            }

            // Update bank account balance if payment method is bank_transfer or online
            if (payment_status === 'paid' && (payment_method === 'bank_transfer' || payment_method === 'online') && bank_account_id) {
                await updateBankAccountBalance(bank_account_id, parseFloat(payment_amount));
            }

            // Update daily counter if payment method is cash
            if (payment_method === 'cash' && payment_status === 'paid') {
                await processPaymentInForDailyCounter(company_id, payment_amount, payment_date);
            }

            // Create cheque record if payment method is cheque
            if (payment_method === 'cheque' && cheque_number && bank_account_id) {
                await createChequeRecord({
                    company_id,
                    bank_account_id,
                    customer_id,
                    payment_amount,
                    payment_date,
                    cheque_number
                }, created_by);
            }

            res.status(201).json({ 
                message: 'Payment in created successfully',
                id: result.insertId 
            });
        } catch (error) {
            console.error('Error in payment processing:', error);
            res.status(201).json({ 
                message: 'Payment in created but some updates failed',
                id: result.insertId,
                warning: error.message
            });
        }
    });
};

exports.getAllPaymentsIn = (req, res) => {
    const { company_id } = req.query;
    let sql = `
        SELECT pi.*, 
               mc.company_name,
               si.invoice_number,
               c.customer_name,
               ba.account_title,
               u.user_name as created_by_name
        FROM payment_in pi
        LEFT JOIN my_companies mc ON pi.company_id = mc.id
        LEFT JOIN sales_invoices si ON pi.sales_invoice_id = si.id
        LEFT JOIN customers c ON pi.customer_id = c.id
        LEFT JOIN bank_accounts ba ON pi.bank_account_id = ba.id
        LEFT JOIN users u ON pi.created_by = u.id
        WHERE pi.is_deleted = 0
    `;
    
    const params = [];
    if (company_id) {
        sql += ' AND pi.company_id = ?';
        params.push(company_id);
    }
    
    sql += ' ORDER BY pi.payment_date DESC, pi.created_at DESC';

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
        results.forEach(result => {
            result.payment_date = formatDate(result.payment_date);
        });
        res.json(results);
    });
};

exports.getPaymentInById = (req, res) => {
    const sql = `
        SELECT pi.*, 
               mc.company_name,
               si.invoice_number,
               c.customer_name,
               ba.account_title,
               u.user_name as created_by_name
        FROM payment_in pi
        LEFT JOIN my_companies mc ON pi.company_id = mc.id
        LEFT JOIN sales_invoices si ON pi.sales_invoice_id = si.id
        LEFT JOIN customers c ON pi.customer_id = c.id
        LEFT JOIN bank_accounts ba ON pi.bank_account_id = ba.id
        LEFT JOIN users u ON pi.created_by = u.id
        WHERE pi.id = ? AND pi.is_deleted = 0
    `;

    db.query(sql, [req.params.id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Payment in not found' });
        }
        results[0].payment_date = formatDate(results[0].payment_date);
        res.json(results[0]);
    });
};

exports.updatePaymentIn = (req, res) => {
    const {
        sales_invoice_id,
        customer_id,
        bank_account_id,
        payment_date,
        payment_amount,
        payment_method,
        payment_status
    } = req.body;

    // First get the current payment record to check if we need to reverse daily counter
    db.query('SELECT * FROM payment_in WHERE id = ? AND is_deleted = 0', [req.params.id], async (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Payment in not found' });
        }

        const oldPayment = results[0];

        const sql = `
            UPDATE payment_in SET 
                sales_invoice_id = ?, customer_id = ?, bank_account_id = ?,
                payment_date = ?, payment_amount = ?, payment_method = ?, payment_status = ?
            WHERE id = ? AND is_deleted = 0
        `;

        db.query(sql, [
            sales_invoice_id, customer_id, bank_account_id,
            payment_date, payment_amount, payment_method, payment_status, req.params.id
        ], async (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error', error: err.message });
            }

            try {
                // Reverse old customer balance if it was paid
                if (oldPayment.payment_status === 'paid' && oldPayment.customer_id) {
                    await updateCustomerBalance(oldPayment.customer_id, parseFloat(oldPayment.payment_amount), false); // Add back to customer balance
                }

                // Update new customer balance if payment is received
                if (payment_status === 'paid' && customer_id) {
                    await updateCustomerBalance(customer_id, parseFloat(payment_amount), true); // Reduce customer balance
                }

                // Reverse old bank account balance if it was bank_transfer or online
                if (oldPayment.payment_status === 'paid' && (oldPayment.payment_method === 'bank_transfer' || oldPayment.payment_method === 'online') && oldPayment.bank_account_id) {
                    await updateBankAccountBalance(oldPayment.bank_account_id, parseFloat(oldPayment.payment_amount), true);
                }

                // Update new bank account balance if payment method is bank_transfer or online
                if (payment_status === 'paid' && (payment_method === 'bank_transfer' || payment_method === 'online') && bank_account_id) {
                    await updateBankAccountBalance(bank_account_id, parseFloat(payment_amount));
                }

                // Reverse old daily counter entry if it was cash and paid
                if (oldPayment.payment_method === 'cash' && oldPayment.payment_status === 'paid') {
                    await reversePaymentInForDailyCounter(oldPayment.company_id, oldPayment.payment_amount, oldPayment.payment_date);
                }

                // Update daily counter if new payment method is cash and paid
                if (payment_method === 'cash' && payment_status === 'paid') {
                    await processPaymentInForDailyCounter(oldPayment.company_id, payment_amount, payment_date);
                }

                res.json({ message: 'Payment in updated successfully' });
            } catch (error) {
                console.error('Error in payment update processing:', error);
                res.json({ 
                    message: 'Payment in updated but some updates failed',
                    warning: error.message
                });
            }
        });
    });
};

exports.deletePaymentIn = (req, res) => {
    // First get the payment record to check if we need to reverse updates
    db.query('SELECT * FROM payment_in WHERE id = ? AND is_deleted = 0', [req.params.id], async (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Payment in not found' });
        }

        const payment = results[0];

        db.query('UPDATE payment_in SET is_deleted = 1 WHERE id = ?', [req.params.id], async (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error', error: err.message });
            }

            try {
                // Reverse customer balance if it was paid
                if (payment.payment_status === 'paid' && payment.customer_id) {
                    await updateCustomerBalance(payment.customer_id, parseFloat(payment.payment_amount), false); // Add back to customer balance
                }

                // Reverse bank account balance if it was bank_transfer or online
                if (payment.payment_status === 'paid' && (payment.payment_method === 'bank_transfer' || payment.payment_method === 'online') && payment.bank_account_id) {
                    await updateBankAccountBalance(payment.bank_account_id, parseFloat(payment.payment_amount), true);
                }

                // Reverse daily counter entry if it was cash and paid
                if (payment.payment_method === 'cash' && payment.payment_status === 'paid') {
                    await reversePaymentInForDailyCounter(payment.company_id, payment.payment_amount, payment.payment_date);
                }

                res.json({ message: 'Payment in deleted successfully' });
            } catch (error) {
                console.error('Error in payment deletion processing:', error);
                res.json({ 
                    message: 'Payment in deleted but some reversals failed',
                    warning: error.message
                });
            }
        });
    });
};

exports.getPaymentsInByCompany = (req, res) => {
    const companyId = req.params.companyId;
    const sql = `
        SELECT pi.*, 
               si.invoice_number,
               c.customer_name,
               ba.account_title,
               u.user_name as created_by_name
        FROM payment_in pi
        LEFT JOIN sales_invoices si ON pi.sales_invoice_id = si.id
        LEFT JOIN customers c ON pi.customer_id = c.id
        LEFT JOIN bank_accounts ba ON pi.bank_account_id = ba.id
        LEFT JOIN users u ON pi.created_by = u.id
        WHERE pi.company_id = ? AND pi.is_deleted = 0
        ORDER BY pi.payment_date DESC, pi.created_at DESC
    `;

    db.query(sql, [companyId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
        results.forEach(result => {
            result.payment_date = formatDate(result.payment_date);
        });
        res.json(results);
    });
};