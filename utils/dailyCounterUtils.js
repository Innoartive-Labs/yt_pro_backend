const db = require('./db');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Get or create daily counter for a company
 * @param {number} companyId - The company ID
 * @returns {Promise<Object>} - The daily counter object
 */
const getOrCreateDailyCounter = (companyId) => {
    return new Promise((resolve, reject) => {
        // First try to get existing daily counter
        db.query('SELECT * FROM daily_counter WHERE company_id = ? AND is_deleted = 0', [companyId], (err, results) => {
            if (err) return reject(err);
            
            if (results.length > 0) {
                resolve(results[0]);
            } else {
                // Create new daily counter if doesn't exist
                db.query('INSERT INTO daily_counter (company_id, amount) VALUES (?, 0)', [companyId], (err, result) => {
                    if (err) return reject(err);
                    resolve({ id: result.insertId, company_id: companyId, amount: 0 });
                });
            }
        });
    });
};

/**
 * Update daily counter amount
 * @param {number} counterId - The daily counter ID
 * @param {number} amount - The amount to add/subtract
 * @returns {Promise<void>}
 */
const updateDailyCounterAmount = (counterId, amount) => {
    return new Promise((resolve, reject) => {
        db.query('UPDATE daily_counter SET amount = amount + ? WHERE id = ?', [amount, counterId], (err, result) => {
            if (err) return reject(err);
            resolve();
        });
    });
};

/**
 * Insert daily counter detail (always creates new record)
 * @param {number} dailyCounterId - The daily counter ID
 * @param {string} counterDate - The counter date (YYYY-MM-DD)
 * @param {number} amount - The amount
 * @param {string} amountType - The amount type ('income', 'expense', 'transfer')
 * @returns {Promise<void>}
 */
const insertOrUpdateDailyCounterDetail = (dailyCounterId, counterDate, amount, amountType) => {
    return new Promise((resolve, reject) => {
        // Always insert new detail record
        db.query(
            'INSERT INTO daily_counter_details (daily_counter_id, counter_date, amount, amount_type) VALUES (?, ?, ?, ?)',
            [dailyCounterId, counterDate, amount, amountType],
            (err) => {
                if (err) return reject(err);
                resolve();
            }
        );
    });
};

/**
 * Process received purchase for daily counter updates
 * @param {number} companyId - The company ID
 * @param {number} deliveryCharges - The delivery charges amount
 * @param {string} receivedDate - The received date
 * @returns {Promise<void>}
 */
const processReceivedPurchaseForDailyCounter = async (companyId, deliveryCharges, receivedDate) => {
    if (!deliveryCharges || parseFloat(deliveryCharges) <= 0) {
        return; // No delivery charges to process
    }
    
    try {
        const dailyCounter = await getOrCreateDailyCounter(companyId);
        const formattedDate = dayjs(receivedDate).tz('Asia/Karachi').format('YYYY-MM-DD');
        
        // Update daily counter amount (delivery charges are an expense)
        await updateDailyCounterAmount(dailyCounter.id, -parseFloat(deliveryCharges));
        
        // Insert/update daily counter detail
        await insertOrUpdateDailyCounterDetail(dailyCounter.id, formattedDate, deliveryCharges, 'expense');
        
    } catch (error) {
        console.error('Error processing received purchase for daily counter:', error);
        throw error;
    }
};

/**
 * Process sales invoice for daily counter updates
 * @param {number} companyId - The company ID
 * @param {number} paidAmount - The paid amount
 * @param {string} invoiceDate - The invoice date
 * @returns {Promise<void>}
 */
const processSalesInvoiceForDailyCounter = async (companyId, paidAmount, invoiceDate) => {
    if (!paidAmount || parseFloat(paidAmount) <= 0) {
        return; // No paid amount to process
    }
    
    try {
        const dailyCounter = await getOrCreateDailyCounter(companyId);
        const formattedDate = dayjs(invoiceDate).tz('Asia/Karachi').format('YYYY-MM-DD');
        
        // Update daily counter amount (paid amount is income)
        await updateDailyCounterAmount(dailyCounter.id, parseFloat(paidAmount));
        
        // Insert/update daily counter detail
        await insertOrUpdateDailyCounterDetail(dailyCounter.id, formattedDate, paidAmount, 'income');
        
    } catch (error) {
        console.error('Error processing sales invoice for daily counter:', error);
        throw error;
    }
};

