const db = require('../utils/db');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { processExpenseForDailyCounter, reverseExpenseForDailyCounter } = require('../utils/dailyCounterUtils');

dayjs.extend(utc);
dayjs.extend(timezone);

exports.createExpense = (req, res) => {
    const { expense_name, expense_type, company_id, expense_amount, expense_date, expense_description } = req.body;
    db.query('INSERT INTO expenses (expense_name, expense_type, company_id, expense_amount, expense_date, expense_description) VALUES (?, ?, ?, ?, ?, ?)', [expense_name, expense_type, company_id, expense_amount, expense_date, expense_description], async (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        
        // Process daily counter updates if expense amount exists
        if (expense_amount && parseFloat(expense_amount) > 0 && company_id) {
            try {
                await processExpenseForDailyCounter(company_id, expense_amount, expense_date);
            } catch (counterError) {
                console.error('Error processing daily counter for expense:', counterError);
            }
        }
        
        res.status(201).json({ id: result.insertId });
    });
};

exports.getAllExpenses = (req, res) => {
    db.query('SELECT * FROM expenses WHERE is_deleted = 0', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        const expenses = results.map(expense => ({
            ...expense,
            expense_date: dayjs(expense.expense_date).tz('Asia/Karachi').format('YYYY-MM-DD')
        }));
        res.json(expenses);
    });
};

exports.getExpenseById = (req, res) => {
    db.query('SELECT * FROM expenses WHERE id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Expense not found' });

        // Convert all date fields to local timezone (e.g., Asia/Karachi)
        const expense = results[0];
   
        expense.expense_date = dayjs(expense.expense_date).tz('Asia/Karachi').format('YYYY-MM-DD');

        res.json(expense);
    });
};

exports.updateExpense = (req, res) => {
    const { expense_name, expense_type, company_id, expense_amount, expense_date, expense_description } = req.body;
    
    // First get the current expense amount to calculate the difference
    db.query('SELECT expense_amount, company_id FROM expenses WHERE id = ? AND is_deleted = 0', [req.params.id], (err, currentResults) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (currentResults.length === 0) return res.status(404).json({ message: 'Expense not found' });
        
        const currentExpenseAmount = parseFloat(currentResults[0].expense_amount) || 0;
        const newExpenseAmount = parseFloat(expense_amount) || 0;
        const expenseAmountDifference = newExpenseAmount - currentExpenseAmount;
        
        db.query('UPDATE expenses SET expense_name=?, expense_type=?, company_id=?, expense_amount=?, expense_date=?, expense_description=? WHERE id=? AND is_deleted=0', [expense_name, expense_type, company_id, expense_amount, expense_date, expense_description, req.params.id], async (err, result) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Expense not found' });
            
            // Process daily counter updates if expense amount changed
            if (expenseAmountDifference !== 0 && company_id) {
                try {
                    const amountToProcess = Math.abs(expenseAmountDifference);
                    const amountType = expenseAmountDifference > 0 ? 'expense' : 'income';
                    
                    const dailyCounter = await require('../utils/dailyCounterUtils').getOrCreateDailyCounter(company_id);
                    const formattedDate = dayjs(expense_date).tz('Asia/Karachi').format('YYYY-MM-DD');
                    
                    // Update daily counter amount
                    await require('../utils/dailyCounterUtils').updateDailyCounterAmount(dailyCounter.id, -expenseAmountDifference);
                    
                    // Insert/update daily counter detail
                    await require('../utils/dailyCounterUtils').insertOrUpdateDailyCounterDetail(dailyCounter.id, formattedDate, amountToProcess, amountType);
                    
                } catch (counterError) {
                    console.error('Error processing daily counter for expense update:', counterError);
                }
            }
            
            res.json({ message: 'Expense updated' });
        });
    });
};

exports.deleteExpense = (req, res) => {
    // First get the expense details to reverse daily counter updates
    db.query('SELECT expense_amount, expense_date, company_id FROM expenses WHERE id = ? AND is_deleted = 0', [req.params.id], (err, currentResults) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (currentResults.length === 0) return res.status(404).json({ message: 'Expense not found' });
        
        const expense = currentResults[0];
        
        db.query('UPDATE expenses SET is_deleted=1 WHERE id=?', [req.params.id], async (err, result) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Expense not found' });
            
            // Reverse daily counter updates if expense amount exists
            if (expense.expense_amount && parseFloat(expense.expense_amount) > 0 && expense.company_id) {
                try {
                    await reverseExpenseForDailyCounter(expense.company_id, expense.expense_amount, expense.expense_date);
                } catch (counterError) {
                    console.error('Error reversing daily counter for expense deletion:', counterError);
                }
            }
            
            res.json({ message: 'Expense deleted (soft)' });
        });
    });
}; 