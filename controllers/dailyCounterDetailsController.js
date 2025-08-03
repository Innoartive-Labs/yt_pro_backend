const db = require('../utils/db');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

exports.createDailyCounterDetail = (req, res) => {
    const { daily_counter_id, counter_date, amount, amount_type } = req.body;
    db.query('INSERT INTO daily_counter_details (daily_counter_id, counter_date, amount, amount_type) VALUES (?, ?, ?, ?)', [daily_counter_id, counter_date, amount, amount_type], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ id: result.insertId });
    });
};

exports.getAllDailyCounterDetails = (req, res) => {
    db.query('SELECT * FROM daily_counter_details WHERE is_deleted = 0 ORDER BY counter_date DESC', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        results.forEach(result => {
            result.counter_date = dayjs.utc(result.counter_date).tz('Asia/Karachi').format('YYYY-MM-DD');
        });
        res.json(results);
    });
};

exports.getDailyCounterDetailById = (req, res) => {
    db.query('SELECT * FROM daily_counter_details WHERE id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Daily counter detail not found' });
        results[0].counter_date = dayjs.utc(results[0].counter_date).tz('Asia/Karachi').format('YYYY-MM-DD');
        res.json(results[0]);
    });
};

exports.updateDailyCounterDetail = (req, res) => {
    const { daily_counter_id, counter_date, amount, amount_type } = req.body;
    db.query('UPDATE daily_counter_details SET daily_counter_id=?, counter_date=?, amount=?, amount_type=? WHERE id=? AND is_deleted=0', [daily_counter_id, counter_date, amount, amount_type, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Daily counter detail updated' });
    });
};

exports.deleteDailyCounterDetail = (req, res) => {
    db.query('UPDATE daily_counter_details SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Daily counter detail deleted (soft)' });
    });
};

exports.getDailyCounterDetailsByCounter = (req, res) => {
    const counterId = req.params.counterId;
    db.query('SELECT * FROM daily_counter_details WHERE daily_counter_id = ? AND is_deleted = 0 ORDER BY counter_date DESC', [counterId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        results.forEach(result => {
            result.counter_date = dayjs.utc(result.counter_date).tz('Asia/Karachi').format('YYYY-MM-DD');
        });
        res.json(results);
    });
};

exports.getDailyCounterDetailsByDate = (req, res) => {
    const { startDate, endDate, counterId } = req.query;
    let sql = 'SELECT * FROM daily_counter_details WHERE is_deleted = 0';
    let params = [];
    
    if (startDate && endDate) {
        sql += ' AND counter_date BETWEEN ? AND ?';
        params.push(startDate, endDate);
    }
    
    if (counterId) {
        sql += ' AND daily_counter_id = ?';
        params.push(counterId);
    }
    
    sql += ' ORDER BY counter_date DESC';
    
    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        results.forEach(result => {
            result.counter_date = dayjs.utc(result.counter_date).tz('Asia/Karachi').format('YYYY-MM-DD');
        });
        res.json(results);
    });
};

exports.getDailyCounterDetailsByType = (req, res) => {
    const { amount_type, counterId } = req.query;
    let sql = 'SELECT * FROM daily_counter_details WHERE is_deleted = 0';
    let params = [];
    
    if (amount_type) {
        sql += ' AND amount_type = ?';
        params.push(amount_type);
    }
    
    if (counterId) {
        sql += ' AND daily_counter_id = ?';
        params.push(counterId);
    }
    
    sql += ' ORDER BY counter_date DESC';
    
    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        results.forEach(result => {
            result.counter_date = dayjs.utc(result.counter_date).tz('Asia/Karachi').format('YYYY-MM-DD');
        });
        res.json(results);
    });
}; 