/**
 * Process expense for daily counter updates
 * @param {number} companyId - The company ID
 * @param {number} expenseAmount - The expense amount
 * @param {string} expenseDate - The expense date
 * @returns {Promise<void>}
 */
const processExpenseForDailyCounter = async (companyId, expenseAmount, expenseDate) => {
    if (!expenseAmount || parseFloat(expenseAmount) <= 0) {
        return; // No expense amount to process
    }
    
    try {
        const dailyCounter = await getOrCreateDailyCounter(companyId);
        const formattedDate = dayjs(expenseDate).tz('Asia/Karachi').format('YYYY-MM-DD');
        
        // Update daily counter amount (expense reduces the amount)
        await updateDailyCounterAmount(dailyCounter.id, -parseFloat(expenseAmount));
        
        // Insert/update daily counter detail
        await insertOrUpdateDailyCounterDetail(dailyCounter.id, formattedDate, expenseAmount, 'expense');
        
    } catch (error) {
        console.error('Error processing expense for daily counter:', error);
        throw error;
    }
};

/**
 * Reverse daily counter updates for received purchase deletion
 * @param {number} companyId - The company ID
 * @param {number} deliveryCharges - The delivery charges amount
 * @param {string} receivedDate - The received date
 * @returns {Promise<void>}
 */
const reverseReceivedPurchaseForDailyCounter = async (companyId, deliveryCharges, receivedDate) => {
    if (!deliveryCharges || parseFloat(deliveryCharges) <= 0) {
        return; // No delivery charges to process
    }
    
    try {
        const dailyCounter = await getOrCreateDailyCounter(companyId);
        const formattedDate = dayjs(receivedDate).tz('Asia/Karachi').format('YYYY-MM-DD');
        
        // Reverse daily counter amount (delivery charges were an expense, so reverse by adding)
        await updateDailyCounterAmount(dailyCounter.id, parseFloat(deliveryCharges));
        
        // Insert/update daily counter detail as income (reversal)
        await insertOrUpdateDailyCounterDetail(dailyCounter.id, formattedDate, deliveryCharges, 'income');
        
    } catch (error) {
        console.error('Error reversing received purchase for daily counter:', error);
        throw error;
    }
};

/**
 * Reverse daily counter updates for sales invoice deletion
 * @param {number} companyId - The company ID
 * @param {number} paidAmount - The paid amount
 * @param {string} invoiceDate - The invoice date
 * @returns {Promise<void>}
 */
const reverseSalesInvoiceForDailyCounter = async (companyId, paidAmount, invoiceDate) => {
    if (!paidAmount || parseFloat(paidAmount) <= 0) {
        return; // No paid amount to process
    }
    
    try {
        const dailyCounter = await getOrCreateDailyCounter(companyId);
        const formattedDate = dayjs(invoiceDate).tz('Asia/Karachi').format('YYYY-MM-DD');
        
        // Reverse daily counter amount (paid amount was income, so reverse by subtracting)
        await updateDailyCounterAmount(dailyCounter.id, -parseFloat(paidAmount));
        
        // Insert/update daily counter detail as expense (reversal)
        await insertOrUpdateDailyCounterDetail(dailyCounter.id, formattedDate, paidAmount, 'expense');
        
    } catch (error) {
        console.error('Error reversing sales invoice for daily counter:', error);
        throw error;
    }
};

/**
 * Reverse daily counter updates for expense deletion
 * @param {number} companyId - The company ID
 * @param {number} expenseAmount - The expense amount
 * @param {string} expenseDate - The expense date
 * @returns {Promise<void>}
 */
const reverseExpenseForDailyCounter = async (companyId, expenseAmount, expenseDate) => {
    if (!expenseAmount || parseFloat(expenseAmount) <= 0) {
        return; // No expense amount to process
    }
    
    try {
        const dailyCounter = await getOrCreateDailyCounter(companyId);
        const formattedDate = dayjs(expenseDate).tz('Asia/Karachi').format('YYYY-MM-DD');
        
        // Reverse daily counter amount (expense reduced the amount, so reverse by adding)
        await updateDailyCounterAmount(dailyCounter.id, parseFloat(expenseAmount));
        
        // Insert/update daily counter detail as income (reversal)
        await insertOrUpdateDailyCounterDetail(dailyCounter.id, formattedDate, expenseAmount, 'income');
        
    } catch (error) {
        console.error('Error reversing expense for daily counter:', error);
        throw error;
    }
};

/**
 * Process payment in for daily counter updates
 * @param {number} companyId - The company ID
 * @param {number} paymentAmount - The payment amount
 * @param {string} paymentDate - The payment date
 * @returns {Promise<void>}
 */
