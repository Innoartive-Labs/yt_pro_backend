const db = require('../utils/db');

exports.createCompany = (req, res) => {
    const { company_name } = req.body;
    
    // Start a transaction
    db.beginTransaction((err) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        
        // Insert the company
        db.query('INSERT INTO my_companies (company_name) VALUES (?)', [company_name], (err, result) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).json({ message: 'Database error', error: err });
                });
            }
            
            const companyId = result.insertId;
            
            // Create a daily counter for the new company with initial amount 0
            db.query('INSERT INTO daily_counter (company_id, amount) VALUES (?, ?)', [companyId, 0], (err, counterResult) => {
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
                        id: companyId, 
                        daily_counter_id: counterResult.insertId,
                        message: 'Company and daily counter created successfully'
                    });
                });
            });
        });
    });
};

exports.getAllCompanies = (req, res) => {
    db.query('SELECT * FROM my_companies WHERE is_deleted = 0', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getCompanyById = (req, res) => {
    db.query('SELECT * FROM my_companies WHERE id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Company not found' });
        res.json(results[0]);
    });
};

exports.updateCompany = (req, res) => {
    const { company_name } = req.body;
    db.query('UPDATE my_companies SET company_name=? WHERE id=? AND is_deleted=0', [company_name, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Company updated' });
    });
};

exports.deleteCompany = (req, res) => {
    db.query('UPDATE my_companies SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Company deleted (soft)' });
    });
}; 