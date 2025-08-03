const db = require('../utils/db');

exports.createDriver = (req, res) => {
    const { driver_name, driver_phone, driver_address, driver_cnic, driver_license_number } = req.body;
    db.query('INSERT INTO drivers (driver_name, driver_phone, driver_address, driver_cnic, driver_license_number) VALUES (?, ?, ?, ?, ?)', [driver_name, driver_phone, driver_address, driver_cnic, driver_license_number], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ id: result.insertId });
    });
};

exports.getAllDrivers = (req, res) => {
    db.query('SELECT * FROM drivers WHERE is_deleted = 0', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
};

exports.getDriverById = (req, res) => {
    db.query('SELECT * FROM drivers WHERE id = ? AND is_deleted = 0', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Driver not found' });
        res.json(results[0]);
    });
};

exports.updateDriver = (req, res) => {
    const { driver_name, driver_phone, driver_address, driver_cnic, driver_license_number } = req.body;
    db.query('UPDATE drivers SET driver_name=?, driver_phone=?, driver_address=?, driver_cnic=?, driver_license_number=? WHERE id=? AND is_deleted=0', [driver_name, driver_phone, driver_address, driver_cnic, driver_license_number, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Driver updated' });
    });
};

exports.deleteDriver = (req, res) => {
    db.query('UPDATE drivers SET is_deleted=1 WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Driver deleted (soft)' });
    });
}; 