const db = require('../utils/db');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const formatDate = (date) => {
    return dayjs.utc(date).tz('Asia/Karachi').format('YYYY-MM-DD');
};
exports.createCheque = (req, res) => {
    const {
        company_id,
        cheque_number,
        bank_id,
        bank_account_id,
        given_by_customer,
        given_to_customer,
        given_by_supplier,
        given_to_supplier,
        cheque_date,
        cheque_amount,
        cheque_status
    } = req.body;

    const created_by = req.user.id;

    const sql = `
        INSERT INTO cheques (
            company_id, cheque_number, bank_id, bank_account_id,
            given_by_customer, given_to_customer, given_by_supplier, given_to_supplier,
            cheque_date, cheque_amount, cheque_status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        company_id, cheque_number, bank_id, bank_account_id,
        given_by_customer, given_to_customer, given_by_supplier, given_to_supplier,
        cheque_date, cheque_amount, cheque_status, created_by
    ], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }

        res.status(201).json({ 
            message: 'Cheque created successfully',
            id: result.insertId 
        });
    });
};

exports.getAllCheques = (req, res) => {
    const { company_id } = req.query;
    let sql = `
        SELECT c.*, 
               mc.company_name,
               b.bank_name,
               ba.account_title,
               c1.customer_name as given_by_customer_name,
               c2.customer_name as given_to_customer_name,
               s1.supplier_name as given_by_supplier_name,
               s2.supplier_name as given_to_supplier_name,
               u.user_name as created_by_name
        FROM cheques c
        LEFT JOIN my_companies mc ON c.company_id = mc.id
        LEFT JOIN banks b ON c.bank_id = b.id
        LEFT JOIN bank_accounts ba ON c.bank_account_id = ba.id
        LEFT JOIN customers c1 ON c.given_by_customer = c1.id
        LEFT JOIN customers c2 ON c.given_to_customer = c2.id
        LEFT JOIN suppliers s1 ON c.given_by_supplier = s1.id
        LEFT JOIN suppliers s2 ON c.given_to_supplier = s2.id
        LEFT JOIN users u ON c.created_by = u.id
        WHERE c.is_deleted = 0
    `;
    
    const params = [];
    if (company_id) {
        sql += ' AND c.company_id = ?';
        params.push(company_id);
    }
    
    sql += ' ORDER BY c.cheque_date DESC, c.created_at DESC';

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
        results.forEach(result => {
            result.cheque_date = formatDate(result.cheque_date);
        });
        res.json(results);
    });
};

exports.getChequeById = (req, res) => {
    const sql = `
        SELECT c.*, 
               mc.company_name,
               b.bank_name,
               ba.account_title,
               c1.customer_name as given_by_customer_name,
               c2.customer_name as given_to_customer_name,
               s1.supplier_name as given_by_supplier_name,
               s2.supplier_name as given_to_supplier_name,
               u.user_name as created_by_name
        FROM cheques c
        LEFT JOIN my_companies mc ON c.company_id = mc.id
        LEFT JOIN banks b ON c.bank_id = b.id
        LEFT JOIN bank_accounts ba ON c.bank_account_id = ba.id
        LEFT JOIN customers c1 ON c.given_by_customer = c1.id
        LEFT JOIN customers c2 ON c.given_to_customer = c2.id
        LEFT JOIN suppliers s1 ON c.given_by_supplier = s1.id
        LEFT JOIN suppliers s2 ON c.given_to_supplier = s2.id
        LEFT JOIN users u ON c.created_by = u.id
        WHERE c.id = ? AND c.is_deleted = 0
    `;

    db.query(sql, [req.params.id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Cheque not found' });
        }
        results[0].cheque_date = formatDate(results[0].cheque_date);
        res.json(results[0]);
    });
};

exports.updateCheque = (req, res) => {
    const {
        cheque_number,
        bank_id,
        bank_account_id,
        given_by_customer,
        given_to_customer,
        given_by_supplier,
        given_to_supplier,
        cheque_date,
        cheque_amount,
        cheque_status
    } = req.body;

    const sql = `
        UPDATE cheques SET 
            cheque_number = ?, bank_id = ?, bank_account_id = ?,
            given_by_customer = ?, given_to_customer = ?, given_by_supplier = ?, given_to_supplier = ?,
            cheque_date = ?, cheque_amount = ?, cheque_status = ?
        WHERE id = ? AND is_deleted = 0
    `;

    db.query(sql, [
        cheque_number, bank_id, bank_account_id,
        given_by_customer, given_to_customer, given_by_supplier, given_to_supplier,
        cheque_date, cheque_amount, cheque_status, req.params.id
    ], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Cheque not found' });
        }
        res.json({ message: 'Cheque updated successfully' });
    });
};

exports.deleteCheque = (req, res) => {
    db.query('UPDATE cheques SET is_deleted = 1 WHERE id = ?', [req.params.id], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Cheque not found' });
        }
        res.json({ message: 'Cheque deleted successfully' });
    });
};

exports.getChequesByCompany = (req, res) => {
    const companyId = req.params.companyId;
    const sql = `
        SELECT c.*, 
               b.bank_name,
               ba.account_title,
               c1.customer_name as given_by_customer_name,
               c2.customer_name as given_to_customer_name,
               s1.supplier_name as given_by_supplier_name,
               s2.supplier_name as given_to_supplier_name,
               u.user_name as created_by_name
        FROM cheques c
        LEFT JOIN banks b ON c.bank_id = b.id
        LEFT JOIN bank_accounts ba ON c.bank_account_id = ba.id
        LEFT JOIN customers c1 ON c.given_by_customer = c1.id
        LEFT JOIN customers c2 ON c.given_to_customer = c2.id
        LEFT JOIN suppliers s1 ON c.given_by_supplier = s1.id
        LEFT JOIN suppliers s2 ON c.given_to_supplier = s2.id
        LEFT JOIN users u ON c.created_by = u.id
        WHERE c.company_id = ? AND c.is_deleted = 0
        ORDER BY c.cheque_date DESC, c.created_at DESC
    `;

    db.query(sql, [companyId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
        results.forEach(result => {
            result.cheque_date = formatDate(result.cheque_date);
        });
        res.json(results);
    });
};

exports.getChequesByStatus = (req, res) => {
    const { company_id, cheque_status } = req.query;
    let sql = `
        SELECT c.*, 
               mc.company_name,
               b.bank_name,
               ba.account_title,
               c1.customer_name as given_by_customer_name,
               c2.customer_name as given_to_customer_name,
               s1.supplier_name as given_by_supplier_name,
               s2.supplier_name as given_to_supplier_name,
               u.user_name as created_by_name
        FROM cheques c
        LEFT JOIN my_companies mc ON c.company_id = mc.id
        LEFT JOIN banks b ON c.bank_id = b.id
        LEFT JOIN bank_accounts ba ON c.bank_account_id = ba.id
        LEFT JOIN customers c1 ON c.given_by_customer = c1.id
        LEFT JOIN customers c2 ON c.given_to_customer = c2.id
        LEFT JOIN suppliers s1 ON c.given_by_supplier = s1.id
        LEFT JOIN suppliers s2 ON c.given_to_supplier = s2.id
        LEFT JOIN users u ON c.created_by = u.id
        WHERE c.is_deleted = 0
    `;
    
    const params = [];
    if (company_id) {
        sql += ' AND c.company_id = ?';
        params.push(company_id);
    }
    if (cheque_status) {
        sql += ' AND c.cheque_status = ?';
        params.push(cheque_status);
    }
    
    sql += ' ORDER BY c.cheque_date DESC, c.created_at DESC';

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
        results.forEach(result => {
            result.cheque_date = formatDate(result.cheque_date);
        });
        res.json(results);
    });
}; 