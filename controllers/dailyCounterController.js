const db = require('../utils/db');

exports.createDailyCounter = (req, res) => {
    const { company_id, amount } = req.body;
    db.query('INSERT INTO daily_counter (company_id, amount) VALUES (?, ?)', [company_id, amount], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ id: result.insertId });
    });
};

exports.getAllDailyCounters = (req, res) => {
    db.query('SELECT * FROM daily_counter WHERE is_deleted = 0', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getDailyCounterById = (req, res) => {
    db.query('SELECT * FROM daily_counter WHERE company_id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Daily counter not found' });
        res.json(results[0]);
    });
};

exports.updateDailyCounter = (req, res) => {
    const { company_id, amount } = req.body;
    db.query('UPDATE daily_counter SET company_id=?, amount=? WHERE id=? AND is_deleted=0', [company_id, amount, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Daily counter updated' });
    });
};

exports.deleteDailyCounter = (req, res) => {
    db.query('UPDATE daily_counter SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Daily counter deleted (soft)' });
    });
};

exports.getDailyCounterByCompany = (req, res) => {
    const companyId = req.params.companyId;
    db.query('SELECT * FROM daily_counter WHERE company_id = ? AND is_deleted = 0', [companyId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getDailyCounterWithDetails = (req, res) => {
    const counterId = req.params.id;
    const sql = `
        SELECT dc.*, mc.company_name
        FROM daily_counter dc
        JOIN my_companies mc ON dc.company_id = mc.id
        WHERE dc.id = ? AND dc.is_deleted = 0
    `;
    db.query(sql, [counterId], (err, counterResults) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (counterResults.length === 0) return res.status(404).json({ message: 'Daily counter not found' });
        
        const counter = counterResults[0];
        
        // Fetch counter details
        db.query('SELECT * FROM daily_counter_details WHERE daily_counter_id = ? AND is_deleted = 0 ORDER BY counter_date DESC', [counterId], (err, detailsResults) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            res.json({ ...counter, details: detailsResults });
        });
    });
}; 