const processPaymentInForDailyCounter = async (companyId, paymentAmount, paymentDate) => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
        return; // No payment amount to process
    }
    
    try {
        const dailyCounter = await getOrCreateDailyCounter(companyId);
        const formattedDate = dayjs(paymentDate).tz('Asia/Karachi').format('YYYY-MM-DD');
        
        // Update daily counter amount (payment in is income)
        await updateDailyCounterAmount(dailyCounter.id, parseFloat(paymentAmount));
        
        // Insert/update daily counter detail
        await insertOrUpdateDailyCounterDetail(dailyCounter.id, formattedDate, paymentAmount, 'income');
        
    } catch (error) {
        console.error('Error processing payment in for daily counter:', error);
        throw error;
    }
};

/**
 * Process payment out for daily counter updates
 * @param {number} companyId - The company ID
 * @param {number} paymentAmount - The payment amount
 * @param {string} paymentDate - The payment date
 * @returns {Promise<void>}
 */
const processPaymentOutForDailyCounter = async (companyId, paymentAmount, paymentDate) => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
        return; // No payment amount to process
    }
    
    try {
        const dailyCounter = await getOrCreateDailyCounter(companyId);
        const formattedDate = dayjs(paymentDate).tz('Asia/Karachi').format('YYYY-MM-DD');
        
        // Update daily counter amount (payment out is an expense)
        await updateDailyCounterAmount(dailyCounter.id, -parseFloat(paymentAmount));
        
        // Insert/update daily counter detail
        await insertOrUpdateDailyCounterDetail(dailyCounter.id, formattedDate, paymentAmount, 'expense');
        
    } catch (error) {
        console.error('Error processing payment out for daily counter:', error);
        throw error;
    }
};

/**
 * Reverse daily counter updates for payment in deletion
 * @param {number} companyId - The company ID
 * @param {number} paymentAmount - The payment amount
 * @param {string} paymentDate - The payment date
 * @returns {Promise<void>}
 */
const reversePaymentInForDailyCounter = async (companyId, paymentAmount, paymentDate) => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
        return; // No payment amount to process
    }
    
    try {
        const dailyCounter = await getOrCreateDailyCounter(companyId);
        const formattedDate = dayjs(paymentDate).tz('Asia/Karachi').format('YYYY-MM-DD');
        
        // Reverse daily counter amount (payment in was income, so reverse by subtracting)
        await updateDailyCounterAmount(dailyCounter.id, -parseFloat(paymentAmount));
        
        // Insert/update daily counter detail as expense (reversal)
        await insertOrUpdateDailyCounterDetail(dailyCounter.id, formattedDate, paymentAmount, 'expense');
        
    } catch (error) {
        console.error('Error reversing payment in for daily counter:', error);
        throw error;
    }
};

/**
 * Reverse daily counter updates for payment out deletion
 * @param {number} companyId - The company ID
 * @param {number} paymentAmount - The payment amount
 * @param {string} paymentDate - The payment date
 * @returns {Promise<void>}
 */
const reversePaymentOutForDailyCounter = async (companyId, paymentAmount, paymentDate) => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
        return; // No payment amount to process
    }
    
    try {
        const dailyCounter = await getOrCreateDailyCounter(companyId);
        const formattedDate = dayjs(paymentDate).tz('Asia/Karachi').format('YYYY-MM-DD');
        
        // Reverse daily counter amount (payment out was an expense, so reverse by adding)
        await updateDailyCounterAmount(dailyCounter.id, parseFloat(paymentAmount));
        
        // Insert/update daily counter detail as income (reversal)
        await insertOrUpdateDailyCounterDetail(dailyCounter.id, formattedDate, paymentAmount, 'income');
        
    } catch (error) {
        console.error('Error reversing payment out for daily counter:', error);
        throw error;
    }
};

module.exports = {
    getOrCreateDailyCounter,
    updateDailyCounterAmount,
    insertOrUpdateDailyCounterDetail,
    processReceivedPurchaseForDailyCounter,
    processSalesInvoiceForDailyCounter,
    processExpenseForDailyCounter,
    reverseReceivedPurchaseForDailyCounter,
    reverseSalesInvoiceForDailyCounter,
    reverseExpenseForDailyCounter,
    processPaymentInForDailyCounter,
    processPaymentOutForDailyCounter,
    reversePaymentInForDailyCounter,
    reversePaymentOutForDailyCounter
}; 